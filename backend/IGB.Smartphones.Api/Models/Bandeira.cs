using System.ComponentModel.DataAnnotations;

namespace IGB.Smartphones.Api.Models;

public class Bandeira
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Nome { get; set; } = string.Empty;

    public ICollection<CartaoCredito> Cartoes { get; set; } = new List<CartaoCredito>();
}