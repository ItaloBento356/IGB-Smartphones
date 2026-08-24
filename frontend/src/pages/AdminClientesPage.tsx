import { useMemo, useState } from 'react'
import { obterClientes, type Cliente } from '../data/adminData'

export default function AdminClientesPage() {
  const [busca, setBusca] = useState('')
  const [clientes] = useState(obterClientes)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return clientes

    return clientes.filter((cliente) =>
      [cliente.nome, cliente.email, cliente.telefone].some((campo) =>
        campo.toLowerCase().includes(termo),
      ),
    )
  }, [busca, clientes])

  return (
    <section className="admin-clientes">
      <header className="admin-page-header">
        <h1>Clientes</h1>
        <p>Consulte os clientes cadastrados na IGB Smartphones.</p>
      </header>

      <div className="admin-list-panel">
        <div className="admin-list-toolbar">
          <label htmlFor="busca-clientes">Buscar cliente</label>
          <input
            id="busca-clientes"
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Nome, e-mail ou telefone"
          />
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nome}</td>
                  <td>{cliente.email}</td>
                  <td>{cliente.telefone}</td>
                  <td>
                    <span className={`admin-status admin-status-${cliente.status.toLowerCase()}`}>
                      {cliente.status}
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
                  </td>
                </tr>
              ))}
              {clientesFiltrados.length === 0 && (
                <tr>
                  <td className="admin-table-empty" colSpan={5}>
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {clienteSelecionado && (
        <div className="admin-detail-panel" role="dialog" aria-labelledby="cliente-detalhes-titulo">
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
            <div><dt>E-mail</dt><dd>{clienteSelecionado.email}</dd></div>
            <div><dt>Telefone</dt><dd>{clienteSelecionado.telefone}</dd></div>
            <div><dt>Status</dt><dd>{clienteSelecionado.status}</dd></div>
            <div><dt>Cidade</dt><dd>{clienteSelecionado.cidade}</dd></div>
            <div><dt>Pedidos realizados</dt><dd>{clienteSelecionado.pedidos}</dd></div>
          </dl>
        </div>
      )}
    </section>
  )
}