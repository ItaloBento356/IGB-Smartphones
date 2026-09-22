using System.ComponentModel.DataAnnotations;

namespace IGB.Smartphones.Api.Models;

public class Cliente
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string CodigoCliente { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Nome { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Genero { get; set; } = string.Empty;

    [Required]
    public DateOnly DataNascimento { get; set; }

    [Required]
    [MaxLength(11)]
    public string CPF { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string TelefoneTipo { get; set; } = string.Empty;

    [Required]
    [MaxLength(3)]
    public string DDD { get; set; } = string.Empty;

    [Required]
    [MaxLength(9)]
    public string TelefoneNumero { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public bool Ativo { get; set; } = true;

    // Endereço de cobrança obrigatório do cliente (RN0021).
    [Required]
    public int EnderecoCobrancaId { get; set; }

    public Endereco EnderecoCobranca { get; set; } = null!;

    // Endereços de entrega do cliente (RN0022: ao menos um; RF0026: podem ser vários).
    public ICollection<Endereco> EnderecosEntrega { get; set; } = new List<Endereco>();
    public ICollection<CartaoCredito> Cartoes { get; set; } = new List<CartaoCredito>();
}
