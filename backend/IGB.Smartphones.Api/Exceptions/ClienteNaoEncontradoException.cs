namespace IGB.Smartphones.Api.Exceptions;

// Cliente não encontrado pelo Id informado (HTTP 404).
public class ClienteNaoEncontradoException : Exception
{
    public ClienteNaoEncontradoException(string message) : base(message)
    {
    }
}
