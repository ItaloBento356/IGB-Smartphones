describe('Cadastro de clientes', () => {
  function gerarCpfValido(): string {
    const numeros = Array.from({ length: 9 }, () =>
      Math.floor(Math.random() * 10),
    )

    const calcularDigito = (valores: number[]) => {
      const soma = valores.reduce(
        (total, numero, indice) =>
          total + numero * (valores.length + 1 - indice),
        0,
      )

      const resto = soma % 11
      return resto < 2 ? 0 : 11 - resto
    }

    const primeiroDigito = calcularDigito(numeros)

    const segundoDigito = calcularDigito([
      ...numeros,
      primeiroDigito,
    ])

    return [...numeros, primeiroDigito, segundoDigito].join('')
  }

  function preencherCadastro(
    senha = 'Senha@123',
    confirmacaoSenha = 'Senha@123',
    cpf = gerarCpfValido(),
    email = `cypress.${Date.now()}@teste.com`,
  ) {
    cy.get('#campo-nome').type('Cliente Teste Cypress')
    cy.get('#campo-genero').select('Masculino')
    cy.get('#campo-data-nascimento').type('2000-01-15')
    cy.get('#campo-cpf').type(cpf)
    cy.get('#campo-telefone-tipo').select('Celular')
    cy.get('#campo-ddd').type('11')
    cy.get('#campo-telefone-numero').type('999998888')
    cy.get('#campo-email').type(email)
    cy.get('#campo-senha').type(senha)
    cy.get('#campo-confirmacao-senha').type(confirmacaoSenha)
    cy.get('#campo-tipo-residencia').select('Casa')
    cy.get('#campo-tipo-logradouro').select('Rua')
    cy.get('#campo-logradouro').type('Rua Cypress')
    cy.get('#campo-numero').type('123')
    cy.get('#campo-bairro').type('Centro')
    cy.get('#campo-cep').type('08710000')
    cy.get('#campo-cidade').type('Mogi das Cruzes')
    cy.get('#campo-estado').type('SP')
    cy.get('#campo-pais').clear().type('Brasil')
    cy.get('#campo-observacoes').type(
      'Cadastro realizado pelo teste automatizado.',
    )
  }

  beforeEach(() => {
    cy.visit('http://localhost:5173/cadastro')
  })

  // RF0021 - Cadastrar cliente
  it('cadastra um cliente com dados válidos', () => {
    preencherCadastro()

    cy.contains('button', 'Cadastrar cliente').click()

    cy.contains('Cadastro concluído').should('be.visible')

    cy.contains(
      'Sua conta foi criada com sucesso na IGB Smartphones.',
    ).should('be.visible')
  })

  // RNF0031 - Senha forte
  it('rejeita senha que não atende aos requisitos', () => {
    preencherCadastro('12345678', '12345678')

    cy.contains('button', 'Cadastrar cliente').click()

    cy.contains(
      'A senha deve ter ao menos uma letra maiúscula.',
    ).should('be.visible')

    cy.contains('Cadastro concluído').should('not.exist')
  })

  // RNF0032 - Confirmação de senha
  it('rejeita confirmação de senha diferente da senha', () => {
    preencherCadastro('Senha@123', 'Senha@456')

    cy.contains('button', 'Cadastrar cliente').click()

    cy.contains('As senhas não coincidem.').should('be.visible')

    cy.contains('Cadastro concluído').should('not.exist')
  })

  // Validação de CPF
  it('rejeita CPF inválido', () => {
    preencherCadastro(
      'Senha@123',
      'Senha@123',
      '147.458.128-81',
    )

    cy.contains('button', 'Cadastrar cliente').click()

    cy.contains(
      'Não foi possível realizar o cadastro.',
    ).should('be.visible')

    cy.contains('CPF inválido.').should('be.visible')

    cy.contains('Cadastro concluído').should('not.exist')
  })

  // Regra de unicidade do CPF
  it('rejeita cadastro com CPF já cadastrado', () => {
    const cpf = gerarCpfValido()
    const primeiroEmail = `cypress.cpf.${Date.now()}@teste.com`
    const segundoEmail = `cypress.cpf2.${Date.now()}@teste.com`

    preencherCadastro(
      'Senha@123',
      'Senha@123',
      cpf,
      primeiroEmail,
    )

    cy.contains('button', 'Cadastrar cliente').click()

    cy.contains('Cadastro concluído').should('be.visible')

    cy.visit('http://localhost:5173/cadastro')

    preencherCadastro(
      'Senha@123',
      'Senha@123',
      cpf,
      segundoEmail,
    )

    cy.contains('button', 'Cadastrar cliente').click()

    cy.contains('CPF já cadastrado.').should('be.visible')

    cy.contains('Cadastro concluído').should('not.exist')
  })

  // Regra de unicidade do e-mail
  it('rejeita cadastro com e-mail já cadastrado', () => {
    const cpfPrimeiro = gerarCpfValido()
    const cpfSegundo = gerarCpfValido()
    const email = `cypress.email.${Date.now()}@teste.com`

    preencherCadastro(
      'Senha@123',
      'Senha@123',
      cpfPrimeiro,
      email,
    )

    cy.contains('button', 'Cadastrar cliente').click()

    cy.contains('Cadastro concluído').should('be.visible')

    cy.visit('http://localhost:5173/cadastro')

    preencherCadastro(
      'Senha@123',
      'Senha@123',
      cpfSegundo,
      email,
    )

    cy.contains('button', 'Cadastrar cliente').click()

    cy.contains('E-mail já cadastrado.').should('be.visible')

    cy.contains('Cadastro concluído').should('not.exist')
  })
})


describe('Consulta de clientes', () => {
  const API_URL = 'http://localhost:5242'

  interface ClienteTeste {
    id: number
    codigoCliente: string
    nome: string
    cpf: string
    email: string
  }

  function gerarCpfValido(): string {
    const numeros = Array.from({ length: 9 }, () =>
      Math.floor(Math.random() * 10),
    )

    const calcularDigito = (valores: number[]) => {
      const soma = valores.reduce(
        (total, numero, indice) =>
          total + numero * (valores.length + 1 - indice),
        0,
      )

      const resto = soma % 11
      return resto < 2 ? 0 : 11 - resto
    }

    const primeiroDigito = calcularDigito(numeros)

    const segundoDigito = calcularDigito([
      ...numeros,
      primeiroDigito,
    ])

    return [...numeros, primeiroDigito, segundoDigito].join('')
  }

  function criarClienteParaConsulta(): Cypress.Chainable<ClienteTeste> {
    const cpf = gerarCpfValido()
    const email = `cypress.consulta.${Date.now()}@teste.com`

    return cy.request({
      method: 'POST',
      url: `${API_URL}/api/clientes`,
      body: {
        nome: 'Cliente Consulta Cypress',
        genero: 'Masculino',
        dataNascimento: '2000-01-15',
        cpf,
        telefoneTipo: 'Celular',
        ddd: '11',
        telefoneNumero: '999998888',
        email,
        senha: 'Senha@123',
        confirmacaoSenha: 'Senha@123',
        enderecoCobranca: {
          tipoResidencia: 'Casa',
          tipoLogradouro: 'Rua',
          logradouro: 'Rua Consulta Cypress',
          numero: '123',
          bairro: 'Centro',
          cep: '08710000',
          cidade: 'Mogi das Cruzes',
          estado: 'SP',
          pais: 'Brasil',
          observacoes: 'Cliente criado para teste de consulta.',
        },
        enderecoEntrega: {
          nome: 'Principal',
          tipoResidencia: 'Casa',
          tipoLogradouro: 'Rua',
          logradouro: 'Rua Consulta Cypress',
          numero: '123',
          bairro: 'Centro',
          cep: '08710000',
          cidade: 'Mogi das Cruzes',
          estado: 'SP',
          pais: 'Brasil',
          observacoes: 'Cliente criado para teste de consulta.',
        },
      },
    }).then((response) => {
      expect(response.status).to.eq(201)

      return {
        id: response.body.id,
        codigoCliente: response.body.codigoCliente,
        nome: response.body.nome,
        cpf: response.body.cpf,
        email: response.body.email,
      }
    })
  }

  beforeEach(() => {
    cy.visit('http://localhost:5173/admin/clientes')
  })

  it('consulta cliente utilizando busca por nome', () => {
    criarClienteParaConsulta().then((cliente) => {
      cy.reload()

      cy.get('#busca-clientes')
        .should('be.visible')
        .type(cliente.nome)

      cy.contains('td', cliente.nome)
        .should('be.visible')
    })
  })

  it('consulta cliente utilizando busca por CPF', () => {
    criarClienteParaConsulta().then((cliente) => {
      cy.reload()

      cy.get('#busca-clientes')
        .should('be.visible')
        .type(cliente.cpf)

      cy.contains('td', cliente.nome)
        .should('be.visible')

      cy.contains('td', cliente.email)
        .should('be.visible')
    })
  })

  it('consulta cliente utilizando busca por e-mail', () => {
    criarClienteParaConsulta().then((cliente) => {
      cy.reload()

      cy.get('#busca-clientes')
        .should('be.visible')
        .type(cliente.email)

      cy.contains('td', cliente.nome)
        .should('be.visible')
    })
  })

  it('consulta cliente utilizando busca por código', () => {
    criarClienteParaConsulta().then((cliente) => {
      cy.reload()

      cy.get('#busca-clientes')
        .should('be.visible')
        .type(cliente.codigoCliente)

      cy.contains('td', cliente.nome)
        .should('be.visible')

      cy.contains('td', cliente.codigoCliente)
        .should('be.visible')
    })
  })
})


describe('Alteração de clientes', () => {
  function gerarCpfValido(): string {
    const numeros = Array.from({ length: 9 }, () =>
      Math.floor(Math.random() * 10),
    )

    const calcularDigito = (valores: number[]) => {
      const soma = valores.reduce(
        (total, numero, indice) =>
          total + numero * (valores.length + 1 - indice),
        0,
      )

      const resto = soma % 11
      return resto < 2 ? 0 : 11 - resto
    }

    const primeiroDigito = calcularDigito(numeros)

    const segundoDigito = calcularDigito([
      ...numeros,
      primeiroDigito,
    ])

    return [...numeros, primeiroDigito, segundoDigito].join('')
  }

  it('altera os dados de um cliente', () => {
    const cpf = gerarCpfValido()
    const email = `cypress.alteracao.${Date.now()}@teste.com`

    cy.request({
      method: 'POST',
      url: 'http://localhost:5242/api/clientes',
      body: {
        nome: 'Cliente Alteracao Cypress',
        genero: 'Masculino',
        dataNascimento: '1995-05-15',
        cpf,
        telefoneTipo: 'Celular',
        ddd: '11',
        telefoneNumero: '988887777',
        email,
        senha: 'Senha@123',
        confirmacaoSenha: 'Senha@123',
        enderecoCobranca: {
          tipoResidencia: 'Casa',
          tipoLogradouro: 'Rua',
          logradouro: 'Rua Cypress',
          numero: '100',
          bairro: 'Centro',
          cep: '08700000',
          cidade: 'Mogi das Cruzes',
          estado: 'SP',
          pais: 'Brasil',
        },
        enderecoEntrega: {
          nome: 'Principal',
          tipoResidencia: 'Casa',
          tipoLogradouro: 'Rua',
          logradouro: 'Rua Cypress',
          numero: '100',
          bairro: 'Centro',
          cep: '08700000',
          cidade: 'Mogi das Cruzes',
          estado: 'SP',
          pais: 'Brasil',
        },
      },
    }).then((response) => {
      expect(response.status).to.eq(201)

      const clienteId = response.body.id

      cy.visit(
        `http://localhost:5173/admin/clientes/editar/${clienteId}`,
      )

      cy.get('#campo-nome')
        .should('have.value', 'Cliente Alteracao Cypress')
        .clear()
        .type('Cliente Alterado Cypress')

      cy.get('#campo-telefone-numero')
        .clear()
        .type('988887777')

      cy.contains('button', 'Salvar alterações').click()

      cy.url().should('include', '/admin/clientes/consulta')

      cy.request({
        method: 'GET',
        url: `http://localhost:5242/api/clientes/${clienteId}`,
      }).then((resposta) => {
        expect(resposta.status).to.eq(200)
        expect(resposta.body.nome).to.eq(
          'Cliente Alterado Cypress',
        )
        expect(resposta.body.telefoneNumero).to.eq(
          '988887777',
        )
      })
    })
  })
})


describe('Inativação de clientes', () => {
  function gerarCpfValido(): string {
    const numeros = Array.from({ length: 9 }, () =>
      Math.floor(Math.random() * 10),
    )

    let soma = numeros.reduce(
      (total, numero, indice) =>
        total + numero * (10 - indice),
      0,
    )

    let resto = soma % 11

    numeros.push(
      resto < 2 ? 0 : 11 - resto,
    )

    soma = numeros.reduce(
      (total, numero, indice) =>
        total + numero * (11 - indice),
      0,
    )

    resto = soma % 11

    numeros.push(
      resto < 2 ? 0 : 11 - resto,
    )

    return numeros.join('')
  }

  it('inativa um cliente ativo', () => {
    const cpf = gerarCpfValido()
    const email = `cypress.inativacao.${Date.now()}@teste.com`

    cy.request({
      method: 'POST',
      url: 'http://localhost:5242/api/clientes',
      body: {
        nome: 'Cliente Inativacao Cypress',
        genero: 'Masculino',
        dataNascimento: '1995-05-15',
        cpf,
        telefoneTipo: 'Celular',
        ddd: '11',
        telefoneNumero: '988887777',
        email,
        senha: 'Senha@123',
        confirmacaoSenha: 'Senha@123',
        enderecoCobranca: {
          tipoResidencia: 'Casa',
          tipoLogradouro: 'Rua',
          logradouro: 'Rua Cypress',
          numero: '100',
          bairro: 'Centro',
          cep: '08700000',
          cidade: 'Mogi das Cruzes',
          estado: 'SP',
          pais: 'Brasil',
        },
        enderecoEntrega: {
          nome: 'Principal',
          tipoResidencia: 'Casa',
          tipoLogradouro: 'Rua',
          logradouro: 'Rua Cypress',
          numero: '100',
          bairro: 'Centro',
          cep: '08700000',
          cidade: 'Mogi das Cruzes',
          estado: 'SP',
          pais: 'Brasil',
        },
      },
    }).then((response) => {
      expect(response.status).to.eq(201)

      const clienteId = response.body.id
      const codigoCliente = response.body.codigoCliente

      cy.visit(
        'http://localhost:5173/admin/clientes/consulta',
      )

      cy.get('#filtro-codigo')
        .type(codigoCliente)

      cy.contains('button', 'Pesquisar').click()

      cy.contains('td', 'Cliente Inativacao Cypress')
  .should('be.visible')

cy.contains('td', 'Cliente Inativacao Cypress')
  .parent('tr')
  .find('td')
  .contains('Ativo')
  .should('be.visible')

cy.contains('td', 'Cliente Inativacao Cypress')
  .parent('tr')
  .contains('button', 'Inativar')
  .click()

      cy.get('[role="dialog"]')
        .should('be.visible')
        .within(() => {
          cy.contains('h2', 'Inativar cliente')
            .should('be.visible')

          cy.contains(
            'Cliente Inativacao Cypress',
          ).should('be.visible')

          cy.contains('Status atual')
            .parent()
            .should('contain', 'Ativo')

          cy.contains(
            'button',
            'Inativar cliente',
          ).click()
        })

      cy.contains(
        'Cliente inativado com sucesso.',
      ).should('be.visible')

      cy.contains(
        'td',
        'Cliente Inativacao Cypress',
      )
        .should('be.visible')
        .parent('tr')
        .within(() => {
          cy.get('.admin-status-inativo')
            .should('be.visible')
            .and('contain.text', 'Inativo')
        })

      cy.request({
        method: 'GET',
        url: `http://localhost:5242/api/clientes/${clienteId}`,
      }).then((resposta) => {
        expect(resposta.status).to.eq(200)
        expect(resposta.body.ativo).to.eq(false)
      })
    })
  })

  it('cancela a inativação de um cliente ativo', () => {
    const cpf = gerarCpfValido()
    const email = `cypress.cancelamento.${Date.now()}@teste.com`

    cy.request({
      method: 'POST',
      url: 'http://localhost:5242/api/clientes',
      body: {
        nome: 'Cliente Cancelamento Cypress',
        genero: 'Masculino',
        dataNascimento: '1995-05-15',
        cpf,
        telefoneTipo: 'Celular',
        ddd: '11',
        telefoneNumero: '988887777',
        email,
        senha: 'Senha@123',
        confirmacaoSenha: 'Senha@123',
        enderecoCobranca: {
          tipoResidencia: 'Casa',
          tipoLogradouro: 'Rua',
          logradouro: 'Rua Cypress',
          numero: '100',
          bairro: 'Centro',
          cep: '08700000',
          cidade: 'Mogi das Cruzes',
          estado: 'SP',
          pais: 'Brasil',
        },
        enderecoEntrega: {
          nome: 'Principal',
          tipoResidencia: 'Casa',
          tipoLogradouro: 'Rua',
          logradouro: 'Rua Cypress',
          numero: '100',
          bairro: 'Centro',
          cep: '08700000',
          cidade: 'Mogi das Cruzes',
          estado: 'SP',
          pais: 'Brasil',
        },
      },
    }).then((response) => {
      expect(response.status).to.eq(201)

      const clienteId = response.body.id
      const codigoCliente = response.body.codigoCliente

      cy.visit(
        'http://localhost:5173/admin/clientes/consulta',
      )

      cy.get('#filtro-codigo')
        .type(codigoCliente)

      cy.contains('button', 'Pesquisar').click()

      cy.contains(
        'td',
        'Cliente Cancelamento Cypress',
      )
        .should('be.visible')
        .parent('tr')
        .within(() => {
          cy.contains('td', 'Ativo').should('be.visible')
          cy.contains('button', 'Inativar').click()
        })

      cy.get('[role="dialog"]')
        .should('be.visible')
        .within(() => {
          cy.contains(
            'h2',
            'Inativar cliente',
          ).should('be.visible')

          cy.contains(
            'button',
            'Cancelar',
          ).click()
        })

      cy.get('[role="dialog"]')
        .should('not.exist')

      cy.contains(
        'td',
        'Cliente Cancelamento Cypress',
      )
        .should('be.visible')
        .parent('tr')
        .within(() => {
          cy.get('.admin-status-ativo')
            .should('be.visible')
            .and('contain.text', 'Ativo')

          cy.contains(
            'button',
            'Inativar',
          ).should('be.visible')
        })

      cy.request({
        method: 'GET',
        url: `http://localhost:5242/api/clientes/${clienteId}`,
      }).then((resposta) => {
        expect(resposta.status).to.eq(200)
        expect(resposta.body.ativo).to.eq(true)
      })
    })
  })
})