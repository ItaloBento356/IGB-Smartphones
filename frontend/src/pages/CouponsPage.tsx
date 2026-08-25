import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { getCouponsForClient } from '../data/coupons'
import { obterClienteAutenticado } from '../data/adminData'

export default function CouponsPage() {
  const navigate = useNavigate()
  const cliente = obterClienteAutenticado()
  const coupons = cliente ? getCouponsForClient(cliente.id) : []
  const selecionarCupom = (code: string) => {
    sessionStorage.setItem('igb-smartphones-cupom-selecionado', code)
    navigate('/carrinho')
  }
  return <div className="site-shell"><Header /><main className="container"><section className="section account-page"><div className="section-heading"><div><h1>Meus cupons</h1><p>Consulte as condições e escolha um cupom para sua próxima compra.</p></div><Link to="/minha-conta">Voltar para minha conta</Link></div><div className="coupon-list">{coupons.map((coupon) => <article className={`coupon-card ${coupon.origem === 'TROCA' ? 'coupon-card-exchange' : ''}`} key={coupon.code}><strong>{coupon.origem === 'TROCA' ? 'Cupom de troca' : 'Cupom promocional'}</strong><h2>{coupon.code}</h2><p>{coupon.description}</p><small>{coupon.status === 'UTILIZADO' ? 'Utilizado' : coupon.origem === 'TROCA' ? 'Gerado após aprovação e recebimento da devolução' : coupon.condition}</small>{coupon.status !== 'UTILIZADO' && <button type="button" onClick={() => selecionarCupom(coupon.code)}>Usar no checkout</button>}</article>)}</div></section></main></div>
}
