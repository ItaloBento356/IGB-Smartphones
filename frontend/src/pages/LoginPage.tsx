import { Link } from 'react-router-dom'

export default function LoginPage() {
  return <main className="container"><section className="section"><div className="section-heading"><h1>Entrar</h1><Link to="/">Voltar para início</Link></div><p>Área de login em preparação.</p><p><Link to="/cadastro">Ainda não tenho cadastro</Link></p></section></main>
}