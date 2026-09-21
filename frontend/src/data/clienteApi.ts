const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5242'

export interface EnderecoCadastro {
  tipoResidencia: string
  tipoLogradouro: string
  logradouro: string
  numero: string
  bairro: string
  cep: string
  cidade: string
  estado: string
  pais: string
  observacoes?: string
}

export interface ClienteCadastro {
  nome: string
  genero: string
  dataNascimento: string
  cpf: string
  telefoneTipo: string
  ddd: string
  telefoneNumero: string
  email: string
  senha: string
  confirmacaoSenha: string
  endereco: EnderecoCadastro
}

// Erro de cadastro que carrega os campos em conflito retornados pela API (ex.: CPF e/ou e-mail duplicados).
export class ErroCadastroCliente extends Error {
  camposConflitantes?: string[]

  constructor(message: string, camposConflitantes?: string[]) {
    super(message)
    this.name = 'ErroCadastroCliente'
    this.camposConflitantes = camposConflitantes
  }
}

// Extrai uma mensagem legível e os campos em conflito do corpo de erro retornado pela API.
const extrairDetalhesErro = async (response: Response) => {
  try {
    const corpo = await response.json()
    const mensagem =
      (typeof corpo?.detail === 'string' && corpo.detail) ||
      (typeof corpo?.message === 'string' && corpo.message) ||
      (typeof corpo?.title === 'string' && corpo.title) ||
      'Não foi possível concluir a operação. Tente novamente.'
    const camposConflitantes = Array.isArray(corpo?.camposConflitantes)
      ? (corpo.camposConflitantes as string[])
      : undefined

    return { mensagem, camposConflitantes }
  } catch {
    return { mensagem: 'Não foi possível concluir a operação. Tente novamente.', camposConflitantes: undefined }
  }
}

export async function cadastrarCliente(dados: ClienteCadastro): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    })
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
  }

  if (!response.ok) {
    const { mensagem, camposConflitantes } = await extrairDetalhesErro(response)
    throw new ErroCadastroCliente(mensagem, camposConflitantes)
  }
}

export interface EnderecoCliente {
  tipoResidencia: string
  tipoLogradouro: string
  logradouro: string
  numero: string
  bairro: string
  cep: string
  cidade: string
  estado: string
  pais: string
  observacoes?: string
}

export interface ClienteConsulta {
  id: number
  codigoCliente: string
  nome: string
  genero: string
  dataNascimento: string
  cpf: string
  telefoneTipo: string
  ddd: string
  telefoneNumero: string
  email: string
  ativo: boolean
  endereco: EnderecoCliente
}

export interface FiltrosConsultaClientes {
  codigo?: string
  nome?: string
  cpf?: string
  email?: string
}

export async function consultarClientes(filtros: FiltrosConsultaClientes = {}): Promise<ClienteConsulta[]> {
  const parametros = new URLSearchParams()
  if (filtros.codigo?.trim()) parametros.set('codigo', filtros.codigo.trim())
  if (filtros.nome?.trim()) parametros.set('nome', filtros.nome.trim())
  if (filtros.cpf?.trim()) parametros.set('cpf', filtros.cpf.trim())
  if (filtros.email?.trim()) parametros.set('email', filtros.email.trim())

  const query = parametros.toString()

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/clientes${query ? `?${query}` : ''}`)
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
  }

  if (!response.ok) {
    const { mensagem } = await extrairDetalhesErro(response)
    throw new Error(mensagem)
  }

  return (await response.json()) as ClienteConsulta[]
}

export async function obterClientePorId(id: number): Promise<ClienteConsulta> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/clientes/${id}`)
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
  }

  if (!response.ok) {
    const { mensagem } = await extrairDetalhesErro(response)
    throw new Error(mensagem)
  }

  return (await response.json()) as ClienteConsulta
}

export interface AtualizarClienteRequest {
  nome: string
  genero: string
  dataNascimento: string
  cpf: string
  telefoneTipo: string
  ddd: string
  telefoneNumero: string
  email: string
  endereco: EnderecoCliente
}

// Erro de atualização que carrega os campos em conflito retornados pela API (ex.: CPF e/ou e-mail duplicados).
export class ErroAtualizacaoCliente extends Error {
  camposConflitantes?: string[]

  constructor(message: string, camposConflitantes?: string[]) {
    super(message)
    this.name = 'ErroAtualizacaoCliente'
    this.camposConflitantes = camposConflitantes
  }
}

export async function atualizarCliente(id: number, dados: AtualizarClienteRequest): Promise<ClienteConsulta> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    })
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
  }

  if (!response.ok) {
    const { mensagem, camposConflitantes } = await extrairDetalhesErro(response)
    throw new ErroAtualizacaoCliente(mensagem, camposConflitantes)
  }

  return (await response.json()) as ClienteConsulta
}

export async function inativarCliente(id: number): Promise<ClienteConsulta> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/clientes/${id}/inativar`, { method: 'PATCH' })
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
  }

  if (!response.ok) {
    const { mensagem } = await extrairDetalhesErro(response)
    throw new Error(mensagem)
  }

  return (await response.json()) as ClienteConsulta
}
