import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { addAddress, getAddressesForClient, getSelectedAddressId, selectAddress, type Address } from '../data/addresses'
import { addCard, getCardsForClient, type PaymentCard } from '../data/cards'
import { getPaymentDraft, savePaymentDraft } from '../data/checkoutDraft'
import { obterClienteAutenticado } from '../data/adminData'
import { useCart } from '../data/cart'
import { products } from '../data/products'

const estadosBrasileiros = [['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapa'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceara'], ['DF', 'Distrito Federal'], ['ES', 'Espirito Santo'], ['GO', 'Goias'], ['MA', 'Maranhao'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'], ['PA', 'Para'], ['PB', 'Paraiba'], ['PR', 'Parana'], ['PE', 'Pernambuco'], ['PI', 'Piaui'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'], ['RS', 'Rio Grande do Sul'], ['RO', 'Rondonia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'Sao Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins']] as const

const formatPrice = (price: number) => price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CheckoutPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { cart } = useCart()
  const cliente = obterClienteAutenticado()
  const etapa = searchParams.get('etapa') === 'pagamento' ? 'pagamento' : 'endereco'
  const retornarParaRevisao = searchParams.get('retorno') === 'revisao'
  const [addresses, setAddresses] = useState<Address[]>(() => cliente ? getAddressesForClient(cliente.id) : [])
  const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>(() => cliente ? getSelectedAddressId(cliente.id) : undefined)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [addressForm, setAddressForm] = useState({ nome: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' })
  const [cards, setCards] = useState<PaymentCard[]>(() => cliente ? getCardsForClient(cliente.id) : [])
  const initialDraft = cliente ? getPaymentDraft(cliente.id) : { selectedCardIds: [], cardAmounts: {} }
  const [selectedCardIds, setSelectedCardIds] = useState(initialDraft.selectedCardIds)
  const [cardAmounts, setCardAmounts] = useState<Record<number, number>>(initialDraft.cardAmounts)
  const [showCardForm, setShowCardForm] = useState(false)
  const [cardError, setCardError] = useState('')
  const [cardForm, setCardForm] = useState({ nomeImpresso: '', numero: '', validade: '', cvv: '', bandeira: '' })

  useEffect(() => {
    if (cliente) savePaymentDraft(cliente.id, { selectedCardIds, cardAmounts })
  }, [cardAmounts, cliente, selectedCardIds])

  useEffect(() => {
    if (!cliente) navigate('/login', { state: { from: `/checkout?etapa=${etapa}` }, replace: true })
    else if (cart.length === 0) navigate('/carrinho', { replace: true })
  }, [cart.length, cliente, etapa, navigate])

  if (!cliente || cart.length === 0) return null

  const checkoutItems = cart.flatMap((item) => {
    const product = products.find((currentProduct) => currentProduct.id === item.productId)
    return product ? [{ product, quantity: item.quantity }] : []
  })
  const total = checkoutItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId)
  const selectedCards = cards.filter((card) => selectedCardIds.includes(card.id))
  const distributedTotal = selectedCards.reduce((sum, card) => sum + (cardAmounts[card.id] ?? 0), 0)
  const paymentIsValid = Boolean(selectedAddress) && selectedCards.length > 0 && Math.round(distributedTotal * 100) === Math.round(total * 100)

  const saveNewAddress = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if ([addressForm.cep, addressForm.logradouro, addressForm.numero, addressForm.bairro, addressForm.cidade, addressForm.estado].some((field) => !field.trim())) {
      setAddressError('Preencha todos os campos obrigatorios do endereco.')
      return
    }
    if (!/^\d{5}-?\d{3}$/.test(addressForm.cep.trim()) || !/^\d+[A-Za-z]?$/.test(addressForm.numero.trim())) {
      setAddressError('Informe CEP e numero validos.')
      return
    }
    const newAddress = addAddress({ ...addressForm, clienteId: cliente.id, nome: addressForm.nome.trim() || 'Endereco principal', estado: addressForm.estado })
    setAddresses((currentAddresses) => [...currentAddresses, newAddress])
    selectAddress(cliente.id, newAddress.id)
    setSelectedAddressId(newAddress.id)
    setAddressForm({ nome: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' })
    setShowAddressForm(false)
    setAddressError('')
  }

  const toggleCard = (cardId: number) => {
    setSelectedCardIds((currentIds) => {
      const nextIds = currentIds.includes(cardId) ? currentIds.filter((id) => id !== cardId) : [...currentIds, cardId]
      setCardAmounts((currentAmounts) => {
        const nextAmounts = { ...currentAmounts }
        if (nextIds.length === 1) nextAmounts[nextIds[0]] = total
        if (nextIds.length > 1 && nextAmounts[cardId] === undefined) nextAmounts[cardId] = 0
        return nextAmounts
      })
      return nextIds
    })
  }

  const saveNewCard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cardNumber = cardForm.numero.replace(/\D/g, '')
    if (Object.values(cardForm).some((field) => !field.trim()) || cardNumber.length < 4) {
      setCardError('Preencha corretamente os dados do cartao.')
      return
    }
    const newCard = addCard({ clienteId: cliente.id, nomeImpresso: cardForm.nomeImpresso.trim(), ultimosQuatroDigitos: cardNumber.slice(-4), bandeira: cardForm.bandeira.trim(), validade: cardForm.validade.trim() })
    setCards((currentCards) => [...currentCards, newCard])
    setCardForm({ nomeImpresso: '', numero: '', validade: '', cvv: '', bandeira: '' })
    setShowCardForm(false)
    setCardError('')
  }

  const updateCardAmount = (cardId: number, value: string) => setCardAmounts((amounts) => ({ ...amounts, [cardId]: value === '' ? 0 : Math.max(0, Number(value)) }))
  const continueFromAddress = () => {
    if (retornarParaRevisao) navigate('/checkout/revisao')
    else setSearchParams({ etapa: 'pagamento' })
  }
  const continueFromPayment = () => navigate('/checkout/revisao')
  const summary = <aside className="checkout-section checkout-summary"><h2>Resumo do pedido</h2>{checkoutItems.map(({ product, quantity }) => <div className="checkout-product" key={product.id}><span>{product.name} x {quantity}</span><strong>{formatPrice(product.price * quantity)}</strong></div>)}<div className="cart-total"><span>Total</span><strong>{formatPrice(total)}</strong></div></aside>

  return <div className="site-shell"><Header /><main className="container"><section className="section checkout-page"><div className="section-heading"><div><h1>Checkout</h1><p>{etapa === 'endereco' ? 'Escolha o endereco para esta entrega.' : 'Selecione e distribua o pagamento.'}</p></div><Link to="/carrinho">Voltar para carrinho</Link></div><nav className="checkout-steps" aria-label="Etapas da compra"><span className="checkout-step checkout-step-complete">✓ Carrinho</span><span className={`checkout-step ${etapa === 'endereco' ? 'checkout-step-current' : 'checkout-step-complete'}`}>{etapa === 'pagamento' ? '✓ Endereco' : '2. Endereco'}</span><span className={`checkout-step ${etapa === 'pagamento' ? 'checkout-step-current' : ''}`}>3. Pagamento</span><span className="checkout-step">4. Revisao</span></nav>{etapa === 'endereco' ? <section className="checkout-section checkout-single-section"><h2>Endereco de entrega</h2>{addresses.length === 0 && !showAddressForm && <p className="checkout-muted">Nenhum endereco cadastrado.</p>}{addresses.map((address) => <button className={`address-option ${address.id === selectedAddressId ? 'address-option-selected' : ''}`} key={address.id} type="button" onClick={() => { selectAddress(cliente.id, address.id); setSelectedAddressId(address.id) }}><strong>{address.nome}</strong><span>{address.logradouro}, {address.numero}{address.complemento && `, ${address.complemento}`}</span><span>{address.bairro} - {address.cidade}/{address.estado}</span><span>CEP: {address.cep}</span></button>)}<button className="secondary-button" type="button" onClick={() => setShowAddressForm(!showAddressForm)}>{showAddressForm ? 'Cancelar' : 'Adicionar novo endereco'}</button>{showAddressForm && <form className="address-form" onSubmit={saveNewAddress}><label>Identificacao<input value={addressForm.nome} onChange={(event) => setAddressForm({ ...addressForm, nome: event.target.value })} /></label><label>CEP<input value={addressForm.cep} onChange={(event) => setAddressForm({ ...addressForm, cep: event.target.value })} required /></label><label>Logradouro<input value={addressForm.logradouro} onChange={(event) => setAddressForm({ ...addressForm, logradouro: event.target.value })} required /></label><label>Numero<input value={addressForm.numero} onChange={(event) => setAddressForm({ ...addressForm, numero: event.target.value })} required /></label><label>Complemento<input value={addressForm.complemento} onChange={(event) => setAddressForm({ ...addressForm, complemento: event.target.value })} /></label><label>Bairro<input value={addressForm.bairro} onChange={(event) => setAddressForm({ ...addressForm, bairro: event.target.value })} required /></label><label>Cidade<input value={addressForm.cidade} onChange={(event) => setAddressForm({ ...addressForm, cidade: event.target.value })} required /></label><label>Estado<select value={addressForm.estado} onChange={(event) => setAddressForm({ ...addressForm, estado: event.target.value })} required><option value="">Selecione o estado</option>{estadosBrasileiros.map(([sigla, nome]) => <option key={sigla} value={sigla}>{sigla} - {nome}</option>)}</select></label>{addressError && <p className="account-error" role="alert">{addressError}</p>}<button className="primary-button" type="submit">Salvar endereco</button></form>}<button className="primary-button checkout-next-button" type="button" disabled={!selectedAddress} onClick={continueFromAddress}>{retornarParaRevisao ? 'Voltar para revisao' : 'Continuar para pagamento'}</button></section> : <div className="checkout-grid"><section className="checkout-section"><h2>Pagamento</h2><p className="checkout-muted">Selecione um ou mais cartoes para distribuir o total.</p>{cards.length === 0 && <p className="checkout-muted">Nenhum cartao cadastrado.</p>}{cards.map((card) => <button className={`card-option ${selectedCardIds.includes(card.id) ? 'card-option-selected' : ''}`} key={card.id} type="button" onClick={() => toggleCard(card.id)}><strong>{card.bandeira} •••• {card.ultimosQuatroDigitos}</strong><span>{card.nomeImpresso} - validade {card.validade}</span></button>)}<button className="secondary-button" type="button" onClick={() => setShowCardForm(!showCardForm)}>{showCardForm ? 'Cancelar' : 'Adicionar novo cartao'}</button>{showCardForm && <form className="card-form" onSubmit={saveNewCard}><label>Nome impresso<input value={cardForm.nomeImpresso} onChange={(event) => setCardForm({ ...cardForm, nomeImpresso: event.target.value })} required /></label><label>Numero do cartao<input value={cardForm.numero} onChange={(event) => setCardForm({ ...cardForm, numero: event.target.value })} required /></label><label>Validade<input value={cardForm.validade} onChange={(event) => setCardForm({ ...cardForm, validade: event.target.value })} required /></label><label>CVV<input type="password" value={cardForm.cvv} onChange={(event) => setCardForm({ ...cardForm, cvv: event.target.value })} required /></label><label>Bandeira<input value={cardForm.bandeira} onChange={(event) => setCardForm({ ...cardForm, bandeira: event.target.value })} required /></label>{cardError && <p className="account-error" role="alert">{cardError}</p>}<button className="primary-button" type="submit">Salvar cartao</button></form>}{selectedCards.length > 0 && <div className="card-amounts"><h3>Distribuicao do pagamento</h3>{selectedCards.map((card) => <label key={card.id}>{card.bandeira} •••• {card.ultimosQuatroDigitos}<input type="number" min="0" step="0.01" value={cardAmounts[card.id] ?? 0} onChange={(event) => updateCardAmount(card.id, event.target.value)} /></label>)}<p>Total distribuido: <strong>{formatPrice(distributedTotal)}</strong> de {formatPrice(total)}</p></div>}</section>{summary}<button className="primary-button checkout-continue checkout-payment-next" type="button" disabled={!paymentIsValid} onClick={continueFromPayment}>{retornarParaRevisao ? 'Voltar para revisao' : 'Continuar'}</button></div>}</section></main></div>
}
