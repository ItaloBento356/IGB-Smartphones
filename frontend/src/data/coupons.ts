export interface Coupon {
  code: string
  description: string
  condition: string
  discountPercent?: number
  discountFixed?: number
  clienteId?: number
  origem?: 'PROMOCIONAL' | 'TROCA'
  status?: 'DISPONIVEL' | 'UTILIZADO'
}

export const coupons: Coupon[] = [
  { code: 'TECH5', description: '5% de desconto adicional', condition: 'Desconto adicional para compras no site.', discountPercent: 5 },
  { code: 'BEMVINDO10', description: '10% de desconto na primeira compra', condition: 'Válido para clientes novos.', discountPercent: 10 },
]

export const getCouponDiscount = (coupon: Coupon | undefined, subtotal: number) => {
  if (!coupon) return 0
  if (coupon.discountPercent) return Math.min(subtotal, subtotal * coupon.discountPercent / 100)
  return Math.min(subtotal, coupon.discountFixed ?? 0)
}

const EXCHANGE_COUPONS_STORAGE_KEY = 'igb-smartphones-cupons-troca'

const readExchangeCoupons = () => {
  try {
    const saved = localStorage.getItem(EXCHANGE_COUPONS_STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) as Coupon[] : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveExchangeCoupons = (items: Coupon[]) => localStorage.setItem(EXCHANGE_COUPONS_STORAGE_KEY, JSON.stringify(items))

export const getCouponsForClient = (clienteId: number) => [
  ...coupons.map((coupon) => ({ ...coupon, origem: 'PROMOCIONAL' as const })),
  ...readExchangeCoupons().filter((coupon) => coupon.clienteId === clienteId),
]

export const getCouponForClient = (clienteId: number, code: string) => getCouponsForClient(clienteId).find((coupon) => coupon.code === code)

export const generateExchangeCoupon = (clienteId: number, orderId: number, value: number) => {
  const existing = readExchangeCoupons().find((coupon) => coupon.clienteId === clienteId && coupon.code === `TROCA-${orderId}`)
  if (existing) return existing
  const coupon: Coupon = { code: `TROCA-${orderId}`, description: 'Cupom de troca gerado após o recebimento da devolução.', condition: 'Exclusivo para o cliente desta troca.', discountFixed: Math.max(0, value), clienteId, origem: 'TROCA', status: 'DISPONIVEL' }
  const updated = [...readExchangeCoupons(), coupon]
  saveExchangeCoupons(updated)
  return coupon
}

export const markCouponUsed = (clienteId: number, code: string) => {
  const exchangeCoupons = readExchangeCoupons()
  const coupon = exchangeCoupons.find((item) => item.clienteId === clienteId && item.code === code)
  if (!coupon) return
  saveExchangeCoupons(exchangeCoupons.map((item) => item.code === code && item.clienteId === clienteId ? { ...item, status: 'UTILIZADO' as const } : item))
}
