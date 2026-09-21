using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IGB.Smartphones.Api.Migrations
{
    /// <inheritdoc />
    public partial class CorrigirRelacionamentoClienteEndereco : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Clientes_EnderecoId",
                table: "Clientes");

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_EnderecoId",
                table: "Clientes",
                column: "EnderecoId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Clientes_EnderecoId",
                table: "Clientes");

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_EnderecoId",
                table: "Clientes",
                column: "EnderecoId");
        }
    }
}
