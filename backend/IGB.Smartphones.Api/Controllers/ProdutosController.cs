using IGB.Smartphones.Api.Dtos;
using IGB.Smartphones.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace IGB.Smartphones.Api.Controllers;

[ApiController]
[Route("api/produtos")]
public class ProdutosController : ControllerBase
{
    private readonly IProdutoService _produtoService;

    public ProdutosController(IProdutoService produtoService)
    {
        _produtoService = produtoService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ProdutoResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar()
    {
        var produtos = await _produtoService.ListarAtivosAsync();
        return Ok(produtos);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ProdutoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObterPorId(int id)
    {
        var produto = await _produtoService.ObterAtivoPorIdAsync(id);

        if (produto is null)
            return Problem(title: "Produto não encontrado.", detail: "Produto não encontrado.", statusCode: StatusCodes.Status404NotFound);

        return Ok(produto);
    }
}