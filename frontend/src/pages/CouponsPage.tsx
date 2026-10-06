import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { obterClienteAutenticado } from '../data/adminData'
import { listarCuponsCliente, type CupomPedido } from '../data/pedidoApi'

export default function CouponsPage() {
  const navigate = useNavigate()
  const cliente = obterClienteAutenticado()
  const clienteId = cliente?.id
  const [coupons, setCoupons] = useState<CupomPedido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!clienteId) {
      navigate('/login', { replace: true })
      return
    }
    let ativo = true
    listarCuponsCliente(clienteId)
      .then((resultado) => { if (ativo) setCoupons(resultado) })
      .catch((erro: unknown) => {
        if (ativo) setError(erro instanceof Error ? erro.message : 'Não foi possível carregar seus cupons.')
      })
      .finally(() => { if (ativo) setLoading(false) })
    return () => { ativo = false }
  }, [clienteId, navigate])

  const selecionarCupom = (code: string) => {
    sessionStorage.setItem('igb-smartphones-cupom-selecionado', code)
    navigate('/carrinho')
  }

  return (
    <div className="site-shell">
      <Header />
      <main className="container">
        <section className="section account-page">
          <div className="section-heading">
            <div><h1>Meus cupons</h1><p>Consulte e utilize cupons disponíveis para sua conta.</p></div>
            <Link to="/minha-conta">Voltar para minha conta</Link>
          </div>
          {loading && <p role="status">Carregando cupons...</p>}
          {error && <p className="account-error" role="alert">{error}</p>}
          {!loading && !error && coupons.length === 0 && <p>Você não possui cupons disponíveis.</p>}
          <div className="coupon-list">
            {coupons.map((coupon) => (
              <article className={`coupon-card ${coupon.natureza === 'Troca' ? 'coupon-card-exchange' : ''}`} key={coupon.id}>
                <strong>{coupon.natureza === 'Troca' ? 'Cupom de troca' : 'Cupom promocional'}</strong>
                <h2>{coupon.codigo}</h2>
                <p>{coupon.formaDesconto === 'Percentual' ? `${coupon.valor}% de desconto` : `${coupon.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de crédito`}</p>
                <small>Disponível para esta conta</small>
                <button type="button" onClick={() => selecionarCupom(coupon.codigo)}>Usar no checkout</button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
