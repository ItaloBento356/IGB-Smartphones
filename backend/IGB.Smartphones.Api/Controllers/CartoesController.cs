using IGB.Smartphones.Api.Dtos;
using IGB.Smartphones.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace IGB.Smartphones.Api.Controllers;

[ApiController]
[Route("api/clientes/{clienteId:int}/cartoes")]
public class CartoesController : ControllerBase
{
    private readonly ICartaoService _cartaoService;

    public CartoesController(ICartaoService cartaoService)
    {
        _cartaoService = cartaoService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CartaoResponse>>> Listar(
        int clienteId)
    {
        try
        {
            var cartoes = await _cartaoService.ListarAsync(clienteId);
            return Ok(cartoes);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensagem = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<CartaoResponse>> Adicionar(
        int clienteId,
        [FromBody] CadastrarCartaoRequest request)
    {
        try
        {
            var cartao = await _cartaoService.AdicionarAsync(
                clienteId,
                request);

            return CreatedAtAction(
                nameof(Listar),
                new { clienteId },
                cartao);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensagem = ex.Message });
        }
    }

    [HttpPatch("{cartaoId:int}/preferencial")]
    public async Task<ActionResult<CartaoResponse>> DefinirComoPreferencial(
        int clienteId,
        int cartaoId)
    {
        try
        {
            var cartao = await _cartaoService.DefinirComoPreferencialAsync(
                clienteId,
                cartaoId);

            return Ok(cartao);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensagem = ex.Message });
        }
    }
}