import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { atualizarCliente, obterClienteAutenticado, obterClientes, validarSenhaCliente, type Cliente } from '../data/adminData'
import { addAddress, getAddressesForClient, getSelectedAddressId, removeAddress, selectAddress, updateAddress, type Address } from '../data/addresses'
import { addCard, getCardsForClient, removeCard, updateCard, type PaymentCard } from '../data/cards'
import { Header } from '../components/Header'

export default function ClientAccountPage() {
  const navigate = useNavigate()
  const clienteAtual = obterClienteAutenticado()
  const [cliente, setCliente] = useState<Cliente | undefined>(clienteAtual)
  const [editando, setEditando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [addresses, setAddresses] = useState<Address[]>(() => clienteAtual ? getAddressesForClient(clienteAtual.id) : [])
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null)
  const [addressForm, setAddressForm] = useState({ nome: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' })
  const [cards, setCards] = useState<PaymentCard[]>(() => clienteAtual ? getCardsForClient(clienteAtual.id) : [])
  const [editingCardId, setEditingCardId] = useState<number | null>(null)
  const [cardForm, setCardForm] = useState({ nomeImpresso: '', numero: '', validade: '', bandeira: '' })
  const [accountAction, setAccountAction] = useState<'inativar' | 'reativar' | null>(null)
  const [accountPassword, setAccountPassword] = useState('')
  const [showAccountPassword, setShowAccountPassword] = useState(false)
  const [accountActionError, setAccountActionError] = useState('')

  useEffect(() => {
    if (!clienteAtual) navigate('/login', { replace: true })
  }, [clienteAtual, navigate])

  if (!cliente) {
    return <main className="container"><section className="section"><h1>Minha conta</h1><p>Cliente não encontrado.</p></section></main>
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

  const abrirAcaoConta = (acao: 'inativar' | 'reativar') => {
    setAccountAction(acao)
    setAccountPassword('')
    setAccountActionError('')
  }

  const confirmarAcaoConta = () => {
    if (!accountPassword || !validarSenhaCliente(cliente.id, accountPassword)) {
      setAccountActionError(accountPassword ? 'Senha incorreta.' : 'Informe sua senha atual.')
      return
    }
    const status = accountAction === 'inativar' ? 'Inativo' : 'Ativo'
    const clienteAtualizado = { ...cliente, status } as Cliente
    atualizarCliente(clienteAtualizado)
    setCliente(clienteAtualizado)
    setEditando(false)
    setAccountAction(null)
    setMensagem(status === 'Inativo' ? 'Sua conta foi inativada.' : 'Sua conta foi reativada com sucesso.')
  }

  const editarEndereco = (address?: Address) => {
    setEditingAddressId(address?.id ?? 0)
    setAddressForm(address ? { nome: address.nome, cep: address.cep, logradouro: address.logradouro, numero: address.numero, complemento: address.complemento, bairro: address.bairro, cidade: address.cidade, estado: address.estado } : { nome: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' })
  }

  const salvarEndereco = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const address = { ...addressForm, clienteId: cliente.id }
    if (editingAddressId) updateAddress({ ...address, id: editingAddressId })
    else addAddress(address)
    setAddresses(getAddressesForClient(cliente.id)); setEditingAddressId(null); setMensagem('Endereço salvo com sucesso.')
  }

  const editarCartao = (card?: PaymentCard) => {
    setEditingCardId(card?.id ?? 0)
    setCardForm(card ? { nomeImpresso: card.nomeImpresso, numero: card.ultimosQuatroDigitos, validade: card.validade, bandeira: card.bandeira } : { nomeImpresso: '', numero: '', validade: '', bandeira: '' })
  }

  const salvarCartao = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const numero = cardForm.numero.replace(/\D/g, '')
    const card = { clienteId: cliente.id, nomeImpresso: cardForm.nomeImpresso, ultimosQuatroDigitos: numero.slice(-4), validade: cardForm.validade, bandeira: cardForm.bandeira }
    if (editingCardId) updateCard({ ...card, id: editingCardId })
    else addCard(card)
    setCards(getCardsForClient(cliente.id)); setEditingCardId(null); setMensagem('Forma de pagamento salva com sucesso.')
  }

  return (
    <div className="site-shell"><Header /><main className="container">
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
          <section className="account-data-section"><div className="section-heading"><div><h2>Endereços de entrega</h2><p>Gerencie os locais usados no checkout.</p></div><button className="secondary-button" type="button" onClick={() => editarEndereco()}>Adicionar endereço</button></div>{addresses.map((address) => <article className="account-data-card" key={address.id}><div><strong>{address.nome}</strong>{getSelectedAddressId(cliente.id) === address.id && <span className="account-primary-label">Principal</span>}<p>{address.logradouro}, {address.numero}{address.complemento && `, ${address.complemento}`}<br />{address.bairro} - {address.cidade}/{address.estado}<br />CEP: {address.cep}</p></div><div className="account-data-actions"><button type="button" onClick={() => { selectAddress(cliente.id, address.id); setAddresses(getAddressesForClient(cliente.id)) }}>Definir principal</button><button type="button" onClick={() => editarEndereco(address)}>Editar</button><button type="button" onClick={() => { removeAddress(cliente.id, address.id); setAddresses(getAddressesForClient(cliente.id)) }}>Excluir</button></div></article>)}{editingAddressId !== null && <form className="account-form account-data-form" onSubmit={salvarEndereco}><h3>{editingAddressId ? 'Editar endereço' : 'Novo endereço'}</h3>{(['nome', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade'] as const).map((field) => <label key={field}>{field === 'nome' ? 'Identificação' : field[0].toUpperCase() + field.slice(1)}<input value={addressForm[field]} required={field !== 'nome' && field !== 'complemento'} onChange={(event) => setAddressForm({ ...addressForm, [field]: event.target.value })} /></label>)}<label>Estado<select value={addressForm.estado} required onChange={(event) => setAddressForm({ ...addressForm, estado: event.target.value })}><option value="">Selecione</option>{['AC', 'AL', 'BA', 'CE', 'DF', 'ES', 'MG', 'PR', 'RJ', 'RS', 'SC', 'SP'].map((estado) => <option key={estado}>{estado}</option>)}</select></label><div><button className="primary-button" type="submit">Salvar</button><button className="secondary-button" type="button" onClick={() => setEditingAddressId(null)}>Cancelar</button></div></form>}</section>
          <section className="account-data-section"><div className="section-heading"><div><h2>Formas de pagamento</h2><p>Gerencie seus cartões salvos.</p></div><button className="secondary-button" type="button" onClick={() => editarCartao()}>Adicionar cartão</button></div>{cards.map((card) => <article className="account-data-card" key={card.id}><div><strong>{card.bandeira} •••• {card.ultimosQuatroDigitos}</strong><p>{card.nomeImpresso} · validade {card.validade}</p></div><div className="account-data-actions"><button type="button" onClick={() => editarCartao(card)}>Editar</button><button type="button" onClick={() => { removeCard(cliente.id, card.id); setCards(getCardsForClient(cliente.id)) }}>Excluir</button></div></article>)}{editingCardId !== null && <form className="account-form account-data-form" onSubmit={salvarCartao}><h3>{editingCardId ? 'Editar cartão' : 'Novo cartão'}</h3><label>Nome impresso<input value={cardForm.nomeImpresso} required onChange={(event) => setCardForm({ ...cardForm, nomeImpresso: event.target.value })} /></label><label>Últimos quatro dígitos<input value={cardForm.numero} inputMode="numeric" maxLength={4} required onChange={(event) => setCardForm({ ...cardForm, numero: event.target.value })} /></label><label>Validade<input value={cardForm.validade} required onChange={(event) => setCardForm({ ...cardForm, validade: event.target.value })} /></label><label>Bandeira<select value={cardForm.bandeira} required onChange={(event) => setCardForm({ ...cardForm, bandeira: event.target.value })}><option value="">Selecione</option>{['Visa', 'Mastercard', 'Elo', 'American Express'].map((bandeira) => <option key={bandeira}>{bandeira}</option>)}</select></label><div><button className="primary-button" type="submit">Salvar</button><button className="secondary-button" type="button" onClick={() => setEditingCardId(null)}>Cancelar</button></div></form>}</section>
          <nav className="account-navigation" aria-label="Navegação da conta">
            <Link className="account-orders-link" to="/meus-pedidos">Meus pedidos</Link>
            <Link className="account-orders-link" to="/cupons">Meus cupons</Link>
          </nav>
          {cliente.status === 'Ativo' && <section className="account-danger-zone"><span className="account-label">Zona de perigo</span><p>Inativar sua conta desativa o acesso à conta.</p><button className="account-inactivate-button" type="button" onClick={() => abrirAcaoConta('inativar')}>Inativar conta</button></section>}
          {cliente.status === 'Inativo' && <section className="account-danger-zone"><span className="account-label">Conta inativa</span><p>Confirme sua senha para reativar sua conta.</p><button className="account-reactivate-button" type="button" onClick={() => abrirAcaoConta('reativar')}>Reativar conta</button></section>}
          {cliente.status === 'Inativo' && <p className="account-inactive-note">Esta conta está inativa e não pode ter novos dados alterados.</p>}
        </div>
      </section>
    </main>{accountAction && <div className="account-modal-backdrop"><section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-action-title"><h2 id="account-action-title">{accountAction === 'inativar' ? 'Inativar conta' : 'Reativar conta'}</h2><p>{accountAction === 'inativar' ? 'Esta ação desativará o acesso à sua conta.' : 'Esta ação reativará o acesso à sua conta.'} Informe sua senha atual para continuar.</p><label>Senha atual<div className="password-field"><input autoFocus type={showAccountPassword ? 'text' : 'password'} value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} /><button type="button" onClick={() => setShowAccountPassword(!showAccountPassword)}>{showAccountPassword ? 'Ocultar' : 'Mostrar'}</button></div></label>{accountActionError && <p className="account-error" role="alert">{accountActionError}</p>}<div className="account-modal-actions"><button className="secondary-button" type="button" onClick={() => setAccountAction(null)}>Cancelar</button><button className="account-inactivate-button" type="button" disabled={!accountPassword} onClick={confirmarAcaoConta}>{accountAction === 'inativar' ? 'Inativar conta' : 'Reativar conta'}</button></div></section></div>}</div>
  )
}