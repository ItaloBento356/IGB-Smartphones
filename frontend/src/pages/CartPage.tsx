import { Link, useNavigate } from 'react-router-dom'
import { useCart, removeFromCart, updateCartQuantity } from '../data/cart'
import { useProducts } from '../data/productApi'
import { Header } from '../components/Header'
import { obterClienteAutenticado } from '../data/adminData'
import { Breadcrumbs } from '../components/Breadcrumbs'

const formatPrice = (price: number) =>
  price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CartPage() {
  const navigate = useNavigate()
  const { cart } = useCart()
  const { products, loading, error } = useProducts()
  const cartProducts = cart.flatMap((item) => {
    const product = products.find((currentProduct) => currentProduct.id === item.productId)
    return product ? [{ product, quantity: item.quantity }] : []
  })
  const total = cartProducts.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const estoqueValido = cartProducts.length > 0 &&
    cartProducts.every(({ product, quantity }) => product.stock > 0 && quantity <= product.stock)

  const continuarCompra = () => {
    if (obterClienteAutenticado()) {
      navigate('/checkout')
    } else {
      navigate('/login', { state: { from: '/checkout' } })
    }
  }

  return (
    <div className="site-shell">
      <Header />
      <main className="container">
        <section className="section cart-page">
          <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Carrinho' }]} />
          <div className="section-heading">
            <h1>Carrinho</h1>
            <Link to="/catalogo">Continuar comprando</Link>
          </div>
          {cartProducts.length === 0 ? (
            <div className="cart-empty">
              <p>{loading ? 'Carregando produtos...' : error || 'Seu carrinho está vazio.'}</p>
              <Link className="primary-button" to="/catalogo">Voltar ao catálogo</Link>
            </div>
          ) : (
            <>
              <div className="cart-list">
                {cartProducts.map(({ product, quantity }) => (
                  <article className="cart-item" key={product.id}>
                    <div>
                      <h2>{product.name}</h2>
                      <p className="product-meta">{product.brand}</p>
                      <p>Preço unitário: {formatPrice(product.price)}</p>
                      <p className="product-meta">
                        {product.stock > 0 ? `${product.stock} em estoque` : 'Indisponível'}
                      </p>
                    </div>
                    <div className="cart-item-actions">
                      <div className="quantity-control">
                        <button
                          type="button"
                          aria-label={`Diminuir quantidade de ${product.name}`}
                          disabled={quantity <= 1}
                          onClick={() => updateCartQuantity(product.id, quantity - 1, product.stock)}
                        >-</button>
                        <span aria-label={`Quantidade de ${product.name}`}>{quantity}</span>
                        <button
                          type="button"
                          aria-label={`Aumentar quantidade de ${product.name}`}
                          disabled={quantity >= product.stock}
                          onClick={() => updateCartQuantity(product.id, quantity + 1, product.stock)}
                        >+</button>
                      </div>
                      <strong>Subtotal: {formatPrice(product.price * quantity)}</strong>
                      <button className="remove-button" type="button" onClick={() => removeFromCart(product.id)}>
                        Remover
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {!estoqueValido && !loading && (
                <p className="account-error" role="alert">
                  Revise os itens: há produtos indisponíveis ou quantidades acima do estoque.
                </p>
              )}
              <div className="cart-total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <button
                className="primary-button cart-continue-button"
                type="button"
                disabled={loading || Boolean(error) || !estoqueValido}
                onClick={continuarCompra}
              >
                Continuar compra
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
