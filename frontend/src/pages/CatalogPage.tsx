import { Link, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { products } from '../data/products'
import { Header } from '../components/Header'

export default function CatalogPage() {
  const [searchParams] = useSearchParams()
  const marca = searchParams.get('marca')

  const filteredProducts = marca
    ? products.filter((product) => product.brand === marca)
    : products

    return (
        <div className="site-shell"><Header /><main className="container">
            <section className="section">
                <div className="section-heading">
                    <h1>Catálogo</h1>
                    <Link to="/">← Voltar para início</Link>
                </div>
                <div className="product-grid">
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </section>
        </main></div>
    )   
}