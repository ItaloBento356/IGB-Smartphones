namespace IGB.Smartphones.Api.Dtos;

public sealed record CupomPedidoResponse(
    int Id,
    string Codigo,
    string Natureza,
    string FormaDesconto,
    decimal Valor);
