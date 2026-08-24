import { Link } from 'react-router-dom'
import { removeFromCart, updateCartQuantity, useCart } from '../data/cart'
import { products } from '../data/products'
import { Header } from '../components/Header'
import { obterClienteAutenticado } from '../data/adminData'
import { useNavigate } from 'react-router-dom'

export default function CartPage() {
  const navigate = useNavigate()
  const { cart } = useCart()
  const cartProducts = cart.flatMap((item) => {
    const product = products.find((currentProduct) => currentProduct.id === item.productId)
    return product ? [{ product, quantity: item.quantity }] : []
  })
  const total = cartProducts.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const formatPrice = (price: number) => price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const continuarCompra = () => {
    if (obterClienteAutenticado()) {
      navigate('/checkout')
    } else {
      navigate('/login', { state: { from: '/checkout' } })
    }
  }

  return <div className="site-shell"><Header /><main className="container"><section className="section cart-page"><div className="section-heading"><h1>Carrinho</h1><Link to="/catalogo">Continuar comprando</Link></div>{cartProducts.length === 0 ? <div className="cart-empty"><p>Seu carrinho está vazio.</p><Link className="primary-button" to="/catalogo">Voltar ao catálogo</Link></div> : <><div className="cart-list">{cartProducts.map(({ product, quantity }) => <article className="cart-item" key={product.id}><div><h2>{product.name}</h2><p className="product-meta">{product.brand}</p><p>Preço unitário: {formatPrice(product.price)}</p></div><div className="cart-item-actions"><div className="quantity-control"><button type="button" aria-label={`Diminuir quantidade de ${product.name}`} onClick={() => updateCartQuantity(product.id, quantity - 1)}>-</button><span>{quantity}</span><button type="button" aria-label={`Aumentar quantidade de ${product.name}`} onClick={() => updateCartQuantity(product.id, quantity + 1)}>+</button></div><strong>Subtotal: {formatPrice(product.price * quantity)}</strong><button className="remove-button" type="button" onClick={() => removeFromCart(product.id)}>Remover</button></div></article>)}</div><div className="cart-total"><span>Total</span><strong>{formatPrice(total)}</strong></div><button className="primary-button cart-continue-button" type="button" onClick={continuarCompra}>Continuar compra</button></>}</section></main></div>
}