namespace IGB.Smartphones.Api.Dtos;

public record CartaoResponse(
    int Id,
    string Ultimos4,
    string NomeImpresso,
    int BandeiraId,
    string BandeiraNome,
    bool Preferencial);