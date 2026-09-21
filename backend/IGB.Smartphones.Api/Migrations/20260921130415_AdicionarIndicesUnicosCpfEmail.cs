using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IGB.Smartphones.Api.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarIndicesUnicosCpfEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Clientes_CPF",
                table: "Clientes",
                column: "CPF",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_Email",
                table: "Clientes",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Clientes_CPF",
                table: "Clientes");

            migrationBuilder.DropIndex(
                name: "IX_Clientes_Email",
                table: "Clientes");
        }
    }
}
