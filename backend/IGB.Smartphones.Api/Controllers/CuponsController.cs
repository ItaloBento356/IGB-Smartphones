using IGB.Smartphones.Api.Dtos;
using IGB.Smartphones.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace IGB.Smartphones.Api.Controllers;

[ApiController]
[Route("api/clientes/{clienteId:int}/cupons")]
public sealed class CuponsController : ControllerBase
{
    private readonly ICupomService _cupomService;

    public CuponsController(ICupomService cupomService)
    {
        _cupomService = cupomService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CupomPedidoResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Listar(int clienteId, CancellationToken cancellationToken)
    {
        try
        {
            var cupons = await _cupomService.ListarDisponiveisAsync(clienteId, cancellationToken);
            return Ok(cupons);
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(title: "Cliente não encontrado.", detail: ex.Message, statusCode: StatusCodes.Status404NotFound);
        }
    }
}
