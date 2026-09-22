using System.ComponentModel.DataAnnotations;

namespace IGB.Smartphones.Api.Dtos;

public class CadastrarCartaoRequest
{
    [Required(ErrorMessage = "O número do cartão é obrigatório.")]
    [MaxLength(19)]
    public string Numero { get; set; } = string.Empty;

    [Required(ErrorMessage = "O nome impresso no cartão é obrigatório.")]
    [MaxLength(100)]
    public string NomeImpresso { get; set; } = string.Empty;

    [Required(ErrorMessage = "A bandeira do cartão é obrigatória.")]
    public int BandeiraId { get; set; }

    [Required(ErrorMessage = "O código de segurança é obrigatório.")]
    [MaxLength(4)]
    public string CodigoSeguranca { get; set; } = string.Empty;

    public bool Preferencial { get; set; }
}