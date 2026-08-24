import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { obterClienteAutenticado, obterPedido } from '../data/adminData'

const formatPrice = (price: number) => price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function OrderConfirmationPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const cliente = obterClienteAutenticado()
  const order = obterPedido(Number(id))

  useEffect(() => {
    if (!cliente) navigate('/login', { replace: true })
  }, [cliente, navigate])

  if (!cliente || !order || order.clienteId !== cliente.id) return null

  return <div className="site-shell"><Header /><main className="container"><section className="section confirmation-page"><h1>Pedido realizado com sucesso!</h1><p>Pedido #{order.id} criado com status {order.status}.</p><div className="confirmation-panel"><strong>Valor total: {formatPrice(order.valor)}</strong>{order.enderecoEntrega && <p><b>Endereço de entrega</b><br />{order.enderecoEntrega.nome}<br />{order.enderecoEntrega.logradouro}, {order.enderecoEntrega.numero}<br />{order.enderecoEntrega.bairro}<br />{order.enderecoEntrega.cidade} - {order.enderecoEntrega.estado}<br />CEP: {order.enderecoEntrega.cep}</p>}{order.pagamentos && <p><b>Forma de pagamento</b><br />{order.pagamentos.map((payment) => <span className="confirmation-payment" key={payment.cartaoId}>{payment.bandeira} •••• {payment.ultimosQuatroDigitos} - {formatPrice(payment.valorPago)}<br /></span>)}</p>}</div><Link className="primary-button" to="/meus-pedidos">Consultar meus pedidos</Link></section></main></div>
}
