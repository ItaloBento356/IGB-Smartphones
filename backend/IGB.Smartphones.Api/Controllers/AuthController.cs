using IGB.Smartphones.Api.Dtos;
using IGB.Smartphones.Api.Exceptions;
using IGB.Smartphones.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace IGB.Smartphones.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IClienteService _clienteService;

    public AuthController(IClienteService clienteService)
    {
        _clienteService = clienteService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(
        LoginRequest request)
    {
        try
        {
            var cliente = await _clienteService.AutenticarAsync(
                request.Email.Trim(),
                request.Senha);

            return Ok(cliente);
        }
        catch (ClienteNaoEncontradoException ex)
        {
            return Unauthorized(new { mensagem = ex.Message });
        }
        catch (ClienteConflitoException ex)
        {
            return Conflict(new { mensagem = ex.Message });
        }
    }
}