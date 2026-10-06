using IGB.Smartphones.Api.Dtos;
using IGB.Smartphones.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace IGB.Smartphones.Api.Controllers;

[ApiController]
[Route("api/pedidos")]
public class PedidosController : ControllerBase
{
    private readonly IPedidoService _pedidoService;

    public PedidosController(IPedidoService pedidoService)
    {
        _pedidoService = pedidoService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PedidoResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] int? clienteId,
        CancellationToken cancellationToken)
    {
        var pedidos = await _pedidoService.ListarAsync(clienteId, cancellationToken);
        return Ok(pedidos);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(PedidoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObterPorId(int id, CancellationToken cancellationToken)
    {
        var pedido = await _pedidoService.ObterPorIdAsync(id, cancellationToken);

        if (pedido is null)
            return Problem(title: "Pedido não encontrado.", detail: "Pedido não encontrado.", statusCode: StatusCodes.Status404NotFound);

        return Ok(pedido);
    }

    [HttpPatch("{id:int}/cancelar")]
    [ProducesResponseType(typeof(PedidoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancelar(int id, CancellationToken cancellationToken)
    {
        try
        {
            var pedido = await _pedidoService.CancelarAsync(id, cancellationToken);

            if (pedido is null)
                return Problem(title: "Pedido não encontrado.", detail: "Pedido não encontrado.", statusCode: StatusCodes.Status404NotFound);

            return Ok(pedido);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(title: "Pedido não pode ser cancelado.", detail: ex.Message, statusCode: StatusCodes.Status409Conflict);
        }
    }

    [HttpPost("calcular-frete")]
    [ProducesResponseType(typeof(CotacaoFreteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CalcularFrete(
        [FromBody] CotacaoFreteRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var cotacao = await _pedidoService.CalcularFreteAsync(request, cancellationToken);
            return Ok(cotacao);
        }
        catch (ArgumentException ex)
        {
            return Problem(title: "Dados inválidos.", detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(title: "Produto indisponível.", detail: ex.Message, statusCode: StatusCodes.Status409Conflict);
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(PedidoResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Criar(
        [FromBody] CriarPedidoRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var pedido = await _pedidoService.CriarAsync(request, cancellationToken);
            return CreatedAtAction(nameof(ObterPorId), new { id = pedido.Id }, pedido);
        }
        catch (ArgumentException ex)
        {
            return Problem(title: "Dados inválidos.", detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(title: "Recurso não encontrado.", detail: ex.Message, statusCode: StatusCodes.Status404NotFound);
        }
        catch (InvalidOperationException ex)
        {
            return Problem(title: "Pedido não pode ser criado.", detail: ex.Message, statusCode: StatusCodes.Status409Conflict);
        }
    }
}