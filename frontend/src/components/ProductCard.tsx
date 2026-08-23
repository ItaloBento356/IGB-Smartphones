import type { Product } from '../types/product'
import { Link } from 'react-router-dom'

type ProductCardProps = { product: Product }

export function ProductCard({ product }: ProductCardProps) {
  return <article className="product-card">
    {product.badge && <span className="badge">{product.badge}</span>}
    <div className="product-image"><div className="mini-phone" style={{ '--phone-color': product.color } as React.CSSProperties} aria-label={`Imagem ilustrativa do ${product.name}`} role="img" /></div>
    <h3>{product.name}</h3><span className="product-meta">{product.brand} · 256 GB</span>
    <div className="product-footer"><span className="price">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span><Link className="add-button" to={`/produto/${product.id}`}>Comprar</Link></div>
  </article>
}