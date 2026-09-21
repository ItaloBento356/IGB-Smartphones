import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { consultarClientes, inativarCliente } from '../data/clienteApi'
import type { ClienteConsulta, FiltrosConsultaClientes } from '../data/clienteApi'
import { formatarCpf } from '../utils/formatadores'

const FILTROS_INICIAIS: FiltrosConsultaClientes = { codigo: '', nome: '', cpf: '', email: '' }

const formatarTelefoneExibicao = (ddd: string, numero: string) => `(${ddd}) ${numero}`

export default function ConsultaClientesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [filtros, setFiltros] = useState<FiltrosConsultaClientes>(FILTROS_INICIAIS)
  const [clientes, setClientes] = useState<ClienteConsulta[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState(
    () => (location.state as { mensagemSucesso?: string } | null)?.mensagemSucesso ?? '',
  )
  const [clienteParaInativar, setClienteParaInativar] = useState<ClienteConsulta | null>(null)
  const [inativando, setInativando] = useState(false)
  const [erroInativacao, setErroInativacao] = useState('')

  const pesquisar = async (filtrosParaBusca: FiltrosConsultaClientes) => {
    setCarregando(true)
    setErro('')
    try {
      const resultado = await consultarClientes(filtrosParaBusca)
      setClientes(resultado)
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : 'Erro ao consultar clientes. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    pesquisar(FILTROS_INICIAIS)
  }, [])

  useEffect(() => {
    if (!mensagemSucesso) return
    // Evita reexibir a mensagem se a página for recarregada ou revisitada.
    navigate('.', { replace: true, state: null })
  }, [mensagemSucesso, navigate])

  const atualizarCampo = (campo: keyof FiltrosConsultaClientes, valor: string) => {
    setFiltros((atual) => ({ ...atual, [campo]: valor }))
  }

  const aoSubmeterFiltros = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (carregando) return
    setMensagemSucesso('')
    pesquisar(filtros)
  }

  const limparFiltros = () => {
    setFiltros(FILTROS_INICIAIS)
    setMensagemSucesso('')
    pesquisar(FILTROS_INICIAIS)
  }

  const abrirConfirmacaoInativar = (cliente: ClienteConsulta) => {
    setErroInativacao('')
    setClienteParaInativar(cliente)
  }

  const cancelarInativacao = () => {
    if (inativando) return
    setClienteParaInativar(null)
    setErroInativacao('')
  }

  const confirmarInativacao = async () => {
    if (!clienteParaInativar || inativando) return

    setInativando(true)
    setErroInativacao('')
    try {
      const clienteAtualizado = await inativarCliente(clienteParaInativar.id)
      setClientes((atual) => atual.map((cliente) => (cliente.id === clienteAtualizado.id ? clienteAtualizado : cliente)))
      setMensagemSucesso('Cliente inativado com sucesso.')
      setClienteParaInativar(null)
    } catch (erro) {
      setErroInativacao(erro instanceof Error ? erro.message : 'Não foi possível inativar o cliente. Tente novamente.')
    } finally {
      setInativando(false)
    }
  }

  return (
    <section className="admin-clientes">
      <header className="admin-page-header">
        <h1>Consulta de Clientes</h1>
        <p>Pesquise clientes cadastrados na IGB Smartphones por código, nome, CPF ou e-mail.</p>
      </header>

      <div className="admin-list-panel">
        <form className="admin-filtros-form" onSubmit={aoSubmeterFiltros}>
          <div className="admin-filtros-grid">
            <label htmlFor="filtro-codigo">
              Código do cliente
              <input
                id="filtro-codigo"
                value={filtros.codigo}
                onChange={(event) => atualizarCampo('codigo', event.target.value)}
                placeholder="CLI-2026-000001"
              />
            </label>

            <label htmlFor="filtro-nome">
              Nome
              <input
                id="filtro-nome"
                value={filtros.nome}
                onChange={(event) => atualizarCampo('nome', event.target.value)}
                placeholder="Nome do cliente"
              />
            </label>

            <label htmlFor="filtro-cpf">
              CPF
              <input
                id="filtro-cpf"
                value={filtros.cpf}
                onChange={(event) => atualizarCampo('cpf', event.target.value)}
                placeholder="000.000.000-00"
              />
            </label>

            <label htmlFor="filtro-email">
              E-mail
              <input
                id="filtro-email"
                type="email"
                value={filtros.email}
                onChange={(event) => atualizarCampo('email', event.target.value)}
                placeholder="cliente@email.com"
              />
            </label>
          </div>

          <div className="admin-filtros-acoes">
            <button className="primary-button" type="submit" disabled={carregando}>
              {carregando ? 'Pesquisando...' : 'Pesquisar'}
            </button>
            <button className="admin-action-button" type="button" onClick={limparFiltros} disabled={carregando}>
              Limpar filtros
            </button>
          </div>
        </form>

        {erro && (
          <div className="account-error-banner" role="alert">
            <strong>Não foi possível concluir a consulta.</strong>
            <span>{erro}</span>
          </div>
        )}

        {mensagemSucesso && (
          <p className="account-message" role="status">{mensagemSucesso}</p>
        )}

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>CPF</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.codigoCliente}</td>
                  <td>{cliente.nome}</td>
                  <td>{formatarCpf(cliente.cpf)}</td>
                  <td>{cliente.email}</td>
                  <td>{formatarTelefoneExibicao(cliente.ddd, cliente.telefoneNumero)}</td>
                  <td>
                    <span className={`admin-status admin-status-${cliente.ativo ? 'ativo' : 'inativo'}`}>
                      {cliente.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="admin-action-button"
                      type="button"
                      onClick={() => navigate(`/admin/clientes/editar/${cliente.id}`)}
                    >
                      Editar
                    </button>
                    {cliente.ativo ? (
                      <button
                        className="admin-action-button"
                        type="button"
                        onClick={() => abrirConfirmacaoInativar(cliente)}
                      >
                        Inativar
                      </button>
                    ) : (
                      <span className="admin-status admin-status-inativo">Inativo</span>
                    )}
                  </td>
                </tr>
              ))}
              {!carregando && clientes.length === 0 && (
                <tr>
                  <td className="admin-table-empty" colSpan={7}>
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
              {carregando && (
                <tr>
                  <td className="admin-table-empty" colSpan={7}>
                    Carregando clientes...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {clienteParaInativar && (
        <div className="account-modal-backdrop">
          <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="inativar-cliente-titulo">
            <h2 id="inativar-cliente-titulo">Inativar cliente</h2>
            <p>Tem certeza que deseja inativar este cliente?</p>
            <dl className="admin-detail-grid">
              <div><dt>Nome</dt><dd>{clienteParaInativar.nome}</dd></div>
              <div><dt>Código do cliente</dt><dd>{clienteParaInativar.codigoCliente}</dd></div>
              <div><dt>Status atual</dt><dd>{clienteParaInativar.ativo ? 'Ativo' : 'Inativo'}</dd></div>
            </dl>
            {erroInativacao && (
              <p className="account-error" role="alert">{erroInativacao}</p>
            )}
            <div className="account-modal-actions">
              <button className="secondary-button" type="button" onClick={cancelarInativacao} disabled={inativando}>
                Cancelar
              </button>
              <button className="account-inactivate-button" type="button" onClick={confirmarInativacao} disabled={inativando}>
                {inativando ? 'Inativando...' : 'Inativar cliente'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
