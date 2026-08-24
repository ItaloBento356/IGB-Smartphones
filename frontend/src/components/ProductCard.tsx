import type { Product } from '../types/product'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addToCart } from '../data/cart'

type ProductCardProps = { product: Product }

export function ProductCard({ product }: ProductCardProps) {
  const [adicionado, setAdicionado] = useState(false)

  const adicionar = () => {
    addToCart(product.id)
    setAdicionado(true)
    window.setTimeout(() => setAdicionado(false), 1600)
  }

  return <article className="product-card">
    {product.badge && <span className="badge">{product.badge}</span>}
    <div className="product-image"><div className="mini-phone" style={{ '--phone-color': product.color } as React.CSSProperties} aria-label={`Imagem ilustrativa do ${product.name}`} role="img" /></div>
    <h3>{product.name}</h3><span className="product-meta">{product.brand} · 256 GB</span>
    <div className="product-footer"><span className="price">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span><button className="add-button" type="button" onClick={adicionar}>{adicionado ? 'Adicionado' : 'Comprar'}</button></div>
    <Link className="product-card-link" to={`/produto/${product.id}`}>Ver detalhes</Link>
  </article>
}