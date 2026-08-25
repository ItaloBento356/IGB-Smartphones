export interface Address {
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

type AddressesByClient = Record<string, Address[]>

const ADDRESSES_STORAGE_KEY = 'igb-smartphones-enderecos'
const SELECTED_ADDRESS_PREFIX = 'igb-smartphones-endereco-selecionado-'

const readAddresses = (): AddressesByClient => {
  const savedAddresses = localStorage.getItem(ADDRESSES_STORAGE_KEY)
  if (!savedAddresses) return {}

  try {
    const addresses = JSON.parse(savedAddresses) as AddressesByClient
    return addresses && typeof addresses === 'object' ? addresses : {}
  } catch {
    return {}
  }
}

const saveAddresses = (addresses: AddressesByClient) => {
  localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(addresses))
}

export const getAddressesForClient = (clienteId: number) => readAddresses()[String(clienteId)] ?? []

export const addAddress = (address: Omit<Address, 'id'>) => {
  const addresses = readAddresses()
  const clientAddresses = addresses[String(address.clienteId)] ?? []
  const newAddress = {
    ...address,
    id: clientAddresses.reduce((highestId, item) => Math.max(highestId, item.id), 0) + 1,
  }

  addresses[String(address.clienteId)] = [...clientAddresses, newAddress]
  saveAddresses(addresses)
  return newAddress
}

export const getSelectedAddressId = (clienteId: number) => {
  const selectedId = Number(localStorage.getItem(`${SELECTED_ADDRESS_PREFIX}${clienteId}`))
  return Number.isInteger(selectedId) && selectedId > 0 ? selectedId : undefined
}

export const selectAddress = (clienteId: number, addressId: number) => {
  localStorage.setItem(`${SELECTED_ADDRESS_PREFIX}${clienteId}`, String(addressId))
}

export const updateAddress = (address: Address) => {
  const addresses = readAddresses()
  addresses[String(address.clienteId)] = (addresses[String(address.clienteId)] ?? []).map((item) => item.id === address.id ? address : item)
  saveAddresses(addresses)
}

export const removeAddress = (clienteId: number, addressId: number) => {
  const addresses = readAddresses()
  addresses[String(clienteId)] = (addresses[String(clienteId)] ?? []).filter((item) => item.id !== addressId)
  saveAddresses(addresses)
  if (getSelectedAddressId(clienteId) === addressId) localStorage.removeItem(`${SELECTED_ADDRESS_PREFIX}${clienteId}`)
}