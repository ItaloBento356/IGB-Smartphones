using System.ComponentModel.DataAnnotations;

namespace IGB.Smartphones.Api.Dtos;

public sealed record CriarPedidoRequest
{
    [Range(1, int.MaxValue)]
    public int ClienteId { get; init; }

    [Required, MinLength(1)]
    public IReadOnlyList<CriarPedidoItemRequest> Itens { get; init; } = [];

    [Required]
    public EnderecoPedidoRequest EnderecoEntrega { get; init; } = new();

    public IReadOnlyList<CriarPedidoPagamentoRequest> Pagamentos { get; init; } = [];

    public IReadOnlyList<string> Cupons { get; init; } = [];
}

public sealed record CriarPedidoItemRequest
{
    [Range(1, int.MaxValue)]
    public int ProdutoId { get; init; }

    [Range(1, int.MaxValue)]
    public int Quantidade { get; init; }
}

public sealed record CriarPedidoPagamentoRequest
{
    public int? CartaoCreditoId { get; init; }

    [MaxLength(50)]
    public string? Bandeira { get; init; }

    [StringLength(4, MinimumLength = 4)]
    public string? Ultimos4 { get; init; }

    [Range(0, 999999999)]
    public decimal Valor { get; init; }
}

public sealed record EnderecoPedidoRequest
{
    [MaxLength(50)]
    public string? Nome { get; init; }

    [Required, MaxLength(50)]
    public string TipoResidencia { get; init; } = string.Empty;

    [Required, MaxLength(50)]
    public string TipoLogradouro { get; init; } = string.Empty;

    [Required, MaxLength(150)]
    public string Logradouro { get; init; } = string.Empty;

    [Required, MaxLength(20)]
    public string Numero { get; init; } = string.Empty;

    [Required, MaxLength(100)]
    public string Bairro { get; init; } = string.Empty;

    [Required, StringLength(8, MinimumLength = 8)]
    public string CEP { get; init; } = string.Empty;

    [Required, MaxLength(100)]
    public string Cidade { get; init; } = string.Empty;

    [Required, StringLength(2, MinimumLength = 2)]
    public string Estado { get; init; } = string.Empty;

    [Required, MaxLength(100)]
    public string Pais { get; init; } = string.Empty;

    [MaxLength(300)]
    public string? Observacoes { get; init; }
}
