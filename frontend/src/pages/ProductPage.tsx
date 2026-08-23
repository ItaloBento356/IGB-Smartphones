import { Link, useParams } from 'react-router-dom'
import { products } from '../data/products'

export default function ProductPage() {
  const { id } = useParams()
  const product = products.find((item) => item.id === Number(id))

  return <main className="container"><section className="section"><Link to="/catalogo">← Voltar para catálogo</Link><div className="section-heading"><h1>{product?.name ?? 'Produto não encontrado'}</h1></div>{product && <p className="product-meta">{product.brand} · R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}</section></main>
}