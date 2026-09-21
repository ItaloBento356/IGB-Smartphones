using System.ComponentModel.DataAnnotations;

namespace IGB.Smartphones.Api.Models;

public class Endereco
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string TipoResidencia { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string TipoLogradouro { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Logradouro { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Numero { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Bairro { get; set; } = string.Empty;

    [Required]
    [MaxLength(8)]
    public string CEP { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Cidade { get; set; } = string.Empty;

    [Required]
    [MaxLength(2)]
    public string Estado { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Pais { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Observacoes { get; set; }
}
