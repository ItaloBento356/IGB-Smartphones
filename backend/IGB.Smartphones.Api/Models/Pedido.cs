using System.ComponentModel.DataAnnotations;

namespace IGB.Smartphones.Api.Models;

public class Pedido
{
    public int Id { get; set; }

    [Required]
    [MaxLength(30)]
    public string Codigo { get; set; } = string.Empty;

    public int ClienteId { get; set; }

    public Cliente Cliente { get; set; } = null!;

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public StatusPedido Status { get; set; } = StatusPedido.EmProcessamento;

    public decimal Subtotal { get; set; }

    public decimal ValorFrete { get; set; }

    public decimal ValorDesconto { get; set; }

    public decimal Total { get; set; }

    // Snapshot do endereço de entrega no momento da compra (não referencia Endereco).
    [MaxLength(50)]
    public string? EntregaNome { get; set; }

    [Required]
    [MaxLength(50)]
    public string EntregaTipoResidencia { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string EntregaTipoLogradouro { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string EntregaLogradouro { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string EntregaNumero { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string EntregaBairro { get; set; } = string.Empty;

    [Required]
    [MaxLength(8)]
    public string EntregaCEP { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string EntregaCidade { get; set; } = string.Empty;

    [Required]
    [MaxLength(2)]
    public string EntregaEstado { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string EntregaPais { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? EntregaObservacoes { get; set; }

    public ICollection<PedidoItem> Itens { get; set; } = new List<PedidoItem>();
    public ICollection<PedidoPagamento> Pagamentos { get; set; } = new List<PedidoPagamento>();
    public ICollection<PedidoCupom> Cupons { get; set; } = new List<PedidoCupom>();
}