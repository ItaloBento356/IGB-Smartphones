using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace IGB.Smartphones.Api.Migrations
{
    /// <inheritdoc />
    public partial class PopularProdutosECupons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Cupons",
                columns: new[] { "Id", "Ativo", "ClienteId", "Codigo", "FormaDesconto", "Natureza", "Valor" },
                values: new object[,]
                {
                    { 1, true, null, "TECH5", "Percentual", "Promocional", 5m },
                    { 2, true, null, "BEMVINDO10", "Percentual", "Promocional", 10m }
                });

            migrationBuilder.InsertData(
                table: "Produtos",
                columns: new[] { "Id", "Ativo", "Cor", "ImagemUrl", "Marca", "Nome", "Preco", "QuantidadeEstoque" },
                values: new object[,]
                {
                    { 1, true, "#8a9a9d", null, "Samsung", "Galaxy S24", 4299.90m, 10 },
                    { 2, true, "#607d8b", null, "Samsung", "Galaxy A55", 2299.90m, 10 },
                    { 3, true, "#4b5263", null, "Samsung", "Galaxy S24 Ultra", 6499.90m, 10 },
                    { 4, true, "#b8c9d8", null, "Apple", "iPhone 15", 4899.00m, 10 },
                    { 5, true, "#8c8c88", null, "Apple", "iPhone 15 Pro", 6499.00m, 10 },
                    { 6, true, "#a8b5a5", null, "Apple", "iPhone 16", 5799.00m, 10 },
                    { 7, true, "#66728b", null, "Motorola", "Edge 50 Pro", 2999.90m, 10 },
                    { 8, true, "#7d8f83", null, "Motorola", "Moto G85", 1899.90m, 10 },
                    { 9, true, "#9b8798", null, "Motorola", "Razr 50", 4999.90m, 10 },
                    { 10, true, "#d4b6a6", null, "Xiaomi", "Redmi Note 13", 1599.90m, 10 },
                    { 11, true, "#727b8f", null, "Xiaomi", "Redmi Note 13 Pro", 2199.90m, 10 },
                    { 12, true, "#555d68", null, "Xiaomi", "Xiaomi 14", 4299.90m, 10 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Cupons",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Cupons",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 12);
        }
    }
}
