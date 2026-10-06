using IGB.Smartphones.Api.Data;
using IGB.Smartphones.Api.Dtos;
using IGB.Smartphones.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IGB.Smartphones.Api.Services;

public class PedidoService : IPedidoService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PedidoService> _logger;

    public PedidoService(ApplicationDbContext context, ILogger<PedidoService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IReadOnlyList<PedidoResponse>> ListarAsync(
        int? clienteId,
        CancellationToken cancellationToken)
    {
        var consulta = _context.Pedidos.AsNoTracking();

        if (clienteId.HasValue)
            consulta = consulta.Where(p => p.ClienteId == clienteId.Value);

        var pedidos = await consulta
            .Include(p => p.Itens)
            .Include(p => p.Pagamentos)
            .Include(p => p.Cupons)
                .ThenInclude(cupom => cupom.Cupom)
            .OrderByDescending(p => p.DataCriacao)
            .ThenByDescending(p => p.Id)
            .ToListAsync(cancellationToken);

        return pedidos.Select(MapearParaResponse).ToList();
    }

    public async Task<PedidoResponse?> ObterPorIdAsync(int id, CancellationToken cancellationToken)
    {
        var pedido = await _context.Pedidos
            .AsNoTracking()
            .Include(p => p.Itens)
            .Include(p => p.Pagamentos)
            .Include(p => p.Cupons)
                .ThenInclude(cupom => cupom.Cupom)
            .Where(p => p.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        return pedido is null ? null : MapearParaResponse(pedido);
    }

    public async Task<PedidoResponse?> CancelarAsync(int id, CancellationToken cancellationToken)
    {
        var pedido = await _context.Pedidos.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (pedido is null)
            return null;

        // Único status cancelável hoje; os demais estados da interface ainda não existem no backend.
        if (pedido.Status != StatusPedido.EmProcessamento)
            throw new InvalidOperationException("O pedido não está em um estado que permite cancelamento.");

        pedido.Status = StatusPedido.Cancelado;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Pedido {PedidoId} cancelado.", pedido.Id);

        return await ObterPorIdAsync(id, cancellationToken);
    }

    public async Task<CotacaoFreteResponse> CalcularFreteAsync(
        CotacaoFreteRequest request,
        CancellationToken cancellationToken)
    {
        await ValidarProdutosAsync(request.Itens, cancellationToken);
        return new CotacaoFreteResponse(CalcularFrete(request.Itens, request.EnderecoEntrega));
    }

    public async Task<PedidoResponse> CriarAsync(
        CriarPedidoRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Iniciando criação de pedido para cliente {ClienteId}.", request.ClienteId);

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var cliente = await _context.Clientes
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == request.ClienteId, cancellationToken);
            if (cliente is null)
                throw new KeyNotFoundException("Cliente não encontrado.");

            ValidarEndereco(request.EnderecoEntrega);
            ValidarItensSemDuplicidade(request.Itens);

            var produtos = await ValidarProdutosAsync(request.Itens, cancellationToken);
            var itens = request.Itens.Select(item =>
            {
                var produto = produtos[item.ProdutoId];
                return new PedidoItem
                {
                    ProdutoId = produto.Id,
                    NomeProduto = produto.Nome,
                    PrecoUnitario = produto.Preco,
                    Quantidade = item.Quantidade,
                };
            }).ToList();

            var subtotal = itens.Sum(item => item.PrecoUnitario * item.Quantidade);
            var frete = CalcularFrete(request.Itens, request.EnderecoEntrega);
            var valorAntesDosCupons = subtotal + frete;
            var cupons = await ValidarCuponsAsync(request.ClienteId, request.Cupons, cancellationToken);
            var (valorDesconto, aplicacoesCupons, excedente) =
                CalcularDescontos(cupons, valorAntesDosCupons);
            var total = valorAntesDosCupons - valorDesconto;
            var pagamentos = await CriarPagamentosAsync(
                request.ClienteId,
                request.Pagamentos,
                total,
                aplicacoesCupons.Count > 0,
                cancellationToken);

            var endereco = request.EnderecoEntrega;
            var pedido = new Pedido
            {
                Codigo = $"PED-{Guid.NewGuid():N}"[..30],
                ClienteId = cliente.Id,
                Status = StatusPedido.EmProcessamento,
                Subtotal = subtotal,
                ValorFrete = frete,
                ValorDesconto = valorDesconto,
                Total = total,
                EntregaNome = endereco.Nome?.Trim(),
                EntregaTipoResidencia = endereco.TipoResidencia.Trim(),
                EntregaTipoLogradouro = endereco.TipoLogradouro.Trim(),
                EntregaLogradouro = endereco.Logradouro.Trim(),
                EntregaNumero = endereco.Numero.Trim(),
                EntregaBairro = endereco.Bairro.Trim(),
                EntregaCEP = endereco.CEP.Trim(),
                EntregaCidade = endereco.Cidade.Trim(),
                EntregaEstado = endereco.Estado.Trim().ToUpperInvariant(),
                EntregaPais = endereco.Pais.Trim(),
                EntregaObservacoes = string.IsNullOrWhiteSpace(endereco.Observacoes)
                    ? null
                    : endereco.Observacoes.Trim(),
                Itens = itens,
                Pagamentos = pagamentos,
                Cupons = aplicacoesCupons,
            };

            if (excedente > 0)
            {
                _context.Cupons.Add(new Cupom
                {
                    Codigo = CriarCodigoCupomTroca(),
                    Natureza = NaturezaCupom.Troca,
                    FormaDesconto = FormaDescontoCupom.ValorFixo,
                    Valor = excedente,
                    Ativo = true,
                    ClienteId = cliente.Id,
                });
            }

            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Pedido {PedidoId} criado com sucesso para cliente {ClienteId}.",
                pedido.Id,
                pedido.ClienteId);

            return MapearParaResponse(pedido);
        }
        catch (Exception exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(
                exception,
                "Falha ao criar pedido para cliente {ClienteId}.",
                request.ClienteId);
            throw;
        }
    }

    private async Task<Dictionary<int, Produto>> ValidarProdutosAsync(
        IReadOnlyList<CriarPedidoItemRequest> itens,
        CancellationToken cancellationToken)
    {
        if (itens.Count == 0)
            throw new ArgumentException("O pedido precisa conter ao menos um produto.");

        if (itens.Any(item => item.ProdutoId <= 0 || item.Quantidade <= 0))
            throw new ArgumentException("Produto e quantidade devem ser válidos.");

        var ids = itens.Select(item => item.ProdutoId).Distinct().ToArray();
        var produtos = await _context.Produtos
            .AsNoTracking()
            .Where(produto => ids.Contains(produto.Id))
            .ToDictionaryAsync(produto => produto.Id, cancellationToken);

        foreach (var item in itens)
        {
            if (!produtos.TryGetValue(item.ProdutoId, out var produto) || !produto.Ativo)
                throw new InvalidOperationException($"Produto {item.ProdutoId} não está disponível.");

            if (item.Quantidade > produto.QuantidadeEstoque)
                throw new InvalidOperationException($"Estoque insuficiente para o produto {produto.Nome}.");
        }

        return produtos;
    }

    private static void ValidarItensSemDuplicidade(IReadOnlyList<CriarPedidoItemRequest> itens)
    {
        if (itens.Select(item => item.ProdutoId).Distinct().Count() != itens.Count)
            throw new ArgumentException("Cada produto deve aparecer uma única vez na lista do pedido.");
    }

    private async Task<List<Cupom>> ValidarCuponsAsync(
        int clienteId,
        IReadOnlyList<string> codigos,
        CancellationToken cancellationToken)
    {
        var normalizados = codigos.Select(codigo => codigo.Trim()).ToArray();
        if (normalizados.Any(string.IsNullOrWhiteSpace) ||
            normalizados.Distinct(StringComparer.OrdinalIgnoreCase).Count() != normalizados.Length)
            throw new ArgumentException("Os cupons informados são inválidos ou estão repetidos.");

        var cupons = new List<Cupom>();
        foreach (var codigo in normalizados)
        {
            var cupom = await _context.Cupons
                .FirstOrDefaultAsync(c => c.Codigo == codigo, cancellationToken);

            if (cupom is null || !cupom.Ativo ||
                (cupom.Natureza == NaturezaCupom.Troca && cupom.ClienteId != clienteId) ||
                (cupom.Natureza == NaturezaCupom.Promocional && cupom.ClienteId.HasValue))
                throw new ArgumentException($"Cupom {codigo} não está disponível para este cliente.");

            var jaUtilizado = await _context.PedidoCupons
                .AnyAsync(pc => pc.CupomId == cupom.Id, cancellationToken);
            if (jaUtilizado)
                throw new ArgumentException($"Cupom {codigo} já foi utilizado.");

            cupons.Add(cupom);
        }

        if (cupons.Count(cupom => cupom.Natureza == NaturezaCupom.Promocional) > 1)
            throw new ArgumentException("Só é permitido um cupom promocional por compra.");

        return cupons;
    }

    private static (decimal desconto, List<PedidoCupom> aplicacoes, decimal excedente)
        CalcularDescontos(IReadOnlyList<Cupom> cupons, decimal valorCompra)
    {
        var restante = valorCompra;
        var aplicacoes = new List<PedidoCupom>();
        var excedente = 0m;

        foreach (var cupom in cupons)
        {
            if (restante <= 0)
                throw new ArgumentException($"O cupom {cupom.Codigo} é desnecessário para esta compra.");

            var valorCupom = cupom.FormaDesconto switch
            {
                FormaDescontoCupom.Percentual => restante * cupom.Valor / 100m,
                FormaDescontoCupom.ValorFixo => cupom.Valor,
                _ => throw new ArgumentException($"A forma de desconto do cupom {cupom.Codigo} é inválida."),
            };
            var valorAplicado = decimal.Round(
                Math.Min(restante, valorCupom),
                2,
                MidpointRounding.AwayFromZero);
            if (valorAplicado <= 0)
                throw new ArgumentException($"O cupom {cupom.Codigo} não gera desconto para esta compra.");

            aplicacoes.Add(new PedidoCupom
            {
                Cupom = cupom,
                CupomId = cupom.Id,
                ValorAplicado = decimal.Round(valorAplicado, 2, MidpointRounding.AwayFromZero),
            });

            restante -= valorAplicado;
            if (cupom.FormaDesconto == FormaDescontoCupom.ValorFixo && valorCupom > valorAplicado)
                excedente += valorCupom - valorAplicado;
        }

        return (valorCompra - restante, aplicacoes, decimal.Round(excedente, 2, MidpointRounding.AwayFromZero));
    }

    private async Task<List<PedidoPagamento>> CriarPagamentosAsync(
        int clienteId,
        IReadOnlyList<CriarPedidoPagamentoRequest> requisicoes,
        decimal total,
        bool temCupons,
        CancellationToken cancellationToken)
    {
        var pagamentosValidos = requisicoes.Where(pagamento => pagamento.Valor > 0).ToArray();
        if (requisicoes.Any(pagamento => pagamento.Valor < 0))
            throw new ArgumentException("O valor de um pagamento não pode ser negativo.");

        if (decimal.Round(pagamentosValidos.Sum(pagamento => pagamento.Valor), 2) != total)
            throw new ArgumentException("A soma dos pagamentos deve ser igual ao total do pedido.");

        if (total == 0)
        {
            if (pagamentosValidos.Length != 0)
                throw new ArgumentException("Não é necessário pagamento quando os cupons cobrem o total.");
            return [];
        }

        var permiteValorMenorQueDez = temCupons && total < 10m && pagamentosValidos.Length == 1;
        if (pagamentosValidos.Length == 0 ||
            (!permiteValorMenorQueDez && pagamentosValidos.Any(pagamento => pagamento.Valor < 10m)))
            throw new ArgumentException("Cada cartão utilizado deve pagar pelo menos R$ 10,00.");

        var cartoesIds = pagamentosValidos
            .Where(pagamento => pagamento.CartaoCreditoId.HasValue)
            .Select(pagamento => pagamento.CartaoCreditoId!.Value)
            .Distinct()
            .ToArray();
        var cartoes = await _context.CartoesCredito
            .AsNoTracking()
            .Include(cartao => cartao.Bandeira)
            .Where(cartao => cartoesIds.Contains(cartao.Id) && cartao.ClienteId == clienteId)
            .ToDictionaryAsync(cartao => cartao.Id, cancellationToken);

        if (cartoes.Count != cartoesIds.Length)
            throw new ArgumentException("Um ou mais cartões não pertencem ao cliente.");

        return pagamentosValidos.Select(pagamento =>
        {
            if (pagamento.CartaoCreditoId is int cartaoId)
            {
                var cartao = cartoes[cartaoId];
                var numero = cartao.Numero.Trim();
                if (numero.Length < 4)
                    throw new ArgumentException("O cartão cadastrado não possui quatro dígitos para identificação.");
                return new PedidoPagamento
                {
                    CartaoCreditoId = cartao.Id,
                    Bandeira = cartao.Bandeira.Nome,
                    Ultimos4 = numero[^4..],
                    Valor = decimal.Round(pagamento.Valor, 2),
                };
            }

            if (string.IsNullOrWhiteSpace(pagamento.Bandeira) ||
                pagamento.Bandeira.Trim().Length > 50 ||
                pagamento.Ultimos4 is not { Length: 4 } ultimos4 ||
                !ultimos4.All(char.IsDigit))
                throw new ArgumentException("Informe bandeira e últimos quatro dígitos para o cartão não salvo.");

            return new PedidoPagamento
            {
                Bandeira = pagamento.Bandeira.Trim(),
                Ultimos4 = ultimos4,
                Valor = decimal.Round(pagamento.Valor, 2),
            };
        }).ToList();
    }

    private static void ValidarEndereco(EnderecoPedidoRequest endereco)
    {
        if (new[]
            {
                endereco.TipoResidencia, endereco.TipoLogradouro, endereco.Logradouro,
                endereco.Numero, endereco.Bairro, endereco.CEP, endereco.Cidade,
                endereco.Estado, endereco.Pais,
            }.Any(string.IsNullOrWhiteSpace))
            throw new ArgumentException("O endereço de entrega está incompleto.");

        if (endereco.CEP.Trim().Length != 8 || endereco.Estado.Trim().Length != 2)
            throw new ArgumentException("CEP ou estado do endereço de entrega inválido.");
    }

    private static decimal CalcularFrete(
        IReadOnlyList<CriarPedidoItemRequest> itens,
        EnderecoPedidoRequest endereco)
    {
        // Frete demonstrativo: R$ 12,00 + R$ 2,00 por unidade, mais R$ 10,00 fora de SP.
        var quantidadeTotal = itens.Sum(item => item.Quantidade);
        var adicionalEstado = string.Equals(
            endereco.Estado.Trim(),
            "SP",
            StringComparison.OrdinalIgnoreCase) ? 0m : 10m;
        return 12m + (2m * quantidadeTotal) + adicionalEstado;
    }

    private static string CriarCodigoCupomTroca() =>
        $"TROCA-{Guid.NewGuid():N}"[..30].ToUpperInvariant();

    // Projeção executada no banco: lê apenas os snapshots do pedido, nunca dados completos do cartão.
    private static PedidoResponse MapearParaResponse(Pedido p)
    {
        return new PedidoResponse(
            p.Id,
            p.Codigo,
            p.ClienteId,
            p.DataCriacao,
            p.Status switch
            {
                StatusPedido.EmProcessamento => "EM PROCESSAMENTO",
                StatusPedido.Cancelado => "CANCELADO",
                _ => p.Status.ToString()
            },
            p.Subtotal,
            p.ValorFrete,
            p.ValorDesconto,
            p.Total,
            new PedidoEnderecoEntregaResponse(
                p.EntregaNome,
                p.EntregaTipoResidencia,
                p.EntregaTipoLogradouro,
                p.EntregaLogradouro,
                p.EntregaNumero,
                p.EntregaBairro,
                p.EntregaCEP,
                p.EntregaCidade,
                p.EntregaEstado,
                p.EntregaPais,
                p.EntregaObservacoes),
            p.Itens
                .OrderBy(i => i.Id)
                .Select(i => new PedidoItemResponse(
                    i.ProdutoId,
                    i.NomeProduto,
                    i.PrecoUnitario,
                    i.Quantidade,
                    i.PrecoUnitario * i.Quantidade))
                .ToList(),
            p.Pagamentos
                .OrderBy(g => g.Id)
                .Select(g => new PedidoPagamentoResponse(g.Bandeira, g.Ultimos4, g.Valor))
                .ToList(),
            p.Cupons
                .OrderBy(c => c.Id)
                .Select(c => new PedidoCupomAplicadoResponse(
                    c.Cupom.Codigo,
                    c.Cupom.Natureza.ToString(),
                    c.Cupom.FormaDesconto.ToString(),
                    c.Cupom.Valor,
                    c.ValorAplicado))
                .ToList());
    }
}
