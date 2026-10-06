using IGB.Smartphones.Api.Data;
using IGB.Smartphones.Api.Models;
using IGB.Smartphones.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy = "FrontendCorsPolicy";

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddSingleton<PasswordHasher<Cliente>>();
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<ICartaoService, CartaoService>();
builder.Services.AddScoped<IProdutoService, ProdutoService>();
builder.Services.AddScoped<IPedidoService, PedidoService>();
builder.Services.AddScoped<ICupomService, CupomService>();

builder.Services.AddCors(options =>
{
    // Permite as origens do frontend Vite em desenvolvimento.
    options.AddPolicy(FrontendCorsPolicy, policy =>
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsEnvironment("Testing") &&
    builder.Configuration.GetValue<bool>("CypressTestFixtures:Enabled"))
{
    await using var scope = app.Services.CreateAsyncScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var codigosFixture = new[] { "CYPRESS-UNDER-10", "CYPRESS-OVER-10000" };
    var existentes = await context.Cupons
        .Where(cupom => codigosFixture.Contains(cupom.Codigo))
        .Select(cupom => cupom.Codigo)
        .ToListAsync();

    if (!existentes.Contains("CYPRESS-UNDER-10"))
    {
        context.Cupons.Add(new Cupom
        {
            Codigo = "CYPRESS-UNDER-10",
            Natureza = NaturezaCupom.Promocional,
            FormaDesconto = FormaDescontoCupom.ValorFixo,
            Valor = 1608.90m,
        });
    }

    if (!existentes.Contains("CYPRESS-OVER-10000"))
    {
        context.Cupons.Add(new Cupom
        {
            Codigo = "CYPRESS-OVER-10000",
            Natureza = NaturezaCupom.Promocional,
            FormaDesconto = FormaDescontoCupom.ValorFixo,
            Valor = 10000m,
        });
    }

    await context.SaveChangesAsync();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

//app.UseHttpsRedirection();

app.UseCors(FrontendCorsPolicy);

app.MapControllers();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
