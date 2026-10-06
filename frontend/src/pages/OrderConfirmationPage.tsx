import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { obterClienteAutenticado } from '../data/adminData'
import { clearCart } from '../data/cart'
import { obterPedidoPorId, type PedidoCriado } from '../data/pedidoApi'

const formatPrice = (price: number) => price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function OrderConfirmationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const cliente = obterClienteAutenticado()
  const clienteId = cliente?.id
  const pedidoId = Number(id)
  const identificadorValido = Number.isInteger(pedidoId) && pedidoId > 0
  const [pedido, setPedido] = useState<PedidoCriado | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const cartCleared = useRef(false)
  const clearCartAfterOrder = typeof location.state === 'object' &&
    location.state !== null &&
    'clearCartAfterOrder' in location.state &&
    location.state.clearCartAfterOrder === true

  useEffect(() => {
    if (!clienteId) {
      navigate('/login', { replace: true })
      return
    }
    if (!identificadorValido) return

    let ativo = true
    obterPedidoPorId(pedidoId)
      .then((resultado) => {
        if (!ativo) return
        if (resultado.clienteId !== clienteId) {
          setError('Pedido não encontrado para esta conta.')
          return
        }
        setPedido(resultado)
        if (clearCartAfterOrder && !cartCleared.current) {
          cartCleared.current = true
          clearCart()
          navigate(location.pathname, { replace: true, state: null })
        }
      })
      .catch((erroPedido: unknown) => {
        if (ativo) setError(erroPedido instanceof Error ? erroPedido.message : 'Não foi possível consultar o pedido.')
      })
      .finally(() => { if (ativo) setLoading(false) })
    return () => { ativo = false }
  }, [clienteId, clearCartAfterOrder, identificadorValido, location.pathname, pedidoId, navigate])

  return (
    <div className="site-shell">
      <Header />
      <main className="container">
        <section className="section confirmation-page">
          {loading && <p role="status">Consultando pedido...</p>}
          {!identificadorValido && <p className="account-error" role="alert">Identificador de pedido inválido.</p>}
          {error && <p className="account-error" role="alert">{error}</p>}
          {pedido && (
            <>
              <h1>Pedido realizado com sucesso!</h1>
              <p>Pedido #{pedido.id} criado com status {pedido.status}.</p>
              <div className="confirmation-panel">
                <strong>Subtotal: {formatPrice(pedido.subtotal)}</strong>
                <p>Frete: {formatPrice(pedido.valorFrete)}</p>
                <p>Descontos: {formatPrice(pedido.valorDesconto)}</p>
                <strong>Valor total: {formatPrice(pedido.total)}</strong>
                <h2>Produtos</h2>
                {pedido.itens.map((item) => (
                  <p key={item.produtoId}>{item.nomeProduto} x {item.quantidade} — {formatPrice(item.subtotal)}</p>
                ))}
                <p>
                  <b>Endereço de entrega</b><br />
                  {pedido.enderecoEntrega.nome}<br />
                  {pedido.enderecoEntrega.tipoLogradouro} {pedido.enderecoEntrega.logradouro}, {pedido.enderecoEntrega.numero}<br />
                  {pedido.enderecoEntrega.bairro}<br />
                  {pedido.enderecoEntrega.cidade} - {pedido.enderecoEntrega.estado}<br />
                  CEP: {pedido.enderecoEntrega.cep}
                </p>
                {pedido.pagamentos.length > 0 && (
                  <p>
                    <b>Forma de pagamento</b><br />
                    {pedido.pagamentos.map((pagamento, index) => (
                      <span className="confirmation-payment" key={`${pagamento.ultimos4}-${index}`}>
                        {pagamento.bandeira} •••• {pagamento.ultimos4} - {formatPrice(pagamento.valor)}<br />
                      </span>
                    ))}
                  </p>
                )}
              </div>
              <Link className="primary-button" to="/meus-pedidos">Consultar meus pedidos</Link>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
