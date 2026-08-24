import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { autenticarCliente } from '../data/adminData'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  const entrar = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!autenticarCliente(email, senha)) {
      setErro('E-mail ou senha inválidos. Contas inativas não podem entrar.')
      return
    }
    navigate(location.state?.from ?? '/minha-conta')
  }

  return <main className="container"><section className="section account-page"><div className="section-heading"><div><h1>Entrar</h1><p>Acesse sua conta IGB Smartphones.</p></div><Link to="/">Voltar para início</Link></div><form className="account-panel account-form" onSubmit={entrar}><label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Senha<input type="password" value={senha} onChange={(event) => setSenha(event.target.value)} required /></label>{erro && <p className="account-error" role="alert">{erro}</p>}<button className="primary-button account-save-button" type="submit">Entrar</button><Link to="/cadastro">Criar conta</Link></form></section></main>
}