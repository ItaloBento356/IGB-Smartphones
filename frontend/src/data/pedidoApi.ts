import type { EnderecoEntregaCadastro, CartaoCliente } from './clienteApi'
import type { StatusPedido } from './adminData'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5242'

export interface ItemCotacaoPedido {
  produtoId: number
  quantidade: number
}

export interface CupomPedido {
  id: number
  codigo: string
  natureza: 'Promocional' | 'Troca'
  formaDesconto: 'Percentual' | 'ValorFixo'
  valor: number
}

export interface PagamentoPedidoRequest {
  cartaoCreditoId?: number
  bandeira?: string
  ultimos4?: string
  valor: number
}

export interface CriarPedidoRequest {
  clienteId: number
  itens: ItemCotacaoPedido[]
  enderecoEntrega: EnderecoEntregaCadastro
  pagamentos: PagamentoPedidoRequest[]
  cupons: string[]
}

export interface PedidoCriado {
  id: number
  codigo: string
  clienteId: number
  dataCriacao: string
  status: StatusPedido
  subtotal: number
  valorFrete: number
  valorDesconto: number
  total: number
  enderecoEntrega: EnderecoEntregaCadastro
  itens: Array<{
    produtoId: number
    nomeProduto: string
    precoUnitario: number
    quantidade: number
    subtotal: number
  }>
  pagamentos: Array<{
    bandeira: string
    ultimos4: string
    valor: number
  }>
  cupons: Array<{
    codigo: string
    natureza: 'Promocional' | 'Troca'
    formaDesconto: 'Percentual' | 'ValorFixo'
    valor: number
    valorAplicado: number
  }>
}

const mensagemErro = async (response: Response) => {
  try {
    const body = await response.json()
    return body.detail ?? body.mensagem ?? body.title ?? 'Não foi possível concluir a operação.'
  } catch {
    return 'Não foi possível concluir a operação.'
  }
}

const enviar = async <T>(url: string, init?: RequestInit): Promise<T> => {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${url}`, init)
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
  }

  if (!response.ok) throw new Error(await mensagemErro(response))
  return (await response.json()) as T
}

export const calcularFretePedido = (
  itens: ItemCotacaoPedido[],
  enderecoEntrega: EnderecoEntregaCadastro,
) => enviar<{ valorFrete: number }>('/api/pedidos/calcular-frete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ itens, enderecoEntrega }),
})

export const listarCuponsCliente = (clienteId: number) =>
  enviar<CupomPedido[]>(`/api/clientes/${clienteId}/cupons`)

export const criarPedido = (pedido: CriarPedidoRequest) =>
  enviar<PedidoCriado>('/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
  })

export const obterPedidoPorId = (id: number) => enviar<PedidoCriado>(`/api/pedidos/${id}`)

export const listarPedidosCliente = (clienteId: number) =>
  enviar<PedidoCriado[]>(`/api/pedidos?clienteId=${encodeURIComponent(clienteId)}`)

export const cancelarPedido = (id: number) =>
  enviar<PedidoCriado>(`/api/pedidos/${id}/cancelar`, { method: 'PATCH' })

export const mapearPagamentoSalvo = (cartao: CartaoCliente, valor: number): PagamentoPedidoRequest => ({
  cartaoCreditoId: cartao.id,
  valor,
})
