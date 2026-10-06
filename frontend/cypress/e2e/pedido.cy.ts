const API_URL = 'http://localhost:5242'
const PRODUCT_ID = 10
const PRODUCT_PRICE = 1599.9
const FREIGHT_SP = 14

interface TestClient {
  id: number
  nome: string
  email: string
}

interface TestOrder {
  id: number
  clienteId: number
  status: string
  subtotal: number
  valorFrete: number
  valorDesconto: number
  total: number
  enderecoEntrega: { logradouro: string }
  itens: Array<{ produtoId: number; quantidade: number }>
  pagamentos: Array<{ valor: number }>
}

function gerarCpfValido(): string {
  const digitos = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  const calcularDigito = (valores: number[]) => {
    const soma = valores.reduce(
      (total, valor, indice) => total + valor * (valores.length + 1 - indice),
      0,
    )
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  const primeiro = calcularDigito(digitos)
  const segundo = calcularDigito([...digitos, primeiro])
  return [...digitos, primeiro, segundo].join('')
}

function criarCliente(): Cypress.Chainable<TestClient> {
  const stamp = `${Date.now()}.${Math.floor(Math.random() * 100000)}`
  const address = {
    nome: 'Endereço principal',
    tipoResidencia: 'Casa',
    tipoLogradouro: 'Rua',
    logradouro: 'Rua Cypress',
    numero: '123',
    bairro: 'Centro',
    cep: '08710000',
    cidade: 'Mogi das Cruzes',
    estado: 'SP',
    pais: 'Brasil',
    observacoes: '',
  }

  return cy.request({
    method: 'POST',
    url: `${API_URL}/api/clientes`,
    body: {
      nome: 'Cliente Pedido Cypress',
      genero: 'Masculino',
      dataNascimento: '2000-01-15',
      cpf: gerarCpfValido(),
      telefoneTipo: 'Celular',
      ddd: '11',
      telefoneNumero: '999998888',
      email: `pedido.cypress.${stamp}@teste.com`,
      senha: 'Senha@123',
      confirmacaoSenha: 'Senha@123',
      enderecoCobranca: address,
      enderecoEntrega: address,
    },
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body as TestClient
  })
}

function adicionarCartao(clienteId: number, numero: string) {
  return cy.request({
    method: 'POST',
    url: `${API_URL}/api/clientes/${clienteId}/cartoes`,
    body: {
      numero,
      nomeImpresso: 'CLIENTE PEDIDO CYPRESS',
      bandeiraId: 1,
      codigoSeguranca: '123',
      preferencial: false,
    },
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body
  })
}

function prepararCheckout(cliente: TestClient, quantidade = 1) {
  cy.visit('/')
  cy.window().then((window) => {
    window.localStorage.setItem('igb-smartphones-sessao', JSON.stringify({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: '',
      status: 'Ativo',
      cidade: '',
      pedidos: 0,
      senhaMock: '',
    }))
    window.localStorage.setItem(
      `igb-smartphones-carrinho-cliente-${cliente.id}`,
      JSON.stringify([{ productId: PRODUCT_ID, quantity: quantidade }]),
    )
  })
  cy.visit('/checkout')
  cy.contains('button', 'Continuar para pagamento').should('be.enabled')
}

function continuarAoPagamento() {
  cy.contains('button', 'Continuar para pagamento').click()
  cy.contains('h2', 'Pagamento').should('be.visible')
}

function abrirRevisao() {
  cy.contains('button', 'Revisar pedido').should('be.enabled').click()
  cy.contains('h1', 'Revisão').should('be.visible')
  cy.contains('button', 'Confirmar pedido').should('be.enabled')
}

function finalizarPedido(clienteId: number): Cypress.Chainable<TestOrder> {
  cy.contains('button', 'Confirmar pedido').click()
  cy.contains('h1', 'Pedido realizado com sucesso!', { timeout: 10000 }).should('be.visible')
  cy.contains('EM PROCESSAMENTO').should('be.visible')

  return cy.request(`${API_URL}/api/pedidos?clienteId=${clienteId}`).then((response) => {
    expect(response.status).to.eq(200)
    const orders = response.body as TestOrder[]
    const order = orders[0]
    if (!order) throw new Error('A API não retornou o pedido recém-criado.')
    expect(order.status).to.eq('EM PROCESSAMENTO')
    return order
  })
}

describe('Criação de pedidos pelo checkout', () => {
  it('TESTE 1 — adiciona mais de um produto e altera a quantidade no carrinho', () => {
    cy.visit('/produto/1')
    cy.contains('button', 'Adicionar ao carrinho').should('be.enabled').click()
    cy.visit('/produto/2')
    cy.contains('button', 'Adicionar ao carrinho').should('be.enabled').click()
    cy.visit('/carrinho')

    cy.get('.cart-item').should('have.length', 2)
    cy.get('.cart-item').first().find('[aria-label^="Aumentar quantidade de"]').click()
    cy.get('.cart-item').first().find('[aria-label^="Quantidade de"]').should('have.text', '2')
  })

  it('TESTE 2 — finaliza com endereço e cartão previamente cadastrados', () => {
    criarCliente().then((cliente) => {
      adicionarCartao(cliente.id, '4111111111111111')
      prepararCheckout(cliente)
      continuarAoPagamento()
      cy.get('.card-option').first().click()
      abrirRevisao()
      finalizarPedido(cliente.id).then((order) => {
        expect(order.enderecoEntrega.logradouro).to.eq('Rua Cypress')
        expect(order.pagamentos).to.have.length(1)
      })
    })
  })

  it('TESTE 3 — cadastra endereço e cartão no checkout e incorpora ambos ao perfil', () => {
    criarCliente().then((cliente) => {
      prepararCheckout(cliente)
      cy.contains('button', 'Cadastrar endereço').click()
      cy.contains('label', 'Identificação').find('input').type('Endereço Cypress Novo')
      cy.contains('label', 'Logradouro').find('input').clear().type('Avenida Integração')
      cy.contains('label', 'Número').find('input').clear().type('456')
      cy.contains('label', 'Bairro').find('input').clear().type('Centro')
      cy.contains('label', 'CEP').find('input').clear().type('08710001')
      cy.contains('label', 'Cidade').find('input').clear().type('Mogi das Cruzes')
      cy.contains('label', 'Estado').find('select').select('SP')
      cy.contains('label', 'Salvar este endereço no meu perfil').find('input').check()
      cy.contains('button', 'Salvar endereço').click()
      cy.contains('button', 'Continuar para pagamento').should('be.enabled')
      continuarAoPagamento()

      cy.contains('button', 'Adicionar cartão').click()
      cy.contains('label', 'Nome impresso').find('input').type('CLIENTE PEDIDO CYPRESS')
      cy.contains('label', 'Número do cartão').find('input').type('4111111111111111')
      cy.contains('label', 'Validade').find('input').type('12/30')
      cy.contains('label', 'Código de segurança').find('input').type('123')
      cy.contains('label', 'Bandeira').find('select').select('Visa')
      cy.contains('label', 'Salvar este cartão no meu perfil').find('input').check()
      cy.contains('button', 'Salvar cartão').click()
      abrirRevisao()

      finalizarPedido(cliente.id).then((order) => {
        expect(order.enderecoEntrega.logradouro).to.eq('Avenida Integração')
        cy.request(`${API_URL}/api/clientes/${cliente.id}`).then((profileResponse) => {
          expect(profileResponse.body.enderecosEntrega).to.have.length(2)
          expect(profileResponse.body.enderecosEntrega.some(
            (address: { nome: string }) => address.nome === 'Endereço Cypress Novo',
          )).to.eq(true)
        })
        cy.request(`${API_URL}/api/clientes/${cliente.id}/cartoes`).then((cardResponse) => {
          expect(cardResponse.body).to.have.length(1)
          expect(cardResponse.body[0].ultimos4).to.eq('1111')
        })
      })
    })
  })

  it('TESTE 4 — divide o pagamento entre dois cartões com mínimo de R$ 10,00', () => {
    criarCliente().then((cliente) => {
      adicionarCartao(cliente.id, '4111111111111111')
      adicionarCartao(cliente.id, '5555555555554444')
      prepararCheckout(cliente)
      continuarAoPagamento()
      cy.get('.card-option').eq(0).click()
      cy.get('.card-option').eq(1).click()
      cy.get('.card-amounts input').eq(0).clear().type('800')
      cy.get('.card-amounts input').eq(1).clear().type('813.9')
      abrirRevisao()

      finalizarPedido(cliente.id).then((order) => {
        expect(order.pagamentos).to.have.length(2)
        expect(order.pagamentos[0].valor).to.be.at.least(10)
        expect(order.pagamentos[1].valor).to.be.at.least(10)
      })
    })
  })

  it('TESTE 5 — usa cartão e cupom permitindo pagamento inferior a R$ 10,00', () => {
    criarCliente().then((cliente) => {
      adicionarCartao(cliente.id, '4111111111111111')
      prepararCheckout(cliente)
      continuarAoPagamento()
      cy.get('.card-option').first().click()
      cy.contains('label', 'Cupom promocional ou de troca')
        .find('input')
        .type('CYPRESS-UNDER-10')
      cy.contains('button', 'Aplicar').click()
      cy.contains('Cupom aplicado com sucesso.').should('be.visible')
      cy.get('.card-amounts input').should('have.value', '5')
      abrirRevisao()

      finalizarPedido(cliente.id).then((order) => {
        expect(order.total).to.eq(5)
        expect(order.pagamentos).to.have.length(1)
        expect(order.pagamentos[0].valor).to.eq(5)
      })
    })
  })

  it('TESTE 6 — gera cupom de troca pelo excedente do cupom promocional', () => {
    criarCliente().then((cliente) => {
      prepararCheckout(cliente)
      continuarAoPagamento()
      cy.contains('label', 'Cupom promocional ou de troca')
        .find('input')
        .type('CYPRESS-OVER-10000')
      cy.contains('button', 'Aplicar').click()
      cy.contains('Cupom aplicado com sucesso.').should('be.visible')
      cy.contains('Os cupons cobrem o valor total. Nenhum cartão adicional é necessário.').should('be.visible')
      abrirRevisao()

      finalizarPedido(cliente.id).then((order) => {
        expect(order.total).to.eq(0)
        cy.request(`${API_URL}/api/clientes/${cliente.id}/cupons`).then((response) => {
          const exchangeCoupon = (response.body as Array<{ natureza: string; valor: number }>)
            .find((coupon) => coupon.natureza === 'Troca')
          if (!exchangeCoupon) throw new Error('O cupom de troca não foi encontrado no perfil.')
          expect(exchangeCoupon?.valor).to.eq(10000 - PRODUCT_PRICE - FREIGHT_SP)
        })
      })
    })
  })

  it('TESTE 7 — registra pedido finalizado como EM PROCESSAMENTO', () => {
    criarCliente().then((cliente) => {
      adicionarCartao(cliente.id, '4111111111111111')
      prepararCheckout(cliente, 2)
      continuarAoPagamento()
      cy.get('.card-option').first().click()
      abrirRevisao()

      finalizarPedido(cliente.id).then((order) => {
        expect(order.clienteId).to.eq(cliente.id)
        expect(order.subtotal).to.eq(PRODUCT_PRICE * 2)
        expect(order.valorFrete).to.eq(FREIGHT_SP + 2)
        expect(order.total).to.eq(PRODUCT_PRICE * 2 + FREIGHT_SP + 2)
        expect(order.itens.some(
          (item) => item.produtoId === PRODUCT_ID && item.quantidade === 2,
        )).to.eq(true)
      })
    })
  })

  it('TESTE 8 — cancela pedido em Meus pedidos e mantém CANCELADO após recarregar', () => {
    criarCliente().then((cliente) => {
      adicionarCartao(cliente.id, '4111111111111111')
      prepararCheckout(cliente)
      continuarAoPagamento()
      cy.get('.card-option').first().click()
      abrirRevisao()
      finalizarPedido(cliente.id).then((order) => {
        cy.visit('/meus-pedidos')
        cy.contains('.order-card', `Pedido #${order.id}`).as('pedido')
        cy.get('@pedido').contains('EM PROCESSAMENTO').should('be.visible')

        cy.on('window:confirm', () => true)
        cy.get('@pedido').contains('button', 'Cancelar pedido').click()
        cy.get('@pedido').contains('.admin-status', 'CANCELADO').should('be.visible')

        cy.reload()
        cy.contains('.order-card', `Pedido #${order.id}`)
          .contains('.admin-status', 'CANCELADO').should('be.visible')
      })
    })
  })
})
