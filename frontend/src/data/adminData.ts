import { mergeGuestCartIntoClient, notifyCartChanged } from './cart'

export interface Cliente {
  id: number
  nome: string
  email: string
  telefone: string
  status: 'Ativo' | 'Inativo'
  cidade: string
  pedidos: number
  senhaMock: string
}

const CLIENTES_STORAGE_KEY = 'igb-smartphones-clientes'
const SESSAO_STORAGE_KEY = 'igb-smartphones-sessao'
const SENHA_MOCK_PADRAO = '123456'

export type StatusPedido =
  | 'EM ABERTO'
  | 'CANCELADO'
  | 'EM PROCESSAMENTO'
  | 'PAGAMENTO REALIZADO'
  | 'EM TRÂNSITO'
  | 'ENTREGUE'
  | 'TROCA SOLICITADA'
  | 'TROCA ACEITA'
  | 'TROCA NEGADA'
  | 'ITEM ENVIADO'
  | 'ITEM RECEBIDO'
  | 'TROCA PROCESSADA'

export interface Pedido {
  id: number
  clienteId: number
  data: string
  valor: number
  status: StatusPedido
  quantidadeItens: number
  itens?: ItemPedido[]
  enderecoEntrega?: EnderecoPedido
  pagamentos?: PagamentoPedido[]
  recebimentoConfirmado?: boolean
  statusPagamento?: 'ESTORNO_PENDENTE'
}

export interface ItemPedido {
  produtoId: number
  nome: string
  quantidade: number
  precoUnitario: number
  subtotal: number
  troca?: TrocaPedido
}

export interface TrocaPedido {
  status: 'TROCA SOLICITADA' | 'TROCA ACEITA' | 'TROCA NEGADA' | 'ITEM ENVIADO' | 'ITEM RECEBIDO' | 'TROCA PROCESSADA'
  quantidade: number
  motivo: string
  descricao?: string
  dataSolicitacao?: string
}

export interface EnderecoPedido {
  id: number
  clienteId: number
  nome: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

export interface PagamentoPedido {
  cartaoId: number
  bandeira: string
  ultimosQuatroDigitos: string
  valorPago: number
}

export const clientes: Cliente[] = [
  {
    id: 1,
    nome: 'Ana Beatriz Souza',
    email: 'ana.souza@gmail.com',
    telefone: '(11) 99876-1200',
    status: 'Ativo',
    cidade: 'Sao Paulo - SP',
    pedidos: 2,
    senhaMock: SENHA_MOCK_PADRAO,
  },
  {
    id: 2,
    nome: 'Carlos Eduardo Lima',
    email: 'carlos.lima@gmail.com',
    telefone: '(21) 98765-4321',
    status: 'Ativo',
    cidade: 'Rio de Janeiro - RJ',
    pedidos: 1,
    senhaMock: SENHA_MOCK_PADRAO,
  },
  {
    id: 3,
    nome: 'Mariana Oliveira',
    email: 'mariana.oliveira@gmail.com',
    telefone: '(31) 97654-2109',
    status: 'Ativo',
    cidade: 'Belo Horizonte - MG',
    pedidos: 1,
    senhaMock: SENHA_MOCK_PADRAO,
  },
  {
    id: 4,
    nome: 'Rafael Martins',
    email: 'rafael.martins@gmail.com',
    telefone: '(41) 96543-1098',
    status: 'Ativo',
    cidade: 'Curitiba - PR',
    pedidos: 1,
    senhaMock: SENHA_MOCK_PADRAO,
  },
  {
    id: 5,
    nome: 'Beatriz Alves',
    email: 'beatriz.alves@gmail.com',
    telefone: '(51) 99812-3456',
    status: 'Ativo',
    cidade: 'Porto Alegre - RS',
    pedidos: 1,
    senhaMock: SENHA_MOCK_PADRAO,
  },
  {
    id: 6,
    nome: 'Joao Pedro Costa',
    email: 'joao.costa@gmail.com',
    telefone: '(11) 99765-4321',
    status: 'Ativo',
    cidade: 'Sao Paulo - SP',
    pedidos: 1,
    senhaMock: SENHA_MOCK_PADRAO,
  },
  {
    id: 7,
    nome: 'Lucas Ferreira',
    email: 'lucas.ferreira@gmail.com',
    telefone: '(21) 99654-3210',
    status: 'Ativo',
    cidade: 'Rio de Janeiro - RJ',
    pedidos: 1,
    senhaMock: SENHA_MOCK_PADRAO,
  },
  {
    id: 8,
    nome: 'Sofia Mendes',
    email: 'sofia.mendes@gmail.com',
    telefone: '(31) 99543-2109',
    status: 'Ativo',
    cidade: 'Belo Horizonte - MG',
    pedidos: 1,
    senhaMock: SENHA_MOCK_PADRAO,
  },
]

const sincronizarClientes = (dados: Cliente[]) => {
  clientes.splice(0, clientes.length, ...dados)
  return clientes
}

export const obterClientes = () => {
  const dadosSalvos = localStorage.getItem(CLIENTES_STORAGE_KEY)

  if (!dadosSalvos) return clientes

  try {
    const dados = JSON.parse(dadosSalvos) as Partial<Cliente>[]
    return Array.isArray(dados)
      ? sincronizarClientes(dados.map((cliente) => ({ ...cliente, senhaMock: cliente.senhaMock ?? SENHA_MOCK_PADRAO } as Cliente)))
      : clientes
  } catch {
    return clientes
  }
}

export const salvarClientes = (dados: Cliente[]) => {
  const clientesAtualizados = sincronizarClientes(dados)
  localStorage.setItem(CLIENTES_STORAGE_KEY, JSON.stringify(clientesAtualizados))
  return clientesAtualizados
}

export const adicionarCliente = (cliente: Omit<Cliente, 'id' | 'pedidos'>) => {
  const clientesAtuais = obterClientes()
  const novoCliente: Cliente = {
    ...cliente,
    id: clientesAtuais.reduce((maiorId, item) => Math.max(maiorId, item.id), 0) + 1,
    pedidos: 0,
  }

  salvarClientes([...clientesAtuais, novoCliente])
  return novoCliente
}

export const obterClienteAutenticado = () => {
  const clienteId = Number(localStorage.getItem(SESSAO_STORAGE_KEY))
  return Number.isInteger(clienteId) ? obterClientes().find((cliente) => cliente.id === clienteId) : undefined
}

export const autenticarCliente = (email: string, senha: string) => {
  const cliente = obterClientes().find((item) =>
    item.email.toLowerCase() === email.trim().toLowerCase() && item.senhaMock === senha,
  )

  if (!cliente) return undefined
  if (cliente.status === 'Inativo') {
    atualizarCliente({ ...cliente, status: 'Ativo' })
  }

  localStorage.setItem(SESSAO_STORAGE_KEY, String(cliente.id))
  mergeGuestCartIntoClient(cliente.id)
  window.dispatchEvent(new Event('igb-auth-change'))
  return cliente
}

export const validarSenhaCliente = (clienteId: number, senha: string) => {
  const cliente = obterClientes().find((item) => item.id === clienteId)
  return Boolean(cliente && cliente.senhaMock === senha)
}

export const encerrarSessao = () => {
  localStorage.removeItem(SESSAO_STORAGE_KEY)
  notifyCartChanged()
  window.dispatchEvent(new Event('igb-auth-change'))
}

export const atualizarCliente = (clienteAtualizado: Cliente) => {
  const clientesAtuais = obterClientes()
  salvarClientes(clientesAtuais.map((cliente) =>
    cliente.id === clienteAtualizado.id ? clienteAtualizado : cliente,
  ))
}

export const pedidos: Pedido[] = [
  { id: 1001, clienteId: 1, data: '12/08/2026', valor: 4299.9, status: 'EM ABERTO', quantidadeItens: 1 },
  { id: 1002, clienteId: 2, data: '11/08/2026', valor: 5899.0, status: 'EM PROCESSAMENTO', quantidadeItens: 2 },
  { id: 1003, clienteId: 3, data: '10/08/2026', valor: 3199.9, status: 'PAGAMENTO REALIZADO', quantidadeItens: 1 },
  { id: 1004, clienteId: 4, data: '08/08/2026', valor: 6799.0, status: 'EM TRÂNSITO', quantidadeItens: 2 },
  { id: 1005, clienteId: 5, data: '05/08/2026', valor: 2499.9, status: 'ENTREGUE', quantidadeItens: 1 },
  { id: 1006, clienteId: 6, data: '04/08/2026', valor: 4599.0, status: 'TROCA SOLICITADA', quantidadeItens: 1 },
  { id: 1007, clienteId: 7, data: '03/08/2026', valor: 1999.9, status: 'ITEM ENVIADO', quantidadeItens: 1 },
  { id: 1008, clienteId: 8, data: '01/08/2026', valor: 5299.0, status: 'ITEM RECEBIDO', quantidadeItens: 1 },
  { id: 1009, clienteId: 1, data: '31/07/2026', valor: 2899.0, status: 'TROCA SOLICITADA', quantidadeItens: 1 },
]

const PEDIDOS_STORAGE_KEY = 'igb-smartphones-pedidos'
const PEDIDOS_CHANGE_EVENT = 'igb-pedidos-change'

export const obterPedidos = () => {
  const dadosSalvos = localStorage.getItem(PEDIDOS_STORAGE_KEY)
  if (!dadosSalvos) return pedidos

  try {
    const dados = JSON.parse(dadosSalvos) as Pedido[]
    return Array.isArray(dados) ? dados : pedidos
  } catch {
    return pedidos
  }
}

export const salvarPedidos = (dados: Pedido[]) => {
  localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(dados))
  window.dispatchEvent(new Event(PEDIDOS_CHANGE_EVENT))
  return dados
}

export const atualizarPedido = (id: number, alteracoes: Partial<Pedido>) => {
  const pedidosAtuais = obterPedidos()
  const pedidoAtualizado = pedidosAtuais.find((pedido) => pedido.id === id)
  if (!pedidoAtualizado) return undefined

  const atualizado = { ...pedidoAtualizado, ...alteracoes }
  salvarPedidos(pedidosAtuais.map((pedido) => pedido.id === id ? atualizado : pedido))
  return atualizado
}

export const PEDIDOS_UPDATED_EVENT = PEDIDOS_CHANGE_EVENT

export const adicionarPedido = (pedido: Omit<Pedido, 'id'>) => {
  const pedidosAtuais = obterPedidos()
  const novoPedido: Pedido = {
    ...pedido,
    id: pedidosAtuais.reduce((maiorId, item) => Math.max(maiorId, item.id), 1000) + 1,
  }
  salvarPedidos([...pedidosAtuais, novoPedido])
  return novoPedido
}

export const obterPedido = (id: number) => obterPedidos().find((pedido) => pedido.id === id)