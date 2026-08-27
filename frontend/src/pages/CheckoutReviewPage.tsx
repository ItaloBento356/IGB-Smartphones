import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { getAddressesForClient, getSelectedAddressId } from '../data/addresses'
import { getCardsForClient } from '../data/cards'
import { getPaymentDraft } from '../data/checkoutDraft'
import { getCouponsForClient, getCouponDiscount, markCouponUsed } from '../data/coupons'
import { adicionarPedido, obterClienteAutenticado, type EnderecoPedido, type ItemPedido, type PagamentoPedido } from '../data/adminData'
import { clearCart, useCart } from '../data/cart'
import { products } from '../data/products'

const formatPrice = (price: number) => price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CheckoutReviewPage() {
  const navigate = useNavigate()
  const { cart } = useCart()
  const cliente = obterClienteAutenticado()
  const [creatingOrder, setCreatingOrder] = useState(false)
  const creationStarted = useRef(false)
  const addresses = cliente ? getAddressesForClient(cliente.id) : []
  const selectedAddressId = cliente ? getSelectedAddressId(cliente.id) : undefined
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId)
  const cards = cliente ? getCardsForClient(cliente.id) : []
  const draft = cliente ? getPaymentDraft(cliente.id) : { selectedCardIds: [], cardAmounts: {} }
  const selectedCards = cards.filter((card) => draft.selectedCardIds.includes(card.id))
  const clientCoupons = cliente ? getCouponsForClient(cliente.id) : []
  const appliedCoupons = (draft.couponCodes ?? (draft.couponCode ? [draft.couponCode] : [])).map((code) => clientCoupons.find((item) => item.code === code && item.status !== 'UTILIZADO')).filter((item): item is typeof clientCoupons[number] => Boolean(item))

  useEffect(() => {
    if (!cliente) navigate('/login', { replace: true })
    else if (cart.length === 0 && !creatingOrder) navigate('/carrinho', { replace: true })
    else if (!selectedAddress || selectedCards.length === 0) navigate('/checkout?etapa=pagamento', { replace: true })
  }, [cart.length, cliente, creatingOrder, navigate, selectedAddress, selectedCards.length])

  if (!cliente || cart.length === 0 || !selectedAddress || selectedCards.length === 0) return null

  const orderItems: ItemPedido[] = cart.flatMap((item) => {
    const product = products.find((currentProduct) => currentProduct.id === item.productId)
    return product ? [{ produtoId: product.id, nome: product.name, quantidade: item.quantity, precoUnitario: product.price, subtotal: product.price * item.quantity }] : []
  })
  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
  const discounts = appliedCoupons.reduce<{ subtotal: number; values: number[] }>((result, coupon) => { const value = getCouponDiscount(coupon, result.subtotal); return { subtotal: result.subtotal - value, values: [...result.values, value] } }, { subtotal, values: [] })
  const total = discounts.subtotal
  const coupon = appliedCoupons[0]
  const couponDiscount = discounts.values[0] ?? 0
  const payments: PagamentoPedido[] = selectedCards.map((card) => ({ cartaoId: card.id, bandeira: card.bandeira, ultimosQuatroDigitos: card.ultimosQuatroDigitos, valorPago: draft.cardAmounts[card.id] ?? 0 }))
  const paidTotal = payments.reduce((sum, payment) => sum + payment.valorPago, 0)
  const hasInvalidMinimum = selectedCards.length > 1 && payments.some((payment) => payment.valorPago < 10)
  const paymentIsValid = !hasInvalidMinimum && Math.round(paidTotal * 100) === Math.round(total * 100)
  const orderAddress: EnderecoPedido = { ...selectedAddress }

  const createOrder = () => {
    if (creationStarted.current || !paymentIsValid) return
    creationStarted.current = true
    setCreatingOrder(true)
    const orderCreated = adicionarPedido({ clienteId: cliente.id, data: new Date().toLocaleDateString('pt-BR'), valor: total, status: 'EM ABERTO', quantidadeItens: orderItems.reduce((sum, item) => sum + item.quantidade, 0), itens: orderItems, enderecoEntrega: orderAddress, pagamentos: payments })
    for (const appliedCoupon of appliedCoupons) markCouponUsed(cliente.id, appliedCoupon.code)
    localStorage.setItem(`igb-smartphones-ultimo-pedido-${cliente.id}`, String(orderCreated.id))
    clearCart()
    navigate(`/pedido-confirmado/${orderCreated.id}`)
  }

  return <div className="site-shell"><Header /><main className="container"><section className="section checkout-page"><div className="checkout-steps" aria-label="Etapas do checkout"><Link className="checkout-step checkout-step-complete" to="/checkout?etapa=endereco&retorno=revisao">✓ Endereço</Link><Link className="checkout-step checkout-step-complete" to="/checkout?etapa=pagamento&retorno=revisao">✓ Pagamento</Link><span className="checkout-step checkout-step-current">• Revisão</span></div><div className="section-heading"><div><h1>Revisão</h1><p>Confira os dados antes de confirmar o pedido.</p></div><Link to="/carrinho">Voltar para carrinho</Link></div><div className="review-grid"><section className="checkout-section"><h2>Produtos</h2>{orderItems.map((item) => <div className="checkout-product review-product" key={item.produtoId}><span>{item.nome} · {item.quantidade} unidade(s)</span><strong>{formatPrice(item.subtotal)}</strong></div>)}{coupon && <p className="checkout-selected">Cupom {coupon.code}: - {formatPrice(couponDiscount)}</p>}</section><section className="checkout-section review-block"><div className="review-heading"><h2>Endereço de entrega</h2><Link to="/checkout?etapa=endereco&retorno=revisao">Editar endereço</Link></div><strong>{selectedAddress.nome}</strong><p>{selectedAddress.logradouro}, {selectedAddress.numero}<br />{selectedAddress.bairro}<br />{selectedAddress.cidade} - {selectedAddress.estado}</p></section><section className="checkout-section review-block"><div className="review-heading"><h2>Forma de pagamento</h2><Link to="/checkout?etapa=pagamento&retorno=revisao">Editar pagamento</Link></div>{payments.map((payment) => <div className="checkout-product" key={payment.cartaoId}><span>{payment.bandeira} •••• {payment.ultimosQuatroDigitos}</span><strong>{formatPrice(payment.valorPago)}</strong></div>)}<p className="checkout-selected">Total pago com cartoes: {formatPrice(paidTotal)}</p>{hasInvalidMinimum && <p className="account-error">Cada cartao deve ter pelo menos R$ 10,00.</p>}</section><section className="checkout-section review-total"><span>Total final</span><strong>{formatPrice(total)}</strong><button className="primary-button" type="button" disabled={creatingOrder || !paymentIsValid} onClick={createOrder}>{creatingOrder ? 'Criando pedido...' : 'Confirmar pedido'}</button></section></div></section></main></div>
}
