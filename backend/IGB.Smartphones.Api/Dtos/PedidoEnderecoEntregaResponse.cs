namespace IGB.Smartphones.Api.Dtos;

public record PedidoEnderecoEntregaResponse(
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