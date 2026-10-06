using System.ComponentModel.DataAnnotations;

namespace IGB.Smartphones.Api.Models;

public class PedidoPagamento
{
    public int Id { get; set; }

    public int PedidoId { get; set; }

    public Pedido Pedido { get; set; } = null!;

    public int? CartaoCreditoId { get; set; }

    public CartaoCredito? CartaoCredito { get; set; }

    // Snapshots: nunca armazenar número completo nem CVV neste registro.
    [Required]
    [StringLength(4, MinimumLength = 4)]
    public string Ultimos4 { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Bandeira { get; set; } = string.Empty;

    public decimal Valor { get; set; }
}