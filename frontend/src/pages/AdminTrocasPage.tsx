import { useEffect, useMemo, useState } from 'react'
import { atualizarPedido, obterClientes, obterPedidos, PEDIDOS_UPDATED_EVENT, type StatusPedido, type TrocaPedido } from '../data/adminData'
import { generateExchangeCoupon } from '../data/coupons'

const proximosStatus: Record<StatusPedido, readonly StatusPedido[]> = {
  'TROCA SOLICITADA': ['TROCA ACEITA', 'TROCA NEGADA'], 'TROCA ACEITA': ['ITEM ENVIADO'], 'ITEM ENVIADO': ['ITEM RECEBIDO'], 'ITEM RECEBIDO': ['TROCA PROCESSADA'],
  'TROCA NEGADA': [], 'TROCA PROCESSADA': [], 'EM ABERTO': [], CANCELADO: [], 'EM PROCESSAMENTO': [], 'PAGAMENTO REALIZADO': [], 'EM TRÂNSITO': [], ENTREGUE: [],
}

export default function AdminTrocasPage() {
  const [pedidos, setPedidos] = useState(obterPedidos)
  const clientes = obterClientes()
  useEffect(() => { const atualizar = () => setPedidos(obterPedidos()); window.addEventListener(PEDIDOS_UPDATED_EVENT, atualizar); return () => window.removeEventListener(PEDIDOS_UPDATED_EVENT, atualizar) }, [])
  const trocas = useMemo(() => pedidos.flatMap((pedido) => (pedido.itens ?? []).flatMap((item) => item.troca ? [{ pedido, item }] : [])), [pedidos])
  const alterarStatus = (pedidoId: number, produtoId: number, status: StatusPedido) => {
    const pedido = pedidos.find((item) => item.id === pedidoId)
    if (!pedido) return
    const trocaStatus = status as TrocaPedido['status']
    atualizarPedido(pedidoId, { itens: pedido.itens?.map((item) => item.produtoId === produtoId && item.troca && proximosStatus[item.troca.status].includes(trocaStatus) ? { ...item, troca: { ...item.troca, status: trocaStatus } } : item) })
    if (trocaStatus === 'ITEM RECEBIDO') {
      const item = pedido.itens?.find((current) => current.produtoId === produtoId)
      if (item) generateExchangeCoupon(pedido.clienteId, pedido.id, item.subtotal)
    }
  }
  return <section className="admin-trocas"><header className="admin-page-header"><h1>Trocas</h1><p>Acompanhe as solicitações e atualize cada etapa do processo.</p></header><div className="admin-list-panel"><p className="admin-exchange-pending">Aguardando análise: {trocas.filter(({ item }) => item.troca?.status === 'TROCA SOLICITADA').length}</p><div className="admin-table-wrapper"><table className="admin-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Produto</th><th>Data da solicitação</th><th>Quantidade</th><th>Motivo</th><th>Status</th><th>Ação</th></tr></thead><tbody>{trocas.map(({ pedido, item }) => { const status = item.troca!.status; const cliente = clientes.find((current) => current.id === pedido.clienteId); const proximos = proximosStatus[status]; return <tr key={`${pedido.id}-${item.produtoId}`}><td>#{pedido.id}</td><td>{cliente?.nome ?? 'Cliente não encontrado'}</td><td>{item.nome}</td><td>{item.troca!.dataSolicitacao ?? 'Não informada'}</td><td>{item.troca!.quantidade}</td><td>{item.troca!.motivo}{item.troca!.descricao && `: ${item.troca!.descricao}`}</td><td><span className="admin-status admin-status-pedido">{status}</span></td><td><select className="admin-status-select" value="" disabled={!proximos.length} onChange={(event) => event.target.value && alterarStatus(pedido.id, item.produtoId, event.target.value as StatusPedido)}><option value="">{proximos.length ? 'Aprovar/recusar' : 'Estado final'}</option>{proximos.map((proximo) => <option key={proximo} value={proximo}>{proximo}</option>)}</select></td></tr> })}{trocas.length === 0 && <tr><td className="admin-table-empty" colSpan={8}>Nenhuma solicitação de troca encontrada.</td></tr>}</tbody></table></div></div></section>
}