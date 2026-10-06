using System.ComponentModel.DataAnnotations;

namespace IGB.Smartphones.Api.Models;

public class Produto
{
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Nome { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Marca { get; set; } = string.Empty;

    public decimal Preco { get; set; }

    [Required]
    [MaxLength(30)]
    public string Cor { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? ImagemUrl { get; set; }

    public bool Ativo { get; set; } = true;

    // Apenas consultado para validar disponibilidade; a baixa de estoque está fora do escopo desta fase.
    public int QuantidadeEstoque { get; set; }
}