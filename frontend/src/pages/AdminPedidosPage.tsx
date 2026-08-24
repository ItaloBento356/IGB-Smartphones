import { useEffect, useMemo, useState } from 'react'
import { obterClientes, obterPedidos, salvarPedidos, type StatusPedido, PEDIDOS_UPDATED_EVENT } from '../data/adminData'

const statusDisponiveis: StatusPedido[] = [
  'EM ABERTO',
  'CANCELADO',
  'EM PROCESSAMENTO',
  'PAGAMENTO REALIZADO',
  'EM TRÂNSITO',
  'ENTREGUE',
  'TROCA SOLICITADA',
  'TROCA ACEITA',
  'TROCA NEGADA',
  'ITEM ENVIADO',
  'ITEM RECEBIDO',
  'TROCA PROCESSADA',
]

const proximosStatus: Record<StatusPedido, readonly StatusPedido[]> = {
  'EM ABERTO': ['EM PROCESSAMENTO'],
  CANCELADO: [],
  'EM PROCESSAMENTO': ['PAGAMENTO REALIZADO'],
  'PAGAMENTO REALIZADO': ['EM TRÂNSITO'],
  'EM TRÂNSITO': ['ENTREGUE'],
  ENTREGUE: [],
  'TROCA SOLICITADA': ['TROCA ACEITA', 'TROCA NEGADA'],
  'TROCA ACEITA': [],
  'TROCA NEGADA': [],
  'ITEM ENVIADO': ['ITEM RECEBIDO'],
  'ITEM RECEBIDO': ['TROCA PROCESSADA'],
  'TROCA PROCESSADA': [],
}

const formatarValor = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminPedidosPage() {
  const clientes = obterClientes()
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<StatusPedido | 'TODOS'>('TODOS')
  const [pedidos, setPedidos] = useState(obterPedidos)

  useEffect(() => {
    const atualizarLista = () => setPedidos(obterPedidos())
    window.addEventListener(PEDIDOS_UPDATED_EVENT, atualizarLista)
    return () => window.removeEventListener(PEDIDOS_UPDATED_EVENT, atualizarLista)
  }, [])

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return pedidos.filter((pedido) => {
      const cliente = clientes.find((item) => item.id === pedido.clienteId)
      const correspondeAoStatus = statusFiltro === 'TODOS' || pedido.status === statusFiltro
      const correspondeABusca = [String(pedido.id), cliente?.nome ?? '', pedido.status]
        .some((campo) => campo.toLowerCase().includes(termo))

      return correspondeAoStatus && correspondeABusca
    })
  }, [busca, clientes, pedidos, statusFiltro])

  const alterarStatus = (id: number, novoStatus: StatusPedido) => {
    setPedidos((pedidosAtuais) => {
      const atualizados = pedidosAtuais.map((pedido) => pedido.id === id && proximosStatus[pedido.status].includes(novoStatus) ? { ...pedido, status: novoStatus } : pedido)
      salvarPedidos(atualizados)
      return atualizados
    })
  }

  return (
    <section className="admin-pedidos">
      <header className="admin-page-header">
        <h1>Pedidos</h1>
        <p>Consulte os pedidos e acompanhe cada etapa da operação.</p>
      </header>

      <div className="admin-list-panel">
        <div className="admin-list-toolbar admin-orders-toolbar">
          <label htmlFor="busca-pedidos">Buscar pedido</label>
          <input
            id="busca-pedidos"
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="ID, cliente ou status"
          />
          <label htmlFor="filtro-status">Filtrar por status</label>
          <select
            id="filtro-status"
            value={statusFiltro}
            onChange={(event) => setStatusFiltro(event.target.value as StatusPedido | 'TODOS')}
          >
            <option value="TODOS">Todos os status</option>
            {statusDisponiveis.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Itens</th>
                <th>Valor</th>
                <th>Status atual</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map((pedido) => {
                const opcoesDeStatus = proximosStatus[pedido.status]
                const cliente = clientes.find((item) => item.id === pedido.clienteId)

                return (
                  <tr key={pedido.id}>
                    <td>#{pedido.id}</td>
                    <td>{cliente?.nome ?? 'Cliente não encontrado'}</td>
                    <td>{pedido.data}</td>
                    <td>{pedido.quantidadeItens}</td>
                    <td>{formatarValor(pedido.valor)}</td>
                    <td><span className="admin-status admin-status-pedido">{pedido.status}</span>{pedido.statusPagamento && <small className="admin-refund-status">Pagamento: Estorno pendente</small>}{pedido.recebimentoConfirmado && <small className="admin-receipt-status">Recebimento confirmado</small>}</td>
                    <td>
                      {pedido.itens && (
                        <details className="admin-order-details">
                          <summary>Ver detalhes</summary>
                          <div><strong>Produtos</strong>{pedido.itens.map((item) => <span key={item.produtoId}>{item.nome} x {item.quantidade} - {formatarValor(item.subtotal)}{item.troca && ` | Troca: ${item.troca.quantidade} un. - ${item.troca.status} - ${item.troca.motivo}`}</span>)}</div>
                          {pedido.enderecoEntrega && <div><strong>Endereco de entrega</strong><span>{pedido.enderecoEntrega.nome}: {pedido.enderecoEntrega.logradouro}, {pedido.enderecoEntrega.numero}, {pedido.enderecoEntrega.cidade} - {pedido.enderecoEntrega.estado}, CEP {pedido.enderecoEntrega.cep}</span></div>}
                          {pedido.pagamentos && <div><strong>Pagamentos</strong>{pedido.pagamentos.map((pagamento) => <span key={pagamento.cartaoId}>{pagamento.bandeira} •••• {pagamento.ultimosQuatroDigitos} - {formatarValor(pagamento.valorPago)}</span>)}</div>}
                          {pedido.recebimentoConfirmado && <span className="admin-order-received">Recebimento confirmado pelo cliente</span>}
                          {pedido.statusPagamento && <span className="admin-order-received">Pagamento: Estorno pendente</span>}
                        </details>
                      )}
                      <select
                        className="admin-status-select"
                        value=""
                        aria-label={`Alterar status do pedido ${pedido.id}`}
                        onChange={(event) => {
                          if (event.target.value) alterarStatus(pedido.id, event.target.value as StatusPedido)
                        }}
                        disabled={opcoesDeStatus.length === 0}
                      >
                        <option value="">{opcoesDeStatus.length ? 'Alterar status' : 'Estado final'}</option>
                        {opcoesDeStatus.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                  </tr>
                )
              })}
              {pedidosFiltrados.length === 0 && (
                <tr><td className="admin-table-empty" colSpan={7}>Nenhum pedido encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}