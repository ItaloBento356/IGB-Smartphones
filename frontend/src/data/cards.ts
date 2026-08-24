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