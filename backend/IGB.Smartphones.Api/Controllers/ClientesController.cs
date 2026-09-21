using IGB.Smartphones.Api.Dtos;
using IGB.Smartphones.Api.Exceptions;
using IGB.Smartphones.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace IGB.Smartphones.Api.Controllers;

[ApiController]
[Route("api/clientes")]
public class ClientesController : ControllerBase
{
    private readonly IClienteService _clienteService;

    public ClientesController(IClienteService clienteService)
    {
        _clienteService = clienteService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ClienteResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Consultar(
        [FromQuery] string? codigo,
        [FromQuery] string? nome,
        [FromQuery] string? cpf,
        [FromQuery] string? email)
    {
        var clientes = await _clienteService.ConsultarAsync(codigo, nome, cpf, email);
        return Ok(clientes);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ClienteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObterPorId(int id)
    {
        try
        {
            var cliente = await _clienteService.ObterPorIdAsync(id);
            return Ok(cliente);
        }
        catch (ClienteNaoEncontradoException ex)
        {
            return Problem(title: "Cliente não encontrado.", detail: ex.Message, statusCode: StatusCodes.Status404NotFound);
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(ClienteResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cadastrar([FromBody] CadastrarClienteRequest request)
    {
        try
        {
            var cliente = await _clienteService.CadastrarAsync(request);
            return Created($"/api/clientes/{cliente.Id}", cliente);
        }
        catch (ClienteValidacaoException ex)
        {
            return Problem(title: "Dados inválidos.", detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
        catch (ClienteConflitoException ex)
        {
            return CriarRespostaConflito(ex);
        }
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ClienteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Atualizar(int id, [FromBody] AtualizarClienteRequest request)
    {
        try
        {
            var cliente = await _clienteService.AtualizarAsync(id, request);
            return Ok(cliente);
        }
        catch (ClienteNaoEncontradoException ex)
        {
            return Problem(title: "Cliente não encontrado.", detail: ex.Message, statusCode: StatusCodes.Status404NotFound);
        }
        catch (ClienteValidacaoException ex)
        {
            return Problem(title: "Dados inválidos.", detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
        catch (ClienteConflitoException ex)
        {
            return CriarRespostaConflito(ex);
        }
    }

    [HttpPatch("{id:int}/inativar")]
    [ProducesResponseType(typeof(ClienteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Inativar(int id)
    {
        try
        {
            var cliente = await _clienteService.InativarAsync(id);
            return Ok(cliente);
        }
        catch (ClienteNaoEncontradoException ex)
        {
            return Problem(title: "Cliente não encontrado.", detail: ex.Message, statusCode: StatusCodes.Status404NotFound);
        }
    }

    private IActionResult CriarRespostaConflito(ClienteConflitoException ex)
    {
        var problemDetails = new ProblemDetails
        {
            Title = "Conflito de dados.",
            Detail = ex.Message,
            Status = StatusCodes.Status409Conflict,
        };
        problemDetails.Extensions["camposConflitantes"] = ex.CamposConflitantes;

        return Conflict(problemDetails);
    }
}
