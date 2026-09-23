import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { consultarClientes } from '../data/clienteApi'
import type { ClienteConsulta } from '../data/clienteApi'
import { formatarCpf } from '../utils/formatadores'

export default function AdminClientesPage() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [clientes, setClientes] = useState<ClienteConsulta[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteConsulta | null>(null)

  useEffect(() => {
    let cancelado = false
    setCarregando(true)
    setErro('')

    consultarClientes()
      .then((resultado) => {
        if (!cancelado) setClientes(resultado)
      })
      .catch((erroCapturado) => {
        if (!cancelado) {
          setErro(erroCapturado instanceof Error ? erroCapturado.message : 'Erro ao carregar clientes. Tente novamente.')
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [])

  const clientesFiltrados = useMemo(() => {
  const termo = busca.trim().toLowerCase()

  if (!termo) return clientes

  const termoNormalizado = termo.replace(/\D/g, '')

  return clientes.filter((cliente) => {
    const nome = cliente.nome.toLowerCase()
    const email = cliente.email.toLowerCase()
    const telefone = cliente.telefoneNumero.replace(/\D/g, '')
    const cpf = cliente.cpf.replace(/\D/g, '')
    const codigo = cliente.codigoCliente.toLowerCase()

    return (
      nome.includes(termo) ||
      email.includes(termo) ||
      telefone.includes(termoNormalizado) ||
      cpf.includes(termoNormalizado) ||
      codigo.includes(termo)
    )
  })
}, [busca, clientes])

  return (
    <section className="admin-clientes">
      <header className="admin-page-header">
        <h1>Clientes</h1>
        <p>Consulte os clientes cadastrados na IGB Smartphones.</p>
      </header>

      <div className="admin-split-panel">
        <div className="admin-list-panel">
        <div className="admin-list-toolbar">
          <label htmlFor="busca-clientes">Buscar cliente</label>
          <input
            id="busca-clientes"
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Código, nome, CPF, e-mail ou telefone"
          />
        </div>

        {erro && (
          <div className="account-error-banner" role="alert">
            <strong>Não foi possível carregar os clientes.</strong>
            <span>{erro}</span>
          </div>
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
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.codigoCliente}</td>
                  <td>{cliente.nome}</td>
                  <td>{formatarCpf(cliente.cpf)}</td>
                  <td>{cliente.email}</td>
                  <td>({cliente.ddd}) {cliente.telefoneNumero}</td>
                  <td>
                    <span className={`admin-status admin-status-${cliente.ativo ? 'ativo' : 'inativo'}`}>
                      {cliente.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="admin-action-button"
                      type="button"
                      onClick={() => setClienteSelecionado(cliente)}
                    >
                      Ver detalhes
                    </button>
                    <button
                      className="admin-action-button"
                      type="button"
                      onClick={() => navigate(`/admin/clientes/editar/${cliente.id}`)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {!carregando && clientesFiltrados.length === 0 && (
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

        {clienteSelecionado && (
          <aside className="admin-detail-panel" aria-labelledby="cliente-detalhes-titulo">
          <div className="admin-detail-heading">
            <div>
              <span className="admin-detail-label">Detalhes do cliente</span>
              <h2 id="cliente-detalhes-titulo">{clienteSelecionado.nome}</h2>
            </div>
            <button
              className="admin-close-button"
              type="button"
              aria-label="Fechar detalhes"
              onClick={() => setClienteSelecionado(null)}
            >
              Fechar
            </button>
          </div>
          <dl className="admin-detail-grid">
            <div><dt>Código</dt><dd>{clienteSelecionado.codigoCliente}</dd></div>
            <div><dt>CPF</dt><dd>{formatarCpf(clienteSelecionado.cpf)}</dd></div>
            <div><dt>E-mail</dt><dd>{clienteSelecionado.email}</dd></div>
            <div><dt>Telefone</dt><dd>({clienteSelecionado.ddd}) {clienteSelecionado.telefoneNumero}</dd></div>
            <div><dt>Status</dt><dd>{clienteSelecionado.ativo ? 'Ativo' : 'Inativo'}</dd></div>
            <div><dt>Cidade</dt><dd>{clienteSelecionado.enderecoCobranca.cidade}</dd></div>
          </dl>
          </aside>
        )}
      </div>
    </section>
  )
}