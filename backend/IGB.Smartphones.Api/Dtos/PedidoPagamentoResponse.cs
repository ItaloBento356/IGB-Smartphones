namespace IGB.Smartphones.Api.Dtos;

public record PedidoPagamentoResponse(
    string Bandeira,
    string Ultimos4,
    decimal Valor);