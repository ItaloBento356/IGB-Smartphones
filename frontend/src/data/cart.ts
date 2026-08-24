import { useEffect, useState } from 'react'

export interface CartItem {
  productId: number
  quantity: number
}

const GUEST_CART_STORAGE_KEY = 'igb-smartphones-carrinho-temporario'
const LEGACY_CART_STORAGE_KEY = 'igb-smartphones-carrinho'
const CLIENT_CART_STORAGE_PREFIX = 'igb-smartphones-carrinho-cliente-'
const SESSION_STORAGE_KEY = 'igb-smartphones-sessao'
const CART_CHANGE_EVENT = 'igb-cart-change'

export const notifyCartChanged = () => window.dispatchEvent(new Event(CART_CHANGE_EVENT))

const getCartStorageKey = () => {
  const clientId = Number(localStorage.getItem(SESSION_STORAGE_KEY))
  return Number.isInteger(clientId) && clientId > 0
    ? `${CLIENT_CART_STORAGE_PREFIX}${clientId}`
    : GUEST_CART_STORAGE_KEY
}

const readCart = (storageKey = getCartStorageKey()): CartItem[] => {
  let savedCart = localStorage.getItem(storageKey)
  if (!savedCart && storageKey === GUEST_CART_STORAGE_KEY) {
    savedCart = localStorage.getItem(LEGACY_CART_STORAGE_KEY)
    if (savedCart) localStorage.removeItem(LEGACY_CART_STORAGE_KEY)
  }
  if (!savedCart) return []

  try {
    const cart = JSON.parse(savedCart) as CartItem[]
    return Array.isArray(cart) ? cart.filter((item) => item.quantity > 0) : []
  } catch {
    return []
  }
}

const publishCart = (cart: CartItem[], storageKey = getCartStorageKey()) => {
  localStorage.setItem(storageKey, JSON.stringify(cart))
  notifyCartChanged()
}

export const getCart = () => readCart()

export const mergeGuestCartIntoClient = (clientId: number) => {
  const guestCart = readCart(GUEST_CART_STORAGE_KEY)
  const clientStorageKey = `${CLIENT_CART_STORAGE_PREFIX}${clientId}`
  const clientCart = readCart(clientStorageKey)
  const mergedCart = [...clientCart]

  guestCart.forEach((guestItem) => {
    const existingItem = mergedCart.find((item) => item.productId === guestItem.productId)
    if (existingItem) {
      existingItem.quantity += guestItem.quantity
    } else {
      mergedCart.push({ ...guestItem })
    }
  })

  localStorage.setItem(clientStorageKey, JSON.stringify(mergedCart))
  if (guestCart.length > 0) localStorage.removeItem(GUEST_CART_STORAGE_KEY)
  notifyCartChanged()
}

export const addToCart = (productId: number) => {
  const cart = readCart()
  const existingItem = cart.find((item) => item.productId === productId)

  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cart.push({ productId, quantity: 1 })
  }

  publishCart(cart)
}

export const updateCartQuantity = (productId: number, quantity: number) => {
  const cart = readCart()
  const item = cart.find((cartItem) => cartItem.productId === productId)
  if (!item) return

  item.quantity = Math.max(1, quantity)
  publishCart(cart)
}

export const removeFromCart = (productId: number) => {
  publishCart(readCart().filter((item) => item.productId !== productId))
}

export const clearCart = () => {
  publishCart([])
}

export const getCartItemCount = (cart: CartItem[] = readCart()) =>
  cart.reduce((total, item) => total + item.quantity, 0)

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>(readCart)

  useEffect(() => {
    const refreshCart = () => setCart(readCart())
    window.addEventListener(CART_CHANGE_EVENT, refreshCart)
    return () => window.removeEventListener(CART_CHANGE_EVENT, refreshCart)
  }, [])

  return { cart, addToCart, updateCartQuantity, removeFromCart }
}