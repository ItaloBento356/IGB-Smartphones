using System.ComponentModel.DataAnnotations;

namespace IGB.Smartphones.Api.Dtos;

// Dados permitidos na alteração de um cliente existente: sem Id, CodigoCliente, Ativo, Senha ou PasswordHash.
public class AtualizarClienteRequest
{
    [Required(ErrorMessage = "O nome é obrigatório.")]
    [MaxLength(150)]
    public string Nome { get; set; } = string.Empty;

    [Required(ErrorMessage = "O gênero é obrigatório.")]
    [MaxLength(30)]
    public string Genero { get; set; } = string.Empty;

    [Required(ErrorMessage = "A data de nascimento é obrigatória.")]
    public DateOnly DataNascimento { get; set; }

    [Required(ErrorMessage = "O CPF é obrigatório.")]
    [RegularExpression(@"^\d{11}$", ErrorMessage = "O CPF deve conter 11 dígitos.")]
    public string CPF { get; set; } = string.Empty;

    [Required(ErrorMessage = "O tipo de telefone é obrigatório.")]
    [MaxLength(20)]
    public string TelefoneTipo { get; set; } = string.Empty;

    [Required(ErrorMessage = "O DDD é obrigatório.")]
    [RegularExpression(@"^\d{2}$", ErrorMessage = "O DDD deve conter 2 dígitos.")]
    public string DDD { get; set; } = string.Empty;

    [Required(ErrorMessage = "O número de telefone é obrigatório.")]
    [RegularExpression(@"^\d{8,9}$", ErrorMessage = "O número de telefone deve conter 8 ou 9 dígitos.")]
    public string TelefoneNumero { get; set; } = string.Empty;

    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "Informe um e-mail válido.")]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "O endereço é obrigatório.")]
    public EnderecoRequest Endereco { get; set; } = new();
}
