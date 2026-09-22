using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IGB.Smartphones.Api.Migrations
{
    /// <inheritdoc />
    public partial class EnderecoCobrancaEEntrega : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Clientes_Enderecos_EnderecoId",
                table: "Clientes");

            migrationBuilder.RenameColumn(
                name: "EnderecoId",
                table: "Clientes",
                newName: "EnderecoCobrancaId");

            migrationBuilder.RenameIndex(
                name: "IX_Clientes_EnderecoId",
                table: "Clientes",
                newName: "IX_Clientes_EnderecoCobrancaId");

            migrationBuilder.AddColumn<int>(
                name: "ClienteId",
                table: "Enderecos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Nome",
                table: "Enderecos",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Enderecos_ClienteId",
                table: "Enderecos",
                column: "ClienteId");

            migrationBuilder.Sql(
                """
                INSERT INTO "Enderecos"
                (
                    "Nome",
                    "ClienteId",
                    "TipoResidencia",
                    "TipoLogradouro",
                    "Logradouro",
                    "Numero",
                    "Bairro",
                    "CEP",
                    "Cidade",
                    "Estado",
                    "Pais",
                    "Observacoes"
                )
                SELECT
                    'Principal',
                    c."Id",
                    e."TipoResidencia",
                    e."TipoLogradouro",
                    e."Logradouro",
                    e."Numero",
                    e."Bairro",
                    e."CEP",
                    e."Cidade",
                    e."Estado",
                    e."Pais",
                    e."Observacoes"
                FROM "Clientes" c
                INNER JOIN "Enderecos" e
                    ON e."Id" = c."EnderecoCobrancaId";
                """);

            migrationBuilder.AddForeignKey(
                name: "FK_Clientes_Enderecos_EnderecoCobrancaId",
                table: "Clientes",
                column: "EnderecoCobrancaId",
                principalTable: "Enderecos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Enderecos_Clientes_ClienteId",
                table: "Enderecos",
                column: "ClienteId",
                principalTable: "Clientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Clientes_Enderecos_EnderecoCobrancaId",
                table: "Clientes");

            migrationBuilder.DropForeignKey(
                name: "FK_Enderecos_Clientes_ClienteId",
                table: "Enderecos");

            migrationBuilder.Sql(
                """
                DELETE FROM "Enderecos"
                WHERE "ClienteId" IS NOT NULL;
                """);

            migrationBuilder.DropIndex(
                name: "IX_Enderecos_ClienteId",
                table: "Enderecos");

            migrationBuilder.DropColumn(
                name: "ClienteId",
                table: "Enderecos");

            migrationBuilder.DropColumn(
                name: "Nome",
                table: "Enderecos");

            migrationBuilder.RenameColumn(
                name: "EnderecoCobrancaId",
                table: "Clientes",
                newName: "EnderecoId");

            migrationBuilder.RenameIndex(
                name: "IX_Clientes_EnderecoCobrancaId",
                table: "Clientes",
                newName: "IX_Clientes_EnderecoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Clientes_Enderecos_EnderecoId",
                table: "Clientes",
                column: "EnderecoId",
                principalTable: "Enderecos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}