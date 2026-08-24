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
  }

  return (
  <>
    <article className="product-card">
      {product.badge && <span className="badge">{product.badge}</span>}

      <Link
        to={`/produto/${product.id}`}
        className="product-image product-image-link"
        aria-label={`Ver detalhes de ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          className="product-card-image"
        />
      </Link>

      <h3>{product.name}</h3>

      <span className="product-meta">
        {product.brand} · 256 GB
      </span>

      <div className="product-footer">
        <span className="price">
          R$ {product.price.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
          })}
        </span>

        <button
          className="add-button"
          type="button"
          onClick={adicionar}
        >
          Comprar
        </button>
      </div>

      <Link
        className="product-card-link"
        to={`/produto/${product.id}`}
      >
        Ver detalhes
      </Link>
    </article>

    {adicionado && (
      <div className="cart-toast" role="status">
        <div className="cart-toast-content">
          <strong>Produto adicionado ao carrinho</strong>
          <span>{product.name}</span>
        </div>

        <div className="cart-toast-actions">
          <Link to="/carrinho" className="cart-toast-button">
            Ver carrinho
          </Link>

          <button
            type="button"
            className="cart-toast-close"
            onClick={() => setAdicionado(false)}
          >
            Continuar comprando
          </button>
        </div>
      </div>
    )}
  </>
  )
}  