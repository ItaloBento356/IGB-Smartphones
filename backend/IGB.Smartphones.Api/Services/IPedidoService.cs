using IGB.Smartphones.Api.Dtos;

namespace IGB.Smartphones.Api.Services;

public interface IPedidoService
{
    Task<IReadOnlyList<PedidoResponse>> ListarAsync(int? clienteId, CancellationToken cancellationToken);

    Task<PedidoResponse?> ObterPorIdAsync(int id, CancellationToken cancellationToken);

    Task<CotacaoFreteResponse> CalcularFreteAsync(
        CotacaoFreteRequest request,
        CancellationToken cancellationToken);

    Task<PedidoResponse> CriarAsync(
        CriarPedidoRequest request,
        CancellationToken cancellationToken);
}