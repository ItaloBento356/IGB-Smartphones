import { Link, useParams } from 'react-router-dom'
import { products } from '../data/products'
import { useState } from 'react'
import { addToCart } from '../data/cart'
import { Header } from '../components/Header'
import { Breadcrumbs } from '../components/Breadcrumbs'

export default function ProductPage() {
  const { id } = useParams()
  const product = products.find((item) => item.id === Number(id))
  const [adicionado, setAdicionado] = useState(false)

  const adicionar = () => {
    if (!product) return

    addToCart(product.id)
    setAdicionado(true)

    window.setTimeout(() => setAdicionado(false), 1600)
  }

  if (!product) {
    return (
      <div className="site-shell">
        <Header />

        <main className="container">
          <section className="section">
            <h1>Produto não encontrado</h1>
            <Link to="/catalogo">Voltar para catálogo</Link>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="site-shell">
      <Header />

      <main className="container">
        <section className="product-page">
          <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Catálogo', to: '/catalogo' }, { label: product.name }]} />
          <Link className="product-back" to="/catalogo">
            ← Voltar para catálogo
          </Link>

          <div className="product-detail">
            <div className="product-detail-image-area">
              {product.badge && (
                <span className="badge">{product.badge}</span>
              )}

              <img
                src={product.image}
                alt={product.name}
                className="product-detail-image"
              />
            </div>

            <div className="product-detail-info">
              <span className="product-brand">
                {product.brand}
              </span>

              <h1>{product.name}</h1>

              <p className="product-description">
                Smartphone {product.name} da {product.brand}.
              </p>

              <div className="product-detail-price">
                R$ {product.price.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </div>

              <div className="product-benefits">
                <div>
                  <strong>Pagamento seguro</strong>
                  <span>Compra protegida e segura.</span>
                </div>

                <div>
                  <strong>Envio rápido</strong>
                  <span>Receba seu pedido com segurança.</span>
                </div>

                <div>
                  <strong>Compra segura</strong>
                  <span>Seus dados são protegidos.</span>
                </div>
              </div>

              <button
                className="product-buy-button"
                type="button"
                onClick={adicionar}
              >
                {adicionado
                  ? 'Produto adicionado ao carrinho'
                  : 'Adicionar ao carrinho'}
              </button>

              {adicionado && (
                <Link className="product-cart-link" to="/carrinho">
                  Ver carrinho →
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}