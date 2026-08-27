import type { Product } from '../types/product'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getCartItemCount, useCart } from '../data/cart'
import { products } from '../data/products'

type ProductCardProps = {
  product: Product
  showBadge?: boolean
}

export function ProductCard({ product, showBadge = false }: ProductCardProps) {
  const [adicionado, setAdicionado] = useState(false)
  const { cart, addToCart } = useCart()

  const itemNoCarrinho = cart.find((item) => item.productId === product.id)
  const quantidadeCarrinho = getCartItemCount(cart)
  const subtotalItem = (itemNoCarrinho?.quantity ?? 1) * product.price

  const totalCarrinho = cart.reduce((total, item) => {
    const produto = products.find((currentProduct) => currentProduct.id === item.productId)
    return total + (produto?.price ?? 0) * item.quantity
  }, 0)

  const adicionar = () => {
    addToCart(product.id)
    setAdicionado(true)
  }

  return (
    <>
      <article className="product-card">
        {showBadge && product.badge && <span className="badge">{product.badge}</span>}

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
            {product.price.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2,
            })}
          </span>

          <button className="add-button" type="button" onClick={adicionar}>
            Adicionar ao carrinho
          </button>
        </div>

        <Link className="product-card-link" to={`/produto/${product.id}`}>
          Ver detalhes
        </Link>
      </article>

      {adicionado && (
        <aside className="cart-toast" role="status" aria-live="polite">
          <div className="cart-toast-header">
            <strong>Seu carrinho</strong>
            <span>{quantidadeCarrinho} item{quantidadeCarrinho === 1 ? '' : 's'}</span>
          </div>

          <div className="cart-toast-item">
            <img src={product.image} alt={product.name} />
            <div>
              <h4>{product.name}</h4>
              <span>{itemNoCarrinho?.quantity ?? 1}x · {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <strong>{subtotalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          </div>

          <div className="cart-toast-total">
            <span>Subtotal</span>
            <strong>{totalCarrinho.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          </div>

          <div className="cart-toast-actions">
            <Link to="/checkout" className="cart-toast-button primary-button">
              Finalizar compra
            </Link>
            <button type="button" className="cart-toast-close" onClick={() => setAdicionado(false)}>
              Continuar comprando
            </button>
            <Link to="/carrinho" className="cart-toast-link">
              Ver carrinho completo
            </Link>
          </div>
        </aside>
      )}
    </>
  )
}