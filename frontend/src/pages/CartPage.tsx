import { Link } from 'react-router-dom'

export default function CartPage() {
  return <main className="container"><section className="section"><div className="section-heading"><h1>Carrinho</h1><Link to="/catalogo">Continuar comprando</Link></div><p>Seu carrinho está vazio.</p></section></main>
}