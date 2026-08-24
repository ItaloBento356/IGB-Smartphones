import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adicionarCliente, autenticarCliente, obterClientes } from '../data/adminData'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cidade, setCidade] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  const cadastrar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!nome.trim() || !email.trim() || !telefone.trim() || !senha) {
      setErro('Preencha nome, e-mail, telefone e senha.')
      return
    }
    if (obterClientes().some((cliente) => cliente.email.toLowerCase() === email.trim().toLowerCase())) {
      setErro('Este e-mail já está cadastrado.')
      return
    }

    const novoCliente = adicionarCliente({ nome: nome.trim(), email: email.trim(), telefone: telefone.trim(), cidade: cidade.trim(), status: 'Ativo', senhaMock: senha })
    autenticarCliente(novoCliente.email, senha)
    navigate('/')
  }

  return <main className="container"><section className="section account-page"><div className="section-heading"><div><h1>Cadastro</h1><p>Crie seu cadastro na IGB Smartphones.</p></div><Link to="/login">Voltar para login</Link></div><form className="account-panel account-form" onSubmit={cadastrar}><label>Nome<input value={nome} onChange={(event) => setNome(event.target.value)} /></label><label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Telefone<input value={telefone} onChange={(event) => setTelefone(event.target.value)} /></label><label>Cidade<input value={cidade} onChange={(event) => setCidade(event.target.value)} /></label><label>Senha mockada<input type="password" value={senha} onChange={(event) => setSenha(event.target.value)} /></label>{erro && <p className="account-error" role="alert">{erro}</p>}<button className="primary-button account-save-button" type="submit">Cadastrar cliente</button></form></section></main>
}