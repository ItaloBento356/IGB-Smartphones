import { Link, useParams } from 'react-router-dom'
import { products } from '../data/products'
import { useState } from 'react'
import { addToCart } from '../data/cart'
import { Header } from '../components/Header'

export default function ProductPage() {
  const { id } = useParams()
  const product = products.find((item) => item.id === Number(id))
  const [adicionado, setAdicionado] = useState(false)

  const adicionar = () => {
    if (!product) return
    addToCart(product.id)
    setAdicionado(true)
  }

  return <div className="site-shell"><Header /><main className="container"><section className="section"><Link to="/catalogo">← Voltar para catálogo</Link><div className="section-heading"><h1>{product?.name ?? 'Produto não encontrado'}</h1></div>{product && <><p className="product-meta">{product.brand} · R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><button className="primary-button" type="button" onClick={adicionar}>{adicionado ? 'Produto adicionado' : 'Adicionar ao carrinho'}</button></>}</section></main></div>
}