using IGB.Smartphones.Api.Dtos;

namespace IGB.Smartphones.Api.Services;

public interface IProdutoService
{
    Task<IReadOnlyList<ProdutoResponse>> ListarAtivosAsync();

    Task<ProdutoResponse?> ObterAtivoPorIdAsync(int id);
}