namespace IGB.Smartphones.Api.Dtos;

public record ProdutoResponse(
    int Id,
    string Nome,
    string Marca,
    decimal Preco,
    string Cor,
    string? ImagemUrl,
    int QuantidadeEstoque);