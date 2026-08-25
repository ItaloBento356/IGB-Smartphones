import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { atualizarPedido, obterClienteAutenticado, obterPedidos, PEDIDOS_UPDATED_EVENT, type ItemPedido, type TrocaPedido } from '../data/adminData'

const formatPrice = (price: number) => price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const exchangeReasons = ['Produto com defeito', 'Produto incorreto', 'Produto danificado', 'Tamanho/modelo incorreto', 'Outro']

interface ExchangeForm {
  orderId: number
  productId: number
  quantity: number
  reason: string
  description: string
}

export default function MyOrdersPage() {
  const navigate = useNavigate()
  const cliente = obterClienteAutenticado()
  const [orders, setOrders] = useState(() => cliente ? obterPedidos().filter((order) => order.clienteId === cliente.id) : [])
  const [feedback, setFeedback] = useState<Record<number, string>>({})
  const [exchangeForm, setExchangeForm] = useState<ExchangeForm | null>(null)

  useEffect(() => {
    if (!cliente) navigate('/login', { replace: true })
    const refreshOrders = () => setOrders(obterPedidos().filter((order) => order.clienteId === cliente?.id))
    window.addEventListener(PEDIDOS_UPDATED_EVENT, refreshOrders)
    return () => window.removeEventListener(PEDIDOS_UPDATED_EVENT, refreshOrders)
  }, [cliente, navigate])

  if (!cliente) return null

  const cancelOrder = (orderId: number) => {
    if (!window.confirm('Deseja cancelar este pedido?')) return
    const order = orders.find((currentOrder) => currentOrder.id === orderId)
    if (!order || !['EM ABERTO', 'EM PROCESSAMENTO', 'PAGAMENTO REALIZADO', 'EM TRÂNSITO'].includes(order.status)) return

    const hasPayment = ['PAGAMENTO REALIZADO', 'EM TRÂNSITO'].includes(order.status) && Boolean(order.pagamentos?.length)
    atualizarPedido(orderId, { status: 'CANCELADO', ...(hasPayment ? { statusPagamento: 'ESTORNO_PENDENTE' as const } : {}) })
    setFeedback((currentFeedback) => ({ ...currentFeedback, [orderId]: hasPayment ? 'Pedido cancelado. O estorno do pagamento está pendente.' : 'Pedido cancelado com sucesso.' }))
  }

  const confirmReceipt = (orderId: number) => {
    const order = orders.find((currentOrder) => currentOrder.id === orderId)
    if (!order || order.status !== 'ENTREGUE' || order.recebimentoConfirmado) return
    atualizarPedido(orderId, { recebimentoConfirmado: true })
  }

    const informDispatch = (orderId: number, productId: number) => {
      const order = orders.find((currentOrder) => currentOrder.id === orderId)
      if (!order) return
      atualizarPedido(orderId, { itens: order.itens?.map((item) => item.produtoId === productId && item.troca?.status === 'TROCA ACEITA' ? { ...item, troca: { ...item.troca, status: 'ITEM ENVIADO' } } : item) })
    }

  const startExchange = (orderId: number, item: ItemPedido) => {
    if (item.troca?.status === 'TROCA ACEITA') {
      informDispatch(orderId, item.produtoId)
      return
    }
    setExchangeForm({ orderId, productId: item.produtoId, quantity: 1, reason: '', description: '' })
  }

  const submitExchange = () => {
    if (!exchangeForm || !exchangeForm.reason || (exchangeForm.reason === 'Outro' && !exchangeForm.description.trim())) return
    const order = orders.find((currentOrder) => currentOrder.id === exchangeForm.orderId)
    const item = order?.itens?.find((currentItem) => currentItem.produtoId === exchangeForm.productId)
    if (!order || order.status !== 'ENTREGUE' || !item || item.troca || exchangeForm.quantity < 1 || exchangeForm.quantity > item.quantidade) return

    const troca: TrocaPedido = {
      status: 'TROCA SOLICITADA',
      quantidade: exchangeForm.quantity,
      motivo: exchangeForm.reason,
      ...(exchangeForm.reason === 'Outro' ? { descricao: exchangeForm.description.trim() } : {}),
    }
    atualizarPedido(exchangeForm.orderId, { itens: order.itens?.map((currentItem) => currentItem.produtoId === item.produtoId ? { ...currentItem, troca } : currentItem) })
    setFeedback((currentFeedback) => ({ ...currentFeedback, [exchangeForm.orderId]: 'Solicitação de troca registrada com sucesso.' }))
    setExchangeForm(null)
  }

  return <div className="site-shell"><Header /><main className="container"><section className="section orders-page"><div className="section-heading"><div><h1>Meus pedidos</h1><p>Consulte os pedidos associados à sua conta.</p></div><Link to="/">Voltar para início</Link></div>{orders.length === 0 ? <div className="cart-empty"><p>Você ainda não possui pedidos.</p><Link className="primary-button" to="/catalogo">Ver catálogo</Link></div> : <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.id}><div className="order-card-header"><strong>Pedido #{order.id}</strong><span className="admin-status admin-status-pedido">{order.status}</span></div><p>{order.data} · {order.quantidadeItens} item(ns)</p><strong>{formatPrice(order.valor)}</strong>{order.statusPagamento && <p className="order-refund">Pagamento: {order.statusPagamento.replace('_', ' ')}</p>}{order.itens && <div className="order-items">{order.itens.map((item) => <div className="order-item" key={item.produtoId}><span>{item.nome} x {item.quantidade} - {formatPrice(item.subtotal)}</span>{item.troca ? <small className="exchange-status">Troca: {item.troca.quantidade} un. - {item.troca.status}</small> : order.status === 'ENTREGUE' && <button className="order-exchange-button" type="button" onClick={() => startExchange(order.id, item)}>Solicitar troca</button>}</div>)}</div>}{order.enderecoEntrega && <details className="order-details"><summary>Ver endereço e pagamento</summary><p>{order.enderecoEntrega.nome}<br />{order.enderecoEntrega.logradouro}, {order.enderecoEntrega.numero}<br />{order.enderecoEntrega.bairro}<br />{order.enderecoEntrega.cidade} - {order.enderecoEntrega.estado}<br />CEP: {order.enderecoEntrega.cep}</p>{order.pagamentos?.map((payment) => <span className="order-payment" key={payment.cartaoId}>{payment.bandeira} •••• {payment.ultimosQuatroDigitos} - {formatPrice(payment.valorPago)}</span>)}</details>}{feedback[order.id] && <p className="order-feedback" role="status">{feedback[order.id]}</p>}{order.status === 'ENTREGUE' && !order.recebimentoConfirmado && <button className="order-action-button" type="button" onClick={() => confirmReceipt(order.id)}>Confirmar recebimento</button>}{order.recebimentoConfirmado && <p className="order-confirmed">Recebimento confirmado</p>}{['EM ABERTO', 'EM PROCESSAMENTO', 'PAGAMENTO REALIZADO', 'EM TRÂNSITO'].includes(order.status) && <button className="order-cancel-button" type="button" onClick={() => cancelOrder(order.id)}>Cancelar pedido</button>}</article>)}</div>}{exchangeForm && <div className="exchange-panel" role="dialog" aria-labelledby="exchange-title"><h2 id="exchange-title">Solicitação de troca</h2><p>Produto: {orders.find((order) => order.id === exchangeForm.orderId)?.itens?.find((item) => item.produtoId === exchangeForm.productId)?.nome}</p><label>Quantidade para troca<select value={exchangeForm.quantity} onChange={(event) => setExchangeForm({ ...exchangeForm, quantity: Number(event.target.value) })}>{Array.from({ length: orders.find((order) => order.id === exchangeForm.orderId)?.itens?.find((item) => item.produtoId === exchangeForm.productId)?.quantidade ?? 1 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><label>Motivo<select value={exchangeForm.reason} onChange={(event) => setExchangeForm({ ...exchangeForm, reason: event.target.value })}><option value="">Selecione o motivo</option>{exchangeReasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select></label>{exchangeForm.reason === 'Outro' && <label>Descrição<textarea value={exchangeForm.description} onChange={(event) => setExchangeForm({ ...exchangeForm, description: event.target.value })} /></label>}<div className="exchange-summary"><strong>Resumo</strong><span>Produto: {orders.find((order) => order.id === exchangeForm.orderId)?.itens?.find((item) => item.produtoId === exchangeForm.productId)?.nome}</span><span>Quantidade: {exchangeForm.quantity}</span><span>Motivo: {exchangeForm.reason || 'Não informado'}</span></div><div className="exchange-actions"><button className="order-cancel-button" type="button" onClick={() => setExchangeForm(null)}>Cancelar</button><button className="order-action-button" type="button" disabled={!exchangeForm.reason || (exchangeForm.reason === 'Outro' && !exchangeForm.description.trim())} onClick={submitExchange}>Solicitar troca</button></div></div>}</section></main></div>
}
