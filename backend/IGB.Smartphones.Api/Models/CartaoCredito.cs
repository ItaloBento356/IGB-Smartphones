using System.ComponentModel.DataAnnotations;

namespace IGB.Smartphones.Api.Models;

public class CartaoCredito
{
    public int Id { get; set; }

    [Required]
    public int ClienteId { get; set; }

    public Cliente Cliente { get; set; } = null!;

    [Required]
    [MaxLength(19)]
    public string Numero { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string NomeImpresso { get; set; } = string.Empty;

    [Required]
    public int BandeiraId { get; set; }

    public Bandeira Bandeira { get; set; } = null!;

    [Required]
    [MaxLength(4)]
    public string CodigoSeguranca { get; set; } = string.Empty;

    public bool Preferencial { get; set; }
}