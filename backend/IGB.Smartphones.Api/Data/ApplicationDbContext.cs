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
        
        modelBuilder.Entity<Bandeira>().HasData(
            new Bandeira { Id = 1, Nome = "Visa" },
            new Bandeira { Id = 2, Nome = "Mastercard" },
            new Bandeira { Id = 3, Nome = "Elo" }
        );
    }
}