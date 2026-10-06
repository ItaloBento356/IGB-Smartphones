import type { EnderecoEntregaCadastro } from './clienteApi'
import type { PaymentCard } from './cards'

export interface CheckoutAddressDraft extends EnderecoEntregaCadastro {
  id?: number
  clienteId: number
}

export interface PaymentDraft {
  selectedCardIds: number[]
  cardAmounts: Record<number, number>
  couponCode?: string
  couponCodes?: string[]
  selectedAddressId?: number
  checkoutAddress?: CheckoutAddressDraft
  unsavedCards?: PaymentCard[]
  freight?: number
}

const DRAFT_STORAGE_PREFIX = 'igb-smartphones-checkout-rascunho-'

const getDraftKey = (clienteId: number) => `${DRAFT_STORAGE_PREFIX}${clienteId}`

export const getPaymentDraft = (clienteId: number): PaymentDraft => {
  const savedDraft = sessionStorage.getItem(getDraftKey(clienteId))
  if (!savedDraft) return { selectedCardIds: [], cardAmounts: {} }

  try {
    const draft = JSON.parse(savedDraft) as PaymentDraft
    return draft && Array.isArray(draft.selectedCardIds)
      ? draft
      : { selectedCardIds: [], cardAmounts: {} }
  } catch {
    return { selectedCardIds: [], cardAmounts: {} }
  }
}

export const savePaymentDraft = (clienteId: number, draft: PaymentDraft) => {
  sessionStorage.setItem(getDraftKey(clienteId), JSON.stringify(draft))
}
