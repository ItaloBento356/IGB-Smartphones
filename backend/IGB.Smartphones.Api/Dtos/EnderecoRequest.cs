using System.ComponentModel.DataAnnotations;

namespace IGB.Smartphones.Api.Dtos;

public class EnderecoRequest
{
    [Required(ErrorMessage = "O tipo de residência é obrigatório.")]
    [MaxLength(50)]
    public string TipoResidencia { get; set; } = string.Empty;

    [Required(ErrorMessage = "O tipo de logradouro é obrigatório.")]
    [MaxLength(50)]
    public string TipoLogradouro { get; set; } = string.Empty;

    [Required(ErrorMessage = "O logradouro é obrigatório.")]
    [MaxLength(150)]
    public string Logradouro { get; set; } = string.Empty;

    [Required(ErrorMessage = "O número é obrigatório.")]
    [MaxLength(20)]
    public string Numero { get; set; } = string.Empty;

    [Required(ErrorMessage = "O bairro é obrigatório.")]
    [MaxLength(100)]
    public string Bairro { get; set; } = string.Empty;

    [Required(ErrorMessage = "O CEP é obrigatório.")]
    [RegularExpression(@"^\d{8}$", ErrorMessage = "O CEP deve conter 8 dígitos.")]
    public string CEP { get; set; } = string.Empty;

    [Required(ErrorMessage = "A cidade é obrigatória.")]
    [MaxLength(100)]
    public string Cidade { get; set; } = string.Empty;

    [Required(ErrorMessage = "O estado é obrigatório.")]
    [StringLength(2, MinimumLength = 2, ErrorMessage = "O estado deve ser informado com a sigla de 2 letras (UF).")]
    public string Estado { get; set; } = string.Empty;

    [Required(ErrorMessage = "O país é obrigatório.")]
    [MaxLength(100)]
    public string Pais { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Observacoes { get; set; }
}
