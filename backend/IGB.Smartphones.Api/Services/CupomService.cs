using IGB.Smartphones.Api.Data;
using IGB.Smartphones.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace IGB.Smartphones.Api.Services;

public sealed class CupomService : ICupomService
{
    private readonly ApplicationDbContext _context;

    public CupomService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<CupomPedidoResponse>> ListarDisponiveisAsync(
        int clienteId,
        CancellationToken cancellationToken)
    {
        var clienteExiste = await _context.Clientes
            .AnyAsync(cliente => cliente.Id == clienteId, cancellationToken);
        if (!clienteExiste)
            throw new KeyNotFoundException("Cliente não encontrado.");

        return await _context.Cupons
            .AsNoTracking()
            .Where(cupom =>
                cupom.Ativo &&
                (cupom.ClienteId == null || cupom.ClienteId == clienteId) &&
                !_context.PedidoCupons.Any(aplicacao => aplicacao.CupomId == cupom.Id))
            .OrderBy(cupom => cupom.Id)
            .Select(cupom => new CupomPedidoResponse(
                cupom.Id,
                cupom.Codigo,
                cupom.Natureza.ToString(),
                cupom.FormaDesconto.ToString(),
                cupom.Valor))
            .ToListAsync(cancellationToken);
    }
}
