using IGB.Smartphones.Api.Dtos;

namespace IGB.Smartphones.Api.Services;

public interface ICupomService
{
    Task<IReadOnlyList<CupomPedidoResponse>> ListarDisponiveisAsync(
        int clienteId,
        CancellationToken cancellationToken);
}
