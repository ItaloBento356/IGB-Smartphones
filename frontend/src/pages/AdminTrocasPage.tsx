import { useEffect, useMemo, useState } from 'react'
import { atualizarPedido, obterClientes, obterPedidos, PEDIDOS_UPDATED_EVENT, type StatusPedido, type TrocaPedido } from '../data/adminData'
import { generateExchangeCoupon } from '../data/coupons'

const proximosStatus: Record<StatusPedido, readonly StatusPedido[]> = {
  'TROCA SOLICITADA': ['TROCA ACEITA', 'TROCA NEGADA'], 'TROCA ACEITA': ['ITEM ENVIADO'], 'ITEM ENVIADO': ['ITEM RECEBIDO'], 'ITEM RECEBIDO': ['TROCA PROCESSADA'],
  'TROCA NEGADA': [], 'TROCA PROCESSADA': [], 'EM ABERTO': [], CANCELADO: [], 'EM PROCESSAMENTO': [], 'PAGAMENTO REALIZADO': [], 'EM TRÂNSITO': [], ENTREGUE: [],
}

export default function AdminTrocasPage() {
  const [pedidos, setPedidos] = useState(obterPedidos)
  const [trocaSelecionada, setTrocaSelecionada] = useState<string | null>(null)
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
  const trocaAtual = trocas.find(({ pedido, item }) => `${pedido.id}-${item.produtoId}` === trocaSelecionada)

  return <section className="admin-trocas"><header className="admin-page-header"><h1>Trocas</h1><p>Acompanhe as solicitações e atualize cada etapa do processo.</p></header><div className="admin-split-panel"><div className="admin-list-panel"><p className="admin-exchange-pending">Aguardando análise: {trocas.filter(({ item }) => item.troca?.status === 'TROCA SOLICITADA').length}</p><div className="admin-table-wrapper"><table className="admin-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Produto</th><th>Status</th><th>Ação</th></tr></thead><tbody>{trocas.map(({ pedido, item }) => { const status = item.troca!.status; const cliente = clientes.find((current) => current.id === pedido.clienteId); const proximos = proximosStatus[status]; const key = `${pedido.id}-${item.produtoId}`; return <tr key={key}><td>#{pedido.id}</td><td>{cliente?.nome ?? 'Cliente não encontrado'}</td><td>{item.nome}</td><td><span className="admin-status admin-status-pedido">{status}</span></td><td><button className="admin-action-button" type="button" onClick={() => setTrocaSelecionada(key)}>Detalhes</button><select className="admin-status-select" value="" disabled={!proximos.length} onChange={(event) => event.target.value && alterarStatus(pedido.id, item.produtoId, event.target.value as StatusPedido)}><option value="">{proximos.length ? 'Próxima ação' : 'Estado final'}</option>{proximos.map((proximo) => <option key={proximo} value={proximo}>{proximo}</option>)}</select></td></tr> })}{trocas.length === 0 && <tr><td className="admin-table-empty" colSpan={5}>Nenhuma solicitação de troca encontrada.</td></tr>}</tbody></table></div></div>{trocaAtual && <aside className="admin-detail-panel" aria-labelledby="troca-detalhes-titulo"><div className="admin-detail-heading"><div><span className="admin-detail-label">Detalhes da troca</span><h2 id="troca-detalhes-titulo">Pedido #{trocaAtual.pedido.id}</h2></div><button className="admin-close-button" type="button" onClick={() => setTrocaSelecionada(null)}>Fechar</button></div><dl className="admin-detail-grid"><div><dt>Cliente</dt><dd>{clientes.find((cliente) => cliente.id === trocaAtual.pedido.clienteId)?.nome ?? 'Cliente não encontrado'}</dd></div><div><dt>Produto</dt><dd>{trocaAtual.item.nome}</dd></div><div><dt>Status</dt><dd>{trocaAtual.item.troca!.status}</dd></div><div><dt>Quantidade</dt><dd>{trocaAtual.item.troca!.quantidade}</dd></div><div><dt>Solicitação</dt><dd>{trocaAtual.item.troca!.dataSolicitacao ?? 'Não informada'}</dd></div></dl><div className="admin-detail-list"><strong>Motivo</strong><span>{trocaAtual.item.troca!.motivo}{trocaAtual.item.troca!.descricao && `: ${trocaAtual.item.troca!.descricao}`}</span></div><div className="admin-detail-list"><strong>Próxima ação</strong><span>{proximosStatus[trocaAtual.item.troca!.status][0] ?? 'Fluxo concluído'}</span></div></aside>}</div></section>
}