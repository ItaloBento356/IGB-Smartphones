namespace IGB.Smartphones.Api.Dtos;

public record PedidoResponse(
    int Id,
    string Codigo,
    int ClienteId,
    DateTime DataCriacao,
    string Status,
    decimal Subtotal,
    decimal ValorFrete,
    decimal ValorDesconto,
    decimal Total,
    PedidoEnderecoEntregaResponse EnderecoEntrega,
    IReadOnlyList<PedidoItemResponse> Itens,
    IReadOnlyList<PedidoPagamentoResponse> Pagamentos,
    IReadOnlyList<PedidoCupomAplicadoResponse> Cupons);