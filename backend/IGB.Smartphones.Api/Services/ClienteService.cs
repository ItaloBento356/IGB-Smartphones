using IGB.Smartphones.Api.Data;
using IGB.Smartphones.Api.Dtos;
using IGB.Smartphones.Api.Exceptions;
using IGB.Smartphones.Api.Models;
using IGB.Smartphones.Api.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace IGB.Smartphones.Api.Services;

public class ClienteService : IClienteService
{
    private readonly ApplicationDbContext _context;
    private readonly PasswordHasher<Cliente> _passwordHasher;

    public ClienteService(ApplicationDbContext context, PasswordHasher<Cliente> passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<ClienteResponse> CadastrarAsync(CadastrarClienteRequest request)
    {
        if (request.Senha != request.ConfirmacaoSenha)
            throw new ClienteValidacaoException("A confirmação de senha não corresponde à senha informada.");

        ValidarSenha(request.Senha);

        var cpf = SomenteDigitos(request.CPF);
        if (!CpfValidator.EhValido(cpf))
            throw new ClienteValidacaoException("CPF inválido.");

        var email = request.Email.Trim();

        var cpfDuplicado = await _context.Clientes.AnyAsync(c => c.CPF == cpf);
        var emailDuplicado = await _context.Clientes.AnyAsync(c => c.Email.ToLower() == email.ToLower());

        if (cpfDuplicado || emailDuplicado)
            throw CriarExcecaoDeConflito(cpfDuplicado, emailDuplicado);

        var cliente = new Cliente
        {
            // Placeholder único e temporário (20 caracteres): o CodigoCliente definitivo só pode ser
            // calculado a partir do Id, que é gerado pelo banco após o insert.
            CodigoCliente = $"TMP-{Guid.NewGuid():N}"[..20],
            Nome = request.Nome.Trim(),
            Genero = request.Genero.Trim(),
            DataNascimento = request.DataNascimento,
            CPF = cpf,
            TelefoneTipo = request.TelefoneTipo.Trim(),
            DDD = SomenteDigitos(request.DDD),
            TelefoneNumero = SomenteDigitos(request.TelefoneNumero),
            Email = email,
            Ativo = true,
            EnderecoCobranca = CriarEndereco(request.EnderecoCobranca),
        };
        // Endereço de entrega inicial (RN0022): adicionado à coleção para que o EF resolva o ClienteId no insert.
        cliente.EnderecosEntrega.Add(CriarEnderecoEntrega(request.EnderecoEntrega));

        cliente.PasswordHash = _passwordHasher.HashPassword(cliente, request.Senha);

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            // Código legível e único, gerado a partir do Id sequencial: CLI-<ano>-<id com 6 dígitos>.
            cliente.CodigoCliente = $"CLI-{DateTime.UtcNow:yyyy}-{cliente.Id:D6}";
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } postgresException)
        {
            await transaction.RollbackAsync();
            throw CriarExcecaoDeConflito(postgresException);
        }

        return MapearParaResponse(cliente);
    }

    public async Task<IReadOnlyList<ClienteResponse>> ConsultarAsync(string? codigo, string? nome, string? cpf, string? email)
    {
        IQueryable<Cliente> query = _context.Clientes
            .Include(c => c.EnderecoCobranca)
            .Include(c => c.EnderecosEntrega);

        if (!string.IsNullOrWhiteSpace(codigo))
        {
            var codigoNormalizado = codigo.Trim();
            query = query.Where(c => c.CodigoCliente == codigoNormalizado);
        }

        if (!string.IsNullOrWhiteSpace(nome))
        {
            var nomeNormalizado = nome.Trim().ToLower();
            query = query.Where(c => c.Nome.ToLower().Contains(nomeNormalizado));
        }

        if (!string.IsNullOrWhiteSpace(cpf))
        {
            var cpfNormalizado = SomenteDigitos(cpf);
            query = query.Where(c => c.CPF == cpfNormalizado);
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            var emailNormalizado = email.Trim().ToLower();
            query = query.Where(c => c.Email.ToLower().Contains(emailNormalizado));
        }

        var clientes = await query
            .OrderBy(c => c.Nome)
            .ToListAsync();

        return clientes.Select(MapearParaResponse).ToList();
    }

    public async Task<ClienteResponse> ObterPorIdAsync(int id)
    {
        var cliente = await BuscarClienteCompletoAsync(id);
        if (cliente is null)
            throw new ClienteNaoEncontradoException($"Cliente com Id {id} não encontrado.");

        return MapearParaResponse(cliente);
    }

    public async Task<ClienteResponse> AtualizarAsync(int id, AtualizarClienteRequest request)
    {
        var cliente = await BuscarClienteCompletoAsync(id);
        if (cliente is null)
            throw new ClienteNaoEncontradoException($"Cliente com Id {id} não encontrado.");

        var cpf = SomenteDigitos(request.CPF);
        if (!CpfValidator.EhValido(cpf))
            throw new ClienteValidacaoException("CPF inválido.");

        var email = request.Email.Trim();

        // Ao verificar duplicidade, o próprio cliente (mesmo Id) não conta como conflito.
        var cpfDuplicado = await _context.Clientes.AnyAsync(c => c.Id != id && c.CPF == cpf);
        var emailDuplicado = await _context.Clientes.AnyAsync(c => c.Id != id && c.Email.ToLower() == email.ToLower());

        if (cpfDuplicado || emailDuplicado)
            throw CriarExcecaoDeConflito(cpfDuplicado, emailDuplicado);

        cliente.Nome = request.Nome.Trim();
        cliente.Genero = request.Genero.Trim();
        cliente.DataNascimento = request.DataNascimento;
        cliente.CPF = cpf;
        cliente.TelefoneTipo = request.TelefoneTipo.Trim();
        cliente.DDD = SomenteDigitos(request.DDD);
        cliente.TelefoneNumero = SomenteDigitos(request.TelefoneNumero);
        cliente.Email = email;

        // Apenas o endereço de cobrança é alterado aqui; os endereços de entrega têm endpoints próprios (RNF0034).
        PreencherEndereco(cliente.EnderecoCobranca, request.EnderecoCobranca);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } postgresException)
        {
            throw CriarExcecaoDeConflito(postgresException);
        }

        return MapearParaResponse(cliente);
    }

    public async Task<ClienteResponse> InativarAsync(int id)
    {
        var cliente = await BuscarClienteCompletoAsync(id);
        if (cliente is null)
            throw new ClienteNaoEncontradoException($"Cliente com Id {id} não encontrado.");

        if (cliente.Ativo)
        {
            cliente.Ativo = false;
            await _context.SaveChangesAsync();
        }

        return MapearParaResponse(cliente);
    }

    public async Task<ClienteResponse> AdicionarEnderecoEntregaAsync(int clienteId, EnderecoEntregaRequest request)
    {
        var cliente = await BuscarClienteCompletoAsync(clienteId);
        if (cliente is null)
            throw new ClienteNaoEncontradoException($"Cliente com Id {clienteId} não encontrado.");

        cliente.EnderecosEntrega.Add(CriarEnderecoEntrega(request));
        await _context.SaveChangesAsync();

        return MapearParaResponse(cliente);
    }

    public async Task<ClienteResponse> AtualizarEnderecoEntregaAsync(int clienteId, int enderecoId, EnderecoEntregaRequest request)
    {
        var cliente = await BuscarClienteCompletoAsync(clienteId);
        if (cliente is null)
            throw new ClienteNaoEncontradoException($"Cliente com Id {clienteId} não encontrado.");

        var endereco = cliente.EnderecosEntrega.FirstOrDefault(e => e.Id == enderecoId);
        if (endereco is null)
            throw new ClienteNaoEncontradoException($"Endereço de entrega com Id {enderecoId} não encontrado para este cliente.");

        PreencherEndereco(endereco, request);
        endereco.Nome = request.Nome.Trim();
        await _context.SaveChangesAsync();

        return MapearParaResponse(cliente);
    }

    private Task<Cliente?> BuscarClienteCompletoAsync(int id) =>
        _context.Clientes
            .Include(c => c.EnderecoCobranca)
            .Include(c => c.EnderecosEntrega)
            .FirstOrDefaultAsync(c => c.Id == id);

    // Determina, pela constraint violada, se o conflito foi de CPF, e-mail ou ambos (condição de corrida).
    private static ClienteConflitoException CriarExcecaoDeConflito(PostgresException ex)
    {
        var constraint = ex.ConstraintName ?? string.Empty;
        var cpfDuplicado = constraint.Contains("CPF", StringComparison.OrdinalIgnoreCase);
        var emailDuplicado = constraint.Contains("Email", StringComparison.OrdinalIgnoreCase);

        // Se a constraint não permitir identificar o campo, assume-se conflito em ambos por segurança.
        if (!cpfDuplicado && !emailDuplicado)
        {
            cpfDuplicado = true;
            emailDuplicado = true;
        }

        return CriarExcecaoDeConflito(cpfDuplicado, emailDuplicado);
    }

    private static ClienteConflitoException CriarExcecaoDeConflito(bool cpfDuplicado, bool emailDuplicado)
    {
        var campos = new List<string>();
        if (cpfDuplicado) campos.Add("cpf");
        if (emailDuplicado) campos.Add("email");

        var mensagem = cpfDuplicado && emailDuplicado
            ? "CPF e e-mail já cadastrados."
            : cpfDuplicado
                ? "CPF já cadastrado."
                : "E-mail já cadastrado.";

        return new ClienteConflitoException(mensagem, campos);
    }

    private static string SomenteDigitos(string valor) => new(valor.Where(char.IsDigit).ToArray());

    private static void ValidarSenha(string senha)
    {
        if (string.IsNullOrEmpty(senha) || senha.Length < 8)
            throw new ClienteValidacaoException("A senha deve ter no mínimo 8 caracteres.");

        if (!senha.Any(char.IsUpper))
            throw new ClienteValidacaoException("A senha deve conter ao menos uma letra maiúscula.");

        if (!senha.Any(char.IsLower))
            throw new ClienteValidacaoException("A senha deve conter ao menos uma letra minúscula.");

        if (senha.All(char.IsLetterOrDigit))
            throw new ClienteValidacaoException("A senha deve conter ao menos um caractere especial.");
    }

    private static void PreencherEndereco(Endereco endereco, EnderecoRequest request)
    {
        endereco.TipoResidencia = request.TipoResidencia.Trim();
        endereco.TipoLogradouro = request.TipoLogradouro.Trim();
        endereco.Logradouro = request.Logradouro.Trim();
        endereco.Numero = request.Numero.Trim();
        endereco.Bairro = request.Bairro.Trim();
        endereco.CEP = SomenteDigitos(request.CEP);
        endereco.Cidade = request.Cidade.Trim();
        endereco.Estado = request.Estado.Trim().ToUpperInvariant();
        endereco.Pais = request.Pais.Trim();
        endereco.Observacoes = string.IsNullOrWhiteSpace(request.Observacoes) ? null : request.Observacoes.Trim();
    }

    private static Endereco CriarEndereco(EnderecoRequest request)
    {
        var endereco = new Endereco();
        PreencherEndereco(endereco, request);
        return endereco;
    }

    private static Endereco CriarEnderecoEntrega(EnderecoEntregaRequest request)
    {
        var endereco = CriarEndereco(request);
        endereco.Nome = request.Nome.Trim();
        return endereco;
    }

    private static ClienteResponse MapearParaResponse(Cliente cliente) => new(
        cliente.Id,
        cliente.CodigoCliente,
        cliente.Nome,
        cliente.Genero,
        cliente.DataNascimento,
        cliente.CPF,
        cliente.TelefoneTipo,
        cliente.DDD,
        cliente.TelefoneNumero,
        cliente.Email,
        cliente.Ativo,
        MapearEndereco(cliente.EnderecoCobranca),
        cliente.EnderecosEntrega.Select(MapearEndereco).ToList());

    private static EnderecoResponse MapearEndereco(Endereco endereco) => new(
        endereco.Id,
        endereco.Nome,
        endereco.TipoResidencia,
        endereco.TipoLogradouro,
        endereco.Logradouro,
        endereco.Numero,
        endereco.Bairro,
        endereco.CEP,
        endereco.Cidade,
        endereco.Estado,
        endereco.Pais,
        endereco.Observacoes);
}

