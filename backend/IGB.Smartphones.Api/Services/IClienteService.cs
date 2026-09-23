using IGB.Smartphones.Api.Dtos;

namespace IGB.Smartphones.Api.Services;

public interface IClienteService
{
    Task<ClienteResponse> CadastrarAsync(CadastrarClienteRequest request);

    Task<IReadOnlyList<ClienteResponse>> ConsultarAsync(string? codigo, string? nome, string? cpf, string? email);

    Task<ClienteResponse> ObterPorIdAsync(int id);

    Task<ClienteResponse> AtualizarAsync(int id, AtualizarClienteRequest request);

    Task<ClienteResponse> InativarAsync(int id);

    Task<ClienteResponse> AdicionarEnderecoEntregaAsync(int clienteId, EnderecoEntregaRequest request);

    Task<ClienteResponse> AtualizarEnderecoEntregaAsync(int clienteId, int enderecoId, EnderecoEntregaRequest request);

    Task<LoginResponse> AutenticarAsync(string email, string senha);
}
