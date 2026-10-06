namespace IGB.Smartphones.Api.Dtos;

public record PedidoItemResponse(
    int ProdutoId,
    string NomeProduto,
    decimal PrecoUnitario,
    int Quantidade,
    decimal Subtotal);