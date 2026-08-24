import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { encerrarSessao, obterClienteAutenticado } from '../data/adminData'
import { getCartItemCount, useCart } from '../data/cart'
import logoIgb from '../assets/logo-igb.png'

export function Header() {
  const navigate = useNavigate()
  const [clienteAutenticado, setClienteAutenticado] = useState(obterClienteAutenticado)
  const { cart } = useCart()

  useEffect(() => {
    const atualizarSessao = () => setClienteAutenticado(obterClienteAutenticado())
    window.addEventListener('igb-auth-change', atualizarSessao)
    return () => window.removeEventListener('igb-auth-change', atualizarSessao)
  }, [])

  const sair = () => {
    encerrarSessao()
    navigate('/')
  }

  return <>
    <div className="topbar">Frete grátis nas compras acima de R$ 299</div>

    <header className="header">
      <Link className="brand" to="/" aria-label="IGB Smartphones - início">
        <img className="brand-logo" src={logoIgb} alt="IGB Smartphones" />
        <span className="brand-name">IGB Smartphones</span>
      </Link>

      <form className="search" role="search" onSubmit={(event) => event.preventDefault()}>
        <input aria-label="Buscar produtos" placeholder="O que você está procurando?" />
        <button type="submit" aria-label="Buscar">⌕</button>
      </form>

      <div className="header-actions">
        {clienteAutenticado ? <><Link to="/minha-conta">Minha conta</Link><Link to="/meus-pedidos">Meus pedidos</Link></> : <Link to="/login">Entrar</Link>}
        <Link className="cart-button" to="/carrinho" aria-label="Carrinho">
          🛒 Carrinho <span className="cart-count">{getCartItemCount(cart)}</span>
        </Link>
        {clienteAutenticado && <button type="button" onClick={sair}>Sair</button>}
      </div>
    </header>

    <nav className="nav" aria-label="Navegação principal">
      <a href="#inicio">Início</a>
      <a href="#marcas">Marcas</a>
      <a href="#ofertas">Ofertas</a>
      <a href="#destaques">Mais vendidos</a>
      <a href="#contato">Atendimento</a>
    </nav>
  </>
}