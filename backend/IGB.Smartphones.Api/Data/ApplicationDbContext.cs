using IGB.Smartphones.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IGB.Smartphones.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Endereco> Enderecos => Set<Endereco>();

    public DbSet<Bandeira> Bandeiras { get; set; }

    public DbSet<CartaoCredito> CartoesCredito { get; set; }

    public DbSet<Produto> Produtos => Set<Produto>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<PedidoItem> PedidoItens => Set<PedidoItem>();
    public DbSet<PedidoPagamento> PedidoPagamentos => Set<PedidoPagamento>();
    public DbSet<Cupom> Cupons => Set<Cupom>();
    public DbSet<PedidoCupom> PedidoCupons => Set<PedidoCupom>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Bandeira>()
            .ToTable("Bandeira");

        modelBuilder.Entity<Bandeira>()
            .HasIndex(b => b.Nome)
            .IsUnique();

        modelBuilder.Entity<CartaoCredito>()
            .ToTable("CartaoCredito");

        modelBuilder.Entity<CartaoCredito>()
            .HasOne(c => c.Cliente)
            .WithMany(c => c.Cartoes)
            .HasForeignKey(c => c.ClienteId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CartaoCredito>()
            .HasOne(c => c.Bandeira)
            .WithMany(b => b.Cartoes)
            .HasForeignKey(c => c.BandeiraId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Cliente>()
            .HasIndex(c => c.CodigoCliente)
            .IsUnique();

        modelBuilder.Entity<Cliente>()
            .HasIndex(c => c.CPF)
            .IsUnique();

        modelBuilder.Entity<Cliente>()
            .HasIndex(c => c.Email)
            .IsUnique();

        modelBuilder.Entity<Cliente>()
            .HasOne(c => c.EnderecoCobranca)
            .WithOne()
            .HasForeignKey<Cliente>(c => c.EnderecoCobrancaId)
            .OnDelete(DeleteBehavior.Restrict);
        
        ConfigurarPedidos(modelBuilder);

        modelBuilder.Entity<Bandeira>().HasData(
            new Bandeira { Id = 1, Nome = "Visa" },
            new Bandeira { Id = 2, Nome = "Mastercard" },
            new Bandeira { Id = 3, Nome = "Elo" }
        );
    }

    private static void ConfigurarPedidos(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Produto>(e =>
        {
            e.ToTable("Produtos", t =>
            {
                t.HasCheckConstraint("CK_Produtos_Preco", "\"Preco\" > 0");
                t.HasCheckConstraint("CK_Produtos_QuantidadeEstoque", "\"QuantidadeEstoque\" >= 0");
            });
            e.Property(p => p.Preco).HasPrecision(12, 2);
        });

        modelBuilder.Entity<Cupom>(e =>
        {
            e.ToTable("Cupons", t =>
            {
                t.HasCheckConstraint("CK_Cupons_Valor", "\"Valor\" > 0");
                t.HasCheckConstraint(
                    "CK_Cupons_Percentual",
                    "\"FormaDesconto\" <> 'Percentual' OR \"Valor\" <= 100");
            });
            e.HasIndex(c => c.Codigo).IsUnique();
            e.Property(c => c.Natureza).HasConversion<string>().HasMaxLength(20);
            e.Property(c => c.FormaDesconto).HasConversion<string>().HasMaxLength(20);
            e.Property(c => c.Valor).HasPrecision(12, 2);
            e.HasOne(c => c.Cliente)
                .WithMany()
                .HasForeignKey(c => c.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Pedido>(e =>
        {
            e.ToTable("Pedidos", t =>
            {
                t.HasCheckConstraint("CK_Pedidos_Subtotal", "\"Subtotal\" >= 0");
                t.HasCheckConstraint("CK_Pedidos_ValorFrete", "\"ValorFrete\" >= 0");
                t.HasCheckConstraint("CK_Pedidos_ValorDesconto", "\"ValorDesconto\" >= 0");
                t.HasCheckConstraint("CK_Pedidos_Total", "\"Total\" >= 0");
            });
            e.HasIndex(p => p.Codigo).IsUnique();
            e.HasIndex(p => p.ClienteId);
            e.Property(p => p.Status).HasConversion<string>().HasMaxLength(30);
            e.Property(p => p.Subtotal).HasPrecision(12, 2);
            e.Property(p => p.ValorFrete).HasPrecision(12, 2);
            e.Property(p => p.ValorDesconto).HasPrecision(12, 2);
            e.Property(p => p.Total).HasPrecision(12, 2);
            e.HasOne(p => p.Cliente)
                .WithMany()
                .HasForeignKey(p => p.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PedidoItem>(e =>
        {
            e.ToTable("PedidoItens", t =>
            {
                t.HasCheckConstraint("CK_PedidoItens_PrecoUnitario", "\"PrecoUnitario\" > 0");
                t.HasCheckConstraint("CK_PedidoItens_Quantidade", "\"Quantidade\" > 0");
            });
            e.Property(i => i.PrecoUnitario).HasPrecision(12, 2);
            e.HasOne(i => i.Pedido)
                .WithMany(p => p.Itens)
                .HasForeignKey(i => i.PedidoId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(i => i.Produto)
                .WithMany()
                .HasForeignKey(i => i.ProdutoId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PedidoPagamento>(e =>
        {
            e.ToTable("PedidoPagamentos", t =>
                t.HasCheckConstraint("CK_PedidoPagamentos_Valor", "\"Valor\" > 0"));
            e.Property(p => p.Valor).HasPrecision(12, 2);
            e.HasOne(p => p.Pedido)
                .WithMany(p => p.Pagamentos)
                .HasForeignKey(p => p.PedidoId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(p => p.CartaoCredito)
                .WithMany()
                .HasForeignKey(p => p.CartaoCreditoId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PedidoCupom>(e =>
        {
            e.ToTable("PedidoCupons", t =>
                t.HasCheckConstraint("CK_PedidoCupons_ValorAplicado", "\"ValorAplicado\" >= 0"));
            e.HasIndex(pc => new { pc.PedidoId, pc.CupomId }).IsUnique();
            e.Property(pc => pc.ValorAplicado).HasPrecision(12, 2);
            e.HasOne(pc => pc.Pedido)
                .WithMany(p => p.Cupons)
                .HasForeignKey(pc => pc.PedidoId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(pc => pc.Cupom)
                .WithMany()
                .HasForeignKey(pc => pc.CupomId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        // Cor usa o valor hexadecimal já existente no frontend; ImagemUrl fica nula nesta etapa.
        modelBuilder.Entity<Produto>().HasData(
            new Produto { Id = 1, Nome = "Galaxy S24", Marca = "Samsung", Preco = 4299.90m, Cor = "#8a9a9d", Ativo = true, QuantidadeEstoque = 10 },
            new Produto { Id = 2, Nome = "Galaxy A55", Marca = "Samsung", Preco = 2299.90m, Cor = "#607d8b", Ativo = true, QuantidadeEstoque = 10 },
            new Produto { Id = 3, Nome = "Galaxy S24 Ultra", Marca = "Samsung", Preco = 6499.90m, Cor = "#4b5263", Ativo = true, QuantidadeEstoque = 10 },
            new Produto { Id = 4, Nome = "iPhone 15", Marca = "Apple", Preco = 4899.00m, Cor = "#b8c9d8", Ativo = true, QuantidadeEstoque = 10 },
            new Produto { Id = 5, Nome = "iPhone 15 Pro", Marca = "Apple", Preco = 6499.00m, Cor = "#8c8c88", Ativo = true, QuantidadeEstoque = 10 },
            new Produto { Id = 6, Nome = "iPhone 16", Marca = "Apple", Preco = 5799.00m, Cor = "#a8b5a5", Ativo = true, QuantidadeEstoque = 10 },
            new Produto { Id = 7, Nome = "Edge 50 Pro", Marca = "Motorola", Preco = 2999.90m, Cor = "#66728b", Ativo = true, QuantidadeEstoque = 10 },
            new Produto { Id = 8, Nome = "Moto G85", Marca = "Motorola", Preco = 1899.90m, Cor = "#7d8f83", Ativo = true, QuantidadeEstoque = 10 },
            new Produto { Id = 9, Nome = "Razr 50", Marca = "Motorola", Preco = 4999.90m, Cor = "#9b8798", Ativo = true, QuantidadeEstoque = 10 },
            new Produto { Id = 10, Nome = "Redmi Note 13", Marca = "Xiaomi", Preco = 1599.90m, Cor = "#d4b6a6", Ativo = true, QuantidadeEstoque = 10 },
            new Produto { Id = 11, Nome = "Redmi Note 13 Pro", Marca = "Xiaomi", Preco = 2199.90m, Cor = "#727b8f", Ativo = true, QuantidadeEstoque = 10 },
            new Produto { Id = 12, Nome = "Xiaomi 14", Marca = "Xiaomi", Preco = 4299.90m, Cor = "#555d68", Ativo = true, QuantidadeEstoque = 10 }
        );

        modelBuilder.Entity<Cupom>().HasData(
            new Cupom { Id = 1, Codigo = "TECH5", Natureza = NaturezaCupom.Promocional, FormaDesconto = FormaDescontoCupom.Percentual, Valor = 5m, Ativo = true },
            new Cupom { Id = 2, Codigo = "BEMVINDO10", Natureza = NaturezaCupom.Promocional, FormaDesconto = FormaDescontoCupom.Percentual, Valor = 10m, Ativo = true }
        );
    }
}