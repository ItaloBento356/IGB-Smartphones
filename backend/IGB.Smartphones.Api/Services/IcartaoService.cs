using IGB.Smartphones.Api.Dtos;

namespace IGB.Smartphones.Api.Services;

public interface ICartaoService
{
    Task<IReadOnlyList<CartaoResponse>> ListarAsync(int clienteId);

    Task<CartaoResponse> AdicionarAsync(
        int clienteId,
        CadastrarCartaoRequest request);

    Task<CartaoResponse> DefinirComoPreferencialAsync(
        int clienteId,
        int cartaoId);
}