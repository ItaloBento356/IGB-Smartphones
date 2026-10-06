using System.ComponentModel.DataAnnotations;

namespace IGB.Smartphones.Api.Dtos;

public sealed record CotacaoFreteRequest
{
    [Required, MinLength(1)]
    public IReadOnlyList<CriarPedidoItemRequest> Itens { get; init; } = [];

    [Required]
    public EnderecoPedidoRequest EnderecoEntrega { get; init; } = new();
}

public sealed record CotacaoFreteResponse(decimal ValorFrete);
