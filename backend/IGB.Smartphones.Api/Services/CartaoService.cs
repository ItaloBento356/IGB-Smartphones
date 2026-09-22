using IGB.Smartphones.Api.Dtos;
using IGB.Smartphones.Api.Models;
using IGB.Smartphones.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace IGB.Smartphones.Api.Services;

public class CartaoService : ICartaoService
{
    private readonly ApplicationDbContext _context;

    public CartaoService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<CartaoResponse>> ListarAsync(int clienteId)
    {
        var clienteExiste = await _context.Clientes
            .AnyAsync(c => c.Id == clienteId);

        if (!clienteExiste)
            throw new KeyNotFoundException("Cliente não encontrado.");

        return await _context.CartoesCredito
            .AsNoTracking()
            .Include(c => c.Bandeira)
            .Where(c => c.ClienteId == clienteId)
            .OrderByDescending(c => c.Preferencial)
            .ThenBy(c => c.Id)
            .Select(c => MapearParaResponse(c))
            .ToListAsync();
    }

    public async Task<CartaoResponse> AdicionarAsync(
        int clienteId,
        CadastrarCartaoRequest request)
    {
        var clienteExiste = await _context.Clientes
            .AnyAsync(c => c.Id == clienteId);

        if (!clienteExiste)
            throw new KeyNotFoundException("Cliente não encontrado.");

        var bandeira = await _context.Bandeiras
            .FirstOrDefaultAsync(b => b.Id == request.BandeiraId);

        if (bandeira is null)
            throw new KeyNotFoundException("Bandeira de cartão não encontrada.");

        var possuiCartoes = await _context.CartoesCredito
            .AnyAsync(c => c.ClienteId == clienteId);

        var cartao = new CartaoCredito
        {
            ClienteId = clienteId,
            Numero = request.Numero.Trim(),
            NomeImpresso = request.NomeImpresso.Trim(),
            BandeiraId = request.BandeiraId,
            CodigoSeguranca = request.CodigoSeguranca.Trim(),
            Preferencial = !possuiCartoes || request.Preferencial
        };

        if (cartao.Preferencial)
        {
            await RemoverPreferencialAtualAsync(clienteId);
        }

        _context.CartoesCredito.Add(cartao);

        await _context.SaveChangesAsync();

        return MapearParaResponse(cartao, bandeira);
    }

    public async Task<CartaoResponse> DefinirComoPreferencialAsync(
        int clienteId,
        int cartaoId)
    {
        var cartao = await _context.CartoesCredito
            .Include(c => c.Bandeira)
            .FirstOrDefaultAsync(c =>
                c.Id == cartaoId &&
                c.ClienteId == clienteId);

        if (cartao is null)
            throw new KeyNotFoundException("Cartão não encontrado.");

        await RemoverPreferencialAtualAsync(clienteId, cartaoId);

        cartao.Preferencial = true;

        await _context.SaveChangesAsync();

        return MapearParaResponse(cartao);
    }

    private async Task RemoverPreferencialAtualAsync(
        int clienteId,
        int? cartaoIgnoradoId = null)
    {
        var cartoesPreferenciais = await _context.CartoesCredito
            .Where(c =>
                c.ClienteId == clienteId &&
                c.Preferencial &&
                (!cartaoIgnoradoId.HasValue || c.Id != cartaoIgnoradoId.Value))
            .ToListAsync();

        foreach (var cartao in cartoesPreferenciais)
        {
            cartao.Preferencial = false;
        }
    }

    private static CartaoResponse MapearParaResponse(CartaoCredito cartao)
    {
        return MapearParaResponse(cartao, cartao.Bandeira);
    }

    private static CartaoResponse MapearParaResponse(
        CartaoCredito cartao,
        Bandeira bandeira)
    {
        var numero = cartao.Numero.Trim();

        var ultimos4 = numero.Length >= 4
            ? numero[^4..]
            : numero;

        return new CartaoResponse(
            cartao.Id,
            ultimos4,
            cartao.NomeImpresso,
            bandeira.Id,
            bandeira.Nome,
            cartao.Preferencial);
    }
}