import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  obterClientePorId,
  listarCartoes,
  adicionarCartao,
  definirCartaoComoPreferencial,
  adicionarEnderecoEntrega,
  atualizarEnderecoEntrega,
  type ClienteConsulta,
  type CartaoCliente,
  type EnderecoCliente,
  type CadastrarCartaoRequest,
} from '../data/clienteApi'
import { Header } from '../components/Header'

export default function ClientAccountPage() {
  const navigate = useNavigate()

  /*
   * Por enquanto o ID do cliente autenticado continua vindo
   * do mecanismo de autenticação que o projeto já utiliza.
   * Os dados exibidos, porém, passam a vir da API/PostgreSQL.
   */
  const clienteId = Number(localStorage.getItem('clienteId'))

  const [cliente, setCliente] = useState<ClienteConsulta | null>(null)
  const [cartoes, setCartoes] = useState<CartaoCliente[]>([])
  const [enderecos, setEnderecos] = useState<EnderecoCliente[]>([])

  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const [editandoEndereco, setEditandoEndereco] = useState<number | null>(null)
  const [novoEndereco, setNovoEndereco] = useState(false)

  const [enderecoForm, setEnderecoForm] = useState({
    nome: '',
    tipoResidencia: '',
    tipoLogradouro: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cep: '',
    cidade: '',
    estado: '',
    pais: 'Brasil',
    observacoes: '',
  })

  const [novoCartao, setNovoCartao] = useState(false)

  const [cartaoForm, setCartaoForm] = useState<CadastrarCartaoRequest>({
    numero: '',
    nomeImpresso: '',
    bandeiraId: 0,
    codigoSeguranca: '',
    preferencial: false,
  })

  const carregarDados = async () => {
    if (!clienteId) {
      navigate('/login', { replace: true })
      return
    }

    try {
      setCarregando(true)
      setErro('')

      const clienteApi = await obterClientePorId(clienteId)
      const cartoesApi = await listarCartoes(clienteId)

      setCliente(clienteApi)
      setCartoes(cartoesApi)
      setEnderecos(clienteApi.enderecosEntrega)
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar sua conta.',
      )
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const atualizarEnderecoCampo = (
    campo: keyof typeof enderecoForm,
    valor: string,
  ) => {
    setEnderecoForm((atual) => ({
      ...atual,
      [campo]: valor,
    }))
  }

  const iniciarNovoEndereco = () => {
    setEditandoEndereco(null)
    setNovoEndereco(true)

    setEnderecoForm({
      nome: '',
      tipoResidencia: '',
      tipoLogradouro: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cep: '',
      cidade: '',
      estado: '',
      pais: 'Brasil',
      observacoes: '',
    })
  }

  const iniciarEdicaoEndereco = (endereco: EnderecoCliente) => {
    setNovoEndereco(false)
    setEditandoEndereco(endereco.id)

    setEnderecoForm({
      nome: endereco.nome ?? '',
      tipoResidencia: endereco.tipoResidencia,
      tipoLogradouro: endereco.tipoLogradouro,
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      bairro: endereco.bairro,
      cep: endereco.cep,
      cidade: endereco.cidade,
      estado: endereco.estado,
      pais: endereco.pais,
      observacoes: endereco.observacoes ?? '',
    })
  }

  const cancelarEndereco = () => {
    setNovoEndereco(false)
    setEditandoEndereco(null)
  }

  const salvarEndereco = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setErro('')

      if (novoEndereco) {
        await adicionarEnderecoEntrega(clienteId, enderecoForm)
        setMensagem('Endereço de entrega adicionado com sucesso.')
      } else if (editandoEndereco !== null) {
        await atualizarEnderecoEntrega(
          clienteId,
          editandoEndereco,
          enderecoForm,
        )
        setMensagem('Endereço de entrega atualizado com sucesso.')
      }

      cancelarEndereco()
      await carregarDados()
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o endereço.',
      )
    }
  }

  const tornarCartaoPreferencial = async (cartaoId: number) => {
    try {
      setErro('')

      await definirCartaoComoPreferencial(clienteId, cartaoId)

      const cartoesAtualizados = await listarCartoes(clienteId)
      setCartoes(cartoesAtualizados)
      setMensagem('Cartão preferencial atualizado com sucesso.')
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível alterar o cartão preferencial.',
      )
    }
  }

  const atualizarCartaoCampo = (
    campo: keyof CadastrarCartaoRequest,
    valor: string | boolean | number,
  ) => {
    setCartaoForm((atual) => ({
      ...atual,
      [campo]: valor,
    }))
  }

  const abrirNovoCartao = () => {
    setNovoCartao(true)

    setCartaoForm({
      numero: '',
      nomeImpresso: '',
      bandeiraId: 0,
      codigoSeguranca: '',
      preferencial: cartoes.length === 0,
    })
  }

  const cancelarCartao = () => {
    setNovoCartao(false)

    setCartaoForm({
      numero: '',
      nomeImpresso: '',
      bandeiraId: 0,
      codigoSeguranca: '',
      preferencial: false,
    })
  }

  const salvarCartao = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setErro('')

      await adicionarCartao(clienteId, {
        ...cartaoForm,
        numero: cartaoForm.numero.replace(/\D/g, ''),
        codigoSeguranca: cartaoForm.codigoSeguranca.replace(/\D/g, ''),
        nomeImpresso: cartaoForm.nomeImpresso.trim(),
      })

      const cartoesAtualizados = await listarCartoes(clienteId)
      setCartoes(cartoesAtualizados)

      cancelarCartao()
      setMensagem('Cartão cadastrado com sucesso.')
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível cadastrar o cartão.',
      )
    }
  }

  if (carregando) {
    return (
      <div className="site-shell">
        <Header />

        <main className="container">
          <section className="section">
            <h1>Minha conta</h1>
            <p>Carregando seus dados...</p>
          </section>
        </main>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="site-shell">
        <Header />

        <main className="container">
          <section className="section">
            <h1>Minha conta</h1>
            <p>{erro || 'Cliente não encontrado.'}</p>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="site-shell">
      <Header />

      <main className="container">
        <section className="section account-page">
          <div className="section-heading">
            <div>
              <h1>Minha conta</h1>
              <p>
                Consulte seus dados, endereços e formas de pagamento.
              </p>
            </div>

            <Link to="/">Voltar para início</Link>
          </div>

          {mensagem && (
            <p className="account-message" role="status">
              {mensagem}
            </p>
          )}

          {erro && (
            <p className="account-error" role="alert">
              {erro}
            </p>
          )}

          <div className="account-panel">
            <div className="account-status-row">
              <div>
                <span className="account-label">Código do cliente</span>
                <strong>{cliente.codigoCliente}</strong>
              </div>

              <div>
                <span className="account-label">Status</span>
                <strong>{cliente.ativo ? 'Ativo' : 'Inativo'}</strong>
              </div>
            </div>

            <section className="account-data-section">
              <div className="section-heading">
                <div>
                  <h2>Meus dados</h2>
                  <p>Dados cadastrais da sua conta.</p>
                </div>
              </div>

              <div className="account-fields">
                <label>
                  Nome
                  <input value={cliente.nome} disabled />
                </label>

                <label>
                  E-mail
                  <input value={cliente.email} disabled />
                </label>

                <label>
                  CPF
                  <input value={cliente.cpf} disabled />
                </label>

                <label>
                  Telefone
                  <input
                    value={`(${cliente.ddd}) ${cliente.telefoneNumero}`}
                    disabled
                  />
                </label>
              </div>
            </section>

            <section className="account-data-section">
              <div className="section-heading">
                <div>
                  <h2>Endereços de entrega</h2>
                  <p>
                    Gerencie os endereços utilizados durante suas compras.
                  </p>
                </div>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={iniciarNovoEndereco}
                  disabled={!cliente.ativo}
                >
                  Adicionar endereço
                </button>
              </div>

              {enderecos.length === 0 && (
                <p>Nenhum endereço de entrega cadastrado.</p>
              )}

      {enderecos.map((endereco) => (
        <article className="account-data-card" key={endereco.id}>
          <div>
            <strong>{endereco.nome}</strong>

            <p>
              {endereco.logradouro}, {endereco.numero}
              <br />
              {endereco.bairro} - {endereco.cidade}/{endereco.estado}
              <br />
              CEP: {endereco.cep}
            </p>
          </div>

          <div className="account-data-actions">
            <button
              type="button"
              onClick={() => iniciarEdicaoEndereco(endereco)}
              disabled={!cliente.ativo}
            >
              Editar
            </button>
          </div>
        </article>
      ))}

              {(novoEndereco || editandoEndereco !== null) && (
                <form
                  className="account-form account-data-form"
                  onSubmit={salvarEndereco}
                >
                  <h3>
                    {novoEndereco
                      ? 'Novo endereço de entrega'
                      : 'Editar endereço de entrega'}
                  </h3>

                  <label>
                    Identificação
                    <input
                      value={enderecoForm.nome}
                      required
                      onChange={(event) =>
                        atualizarEnderecoCampo('nome', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Tipo de residência
                    <input
                      value={enderecoForm.tipoResidencia}
                      required
                      onChange={(event) =>
                        atualizarEnderecoCampo(
                          'tipoResidencia',
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    Tipo de logradouro
                    <input
                      value={enderecoForm.tipoLogradouro}
                      required
                      onChange={(event) =>
                        atualizarEnderecoCampo(
                          'tipoLogradouro',
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    Logradouro
                    <input
                      value={enderecoForm.logradouro}
                      required
                      onChange={(event) =>
                        atualizarEnderecoCampo(
                          'logradouro',
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    Número
                    <input
                      value={enderecoForm.numero}
                      required
                      onChange={(event) =>
                        atualizarEnderecoCampo('numero', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Bairro
                    <input
                      value={enderecoForm.bairro}
                      required
                      onChange={(event) =>
                        atualizarEnderecoCampo('bairro', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    CEP
                    <input
                      value={enderecoForm.cep}
                      required
                      onChange={(event) =>
                        atualizarEnderecoCampo('cep', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Cidade
                    <input
                      value={enderecoForm.cidade}
                      required
                      onChange={(event) =>
                        atualizarEnderecoCampo('cidade', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Estado
                    <select
                      value={enderecoForm.estado}
                      required
                      onChange={(event) =>
                        atualizarEnderecoCampo(
                          'estado',
                          event.target.value,
                        )
                      }
                    >
                      <option value="">Selecione</option>
                      {[
                        'AC',
                        'AL',
                        'AP',
                        'AM',
                        'BA',
                        'CE',
                        'DF',
                        'ES',
                        'GO',
                        'MA',
                        'MT',
                        'MS',
                        'MG',
                        'PA',
                        'PB',
                        'PR',
                        'PE',
                        'PI',
                        'RJ',
                        'RN',
                        'RS',
                        'RO',
                        'RR',
                        'SC',
                        'SP',
                        'SE',
                        'TO',
                      ].map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    País
                    <input
                      value={enderecoForm.pais}
                      required
                      onChange={(event) =>
                        atualizarEnderecoCampo('pais', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Observações
                    <input
                      value={enderecoForm.observacoes}
                      onChange={(event) =>
                        atualizarEnderecoCampo(
                          'observacoes',
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <div>
                    <button className="primary-button" type="submit">
                      Salvar
                    </button>

                    <button
                      className="secondary-button"
                      type="button"
                      onClick={cancelarEndereco}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section className="account-data-section">
              <div className="section-heading">
                <div>
                  <h2>Meus cartões</h2>
                  <p>
                    Gerencie seus cartões e escolha o cartão preferencial.
                  </p>
                </div>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={abrirNovoCartao}
                  disabled={!cliente.ativo}
                >
                  Adicionar cartão
                </button>
              </div>

              {cartoes.length === 0 && (
                <p>Nenhum cartão cadastrado.</p>
              )}

              <div className="account-card-list">
                {cartoes.map((cartao) => (
                  <article
                    className="account-card-item"
                    key={cartao.id}
                  >
                    <div className="account-card-info">
                      <div className="account-card-brand">
                        <strong>{cartao.bandeiraNome}</strong>
                      </div>

                      <div className="account-card-details">
                        <strong>
                          •••• •••• •••• {cartao.ultimos4}
                        </strong>

                        <span>{cartao.nomeImpresso}</span>

                        {cartao.preferencial && (
                          <span className="account-card-preferred">
                            Preferencial
                          </span>
                        )}
                      </div>
                    </div>

                    {!cartao.preferencial && (
                      <button
                        className="account-card-action"
                        type="button"
                        onClick={() =>
                          tornarCartaoPreferencial(cartao.id)
                        }
                        disabled={!cliente.ativo}
                      >
                        Tornar preferencial
                      </button>
                    )}
                  </article>
                ))}
              </div>

              {novoCartao && (
                <form
                  className="account-form account-data-form"
                  onSubmit={salvarCartao}
                >
                  <h3>Novo cartão</h3>

                  <label>
                    Número do cartão
                    <input
                      value={cartaoForm.numero}
                      inputMode="numeric"
                      maxLength={19}
                      required
                      onChange={(event) =>
                        atualizarCartaoCampo(
                          'numero',
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    Nome impresso
                    <input
                      value={cartaoForm.nomeImpresso}
                      required
                      onChange={(event) =>
                        atualizarCartaoCampo(
                          'nomeImpresso',
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    Código de segurança
                    <input
                      value={cartaoForm.codigoSeguranca}
                      inputMode="numeric"
                      maxLength={4}
                      required
                      onChange={(event) =>
                        atualizarCartaoCampo(
                          'codigoSeguranca',
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    Bandeira
                    <select
                      value={cartaoForm.bandeiraId}
                      required
                      onChange={(event) =>
                        atualizarCartaoCampo(
                          'bandeiraId',
                          Number(event.target.value),
                        )
                      }
                    >
                      <option value={0}>Selecione</option>
                      <option value={1}>Visa</option>
                      <option value={2}>Mastercard</option>
                      <option value={3}>Elo</option>
                    </select>
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={cartaoForm.preferencial}
                      onChange={(event) =>
                        atualizarCartaoCampo(
                          'preferencial',
                          event.target.checked,
                        )
                      }
                    />
                    Definir como cartão preferencial
                  </label>

                  <div>
                    <button
                      className="primary-button"
                      type="submit"
                    >
                      Salvar cartão
                    </button>

                    <button
                      className="secondary-button"
                      type="button"
                      onClick={cancelarCartao}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </section>

            <nav
              className="account-navigation"
              aria-label="Navegação da conta"
            >
              <Link
                className="account-orders-link"
                to="/meus-pedidos"
              >
                Meus pedidos
              </Link>

              <Link
                className="account-orders-link"
                to="/cupons"
              >
                Meus cupons
              </Link>
            </nav>
          </div>
        </section>
      </main>
    </div>
  )}