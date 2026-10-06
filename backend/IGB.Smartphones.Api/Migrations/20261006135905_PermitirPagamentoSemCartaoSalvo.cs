using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IGB.Smartphones.Api.Migrations
{
    /// <inheritdoc />
    public partial class PermitirPagamentoSemCartaoSalvo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "CartaoCreditoId",
                table: "PedidoPagamentos",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "CartaoCreditoId",
                table: "PedidoPagamentos",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
