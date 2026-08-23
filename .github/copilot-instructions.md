# IGB Smartphones — Instruções do Projeto

## Contexto

Este é um projeto acadêmico de Engenharia de Software / Projeto LES.

O sistema é um e-commerce completo de smartphones.

O CRUD de clientes possui maior importância acadêmica, mas o sistema NÃO deve ser reduzido a um CRUD de clientes.

## Stack

- Front-end: React + TypeScript
- Build: Vite
- Back-end: C# + ASP.NET Core
- Banco de dados: PostgreSQL
- IA do sistema: Google Gemini API
- Testes: Cypress
- Controle de versão: Git/GitHub

## Front-end

O front-end deve utilizar React + TypeScript.

Priorizar:

- componentes pequenos e reutilizáveis quando fizer sentido;
- responsabilidades claras;
- tipagem explícita;
- código simples e legível;
- separação de responsabilidades;
- acessibilidade;
- estados de carregamento, erro e vazio;
- manutenção e testabilidade.

Evitar:

- `any` sem justificativa;
- componentes monolíticos;
- abstrações prematuras;
- bibliotecas desnecessárias;
- lógica de negócio complexa dentro de componentes visuais;
- acesso direto ao banco de dados;
- secrets ou chaves de API no front-end.

## Arquitetura

A arquitetura planejada é:

React
↓
HTTP/REST
↓
ASP.NET Core
↓
PostgreSQL

A integração com a Gemini deverá ocorrer através do back-end.

## Escopo do protótipo

O protótipo deve representar visualmente um e-commerce de smartphones.

Priorizar:

- página inicial;
- catálogo de smartphones;
- busca;
- filtros;
- detalhes do produto;
- carrinho;
- checkout;
- login;
- cadastro de cliente;
- área do cliente;
- administração;
- gestão de clientes;
- gestão de produtos;
- pedidos;
- estoque.

O protótipo deve apresentar uma experiência coerente de e-commerce, mesmo que inicialmente os dados sejam mockados.

## Regras de desenvolvimento

Não inventar requisitos.

Não alterar código não relacionado à tarefa.

Não introduzir bibliotecas ou padrões arquiteturais sem necessidade.

Antes de implementar uma mudança arquitetural significativa, explicar a abordagem.

Código gerado por IA deve ser tratado como sugestão e revisado criticamente.

O código deve ser simples o suficiente para que um estudante consiga compreender, explicar e defender sua implementação academicamente.