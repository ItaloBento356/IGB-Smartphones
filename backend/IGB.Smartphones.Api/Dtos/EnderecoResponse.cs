namespace IGB.Smartphones.Api.Dtos;

public record EnderecoResponse(
    int Id,
    string? Nome,
    string TipoResidencia,
    string TipoLogradouro,
    string Logradouro,
    string Numero,
    string Bairro,
    string CEP,
    string Cidade,
    string Estado,
    string Pais,
    string? Observacoes);
