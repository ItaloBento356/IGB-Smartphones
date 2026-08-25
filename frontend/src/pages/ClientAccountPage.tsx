import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { atualizarCliente, obterClienteAutenticado, obterClientes, type Cliente } from '../data/adminData'

export default function ClientAccountPage() {
  const navigate = useNavigate()
  const clienteAtual = obterClienteAutenticado()
  const [cliente, setCliente] = useState<Cliente | undefined>(clienteAtual)
  const [editando, setEditando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    if (!clienteAtual) navigate('/login', { replace: true })
  }, [clienteAtual, navigate])

  if (!cliente) {
    return <main className="container"><section className="section"><h1>Minha conta</h1><p>Cliente mockado não encontrado.</p></section></main>
  }

  const atualizarCampo = (campo: keyof Pick<Cliente, 'nome' | 'email' | 'telefone' | 'cidade'>, valor: string) => {
    setCliente({ ...cliente, [campo]: valor })
  }

  const salvarAlteracoes = () => {
    if (!cliente.nome.trim() || !cliente.email.trim() || !cliente.telefone.trim()) {
      setErro('Preencha nome, e-mail e telefone.')
      return
    }

    const emailEmUso = obterClientes().some((item) =>
      item.id !== cliente.id && item.email.toLowerCase() === cliente.email.trim().toLowerCase(),
    )

    if (emailEmUso) {
      setErro('Este e-mail já está cadastrado.')
      return
    }

    const clienteSalvo = { ...cliente, nome: cliente.nome.trim(), email: cliente.email.trim(), telefone: cliente.telefone.trim() }
    atualizarCliente(clienteSalvo)
    setCliente(clienteSalvo)
    setEditando(false)
    setErro('')
    setMensagem('Dados atualizados com sucesso.')
  }

  const inativarConta = () => {
    if (!window.confirm('Tem certeza que deseja inativar sua conta?')) return

    const clienteInativado = { ...cliente, status: 'Inativo' as const }
    atualizarCliente(clienteInativado)
    setCliente(clienteInativado)
    setEditando(false)
    setMensagem('Sua conta foi inativada.')
  }

  return (
    <main className="container">
      <section className="section account-page">
        <div className="section-heading">
          <div>
            <h1>Minha conta</h1>
            <p>Consulte e mantenha seus dados cadastrais atualizados.</p>
          </div>
          <Link to="/">Voltar para início</Link>
        </div>

        <div className={`account-panel ${cliente.status === 'Inativo' ? 'account-panel-inactive' : ''}`}>
          <div className="account-status-row">
            <div><span className="account-label">Status da conta</span><strong>{cliente.status}</strong></div>
            {cliente.status === 'Ativo' && !editando && <button type="button" onClick={() => setEditando(true)}>Editar dados</button>}
          </div>

          {mensagem && <p className="account-message" role="status">{mensagem}</p>}
          {erro && <p className="account-error" role="alert">{erro}</p>}

          <div className="account-fields">
            <label>Nome<input value={cliente.nome} disabled={!editando || cliente.status === 'Inativo'} onChange={(event) => atualizarCampo('nome', event.target.value)} /></label>
            <label>E-mail<input type="email" value={cliente.email} disabled={!editando || cliente.status === 'Inativo'} onChange={(event) => atualizarCampo('email', event.target.value)} /></label>
            <label>Telefone<input value={cliente.telefone} disabled={!editando || cliente.status === 'Inativo'} onChange={(event) => atualizarCampo('telefone', event.target.value)} /></label>
            <label>Cidade<input value={cliente.cidade} disabled={!editando || cliente.status === 'Inativo'} onChange={(event) => atualizarCampo('cidade', event.target.value)} /></label>
          </div>

          {editando && cliente.status === 'Ativo' && <button className="primary-button account-save-button" type="button" onClick={salvarAlteracoes}>Salvar alterações</button>}
          {cliente.status === 'Ativo' && <button className="account-inactivate-button" type="button" onClick={inativarConta}>Inativar conta</button>}
          <Link className="account-orders-link" to="/meus-pedidos">Meus pedidos</Link>
          <Link className="account-orders-link" to="/cupons">Consultar cupons</Link>
          {cliente.status === 'Inativo' && <p className="account-inactive-note">Esta conta está inativa e não pode ter novos dados alterados.</p>}
        </div>
      </section>
    </main>
  )
}