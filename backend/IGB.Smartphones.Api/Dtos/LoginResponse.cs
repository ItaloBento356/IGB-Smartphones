namespace IGB.Smartphones.Api.Dtos;

public record LoginResponse(
    int Id,
    string CodigoCliente,
    string Nome,
    string Email);