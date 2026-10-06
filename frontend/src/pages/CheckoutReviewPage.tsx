import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { listarCartoes, type CartaoCliente } from '../data/clienteApi'
import { getPaymentDraft } from '../data/checkoutDraft'
import { obterClienteAutenticado } from '../data/adminData'
import { useCart } from '../data/cart'
import { useProducts } from '../data/productApi'
import { calcularFretePedido, criarPedido, listarCuponsCliente, type CupomPedido } from '../data/pedidoApi'
import type { PaymentCard } from '../data/cards'

const formatPrice = (price: number) => price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const calcularDescontos = (cupons: CupomPedido[], valor: number) =>
  cupons.reduce<{ total: number; descontos: number[] }>((resultado, cupom) => {
    const valorCupom = cupom.formaDesconto === 'Percentual'
      ? resultado.total * cupom.valor / 100
      : cupom.valor
    const desconto = Math.round((Math.min(resultado.total, valorCupom) + Number.EPSILON) * 100) / 100
    return { total: resultado.total - desconto, descontos: [...resultado.descontos, desconto] }
  }, { total: valor, descontos: [] })

const mapearCartao = (cartao: CartaoCliente, clienteId: number): PaymentCard => ({
  id: cartao.id,
  clienteId,
  nomeImpresso: cartao.nomeImpresso,
  ultimosQuatroDigitos: cartao.ultimos4,
  bandeira: cartao.bandeiraNome,
  validade: '',
})

export default function CheckoutReviewPage() {
  const navigate = useNavigate()
  const { cart } = useCart()
  const { products, loading: carregandoProdutos, error: erroProdutos } = useProducts()
  const cliente = obterClienteAutenticado()
  const clienteId = cliente?.id
  const [draft] = useState(
    () => clienteId ? getPaymentDraft(clienteId) : { selectedCardIds: [], cardAmounts: {} },
  )
  const [cards, setCards] = useState<PaymentCard[]>(draft.unsavedCards ?? [])
  const [coupons, setCoupons] = useState<CupomPedido[]>([])
  const [carregandoDados, setCarregandoDados] = useState(true)
  const [freight, setFreight] = useState<number | undefined>(draft.freight)
  const [erro, setErro] = useState('')
  const [creatingOrder, setCreatingOrder] = useState(false)
  const creationStarted = useRef(false)
  const selectedAddress = draft.checkoutAddress

  useEffect(() => {
    if (!clienteId) {
      navigate('/login', { replace: true })
      return
    }
    if (cart.length === 0) {
      navigate('/carrinho', { replace: true })
      return
    }
    if (!selectedAddress) {
      navigate('/checkout?etapa=endereco', { replace: true })
      return
    }

    let ativo = true
    Promise.all([listarCartoes(clienteId), listarCuponsCliente(clienteId)])
      .then(([cartoes, cuponsDisponiveis]) => {
        if (!ativo) return
        setCards([
          ...cartoes.map((cartao) => mapearCartao(cartao, clienteId)),
          ...(draft.unsavedCards ?? []),
        ])
        setCoupons(cuponsDisponiveis)
        setErro('')
      })
      .catch((error: unknown) => {
        if (ativo) setErro(error instanceof Error ? error.message : 'Não foi possível carregar os dados do pedido.')
      })
      .finally(() => { if (ativo) setCarregandoDados(false) })

    return () => { ativo = false }
  }, [cart.length, clienteId, draft.unsavedCards, navigate, selectedAddress])

  const orderItems = useMemo(() => cart.flatMap((item) => {
    const product = products.find((currentProduct) => currentProduct.id === item.productId)
    return product ? [{ product, quantity: item.quantity }] : []
  }), [cart, products])
  const subtotal = orderItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const validCoupons = (draft.couponCodes ?? (draft.couponCode ? [draft.couponCode] : []))
    .map((code) => coupons.find((coupon) => coupon.codigo.toUpperCase() === code.toUpperCase()))
    .filter((coupon): coupon is CupomPedido => Boolean(coupon))
  const [freightBase, setFreightBase] = useState<number | undefined>()
  const discounts = calcularDescontos(validCoupons, freightBase ?? subtotal)
  const total = discounts.total
  const selectedCards = cards.filter((card) => draft.selectedCardIds.includes(card.id))
  const payments = selectedCards.flatMap((card) => {
    const valor = draft.cardAmounts[card.id] ?? 0
    return valor > 0 ? [{ card, valor }] : []
  })
  const paidTotal = payments.reduce((sum, payment) => sum + payment.valor, 0)
  const smallCouponPayment = validCoupons.length > 0 && total > 0 && total < 10 && payments.length === 1
  const paymentIsValid = total === 0
    ? payments.length === 0
    : payments.length > 0 &&
      (smallCouponPayment || payments.every((payment) => payment.valor >= 10)) &&
      Math.round(paidTotal * 100) === Math.round(total * 100)

  useEffect(() => {
    if (!selectedAddress || carregandoProdutos || orderItems.length !== cart.length) return
    let ativo = true
    calcularFretePedido(
      cart.map((item) => ({ produtoId: item.productId, quantidade: item.quantity })),
      selectedAddress,
    ).then((quote) => {
      if (!ativo) return
      setFreight(quote.valorFrete)
      setFreightBase(subtotal + quote.valorFrete)
      setErro('')
    }).catch((error: unknown) => {
      if (ativo) {
        setFreight(undefined)
        setFreightBase(undefined)
        setErro(error instanceof Error ? error.message : 'Não foi possível calcular o frete.')
      }
    })
    return () => { ativo = false }
  }, [cart, carregandoProdutos, orderItems.length, selectedAddress, subtotal])

  const createOrder = async () => {
    if (!cliente || !selectedAddress || !paymentIsValid || freight === undefined || creationStarted.current) return
    creationStarted.current = true
    setCreatingOrder(true)
    setErro('')

    try {
      const order = await criarPedido({
        clienteId: cliente.id,
        itens: cart.map((item) => ({ produtoId: item.productId, quantidade: item.quantity })),
        enderecoEntrega: selectedAddress,
        pagamentos: payments.map(({ card, valor }) => card.id > 0
          ? { cartaoCreditoId: card.id, valor }
          : { bandeira: card.bandeira, ultimos4: card.ultimosQuatroDigitos, valor }),
        cupons: validCoupons.map((coupon) => coupon.codigo),
      })
      navigate(`/pedido-confirmado/${order.id}`, { state: { clearCartAfterOrder: true } })
    } catch (error) {
      creationStarted.current = false
      setCreatingOrder(false)
      setErro(error instanceof Error ? error.message : 'Não foi possível criar o pedido.')
    }
  }

  if (!cliente || !cart.length) return null
  if (carregandoDados || carregandoProdutos) return <div className="site-shell"><Header /><main className="container"><section className="section"><p role="status">Preparando revisão do pedido...</p></section></main></div>
  if (erroProdutos) return <div className="site-shell"><Header /><main className="container"><section className="section"><p className="account-error" role="alert">{erroProdutos}</p></section></main></div>

  return (
    <div className="site-shell">
      <Header />
      <main className="container">
        <section className="section checkout-page">
          <div className="checkout-steps" aria-label="Etapas do checkout">
            <Link className="checkout-step checkout-step-complete" to="/checkout?etapa=endereco">✓ Endereço</Link>
            <Link className="checkout-step checkout-step-complete" to="/checkout?etapa=pagamento">✓ Pagamento</Link>
            <span className="checkout-step checkout-step-current">• Revisão</span>
          </div>
          <div className="section-heading">
            <div><h1>Revisão</h1><p>Confira os dados antes de confirmar o pedido.</p></div>
            <Link to="/carrinho">Voltar para carrinho</Link>
          </div>
          <div className="review-grid">
            <section className="checkout-section">
              <h2>Produtos</h2>
              {orderItems.map(({ product, quantity }) => (
                <div className="checkout-product review-product" key={product.id}>
                  <span>{product.name} · {quantity} unidade(s)</span>
                  <strong>{formatPrice(product.price * quantity)}</strong>
                </div>
              ))}
              <div className="checkout-product"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <div className="checkout-product"><span>Frete</span><strong>{freight === undefined ? 'Calculando...' : formatPrice(freight)}</strong></div>
              {validCoupons.map((coupon, index) => <p className="checkout-selected" key={coupon.id}>Cupom {coupon.codigo}: - {formatPrice(discounts.descontos[index])}</p>)}
            </section>
            <section className="checkout-section review-block">
              <div className="review-heading"><h2>Endereço de entrega</h2><Link to="/checkout?etapa=endereco">Editar endereço</Link></div>
              <strong>{selectedAddress?.nome}</strong>
              <p>{selectedAddress?.tipoLogradouro} {selectedAddress?.logradouro}, {selectedAddress?.numero}<br />{selectedAddress?.bairro}<br />{selectedAddress?.cidade} - {selectedAddress?.estado}<br />CEP: {selectedAddress?.cep}</p>
            </section>
            <section className="checkout-section review-block">
              <div className="review-heading"><h2>Forma de pagamento</h2><Link to="/checkout?etapa=pagamento">Editar pagamento</Link></div>
              {payments.map(({ card, valor }) => (
                <div className="checkout-product" key={card.id}>
                  <span>{card.bandeira} •••• {card.ultimosQuatroDigitos}</span>
                  <strong>{formatPrice(valor)}</strong>
                </div>
              ))}
              {payments.length === 0 && <p className="checkout-selected">Cupons cobrem o valor total; nenhum pagamento adicional necessário.</p>}
              <p className="checkout-selected">Total pago com cartões: {formatPrice(paidTotal)}</p>
              {!paymentIsValid && <p className="account-error">Verifique a distribuição: mínimo de R$ 10,00 por cartão e soma igual ao total restante.</p>}
            </section>
            <section className="checkout-section review-total">
              <span>Total final</span>
              <strong>{formatPrice(total)}</strong>
              <button className="primary-button" type="button" disabled={creatingOrder || !paymentIsValid || freight === undefined || Boolean(erro)} onClick={createOrder}>
                {creatingOrder ? 'Criando pedido...' : 'Confirmar pedido'}
              </button>
              {erro && <p className="account-error" role="alert">{erro}</p>}
            </section>
          </div>
        </section>
      </main>
    </div>
  )
}
