using System.ComponentModel.DataAnnotations;

namespace IGB.Smartphones.Api.Models;

public class PedidoItem
{
    public int Id { get; set; }

    public int PedidoId { get; set; }

    public Pedido Pedido { get; set; } = null!;

    public int ProdutoId { get; set; }

    public Produto Produto { get; set; } = null!;

    // Snapshots do produto no momento da compra.
    [Required]
    [MaxLength(150)]
    public string NomeProduto { get; set; } = string.Empty;

    public decimal PrecoUnitario { get; set; }

    public int Quantidade { get; set; }
}