namespace IGB.Smartphones.Api.Dtos;

public sealed record PedidoCupomAplicadoResponse(
    string Codigo,
    string Natureza,
    string FormaDesconto,
    decimal Valor,
    decimal ValorAplicado);
