using System.ComponentModel.DataAnnotations;

namespace IGB.Smartphones.Api.Dtos;

// Mesma estrutura de EnderecoRequest (RN0023), com a identificação curta exigida pelo RF0026.
public class EnderecoEntregaRequest : EnderecoRequest
{
    [Required(ErrorMessage = "A identificação do endereço de entrega é obrigatória.")]
    [MaxLength(50)]
    public string Nome { get; set; } = string.Empty;
}
