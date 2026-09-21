namespace IGB.Smartphones.Api.Exceptions;

// Erro de validação de regra de negócio não coberta pelas DataAnnotations do DTO (HTTP 400).
public class ClienteValidacaoException : Exception
{
    public ClienteValidacaoException(string message) : base(message)
    {
    }
}
