using IGB.Smartphones.Api.Data;
using IGB.Smartphones.Api.Dtos;
using IGB.Smartphones.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IGB.Smartphones.Api.Services;

public class ProdutoService : IProdutoService
{
    private readonly ApplicationDbContext _context;

    public ProdutoService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<ProdutoResponse>> ListarAtivosAsync()
    {
        return await _context.Produtos
            .AsNoTracking()
            .Where(p => p.Ativo)
            .OrderBy(p => p.Id)
            .Select(p => new ProdutoResponse(
                p.Id, p.Nome, p.Marca, p.Preco, p.Cor, p.ImagemUrl, p.QuantidadeEstoque))
            .ToListAsync();
    }

    public async Task<ProdutoResponse?> ObterAtivoPorIdAsync(int id)
    {
        return await _context.Produtos
            .AsNoTracking()
            .Where(p => p.Id == id && p.Ativo)
            .Select(p => new ProdutoResponse(
                p.Id, p.Nome, p.Marca, p.Preco, p.Cor, p.ImagemUrl, p.QuantidadeEstoque))
            .FirstOrDefaultAsync();
    }
}