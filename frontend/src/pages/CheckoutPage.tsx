import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Header } from '../components/Header'
import {
  adicionarCartao,
  adicionarEnderecoEntrega,
  listarCartoes,
  obterClientePorId,
  type CartaoCliente,
  type EnderecoCliente,
  type EnderecoEntregaCadastro,
} from '../data/clienteApi'
import { getPaymentDraft, savePaymentDraft, type CheckoutAddressDraft } from '../data/checkoutDraft'
import { obterClienteAutenticado } from '../data/adminData'
import { useCart } from '../data/cart'
import { useProducts } from '../data/productApi'
import { calcularFretePedido, listarCuponsCliente, type CupomPedido, type ItemCotacaoPedido } from '../data/pedidoApi'
import type { PaymentCard } from '../data/cards'

const estados = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const bandeiras = [
  { nome: 'Visa', id: 1 },
  { nome: 'Mastercard', id: 2 },
  { nome: 'Elo', id: 3 },
]
const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const parseCardAmount = (value: string): number | null => {
  const normalized = value.trim().replace(',', '.')
  if (!/^\d*(?:\.\d{0,2})?$/.test(normalized) || !/\d/.test(normalized)) return null

  const amount = Number(normalized)
  return Number.isFinite(amount)
    ? Math.round((amount + Number.EPSILON) * 100) / 100
    : null
}

const mapearEndereco = (endereco: EnderecoCliente, clienteId: number): CheckoutAddressDraft => ({
  id: endereco.id,
  clienteId,
  nome: endereco.nome ?? 'Endereço de entrega',
  tipoResidencia: endereco.tipoResidencia,
  tipoLogradouro: endereco.tipoLogradouro,
  logradouro: endereco.logradouro,
  numero: endereco.numero,
  bairro: endereco.bairro,
  cep: endereco.cep,
  cidade: endereco.cidade,
  estado: endereco.estado,
  pais: endereco.pais,
  observacoes: endereco.observacoes ?? '',
})

const mapearCartao = (cartao: CartaoCliente, clienteId: number): PaymentCard => ({
  id: cartao.id,
  clienteId,
  nomeImpresso: cartao.nomeImpresso,
  ultimosQuatroDigitos: cartao.ultimos4,
  bandeira: cartao.bandeiraNome,
  validade: '',
})

const calcularDescontos = (cupons: CupomPedido[], valor: number) =>
  cupons.reduce<{ total: number; descontos: number[] }>((resultado, cupom) => {
    const valorCupom = cupom.formaDesconto === 'Percentual'
      ? resultado.total * cupom.valor / 100
      : cupom.valor
    const desconto = Math.round((Math.min(resultado.total, valorCupom) + Number.EPSILON) * 100) / 100
    return { total: resultado.total - desconto, descontos: [...resultado.descontos, desconto] }
  }, { total: valor, descontos: [] })

export default function CheckoutPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { cart } = useCart()
  const { products, loading: carregandoProdutos, error: erroProdutos } = useProducts()
  const cliente = obterClienteAutenticado()
  const clienteId = cliente?.id
  const etapa = params.get('etapa') === 'pagamento' ? 'pagamento' : 'endereco'
  const initialDraft = useMemo(
    () => clienteId ? getPaymentDraft(clienteId) : { selectedCardIds: [], cardAmounts: {} },
    [clienteId],
  )

  const [carregandoPerfil, setCarregandoPerfil] = useState(true)
  const [erroPerfil, setErroPerfil] = useState('')
  const [addresses, setAddresses] = useState<CheckoutAddressDraft[]>([])
  const [selectedAddress, setSelectedAddress] = useState<CheckoutAddressDraft | undefined>(initialDraft.checkoutAddress)
  const [addressForm, setAddressForm] = useState<EnderecoEntregaCadastro>({
    nome: '',
    tipoResidencia: 'Casa',
    tipoLogradouro: 'Rua',
    logradouro: '',
    numero: '',
    bairro: '',
    cep: '',
    cidade: '',
    estado: '',
    pais: 'Brasil',
    observacoes: '',
  })
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [incorporarEndereco, setIncorporarEndereco] = useState(false)
  const [addressError, setAddressError] = useState('')

  const [profileCards, setProfileCards] = useState<PaymentCard[]>([])
  const [unsavedCards, setUnsavedCards] = useState<PaymentCard[]>(initialDraft.unsavedCards ?? [])
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>(initialDraft.selectedCardIds)
  const [cardAmountInputs, setCardAmountInputs] = useState<Record<number, string>>(
    () => Object.fromEntries(
      Object.entries(initialDraft.cardAmounts).map(([id, amount]) => [id, String(amount)]),
    ),
  )
  const [showCardForm, setShowCardForm] = useState(false)
  const [incorporarCartao, setIncorporarCartao] = useState(false)
  const [cardError, setCardError] = useState('')
  const [cardForm, setCardForm] = useState({ nomeImpresso: '', numero: '', validade: '', cvv: '', bandeira: '' })

  const [coupons, setCoupons] = useState<CupomPedido[]>([])
  const [couponInput, setCouponInput] = useState('')
  const [appliedCouponCodes, setAppliedCouponCodes] = useState<string[]>(() => {
    const codes = initialDraft.couponCodes ?? (initialDraft.couponCode ? [initialDraft.couponCode] : [])
    const couponFromPage = sessionStorage.getItem('igb-smartphones-cupom-selecionado')
    if (couponFromPage && !codes.includes(couponFromPage)) codes.push(couponFromPage)
    sessionStorage.removeItem('igb-smartphones-cupom-selecionado')
    return codes
  })
  const [couponMessage, setCouponMessage] = useState('')

  const [freightQuote, setFreightQuote] = useState<{ key: string; value: number }>()
  const [freightFailure, setFreightFailure] = useState<{ key: string; message: string }>()

  useEffect(() => {
    if (!clienteId) {
      navigate('/login', { state: { from: `/checkout?etapa=${etapa}` }, replace: true })
      return
    }
    if (!cart.length) navigate('/carrinho', { replace: true })
  }, [cart.length, clienteId, etapa, navigate])

  useEffect(() => {
    if (!clienteId) return
    let ativo = true

    Promise.all([
      obterClientePorId(clienteId),
      listarCartoes(clienteId),
      listarCuponsCliente(clienteId),
    ]).then(([perfil, cartoes, cupons]) => {
      if (!ativo) return
      const enderecos = perfil.enderecosEntrega.map((endereco) => mapearEndereco(endereco, clienteId))
      const cartoesPerfil = cartoes.map((cartao) => mapearCartao(cartao, clienteId))
      const enderecoSalvo = initialDraft.checkoutAddress
      const enderecoAtualizado = enderecoSalvo?.id
        ? enderecos.find((endereco) => endereco.id === enderecoSalvo.id) ?? enderecoSalvo
        : enderecoSalvo
      setAddresses(enderecos)
      setProfileCards(cartoesPerfil)
      setCoupons(cupons)
      setSelectedAddress(enderecoAtualizado ?? enderecos[0])
    }).catch((error: unknown) => {
      if (ativo) setErroPerfil(error instanceof Error ? error.message : 'Não foi possível carregar dados do cliente.')
    }).finally(() => {
      if (ativo) setCarregandoPerfil(false)
    })

    return () => { ativo = false }
  }, [clienteId, initialDraft.checkoutAddress])

  const allCards = useMemo(() => [...profileCards, ...unsavedCards], [profileCards, unsavedCards])
  const items = cart.flatMap((item) => {
    const product = products.find((current) => current.id === item.productId)
    return product ? [{ product, quantity: item.quantity }] : []
  })
  const estoqueValido = items.length === cart.length &&
    items.every(({ product, quantity }) => product.stock > 0 && quantity <= product.stock)
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const quoteItems = useMemo<ItemCotacaoPedido[]>(
    () => cart.map((item) => ({ produtoId: item.productId, quantidade: item.quantity })),
    [cart],
  )
  const quoteKey = selectedAddress ? JSON.stringify({ items: quoteItems, address: selectedAddress }) : ''
  const freight = freightQuote?.key === quoteKey ? freightQuote.value : undefined
  const freightError = !estoqueValido && cart.length > 0
    ? 'Um ou mais produtos não estão disponíveis na quantidade solicitada.'
    : freightFailure?.key === quoteKey ? freightFailure.message : ''
  const freightLoading = Boolean(
    quoteKey && !carregandoPerfil && !carregandoProdutos && estoqueValido && freight === undefined && !freightError,
  )
  const appliedCoupons = appliedCouponCodes
    .map((code) => coupons.find((coupon) => coupon.codigo.toUpperCase() === code.toUpperCase()))
    .filter((coupon): coupon is CupomPedido => Boolean(coupon))
  const beforeDiscount = subtotal + (freight ?? 0)
  const discounts = calcularDescontos(appliedCoupons, beforeDiscount)
  const total = discounts.total
  const selectedCards = allCards.filter((card) => selectedCardIds.includes(card.id))
  const payments = selectedCards.map((card) => ({
    card,
    value: parseCardAmount(
      selectedCards.length === 1
        ? String(total)
        : cardAmountInputs[card.id] ?? String(initialDraft.cardAmounts[card.id] ?? 0),
    ),
  }))
  const distributedTotal = payments.reduce((sum, payment) => sum + (payment.value ?? 0), 0)
  const activePayments = payments.filter((payment) => (payment.value ?? 0) > 0)
  const permitsSmallSinglePayment = appliedCoupons.length > 0 && total > 0 && total < 10 && activePayments.length === 1
  const minimumIsValid = total === 0
    ? activePayments.length === 0
    : activePayments.length > 0 &&
      payments.every((payment) => payment.value !== null) &&
      (permitsSmallSinglePayment || activePayments.every((payment) => (payment.value ?? 0) >= 10))
  const cardAmounts = useMemo<Record<number, number>>(() => Object.fromEntries(
    Object.entries(cardAmountInputs).flatMap(([id, value]) => {
      const amount = parseCardAmount(value)
      return amount === null ? [] : [[Number(id), amount]]
    }),
  ), [cardAmountInputs])
  const paymentIsValid = Boolean(
    selectedAddress &&
    freight !== undefined &&
    !freightError &&
    estoqueValido &&
    minimumIsValid &&
    Math.round(distributedTotal * 100) === Math.round(total * 100),
  )
  useEffect(() => {
    if (carregandoPerfil || !clienteId) return
    savePaymentDraft(clienteId, {
      selectedCardIds,
      cardAmounts,
      couponCodes: appliedCouponCodes,
      selectedAddressId: selectedAddress?.id,
      checkoutAddress: selectedAddress,
      unsavedCards,
      freight,
    })
  }, [appliedCouponCodes, cardAmounts, carregandoPerfil, clienteId, freight, selectedAddress, selectedCardIds, unsavedCards])

  useEffect(() => {
    if (!clienteId || carregandoPerfil || !selectedAddress || carregandoProdutos || !cart.length || !estoqueValido) return

    let ativo = true
    calcularFretePedido(quoteItems, selectedAddress)
      .then((quote) => { if (ativo) setFreightQuote({ key: quoteKey, value: quote.valorFrete }) })
      .catch((error: unknown) => {
        if (ativo) {
          setFreightFailure({
            key: quoteKey,
            message: error instanceof Error ? error.message : 'Não foi possível calcular o frete.',
          })
        }
      })

    return () => { ativo = false }
  }, [cart, carregandoPerfil, carregandoProdutos, clienteId, estoqueValido, quoteItems, quoteKey, selectedAddress])

  if (!clienteId || !cart.length) return null

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAddressError('')
    const address = { ...addressForm, cep: addressForm.cep.replace(/\D/g, ''), estado: addressForm.estado.toUpperCase() }

    if (address.cep.length !== 8 || !address.estado || Object.entries(address).some(([field, value]) =>
      field !== 'observacoes' && field !== 'nome' && !value.trim())) {
      setAddressError('Preencha todos os campos obrigatórios e informe um CEP válido com 8 dígitos.')
      return
    }

    try {
      if (incorporarEndereco) {
        const perfilAtualizado = await adicionarEnderecoEntrega(cliente.id, address)
        const savedAddresses = perfilAtualizado.enderecosEntrega.map((item) => mapearEndereco(item, cliente.id))
        const savedAddress = savedAddresses.find((item) =>
          item.nome === address.nome &&
          item.logradouro === address.logradouro &&
          item.numero === address.numero &&
          item.cep === address.cep,
        )
        if (!savedAddress) throw new Error('O endereço foi salvo, mas não foi retornado pelo perfil.')
        setAddresses(savedAddresses)
        setSelectedAddress(savedAddress)
      } else {
        setSelectedAddress({ ...address, id: -Date.now(), clienteId: cliente.id })
      }
      setShowAddressForm(false)
      setAddressForm({
        nome: '',
        tipoResidencia: 'Casa',
        tipoLogradouro: 'Rua',
        logradouro: '',
        numero: '',
        bairro: '',
        cep: '',
        cidade: '',
        estado: '',
        pais: 'Brasil',
        observacoes: '',
      })
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : 'Não foi possível salvar o endereço.')
    }
  }

  const toggleCard = (id: number) => {
    const next = selectedCardIds.includes(id)
      ? selectedCardIds.filter((cardId) => cardId !== id)
      : [...selectedCardIds, id]
    setSelectedCardIds(next)
    if (next.length === 1)
      setCardAmountInputs((amounts) => ({ ...amounts, [next[0]]: String(total) }))
  }

  const saveCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCardError('')
    const cleanNumber = cardForm.numero.replace(/\D/g, '')
    const bandeira = bandeiras.find((item) => item.nome === cardForm.bandeira)

    if (!bandeira || cleanNumber.length < 13 || cleanNumber.length > 16 ||
      !cardForm.nomeImpresso.trim() || !cardForm.validade.trim() ||
      !cardForm.cvv.trim()) {
      setCardError('Preencha os dados do cartão e selecione uma bandeira válida.')
      return
    }

    try {
      let newCard: PaymentCard
      if (incorporarCartao) {
        const saved = await adicionarCartao(cliente.id, {
          numero: cleanNumber,
          nomeImpresso: cardForm.nomeImpresso.trim(),
          bandeiraId: bandeira.id,
          codigoSeguranca: cardForm.cvv,
          preferencial: false,
        })
        newCard = mapearCartao(saved, cliente.id)
        setProfileCards((current) => [...current, newCard])
      } else {
        newCard = {
          id: -Date.now(),
          clienteId: cliente.id,
          nomeImpresso: cardForm.nomeImpresso.trim(),
          ultimosQuatroDigitos: cleanNumber.slice(-4),
          bandeira: bandeira.nome,
          validade: cardForm.validade,
        }
        setUnsavedCards((current) => [...current, newCard])
      }
      setSelectedCardIds((current) => [...current, newCard.id])
      setCardAmountInputs((current) => ({ ...current, [newCard.id]: String(total) }))
      setCardForm({ nomeImpresso: '', numero: '', validade: '', cvv: '', bandeira: '' })
      setShowCardForm(false)
    } catch (error) {
      setCardError(error instanceof Error ? error.message : 'Não foi possível salvar o cartão.')
    }
  }

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase()
    const coupon = coupons.find((item) => item.codigo.toUpperCase() === code)
    if (!code || !coupon) {
      setCouponMessage('Cupom inexistente ou indisponível para esta conta.')
      return
    }
    if (appliedCouponCodes.some((applied) => applied.toUpperCase() === code)) {
      setCouponMessage('Este cupom já foi aplicado.')
      return
    }
    if (coupon.natureza === 'Promocional' &&
      appliedCoupons.some((item) => item.natureza === 'Promocional')) {
      setCouponMessage('Só é permitido um cupom promocional por compra.')
      return
    }
    if (calcularDescontos(appliedCoupons, beforeDiscount).total <= 0) {
      setCouponMessage('Os cupons aplicados já cobrem o total da compra.')
      return
    }
    setAppliedCouponCodes((current) => [...current, coupon.codigo])
    setCouponInput('')
    setCouponMessage('Cupom aplicado com sucesso.')
  }

  const continuarParaPagamento = () => {
    if (!clienteId) return
    const amounts = selectedCards.length === 1
      ? { ...cardAmounts, [selectedCards[0].id]: total }
      : cardAmounts
    savePaymentDraft(clienteId, {
      selectedCardIds,
      cardAmounts: amounts,
      couponCodes: appliedCouponCodes,
      selectedAddressId: selectedAddress?.id,
      checkoutAddress: selectedAddress,
      unsavedCards,
      freight,
    })
    setParams({ etapa: 'pagamento' }, { replace: true })
  }

  const revisarPedido = () => {
    if (!clienteId) return
    const amounts = selectedCards.length === 1
      ? { ...cardAmounts, [selectedCards[0].id]: total }
      : cardAmounts
    savePaymentDraft(clienteId, {
      selectedCardIds,
      cardAmounts: amounts,
      couponCodes: appliedCouponCodes,
      selectedAddressId: selectedAddress?.id,
      checkoutAddress: selectedAddress,
      unsavedCards,
      freight,
    })
    navigate('/checkout/revisao')
  }

  const renderStepIndicator = () => (
    <div className="checkout-steps" aria-label="Etapas do checkout">
      {etapa === 'pagamento'
        ? <Link className="checkout-step checkout-step-complete" to="/checkout?etapa=endereco">✓ Endereço</Link>
        : <span className="checkout-step checkout-step-current">• Endereço</span>}
      <span className={`checkout-step ${etapa === 'pagamento' ? 'checkout-step-current' : ''} ${selectedCards.length ? 'checkout-step-complete' : ''}`}>
        {selectedCards.length ? '✓' : '•'} Pagamento
      </span>
      <span className={`checkout-step ${etapa === 'pagamento' ? 'checkout-step-current' : ''}`}>
        {etapa === 'pagamento' ? '•' : '○'} Revisão
      </span>
    </div>
  )

  const summary = (
    <aside className="checkout-section checkout-summary">
      <h2>Resumo do pedido</h2>
      {items.map(({ product, quantity }) => (
        <div className="checkout-product" key={product.id}>
          <span>{product.name} x {quantity}</span>
          <strong>{formatPrice(product.price * quantity)}</strong>
        </div>
      ))}
      <div className="checkout-product"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
      <div className="checkout-product">
        <span>Frete</span>
        <strong>{freightLoading ? 'Calculando...' : freight === undefined ? '—' : formatPrice(freight)}</strong>
      </div>
      {appliedCoupons.map((coupon, index) => (
        <div className="checkout-product" key={coupon.codigo}>
          <span>{coupon.codigo}</span>
          <strong>- {formatPrice(discounts.descontos[index])}</strong>
        </div>
      ))}
      <div className="cart-total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
      {freightError && <p className="account-error" role="alert">{freightError}</p>}
    </aside>
  )

  if (carregandoPerfil || carregandoProdutos) {
    return <div className="site-shell"><Header /><main className="container"><section className="section"><p role="status">Carregando dados do checkout...</p></section></main></div>
  }

  if (erroPerfil || erroProdutos) {
    return <div className="site-shell"><Header /><main className="container"><section className="section"><p className="account-error" role="alert">{erroPerfil || erroProdutos}</p></section></main></div>
  }

  return (
    <div className="site-shell">
      <Header />
      <main className="container">
        <section className="section checkout-page">
          {renderStepIndicator()}
          <div className="section-heading">
            <div>
              <h1>Checkout</h1>
              <p>{etapa === 'endereco' ? 'Escolha o endereço e calcule o frete.' : 'Selecione cartões e aplique cupons.'}</p>
            </div>
            <Link to="/carrinho">Voltar para carrinho</Link>
          </div>

          {etapa === 'endereco' ? (
            <section className="checkout-section checkout-single-section">
              <h2>Endereço de entrega</h2>
              {addresses.map((address) => (
                <button
                  className={`address-option ${address.id === selectedAddress?.id ? 'address-option-selected' : ''}`}
                  key={address.id}
                  type="button"
                  onClick={() => setSelectedAddress(address)}
                >
                  <strong>{address.nome}</strong>
                  <span>{address.tipoLogradouro} {address.logradouro}, {address.numero}</span>
                  <span>{address.bairro} - {address.cidade}/{address.estado}</span>
                </button>
              ))}
              {addresses.length === 0 && <p className="checkout-muted">Nenhum endereço de perfil cadastrado.</p>}
              {selectedAddress && !selectedAddress.id ? (
                <p className="checkout-selected">Endereço temporário selecionado para este pedido.</p>
              ) : null}
              <button className="secondary-button" type="button" onClick={() => setShowAddressForm((current) => !current)}>
                {showAddressForm ? 'Cancelar' : 'Cadastrar endereço'}
              </button>
              {showAddressForm && (
                <form className="address-form" onSubmit={saveAddress}>
                  <label>Identificação<input value={addressForm.nome} onChange={(event) => setAddressForm({ ...addressForm, nome: event.target.value })} /></label>
                  <label>Tipo de residência<select value={addressForm.tipoResidencia} onChange={(event) => setAddressForm({ ...addressForm, tipoResidencia: event.target.value })}><option>Casa</option><option>Apartamento</option></select></label>
                  <label>Tipo de logradouro<select value={addressForm.tipoLogradouro} onChange={(event) => setAddressForm({ ...addressForm, tipoLogradouro: event.target.value })}><option>Rua</option><option>Avenida</option><option>Alameda</option><option>Praça</option></select></label>
                  <label>Logradouro<input required value={addressForm.logradouro} onChange={(event) => setAddressForm({ ...addressForm, logradouro: event.target.value })} /></label>
                  <label>Número<input required value={addressForm.numero} onChange={(event) => setAddressForm({ ...addressForm, numero: event.target.value })} /></label>
                  <label>Bairro<input required value={addressForm.bairro} onChange={(event) => setAddressForm({ ...addressForm, bairro: event.target.value })} /></label>
                  <label>CEP<input required inputMode="numeric" minLength={8} maxLength={8} value={addressForm.cep} onChange={(event) => setAddressForm({ ...addressForm, cep: event.target.value.replace(/\D/g, '').slice(0, 8) })} /></label>
                  <label>Cidade<input required value={addressForm.cidade} onChange={(event) => setAddressForm({ ...addressForm, cidade: event.target.value })} /></label>
                  <label>Estado<select required value={addressForm.estado} onChange={(event) => setAddressForm({ ...addressForm, estado: event.target.value })}><option value="">Selecione</option>{estados.map((estado) => <option key={estado}>{estado}</option>)}</select></label>
                  <label>País<input required value={addressForm.pais} onChange={(event) => setAddressForm({ ...addressForm, pais: event.target.value })} /></label>
                  <label>Observações<input value={addressForm.observacoes} onChange={(event) => setAddressForm({ ...addressForm, observacoes: event.target.value })} /></label>
                  <label className="checkout-consent"><input type="checkbox" checked={incorporarEndereco} onChange={(event) => setIncorporarEndereco(event.target.checked)} /> Salvar este endereço no meu perfil</label>
                  <button className="primary-button" type="submit">Salvar endereço</button>
                </form>
              )}
              {addressError && <p className="account-error" role="alert">{addressError}</p>}
              {selectedAddress && <p className="checkout-selected">Endereço selecionado para entrega.</p>}
              <div className="checkout-actions">
                <button className="primary-button checkout-next-button" type="button" disabled={!selectedAddress || freightLoading || freight === undefined || Boolean(freightError) || !estoqueValido} onClick={continuarParaPagamento}>
                  Continuar para pagamento
                </button>
                {!selectedAddress && <p className="account-error">Selecione ou cadastre um endereço de entrega.</p>}
              </div>
              {summary}
            </section>
          ) : (
            <div className="checkout-grid">
              <section className="checkout-section">
                <h2>Pagamento</h2>
                {allCards.map((card) => (
                  <button className={`card-option ${selectedCardIds.includes(card.id) ? 'card-option-selected' : ''}`} key={card.id} type="button" onClick={() => toggleCard(card.id)}>
                    <strong>{card.bandeira}</strong><span>•••• {card.ultimosQuatroDigitos}</span>
                    {unsavedCards.some((unsaved) => unsaved.id === card.id) && <small>Somente nesta compra</small>}
                  </button>
                ))}
                {allCards.length === 0 && total > 0 && <p className="checkout-muted">Nenhum cartão cadastrado. Adicione uma forma de pagamento.</p>}
                <button className="secondary-button" type="button" onClick={() => setShowCardForm((current) => !current)}>
                  {showCardForm ? 'Cancelar' : 'Adicionar cartão'}
                </button>
                {showCardForm && (
                  <form className="card-form" onSubmit={saveCard}>
                    <label>Nome impresso<input required value={cardForm.nomeImpresso} onChange={(event) => setCardForm({ ...cardForm, nomeImpresso: event.target.value })} /></label>
                    <label>Número do cartão<input required inputMode="numeric" maxLength={16} value={cardForm.numero} onChange={(event) => setCardForm({ ...cardForm, numero: event.target.value.replace(/\D/g, '').slice(0, 16) })} /></label>
                    <label>Validade<input required placeholder="MM/AA" value={cardForm.validade} onChange={(event) => setCardForm({ ...cardForm, validade: event.target.value })} /></label>
                    <label>Código de segurança<input required inputMode="numeric" maxLength={4} value={cardForm.cvv} onChange={(event) => setCardForm({ ...cardForm, cvv: event.target.value.replace(/\D/g, '').slice(0, 4) })} /></label>
                    <label>Bandeira<select required value={cardForm.bandeira} onChange={(event) => setCardForm({ ...cardForm, bandeira: event.target.value })}><option value="">Selecione</option>{bandeiras.map((bandeira) => <option key={bandeira.id}>{bandeira.nome}</option>)}</select></label>
                    <label className="checkout-consent"><input type="checkbox" checked={incorporarCartao} onChange={(event) => setIncorporarCartao(event.target.checked)} /> Salvar este cartão no meu perfil</label>
                    <button className="primary-button" type="submit">Salvar cartão</button>
                  </form>
                )}
                {cardError && <p className="account-error" role="alert">{cardError}</p>}
                {selectedCards.length > 0 && (
                  <div className="card-amounts">
                    <h3>Distribuição do pagamento</h3>
                    <p>Distribua o valor restante de {formatPrice(total)} entre os cartões.</p>
                    {selectedCards.map((card) => (
                      <label key={card.id}>
                        {card.bandeira} •••• {card.ultimosQuatroDigitos}
                        <input
                          inputMode="decimal"
                          type="text"
                          disabled={selectedCards.length === 1}
                          value={selectedCards.length === 1 ? total : cardAmountInputs[card.id] ?? String(initialDraft.cardAmounts[card.id] ?? 0)}
                          onChange={(event) => setCardAmountInputs((current) => ({ ...current, [card.id]: event.target.value }))}
                        />
                      </label>
                    ))}
                    {activePayments.length > 0 && !minimumIsValid && <p className="account-error">Cada cartão utilizado deve pagar pelo menos R$ 10,00.</p>}
                    <p className="checkout-muted">Falta: {formatPrice(Math.max(0, total - distributedTotal))}</p>
                  </div>
                )}
                {(total > 0 || appliedCoupons.length > 0) && (
                  <div className="coupon-box">
                  {total > 0 && (
                    <>
                      <label>Cupom promocional ou de troca<input value={couponInput} placeholder="Digite seu cupom..." onChange={(event) => setCouponInput(event.target.value.toUpperCase())} /></label>
                      <button className="secondary-button" type="button" onClick={applyCoupon}>Aplicar</button>
                    </>
                  )}
                  {couponMessage && <p className="checkout-selected" role="status">{couponMessage}</p>}
                    {appliedCoupons.map((coupon, index) => (
                      <div key={coupon.id} className="checkout-coupon-item">
                        <strong>{coupon.codigo}</strong>
                        <small>{coupon.natureza === 'Troca' ? 'Cupom de troca' : 'Cupom promocional'}</small>
                        <span>{formatPrice(discounts.descontos[index])} de desconto</span>
                      </div>
                    ))}
                  </div>
                )}
                {summary}
                <div className="checkout-actions">
                  {total === 0 && <p className="checkout-selected">Os cupons cobrem o valor total. Nenhum cartão adicional é necessário.</p>}
                  {!minimumIsValid && total > 0 && <p className="account-error">Selecione cartões e distribua o valor exato restante.</p>}
                  <button className="primary-button checkout-next-button" type="button" disabled={!paymentIsValid} onClick={revisarPedido}>
                    Revisar pedido
                  </button>
                </div>
              </section>
              {summary}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
