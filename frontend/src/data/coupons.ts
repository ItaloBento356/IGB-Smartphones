export interface Coupon {
  code: string
  description: string
  condition: string
}

export const coupons: Coupon[] = [
  { code: 'BEMVINDO10', description: '10% de desconto na primeira compra', condition: 'Válido para clientes novos em pedidos acima de R$ 500.' },
  { code: 'FRETEGRATIS', description: 'Frete grátis', condition: 'Compras acima de R$ 299.' },
]
