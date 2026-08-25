export interface PaymentCard {
  id: number
  clienteId: number
  nomeImpresso: string
  ultimosQuatroDigitos: string
  bandeira: string
  validade: string
}

const CARDS_STORAGE_KEY = 'igb-smartphones-cartoes'

type CardsByClient = Record<string, PaymentCard[]>

const readCards = (): CardsByClient => {
  const savedCards = localStorage.getItem(CARDS_STORAGE_KEY)
  if (!savedCards) return {}

  try {
    const cards = JSON.parse(savedCards) as CardsByClient
    return cards && typeof cards === 'object' ? cards : {}
  } catch {
    return {}
  }
}

export const getCardsForClient = (clienteId: number) => readCards()[String(clienteId)] ?? []

export const addCard = (card: Omit<PaymentCard, 'id'>) => {
  const cards = readCards()
  const clientCards = cards[String(card.clienteId)] ?? []
  const newCard = {
    ...card,
    id: clientCards.reduce((highestId, item) => Math.max(highestId, item.id), 0) + 1,
  }

  cards[String(card.clienteId)] = [...clientCards, newCard]
  localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards))
  return newCard
}

export const updateCard = (card: PaymentCard) => {
  const cards = readCards()
  cards[String(card.clienteId)] = (cards[String(card.clienteId)] ?? []).map((item) => item.id === card.id ? card : item)
  localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards))
}

export const removeCard = (clienteId: number, cardId: number) => {
  const cards = readCards()
  cards[String(clienteId)] = (cards[String(clienteId)] ?? []).filter((item) => item.id !== cardId)
  localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards))
}