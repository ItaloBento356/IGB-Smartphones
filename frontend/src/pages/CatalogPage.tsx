import { Link, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { products } from '../data/products'
import { Header } from '../components/Header'
import { Breadcrumbs } from '../components/Breadcrumbs'

export default function CatalogPage() {
  const [searchParams] = useSearchParams()
  const marca = searchParams.get('marca')
    const busca = searchParams.get('busca')?.trim().toLowerCase() ?? ''

  const filteredProducts = marca
    ? products.filter((product) => product.brand === marca)
    : products
    const searchedProducts = busca ? filteredProducts.filter((product) => [product.name, product.brand].some((campo) => campo.toLowerCase().includes(busca))) : filteredProducts

    return (
        <div className="site-shell"><Header /><main className="container">
            <section className="section">
                <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Catálogo' }]} />
                <div className="section-heading">
                    <h1>Catálogo</h1>
                    <Link to="/">← Voltar para início</Link>
                </div>
                <div className="product-grid">
                    {searchedProducts.map((product) => (
                        <ProductCard key={product.id} product={product} showBadge={false} />
                    ))}
                </div>
                {searchedProducts.length === 0 && <p className="catalog-empty">Nenhum produto encontrado para essa busca.</p>}
            </section>
        </main></div>
    )   
}