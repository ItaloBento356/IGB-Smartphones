namespace IGB.Smartphones.Api.Dtos;

public record ClienteResponse(
    int Id,
    string CodigoCliente,
    string Nome,
    string Genero,
    DateOnly DataNascimento,
    string CPF,
    string TelefoneTipo,
    string DDD,
    string TelefoneNumero,
    string Email,
    bool Ativo,
    EnderecoResponse EnderecoCobranca,
    IReadOnlyList<EnderecoResponse> EnderecosEntrega);
