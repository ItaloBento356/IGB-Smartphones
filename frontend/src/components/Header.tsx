import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { encerrarSessao, obterClienteAutenticado } from '../data/adminData'
import { getCartItemCount, useCart } from '../data/cart'
import logoIgb from '../assets/logo-igb.png'
import { products } from '../data/products'
import { RecommendationChat } from './RecommendationChat'

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [clienteAutenticado, setClienteAutenticado] = useState(obterClienteAutenticado)
  const [busca, setBusca] = useState(new URLSearchParams(location.search).get('busca') ?? '')
  const [buscaAtiva, setBuscaAtiva] = useState(false)
  const searchRef = useRef<HTMLFormElement>(null)
  const { cart } = useCart()

  const resultados = busca.trim()
    ? [...new Map(
        products
          .filter((product) => [product.name, product.brand].some((campo) => campo.toLowerCase().includes(busca.trim().toLowerCase())))
          .map((product) => [product.id, product]),
      ).values()]
    : []

  useEffect(() => {
    const atualizarSessao = () => setClienteAutenticado(obterClienteAutenticado())
    window.addEventListener('igb-auth-change', atualizarSessao)
    return () => window.removeEventListener('igb-auth-change', atualizarSessao)
  }, [])

  useEffect(() => {
    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBuscaAtiva(false)
    }
    document.addEventListener('keydown', fecharComEscape)
    return () => document.removeEventListener('keydown', fecharComEscape)
  }, [])

  useEffect(() => {
    const atualizarBusca = window.setTimeout(() => setBusca(new URLSearchParams(location.search).get('busca') ?? ''), 0)
    return () => window.clearTimeout(atualizarBusca)
  }, [location.search])

  useEffect(() => {
    const fecharBusca = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setBuscaAtiva(false)
    }
    document.addEventListener('mousedown', fecharBusca)
    return () => document.removeEventListener('mousedown', fecharBusca)
  }, [])

  const pesquisar = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const termo = busca.trim()
    const resultadosDaBusca = products.filter((product) => [product.name, product.brand].some((campo) => campo.toLowerCase().includes(termo.toLowerCase())))
    navigate(resultadosDaBusca.length === 1 ? `/produto/${resultadosDaBusca[0].id}` : `/catalogo${termo ? `?busca=${encodeURIComponent(termo)}` : ''}`)
    setBuscaAtiva(false)
  }

  const navegarParaHome = (id: string) => {
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    navigate(`/?secao=${id}`)
  }

  useEffect(() => {
    const secao = new URLSearchParams(location.search).get('secao')
    if (location.pathname === '/' && secao) {
      window.setTimeout(() => document.getElementById(secao)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
    }
  }, [location.pathname, location.search])

  const sair = () => {
    encerrarSessao()
    navigate('/')
  }

  return (
    <>
      <div className="topbar" />

      <header className="header">
        <Link className="brand" to="/" aria-label="IGB Smartphones - início">
          <img className="brand-logo" src={logoIgb} alt="IGB Smartphones" />
          <span className="brand-name">IGB Smartphones</span>
        </Link>

        <form className="search" ref={searchRef} role="search" onSubmit={pesquisar}>
          <input
            aria-label="Buscar produtos"
            value={busca}
            onFocus={() => setBuscaAtiva(true)}
            onChange={(event) => {
              setBusca(event.target.value)
              setBuscaAtiva(true)
            }}
            placeholder="O que você está procurando?"
          />
          <button type="submit" aria-label="Buscar">⌕</button>
          {buscaAtiva && busca.trim() && (
            <div className="search-dropdown">
              {resultados.length > 0 ? (
                resultados.map((product) => (
                  <Link
                    className="search-result"
                    to={`/produto/${product.id}`}
                    key={product.id}
                    onClick={() => setBuscaAtiva(false)}
                  >
                    <img src={product.image} alt="" />
                    <span>
                      <strong>{product.name}</strong>
                      <small>
                        {product.brand} · {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </small>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="search-empty">Nenhum produto encontrado</p>
              )}
            </div>
          )}
        </form>

        <div className="header-actions">
          {clienteAutenticado ? (
            <>
              <Link to="/minha-conta">Minha conta</Link>
              <Link to="/meus-pedidos">Meus pedidos</Link>
            </>
          ) : (
            <Link to="/login">Entrar</Link>
          )}

          <Link className="cart-button" to="/carrinho" aria-label="Carrinho">
            🛒 Carrinho <span className="cart-count">{getCartItemCount(cart)}</span>
          </Link>

          {clienteAutenticado && (
            <button type="button" onClick={sair}>
              Sair
            </button>
          )}
        </div>
      </header>

      <nav className="nav" aria-label="Navegação principal">
        <a href="/#inicio" onClick={(event) => { event.preventDefault(); navegarParaHome('inicio') }}>Início</a>
        <a href="/#marcas" onClick={(event) => { event.preventDefault(); navegarParaHome('marcas') }}>Marcas</a>
        <a href="/#destaques" onClick={(event) => { event.preventDefault(); navegarParaHome('destaques') }}>Destaques</a>
        <Link to="/catalogo">Catálogo</Link>
      </nav>

      <RecommendationChat />
    </>
  )
}