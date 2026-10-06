import { useEffect, useState } from 'react'
import type { Product } from '../types/product'

import galaxyS24Image from '../assets/products/s24.png'
import galaxyA55Image from '../assets/products/a55.png'
import galaxyS24UltraImage from '../assets/products/s24u.png'
import iphone15Image from '../assets/products/i15.png'
import iphone15ProImage from '../assets/products/i15p.png'
import iphone16Image from '../assets/products/i16.png'
import motorolaEdge50Image from '../assets/products/e50.png'
import motorolaG85Image from '../assets/products/g85.png'
import motorolaRazr50Image from '../assets/products/r50.png'
import xiaomiNote13Image from '../assets/products/n13.png'
import xiaomiNote13ProImage from '../assets/products/n13p.png'
import xiaomi14Image from '../assets/products/x14.png'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5242'

interface ProdutoResponse {
  id: number
  nome: string
  marca: string
  preco: number
  cor: string
  imagemUrl: string | null
  quantidadeEstoque: number
}

// Imagens locais usadas enquanto o banco não possui ImagemUrl, associadas pelo id do produto.
const imagensLocaisPorId: Record<number, string> = {
  1: galaxyS24Image,
  2: galaxyA55Image,
  3: galaxyS24UltraImage,
  4: iphone15Image,
  5: iphone15ProImage,
  6: iphone16Image,
  7: motorolaEdge50Image,
  8: motorolaG85Image,
  9: motorolaRazr50Image,
  10: xiaomiNote13Image,
  11: xiaomiNote13ProImage,
  12: xiaomi14Image,
}

// Único ponto de conversão do DTO da API para o tipo Product usado pelo frontend.
const converterProduto = (produto: ProdutoResponse): Product => ({
  id: produto.id,
  name: produto.nome,
  brand: produto.marca,
  price: produto.preco,
  color: produto.cor,
  image: produto.imagemUrl ?? imagensLocaisPorId[produto.id] ?? '',
  stock: produto.quantidadeEstoque,
})

export const listarProdutos = async (): Promise<Product[]> => {
  const response = await fetch(`${API_BASE_URL}/api/produtos`)
  if (!response.ok) throw new Error('Não foi possível carregar os produtos.')
  return ((await response.json()) as ProdutoResponse[]).map(converterProduto)
}

// Cache de módulo: a lista é buscada uma vez e compartilhada entre os componentes.
let produtosEmCache: Promise<Product[]> | undefined

const carregarProdutos = () => {
  produtosEmCache ??= listarProdutos().catch((error) => {
    produtosEmCache = undefined
    throw error
  })
  return produtosEmCache
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ativo = true
    carregarProdutos()
      .then((lista) => { if (ativo) setProducts(lista) })
      .catch((erro: Error) => { if (ativo) setError(erro.message) })
      .finally(() => { if (ativo) setLoading(false) })
    return () => { ativo = false }
  }, [])

  return { products, loading, error }
}