import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { autenticarCliente } from '../data/clienteApi'

export default function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  const entrar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (entrando) return

    setErro('')
    setEntrando(true)

    try {
      const cliente = await autenticarCliente(email.trim(), senha)

      localStorage.setItem(
  'igb-smartphones-sessao',
  JSON.stringify({
    id: cliente.id,
    nome: cliente.nome,
    email: cliente.email,
    telefone: '',
    status: 'Ativo',
    cidade: '',
    pedidos: 0,
    senhaMock: '',
  }),
)

localStorage.setItem('clienteId', String(cliente.id))

navigate('/')
    } catch (erro) {
      setErro(
        erro instanceof Error
          ? erro.message
          : 'E-mail ou senha inválidos.'
      )
    } finally {
      setEntrando(false)
    }
  }

  return (
    <main className="container">
      <section className="section account-page">
        <div className="section-heading">
          <div>
            <h1>Entrar</h1>
            <p>Acesse sua conta IGB Smartphones.</p>
          </div>

          <Link to="/">Voltar para início</Link>
        </div>

        <form
          className="account-panel account-form"
          onSubmit={entrar}
        >
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
            />
          </label>

          {erro && (
            <p className="account-error" role="alert">
              {erro}
            </p>
          )}

          <button
            className="primary-button account-save-button"
            type="submit"
            disabled={entrando}
          >
            {entrando ? 'Entrando...' : 'Entrar'}
          </button>

          <Link to="/cadastro">Criar conta</Link>
        </form>
      </section>
    </main>
  )
}