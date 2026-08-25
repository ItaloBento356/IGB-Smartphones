import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { coupons } from '../data/coupons'

export default function CouponsPage() {
  return <div className="site-shell"><Header /><main className="container"><section className="section account-page"><div className="section-heading"><div><h1>Cupons disponíveis</h1><p>Consulte as condições antes de finalizar sua compra.</p></div><Link to="/">Voltar para início</Link></div><div className="coupon-list">{coupons.map((coupon) => <article className="coupon-card" key={coupon.code}><strong>{coupon.code}</strong><h2>{coupon.description}</h2><p>{coupon.condition}</p><button type="button" onClick={() => sessionStorage.setItem('igb-smartphones-cupom-selecionado', coupon.code)}>Aplicar cupom</button></article>)}</div></section></main></div>
}
