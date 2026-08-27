import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { addAddress, getAddressesForClient, getSelectedAddressId, selectAddress, type Address } from '../data/addresses'
import { addCard, getCardsForClient, type PaymentCard } from '../data/cards'
import { getCouponForClient, getCouponsForClient, getCouponDiscount } from '../data/coupons'
import { getPaymentDraft, savePaymentDraft } from '../data/checkoutDraft'
import { obterClienteAutenticado } from '../data/adminData'
import { useCart } from '../data/cart'
import { products } from '../data/products'

const estados = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const bandeiras = ['Visa', 'Mastercard', 'Elo', 'American Express']
const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CheckoutPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { cart } = useCart()
  const cliente = obterClienteAutenticado()
  const etapa = params.get('etapa') === 'pagamento' ? 'pagamento' : 'endereco'

  const [addresses, setAddresses] = useState<Address[]>(() => (cliente ? getAddressesForClient(cliente.id) : []))
  const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>(() => (cliente ? getSelectedAddressId(cliente.id) : undefined))
  const [addressForm, setAddressForm] = useState({ nome: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' })
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressError, setAddressError] = useState('')

  const [cards, setCards] = useState<PaymentCard[]>(() => (cliente ? getCardsForClient(cliente.id) : []))
  const initialDraft = cliente ? getPaymentDraft(cliente.id) : { selectedCardIds: [], cardAmounts: {} }
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>(initialDraft.selectedCardIds)
  const [cardAmounts, setCardAmounts] = useState<Record<number, number>>(initialDraft.cardAmounts)
  const [showCardForm, setShowCardForm] = useState(false)
  const [cardError, setCardError] = useState('')
  const [cardForm, setCardForm] = useState({ nomeImpresso: '', numero: '', validade: '', cvv: '', bandeira: '' })

  const [couponInput, setCouponInput] = useState('')
  const [appliedCouponCodes, setAppliedCouponCodes] = useState<string[]>(() => initialDraft.couponCodes ?? (initialDraft.couponCode ? [initialDraft.couponCode] : []))
  const [couponMessage, setCouponMessage] = useState('')

  useEffect(() => {
    if (cliente) savePaymentDraft(cliente.id, { selectedCardIds, cardAmounts, couponCodes: appliedCouponCodes })
  }, [appliedCouponCodes, cardAmounts, cliente, selectedCardIds])

  useEffect(() => {
    if (!cliente) {
      navigate('/login', { state: { from: `/checkout?etapa=${etapa}` }, replace: true })
      return
    }

    if (!cart.length) navigate('/carrinho', { replace: true })
  }, [cart.length, cliente, etapa, navigate])

  if (!cliente || !cart.length) return null

  const items = cart.flatMap((item) => {
    const product = products.find((current) => current.id === item.productId)
    return product ? [{ product, quantity: item.quantity }] : []
  })

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const clientCoupons = getCouponsForClient(cliente.id)
  const appliedCoupons = appliedCouponCodes
    .map((code) => clientCoupons.find((coupon) => coupon.code === code && coupon.status !== 'UTILIZADO'))
    .filter((coupon): coupon is (typeof clientCoupons)[number] => Boolean(coupon))

  const discounts = appliedCoupons.reduce<{ subtotal: number; values: number[] }>((result, coupon) => {
    const value = getCouponDiscount(coupon, result.subtotal)
    return { subtotal: result.subtotal - value, values: [...result.values, value] }
  }, { subtotal, values: [] })

  const total = discounts.subtotal
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId)
  const selectedCards = cards.filter((card) => selectedCardIds.includes(card.id))
  const distributedTotal = selectedCards.reduce((sum, card) => sum + (cardAmounts[card.id] ?? 0), 0)
  const invalidMinimum = selectedCards.length > 1 && selectedCards.some((card) => (cardAmounts[card.id] ?? 0) < 10)
  const paymentIsValid = Boolean(selectedAddress && selectedCards.length && !invalidMinimum && Math.round(distributedTotal * 100) === Math.round(total * 100))

  const saveAddress = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if ([addressForm.cep, addressForm.logradouro, addressForm.numero, addressForm.bairro, addressForm.cidade, addressForm.estado].some((value) => !value.trim())) {
      setAddressError('Preencha todos os campos obrigatórios do endereço.')
      return
    }

    const newAddress = addAddress({
      ...addressForm,
      clienteId: cliente.id,
      nome: addressForm.nome.trim() || 'Endereço principal',
    })

    setAddresses((current) => [...current, newAddress])
    selectAddress(cliente.id, newAddress.id)
    setSelectedAddressId(newAddress.id)
    setShowAddressForm(false)
    setAddressError('')
  }

  const toggleCard = (id: number) => {
    setSelectedCardIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]

      setCardAmounts((amounts) => {
        const updated = { ...amounts }
        if (next.length === 1) {
          updated[next[0]] = total
        }

        return updated
      })

      return next
    })
  }

  const saveCard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanNumber = cardForm.numero.replace(/\D/g, '')

    if (Object.values(cardForm).some((value) => !value.trim()) || cleanNumber.length < 4) {
      setCardError('Preencha corretamente os dados do cartão.')
      return
    }

    const newCard = addCard({
      clienteId: cliente.id,
      nomeImpresso: cardForm.nomeImpresso,
      ultimosQuatroDigitos: cleanNumber.slice(-4),
      bandeira: cardForm.bandeira,
      validade: cardForm.validade,
    })

    setCards((current) => [...current, newCard])
    setCardForm({ nomeImpresso: '', numero: '', validade: '', cvv: '', bandeira: '' })
    setShowCardForm(false)
    setCardError('')
  }

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase()

    if (!code) {
      setCouponMessage('Digite um código de cupom antes de aplicar.')
      return
    }

    const coupon = getCouponForClient(cliente.id, code)
    if (!coupon) {
      setCouponMessage('Cupom inexistente ou não disponível para esta conta.')
      return
    }

    if (coupon.status === 'UTILIZADO') {
      setCouponMessage('Este cupom já foi utilizado.')
      return
    }

    if (appliedCouponCodes.includes(code)) {
      setCouponMessage('Este cupom já foi aplicado.')
      return
    }

    setAppliedCouponCodes((current) => [...current, code])
    setCouponInput('')
    setCouponMessage('Cupom aplicado com sucesso.')
  }

  const renderStepIndicator = () => (
    <div className="checkout-steps" aria-label="Etapas do checkout">
      {etapa === 'pagamento' ? (
        <Link className="checkout-step checkout-step-complete" to="/checkout?etapa=endereco">✓ Endereço</Link>
      ) : (
        <span className="checkout-step checkout-step-current">• Endereço</span>
      )}
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

      {appliedCoupons.map((coupon, index) => (
        <div className="checkout-product" key={coupon.code}>
          <span>{coupon.code}</span>
          <strong>- {formatPrice(discounts.values[index])}</strong>
        </div>
      ))}

      {appliedCoupons.length > 0 && (
        <div className="checkout-product">
          <span>Total de descontos</span>
          <strong>- {formatPrice(subtotal - total)}</strong>
        </div>
      )}

      <div className="cart-total">
        <span>Total</span>
        <strong>{formatPrice(total)}</strong>
      </div>
    </aside>
  )

  return (
    <div className="site-shell">
      <Header />

      <main className="container">
        <section className="section checkout-page">
          {renderStepIndicator()}

          <div className="section-heading">
            <div>
              <h1>Checkout</h1>
              <p>{etapa === 'endereco' ? 'Escolha o endereço para esta entrega.' : 'Selecione e distribua o pagamento.'}</p>
            </div>
            <Link to="/carrinho">Voltar para carrinho</Link>
          </div>

          {etapa === 'endereco' ? (
            <section className="checkout-section checkout-single-section">
              <h2>Endereço de entrega</h2>

              {!addresses.length && <p className="checkout-muted">Nenhum endereço cadastrado. Cadastre um endereço para continuar.</p>}
              {addresses.length > 0 && !selectedAddress && <p className="account-error">Selecione um endereço de entrega para continuar.</p>}

              {addresses.map((address) => (
                <button
                  className={`address-option ${address.id === selectedAddressId ? 'address-option-selected' : ''}`}
                  key={address.id}
                  type="button"
                  onClick={() => {
                    selectAddress(cliente.id, address.id)
                    setSelectedAddressId(address.id)
                  }}
                >
                  <strong>{address.nome}</strong>
                  <span>{address.logradouro}, {address.numero}{address.complemento ? `, ${address.complemento}` : ''}</span>
                  <span>{address.bairro} - {address.cidade}/{address.estado}</span>
                </button>
              ))}

              <button className="secondary-button" type="button" onClick={() => setShowAddressForm((current) => !current)}>
                {showAddressForm ? 'Cancelar' : 'Cadastrar endereço'}
              </button>

              {showAddressForm && (
                <form className="address-form" onSubmit={saveAddress}>
                  <label>
                    Identificação
                    <input value={addressForm.nome} onChange={(event) => setAddressForm({ ...addressForm, nome: event.target.value })} />
                  </label>

                  {(['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade'] as const).map((field) => (
                    <label key={field}>
                      {field[0].toUpperCase() + field.slice(1)}
                      <input
                        value={addressForm[field]}
                        required={field !== 'complemento'}
                        onChange={(event) => setAddressForm({ ...addressForm, [field]: event.target.value })}
                      />
                    </label>
                  ))}

                  <label>
                    Estado
                    <select value={addressForm.estado} required onChange={(event) => setAddressForm({ ...addressForm, estado: event.target.value })}>
                      <option value="">Selecione</option>
                      {estados.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                    </select>
                  </label>

                  <button className="primary-button" type="submit">Salvar endereço</button>
                </form>
              )}

              {addressError && <p className="account-error">{addressError}</p>}
              {selectedAddress && <p className="checkout-selected">Endereço selecionado para entrega.</p>}

              <div className="checkout-actions">
                <button
                  className="primary-button checkout-next-button"
                  type="button"
                  disabled={!selectedAddress}
                  onClick={() => setParams({ etapa: 'pagamento' }, { replace: true })}
                >
                  Continuar para pagamento
                </button>

                {!selectedAddress && <p className="account-error">Cadastre um endereço de entrega para continuar.</p>}
              </div>
            </section>
          ) : (
            <div className="checkout-grid">
              <section className="checkout-section">
                <h2>Pagamento</h2>

                {!cards.length && <p className="checkout-muted">Nenhum cartão cadastrado. Adicione uma forma de pagamento para continuar.</p>}

                {cards.map((card) => (
                  <button
                    className={`card-option ${selectedCardIds.includes(card.id) ? 'card-option-selected' : ''}`}
                    key={card.id}
                    type="button"
                    onClick={() => toggleCard(card.id)}
                  >
                    <strong>{card.bandeira}</strong>
                    <span>•••• {card.ultimosQuatroDigitos}</span>
                  </button>
                ))}

                <button className="secondary-button" type="button" onClick={() => setShowCardForm((current) => !current)}>
                  {showCardForm ? 'Cancelar' : 'Adicionar cartão'}
                </button>

                {showCardForm && (
                  <form className="card-form" onSubmit={saveCard}>
                    <label>
                      Nome impresso
                      <input value={cardForm.nomeImpresso} onChange={(event) => setCardForm({ ...cardForm, nomeImpresso: event.target.value })} />
                    </label>

                    <label>
                      Número do cartão
                      <input
                        value={cardForm.numero}
                        inputMode="numeric"
                        maxLength={19}
                        onChange={(event) => setCardForm({ ...cardForm, numero: event.target.value.replace(/\D/g, '').slice(0, 16) })}
                      />
                    </label>

                    <label>
                      Validade
                      <input value={cardForm.validade} placeholder="MM/AA" onChange={(event) => setCardForm({ ...cardForm, validade: event.target.value })} />
                    </label>

                    <label>
                      Bandeira
                      <select value={cardForm.bandeira} onChange={(event) => setCardForm({ ...cardForm, bandeira: event.target.value })}>
                        <option value="">Selecione</option>
                        {bandeiras.map((bandeira) => <option key={bandeira} value={bandeira}>{bandeira}</option>)}
                      </select>
                    </label>

                    <button className="primary-button" type="submit">Salvar cartão</button>
                  </form>
                )}

                {cardError && <p className="account-error">{cardError}</p>}

                {selectedCards.length > 0 && (
                  <div className="card-amounts">
                    <h3>Distribuição do pagamento</h3>
                    <p>Distribua o valor total entre os cartões selecionados.</p>

                    {selectedCards.map((card) => (
                      <label key={card.id}>
                        {card.bandeira} •••• {card.ultimosQuatroDigitos}
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={cardAmounts[card.id] ?? 0}
                          onChange={(event) => setCardAmounts((current) => ({ ...current, [card.id]: Number(event.target.value) || 0 }))}
                        />
                      </label>
                    ))}

                    {invalidMinimum && <p className="account-error">Cada cartão deve ter pelo menos R$ 10,00.</p>}
                    <p className="checkout-muted">Falta: {formatPrice(Math.max(0, total - distributedTotal))}</p>
                  </div>
                )}

                {selectedCards.length > 0 && (
                  <div className="coupon-box">
                    <label>
                      Cupom promocional
                      <input
                        value={couponInput}
                        placeholder="Digite seu cupom..."
                        onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                      />
                    </label>

                    <button className="secondary-button" type="button" onClick={applyCoupon}>Aplicar</button>

                    {couponMessage && <p className="checkout-selected">{couponMessage}</p>}

                    {appliedCoupons.length > 0 && (
                      <div className="checkout-coupons-list">
                        {appliedCoupons.map((coupon) => (
                          <div key={coupon.code} className="checkout-coupon-item">
                            <strong>{coupon.code}</strong>
                            <small>{coupon.description}</small>
                            <span>{formatPrice(getCouponDiscount(coupon, subtotal))} de desconto</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="checkout-actions">
                  <button
                    className="primary-button checkout-next-button"
                    type="button"
                    disabled={!paymentIsValid}
                    onClick={() => navigate('/checkout/revisao')}
                  >
                    Revisar pedido
                  </button>

                  {!selectedCards.length && <p className="account-error">Selecione ao menos um cartão para continuar.</p>}
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
