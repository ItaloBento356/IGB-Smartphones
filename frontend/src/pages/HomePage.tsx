import { products } from '../data/products'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { Link } from 'react-router-dom'
import appleLogo from '../assets/brands/Apple.png'
import samsungLogo from '../assets/brands/Samsung.png'
import motorolaLogo from '../assets/brands/Motorola.png'
import xiaomiLogo from '../assets/brands/Xiaomi.png'

const marcas = [
    {
        nome: 'Apple',
        icone: appleLogo
    },
    {
        nome: 'Samsung',
        icone: samsungLogo
    },
    {
        nome: 'Motorola',
        icone: motorolaLogo
    },
    {
        nome: 'Xiaomi',
        icone: xiaomiLogo
    }
]

export default function HomePage() {
  return <div className="site-shell" id="inicio"><Header /><main className="container">
    <section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><span className="eyebrow">Tecnologia que acompanha você</span><h1 id="hero-title">Seu próximo smartphone está aqui.</h1><p>Escolha seu novo aparelho com curadoria, preço justo e a confiança de quem entende de tecnologia.</p><Link className="primary-button" to="/catalogo">Ver smartphones</Link></div><div className="hero-device" aria-label="Smartphone em destaque" role="img"><div className="phone"><div className="phone-camera" /><div className="phone-screen" /></div></div></section>
    <section className="section" id="marcas"><div className="section-heading"><h2>Encontre por marca</h2></div><div className="category-grid">
        {marcas.map((marca) => (
            <Link className="category" to={`/catalogo?marca=${marca.nome}`} key={marca.nome}>
                <img className="category-icon" src={marca.icone} alt={'Logo da ${marca.nome}'} />
                <h3>{marca.nome}</h3>
            </Link>
        ))}</div></section>
    <section className="section" id="catalogo"><div className="section-heading"><h2>Em destaque</h2><Link to="/catalogo">Ver catálogo →</Link></div><div className="product-grid">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div></section>
    <section className="benefits" id="ofertas"><div className="benefit"><span aria-hidden="true">▱</span><div><strong>Compra segura</strong><span>Seus dados protegidos</span></div></div><div className="benefit"><span aria-hidden="true">◇</span><div><strong>Entrega rápida</strong><span>Enviamos para todo o Brasil</span></div></div><div className="benefit"><span aria-hidden="true">↺</span><div><strong>Troca facilitada</strong><span>Até 7 dias para trocar</span></div></div></section>
  </main><footer className="footer" id="contato"><div className="footer-content"><div><strong className="brand-name">IGB Smartphones</strong><p>Seu universo mobile, mais perto.</p></div><div className="footer-links"><a href="#contato">Fale conosco</a><a href="#contato">Política de privacidade</a></div></div></footer></div>
}