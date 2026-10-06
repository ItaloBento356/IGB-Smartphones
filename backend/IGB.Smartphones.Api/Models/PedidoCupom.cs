namespace IGB.Smartphones.Api.Models;

public class PedidoCupom
{
    public int Id { get; set; }

    public int PedidoId { get; set; }

    public Pedido Pedido { get; set; } = null!;

    public int CupomId { get; set; }

    public Cupom Cupom { get; set; } = null!;

    public decimal ValorAplicado { get; set; }
}