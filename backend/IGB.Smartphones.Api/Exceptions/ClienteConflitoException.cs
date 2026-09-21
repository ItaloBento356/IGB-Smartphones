namespace IGB.Smartphones.Api.Exceptions;

// CPF, e-mail ou código já cadastrados (HTTP 409).
public class ClienteConflitoException : Exception
{
    public ClienteConflitoException(string message, IReadOnlyCollection<string> camposConflitantes) : base(message)
    {
        CamposConflitantes = camposConflitantes;
    }

    // Nomes dos campos em conflito (ex.: "cpf", "email"), usados pelo frontend para destacar os campos.
    public IReadOnlyCollection<string> CamposConflitantes { get; }
}
