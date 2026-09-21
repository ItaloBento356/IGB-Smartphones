using IGB.Smartphones.Api.Data;
using IGB.Smartphones.Api.Dtos;
using IGB.Smartphones.Api.Exceptions;
using IGB.Smartphones.Api.Models;
using IGB.Smartphones.Api.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace IGB.Smartphones.Api.Services;

public class ClienteService : IClienteService
{
    private readonly ApplicationDbContext _context;
    private readonly PasswordHasher<Cliente> _passwordHasher;

    public ClienteService(ApplicationDbContext context, PasswordHasher<Cliente> passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<ClienteResponse> CadastrarAsync(CadastrarClienteRequest request)
    {
        if (request.Senha != request.ConfirmacaoSenha)
            throw new ClienteValidacaoException("A confirmação de senha não corresponde à senha informada.");

        ValidarSenha(request.Senha);

        var cpf = SomenteDigitos(request.CPF);
        if (!CpfValidator.EhValido(cpf))
            throw new ClienteValidacaoException("CPF inválido.");

        var email = request.Email.Trim();

        var cpfDuplicado = await _context.Clientes.AnyAsync(c => c.CPF == cpf);
        var emailDuplicado = await _context.Clientes.AnyAsync(c => c.Email.ToLower() == email.ToLower());

        if (cpfDuplicado || emailDuplicado)
            throw CriarExcecaoDeConflito(cpfDuplicado, emailDuplicado);

        var endereco = new Endereco
        {
            TipoResidencia = request.Endereco.TipoResidencia.Trim(),
            TipoLogradouro = request.Endereco.TipoLogradouro.Trim(),
            Logradouro = request.Endereco.Logradouro.Trim(),
            Numero = request.Endereco.Numero.Trim(),
            Bairro = request.Endereco.Bairro.Trim(),
            CEP = SomenteDigitos(request.Endereco.CEP),
            Cidade = request.Endereco.Cidade.Trim(),
            Estado = request.Endereco.Estado.Trim().ToUpperInvariant(),
            Pais = request.Endereco.Pais.Trim(),
            Observacoes = string.IsNullOrWhiteSpace(request.Endereco.Observacoes)
                ? null
                : request.Endereco.Observacoes.Trim(),
        };

        var cliente = new Cliente
        {
            // Placeholder único e temporário (20 caracteres): o CodigoCliente definitivo só pode ser
            // calculado a partir do Id, que é gerado pelo banco após o insert.
            CodigoCliente = $"TMP-{Guid.NewGuid():N}"[..20],
            Nome = request.Nome.Trim(),
            Genero = request.Genero.Trim(),
            DataNascimento = request.DataNascimento,
            CPF = cpf,
            TelefoneTipo = request.TelefoneTipo.Trim(),
            DDD = SomenteDigitos(request.DDD),
            TelefoneNumero = SomenteDigitos(request.TelefoneNumero),
            Email = email,
            Ativo = true,
            Endereco = endereco,
        };
        cliente.PasswordHash = _passwordHasher.HashPassword(cliente, request.Senha);

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.Enderecos.Add(endereco);
            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            // Código legível e único, gerado a partir do Id sequencial: CLI-<ano>-<id com 6 dígitos>.
            cliente.CodigoCliente = $"CLI-{DateTime.UtcNow:yyyy}-{cliente.Id:D6}";
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } postgresException)
        {
            await transaction.RollbackAsync();
            throw CriarExcecaoDeConflito(postgresException);
        }

        return MapearParaResponse(cliente);
    }

    public async Task<IReadOnlyList<ClienteResponse>> ConsultarAsync(string? codigo, string? nome, string? cpf, string? email)
    {
        IQueryable<Cliente> query = _context.Clientes.Include(c => c.Endereco);

        if (!string.IsNullOrWhiteSpace(codigo))
        {
            var codigoNormalizado = codigo.Trim();
            query = query.Where(c => c.CodigoCliente == codigoNormalizado);
        }

        if (!string.IsNullOrWhiteSpace(nome))
        {
            var nomeNormalizado = nome.Trim().ToLower();
            query = query.Where(c => c.Nome.ToLower().Contains(nomeNormalizado));
        }

        if (!string.IsNullOrWhiteSpace(cpf))
        {
            var cpfNormalizado = SomenteDigitos(cpf);
            query = query.Where(c => c.CPF == cpfNormalizado);
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            var emailNormalizado = email.Trim().ToLower();
            query = query.Where(c => c.Email.ToLower().Contains(emailNormalizado));
        }

        var clientes = await query
            .OrderBy(c => c.Nome)
            .ToListAsync();

        return clientes.Select(MapearParaResponse).ToList();
    }

    public async Task<ClienteResponse> ObterPorIdAsync(int id)
    {
        var cliente = await _context.Clientes.Include(c => c.Endereco).FirstOrDefaultAsync(c => c.Id == id);
        if (cliente is null)
            throw new ClienteNaoEncontradoException($"Cliente com Id {id} não encontrado.");

        return MapearParaResponse(cliente);
    }

    public async Task<ClienteResponse> AtualizarAsync(int id, AtualizarClienteRequest request)
    {
        var cliente = await _context.Clientes.Include(c => c.Endereco).FirstOrDefaultAsync(c => c.Id == id);
        if (cliente is null)
            throw new ClienteNaoEncontradoException($"Cliente com Id {id} não encontrado.");

        var cpf = SomenteDigitos(request.CPF);
        if (!CpfValidator.EhValido(cpf))
            throw new ClienteValidacaoException("CPF inválido.");

        var email = request.Email.Trim();

        // Ao verificar duplicidade, o próprio cliente (mesmo Id) não conta como conflito.
        var cpfDuplicado = await _context.Clientes.AnyAsync(c => c.Id != id && c.CPF == cpf);
        var emailDuplicado = await _context.Clientes.AnyAsync(c => c.Id != id && c.Email.ToLower() == email.ToLower());

        if (cpfDuplicado || emailDuplicado)
            throw CriarExcecaoDeConflito(cpfDuplicado, emailDuplicado);

        cliente.Nome = request.Nome.Trim();
        cliente.Genero = request.Genero.Trim();
        cliente.DataNascimento = request.DataNascimento;
        cliente.CPF = cpf;
        cliente.TelefoneTipo = request.TelefoneTipo.Trim();
        cliente.DDD = SomenteDigitos(request.DDD);
        cliente.TelefoneNumero = SomenteDigitos(request.TelefoneNumero);
        cliente.Email = email;

        cliente.Endereco.TipoResidencia = request.Endereco.TipoResidencia.Trim();
        cliente.Endereco.TipoLogradouro = request.Endereco.TipoLogradouro.Trim();
        cliente.Endereco.Logradouro = request.Endereco.Logradouro.Trim();
        cliente.Endereco.Numero = request.Endereco.Numero.Trim();
        cliente.Endereco.Bairro = request.Endereco.Bairro.Trim();
        cliente.Endereco.CEP = SomenteDigitos(request.Endereco.CEP);
        cliente.Endereco.Cidade = request.Endereco.Cidade.Trim();
        cliente.Endereco.Estado = request.Endereco.Estado.Trim().ToUpperInvariant();
        cliente.Endereco.Pais = request.Endereco.Pais.Trim();
        cliente.Endereco.Observacoes = string.IsNullOrWhiteSpace(request.Endereco.Observacoes)
            ? null
            : request.Endereco.Observacoes.Trim();

        try
        {
            // Cliente e Endereco são atualizados num único SaveChangesAsync, já executado em transação implícita do EF Core.
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } postgresException)
        {
            throw CriarExcecaoDeConflito(postgresException);
        }

        return MapearParaResponse(cliente);
    }

    public async Task<ClienteResponse> InativarAsync(int id)
    {
        var cliente = await _context.Clientes.Include(c => c.Endereco).FirstOrDefaultAsync(c => c.Id == id);
        if (cliente is null)
            throw new ClienteNaoEncontradoException($"Cliente com Id {id} não encontrado.");

        if (cliente.Ativo)
        {
            cliente.Ativo = false;
            await _context.SaveChangesAsync();
        }

        return MapearParaResponse(cliente);
    }

    // Determina, pela constraint violada, se o conflito foi de CPF, e-mail ou ambos (condição de corrida).
    private static ClienteConflitoException CriarExcecaoDeConflito(PostgresException ex)
    {
        var constraint = ex.ConstraintName ?? string.Empty;
        var cpfDuplicado = constraint.Contains("CPF", StringComparison.OrdinalIgnoreCase);
        var emailDuplicado = constraint.Contains("Email", StringComparison.OrdinalIgnoreCase);

        // Se a constraint não permitir identificar o campo, assume-se conflito em ambos por segurança.
        if (!cpfDuplicado && !emailDuplicado)
        {
            cpfDuplicado = true;
            emailDuplicado = true;
        }

        return CriarExcecaoDeConflito(cpfDuplicado, emailDuplicado);
    }

    private static ClienteConflitoException CriarExcecaoDeConflito(bool cpfDuplicado, bool emailDuplicado)
    {
        var campos = new List<string>();
        if (cpfDuplicado) campos.Add("cpf");
        if (emailDuplicado) campos.Add("email");

        var mensagem = cpfDuplicado && emailDuplicado
            ? "CPF e e-mail já cadastrados."
            : cpfDuplicado
                ? "CPF já cadastrado."
                : "E-mail já cadastrado.";

        return new ClienteConflitoException(mensagem, campos);
    }

    private static string SomenteDigitos(string valor) => new(valor.Where(char.IsDigit).ToArray());

    private static void ValidarSenha(string senha)
    {
        if (string.IsNullOrEmpty(senha) || senha.Length < 8)
            throw new ClienteValidacaoException("A senha deve ter no mínimo 8 caracteres.");

        if (!senha.Any(char.IsUpper))
            throw new ClienteValidacaoException("A senha deve conter ao menos uma letra maiúscula.");

        if (!senha.Any(char.IsLower))
            throw new ClienteValidacaoException("A senha deve conter ao menos uma letra minúscula.");

        if (senha.All(char.IsLetterOrDigit))
            throw new ClienteValidacaoException("A senha deve conter ao menos um caractere especial.");
    }

    private static ClienteResponse MapearParaResponse(Cliente cliente) => new(
        cliente.Id,
        cliente.CodigoCliente,
        cliente.Nome,
        cliente.Genero,
        cliente.DataNascimento,
        cliente.CPF,
        cliente.TelefoneTipo,
        cliente.DDD,
        cliente.TelefoneNumero,
        cliente.Email,
        cliente.Ativo,
        new EnderecoResponse(
            cliente.Endereco.TipoResidencia,
            cliente.Endereco.TipoLogradouro,
            cliente.Endereco.Logradouro,
            cliente.Endereco.Numero,
            cliente.Endereco.Bairro,
            cliente.Endereco.CEP,
            cliente.Endereco.Cidade,
            cliente.Endereco.Estado,
            cliente.Endereco.Pais,
            cliente.Endereco.Observacoes));
}
