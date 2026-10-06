# IGB Smartphones — Front-end

## Testes do checkout

Os sete cenários de criação de pedidos estão em `cypress/e2e/pedido.cy.ts`. Eles usam a API em `http://localhost:5242`, o Vite em `http://localhost:5173` e um banco PostgreSQL **exclusivo para testes**.

Configure `ConnectionStrings__DefaultConnection` para apontar ao banco descartável e inicie a API com as fixtures habilitadas:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Testing"
$env:CypressTestFixtures__Enabled = "false"
$env:ConnectionStrings__DefaultConnection = "Host=localhost;Port=5432;Database=igb_smartphones_cypress;Username=postgres;Password=<senha>"
Set-Location ..\backend\IGB.Smartphones.Api
dotnet ef database update
$env:CypressTestFixtures__Enabled = "true"
dotnet run --urls http://localhost:5242
```

Em outro terminal, inicie o front-end (`npm run dev`) e execute `npm run cypress:run`. As fixtures de cupom são de uso único; para repetir a suíte, recrie ou resete o banco descartável e aplique as migrations antes de reiniciar a API. Nunca aponte essa configuração para o banco de desenvolvimento ou produção.

## Scripts

- `npm run dev` — inicia o Vite.
- `npm run build` — verifica tipos e gera o build.
- `npm run lint` — executa o ESLint.
- `npm run cypress:run` — executa os cenários Cypress em modo headless.
