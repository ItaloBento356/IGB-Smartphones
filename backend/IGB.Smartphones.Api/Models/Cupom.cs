using System.ComponentModel.DataAnnotations;

namespace IGB.Smartphones.Api.Models;

public class Cupom
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Codigo { get; set; } = string.Empty;

    public NaturezaCupom Natureza { get; set; }

    public FormaDescontoCupom FormaDesconto { get; set; }

    // Percentual (0 < valor <= 100) ou valor fixo em reais, conforme a FormaDesconto.
    public decimal Valor { get; set; }

    public bool Ativo { get; set; } = true;

    // Nulo para cupom promocional; preenchido para cupom exclusivo de um cliente.
    public int? ClienteId { get; set; }

    public Cliente? Cliente { get; set; }
}