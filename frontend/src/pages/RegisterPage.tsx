import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { cadastrarCliente, ErroCadastroCliente } from '../data/clienteApi'
import { apenasNumeros, EMAIL_REGEX, formatarCep, formatarCpf } from '../utils/formatadores'

interface FormularioCadastro {
  nome: string
  genero: string
  dataNascimento: string
  cpf: string
  telefoneTipo: string
  ddd: string
  telefoneNumero: string
  email: string
  senha: string
  confirmacaoSenha: string
  tipoResidencia: string
  tipoLogradouro: string
  logradouro: string
  numero: string
  bairro: string
  cep: string
  cidade: string
  estado: string
  pais: string
  observacoes: string
  entregaIgualCobranca: boolean
  entregaNome: string
  entregaTipoResidencia: string
  entregaTipoLogradouro: string
  entregaLogradouro: string
  entregaNumero: string
  entregaBairro: string
  entregaCep: string
  entregaCidade: string
  entregaEstado: string
  entregaPais: string
  entregaObservacoes: string
}

const FORMULARIO_INICIAL: FormularioCadastro = {
  nome: '',
  genero: '',
  dataNascimento: '',
  cpf: '',
  telefoneTipo: '',
  ddd: '',
  telefoneNumero: '',
  email: '',
  senha: '',
  confirmacaoSenha: '',
  tipoResidencia: '',
  tipoLogradouro: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cep: '',
  cidade: '',
  estado: '',
  pais: 'Brasil',
  observacoes: '',
  entregaIgualCobranca: true,
  entregaNome: '',
  entregaTipoResidencia: '',
  entregaTipoLogradouro: '',
  entregaLogradouro: '',
  entregaNumero: '',
  entregaBairro: '',
  entregaCep: '',
  entregaCidade: '',
  entregaEstado: '',
  entregaPais: 'Brasil',
  entregaObservacoes: '',
}

type ErrosFormulario = Partial<Record<keyof FormularioCadastro, string>>

const SENHA_CARACTERE_ESPECIAL_REGEX = /[^A-Za-z0-9]/

function validarFormulario(dados: FormularioCadastro): ErrosFormulario {
  const erros: ErrosFormulario = {}

  if (!dados.nome.trim()) erros.nome = 'Informe o nome.'
  if (!dados.genero) erros.genero = 'Selecione o gênero.'
  if (!dados.dataNascimento) erros.dataNascimento = 'Informe a data de nascimento.'
  if (apenasNumeros(dados.cpf).length !== 11) erros.cpf = 'Informe um CPF válido com 11 dígitos.'

  if (!dados.telefoneTipo) erros.telefoneTipo = 'Selecione o tipo de telefone.'
  if (apenasNumeros(dados.ddd).length !== 2) erros.ddd = 'Informe o DDD com 2 dígitos.'
  if (!apenasNumeros(dados.telefoneNumero)) erros.telefoneNumero = 'Informe o número de telefone.'

  if (!dados.email.trim()) erros.email = 'Informe o e-mail.'
  else if (!EMAIL_REGEX.test(dados.email.trim())) erros.email = 'Informe um e-mail válido.'

  if (!dados.senha) erros.senha = 'Informe a senha.'
  else if (dados.senha.length < 8) erros.senha = 'A senha deve ter no mínimo 8 caracteres.'
  else if (!/[A-Z]/.test(dados.senha)) erros.senha = 'A senha deve ter ao menos uma letra maiúscula.'
  else if (!/[a-z]/.test(dados.senha)) erros.senha = 'A senha deve ter ao menos uma letra minúscula.'
  else if (!SENHA_CARACTERE_ESPECIAL_REGEX.test(dados.senha)) erros.senha = 'A senha deve ter ao menos um caractere especial.'

  if (!dados.confirmacaoSenha) erros.confirmacaoSenha = 'Confirme a senha.'
  else if (dados.confirmacaoSenha !== dados.senha) erros.confirmacaoSenha = 'As senhas não coincidem.'

  if (!dados.tipoResidencia) erros.tipoResidencia = 'Selecione o tipo de residência.'
  if (!dados.tipoLogradouro) erros.tipoLogradouro = 'Selecione o tipo de logradouro.'
  if (!dados.logradouro.trim()) erros.logradouro = 'Informe o logradouro.'
  if (!dados.numero.trim()) erros.numero = 'Informe o número.'
  if (!dados.bairro.trim()) erros.bairro = 'Informe o bairro.'
  if (apenasNumeros(dados.cep).length !== 8) erros.cep = 'Informe um CEP válido com 8 dígitos.'
  if (!dados.cidade.trim()) erros.cidade = 'Informe a cidade.'
  if (!dados.estado.trim()) erros.estado = 'Informe o estado.'
  if (!dados.pais.trim()) erros.pais = 'Informe o país.'

  if (!dados.entregaNome.trim()) erros.entregaNome = 'Informe uma identificação para o endereço de entrega.'

  if (!dados.entregaIgualCobranca) {
    if (!dados.entregaTipoResidencia) erros.entregaTipoResidencia = 'Selecione o tipo de residência.'
    if (!dados.entregaTipoLogradouro) erros.entregaTipoLogradouro = 'Selecione o tipo de logradouro.'
    if (!dados.entregaLogradouro.trim()) erros.entregaLogradouro = 'Informe o logradouro.'
    if (!dados.entregaNumero.trim()) erros.entregaNumero = 'Informe o número.'
    if (!dados.entregaBairro.trim()) erros.entregaBairro = 'Informe o bairro.'
    if (apenasNumeros(dados.entregaCep).length !== 8) erros.entregaCep = 'Informe um CEP válido com 8 dígitos.'
    if (!dados.entregaCidade.trim()) erros.entregaCidade = 'Informe a cidade.'
    if (!dados.entregaEstado.trim()) erros.entregaEstado = 'Informe o estado.'
    if (!dados.entregaPais.trim()) erros.entregaPais = 'Informe o país.'
  }

  return erros
}

export default function RegisterPage() {
  const [dados, setDados] = useState<FormularioCadastro>(FORMULARIO_INICIAL)
  const [erros, setErros] = useState<ErrosFormulario>({})
  const [erroEnvio, setErroEnvio] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cadastroConcluido, setCadastroConcluido] = useState(false)

  const atualizarCampo = <K extends keyof FormularioCadastro>(campo: K, valor: string) => {
    setDados((atual) => ({ ...atual, [campo]: valor }))
  }

  const cadastrar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (enviando) return

    setErroEnvio('')
    const errosValidacao = validarFormulario(dados)
    setErros(errosValidacao)
    if (Object.keys(errosValidacao).length > 0) return

    setEnviando(true)
    try {
      await cadastrarCliente({
        nome: dados.nome.trim(),
        genero: dados.genero,
        dataNascimento: dados.dataNascimento,
        cpf: apenasNumeros(dados.cpf),
        telefoneTipo: dados.telefoneTipo,
        ddd: apenasNumeros(dados.ddd),
        telefoneNumero: apenasNumeros(dados.telefoneNumero),
        email: dados.email.trim(),
        senha: dados.senha,
        confirmacaoSenha: dados.confirmacaoSenha,
        enderecoCobranca: {
          tipoResidencia: dados.tipoResidencia,
          tipoLogradouro: dados.tipoLogradouro,
          logradouro: dados.logradouro.trim(),
          numero: dados.numero.trim(),
          bairro: dados.bairro.trim(),
          cep: apenasNumeros(dados.cep),
          cidade: dados.cidade.trim(),
          estado: dados.estado.trim().toUpperCase(),
          pais: dados.pais.trim(),
          observacoes: dados.observacoes.trim() || undefined,
        },
        enderecoEntrega: {
          nome: 'Principal',
          tipoResidencia: dados.tipoResidencia,
          tipoLogradouro: dados.tipoLogradouro,
          logradouro: dados.logradouro.trim(),
          numero: dados.numero.trim(),
          bairro: dados.bairro.trim(),
          cep: apenasNumeros(dados.cep),
          cidade: dados.cidade.trim(),
          estado: dados.estado.trim().toUpperCase(),
          pais: dados.pais.trim(),
          observacoes: dados.observacoes.trim() || undefined,
        },
      })
      setCadastroConcluido(true)
    } catch (erro) {
      if (erro instanceof ErroCadastroCliente) {
        setErroEnvio(erro.message)

        if (erro.camposConflitantes?.length) {
          setErros((atual) => ({
            ...atual,
            ...(erro.camposConflitantes?.includes('cpf') ? { cpf: 'CPF já cadastrado.' } : {}),
            ...(erro.camposConflitantes?.includes('email') ? { email: 'E-mail já cadastrado.' } : {}),
          }))
        }
      } else {
        setErroEnvio(erro instanceof Error ? erro.message : 'Erro ao comunicar com o servidor. Tente novamente.')
      }
    } finally {
      setEnviando(false)
    }
  }

  if (cadastroConcluido) {
    return (
      <main className="container">
        <section className="section account-page">
          <div className="section-heading">
            <div>
              <h1>Cadastro concluído</h1>
              <p>Sua conta foi criada com sucesso na IGB Smartphones.</p>
            </div>
          </div>
          <div className="account-panel">
            <p className="account-message">Agora você já pode entrar com o e-mail e a senha cadastrados.</p>
            <Link className="primary-button account-save-button" to="/login">Ir para login</Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="container">
      <section className="section account-page">
        <div className="section-heading">
          <div>
            <h1>Cadastro</h1>
            <p>Crie seu cadastro na IGB Smartphones.</p>
          </div>
          <Link to="/login">Voltar para login</Link>
        </div>

        <form className="account-panel account-form" onSubmit={cadastrar} noValidate>
          <fieldset className="account-form-section">
            <legend>Dados pessoais</legend>
            <div className="account-fields">
              <label htmlFor="campo-nome">
                Nome
                <input
                  id="campo-nome"
                  value={dados.nome}
                  onChange={(event) => atualizarCampo('nome', event.target.value)}
                  aria-invalid={Boolean(erros.nome)}
                />
                {erros.nome && <span className="account-error" role="alert">{erros.nome}</span>}
              </label>

              <label htmlFor="campo-genero">
                Gênero
                <select
                  id="campo-genero"
                  value={dados.genero}
                  onChange={(event) => atualizarCampo('genero', event.target.value)}
                  aria-invalid={Boolean(erros.genero)}
                >
                  <option value="">Selecione</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                  <option value="Prefiro não informar">Prefiro não informar</option>
                </select>
                {erros.genero && <span className="account-error" role="alert">{erros.genero}</span>}
              </label>

              <label htmlFor="campo-data-nascimento">
                Data de nascimento
                <input
                  id="campo-data-nascimento"
                  type="date"
                  value={dados.dataNascimento}
                  onChange={(event) => atualizarCampo('dataNascimento', event.target.value)}
                  aria-invalid={Boolean(erros.dataNascimento)}
                />
                {erros.dataNascimento && <span className="account-error" role="alert">{erros.dataNascimento}</span>}
              </label>

              <label htmlFor="campo-cpf">
                CPF
                <input
                  id="campo-cpf"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={dados.cpf}
                  onChange={(event) => atualizarCampo('cpf', formatarCpf(event.target.value))}
                  aria-invalid={Boolean(erros.cpf)}
                />
                {erros.cpf && <span className="account-error" role="alert">{erros.cpf}</span>}
              </label>
            </div>
          </fieldset>

          <fieldset className="account-form-section">
            <legend>Contato</legend>
            <div className="account-fields">
              <label htmlFor="campo-telefone-tipo">
                Tipo de telefone
                <select
                  id="campo-telefone-tipo"
                  value={dados.telefoneTipo}
                  onChange={(event) => atualizarCampo('telefoneTipo', event.target.value)}
                  aria-invalid={Boolean(erros.telefoneTipo)}
                >
                  <option value="">Selecione</option>
                  <option value="Celular">Celular</option>
                  <option value="Residencial">Residencial</option>
                  <option value="Comercial">Comercial</option>
                </select>
                {erros.telefoneTipo && <span className="account-error" role="alert">{erros.telefoneTipo}</span>}
              </label>

              <label htmlFor="campo-ddd">
                DDD
                <input
                  id="campo-ddd"
                  inputMode="numeric"
                  placeholder="11"
                  value={dados.ddd}
                  onChange={(event) => atualizarCampo('ddd', apenasNumeros(event.target.value).slice(0, 2))}
                  aria-invalid={Boolean(erros.ddd)}
                />
                {erros.ddd && <span className="account-error" role="alert">{erros.ddd}</span>}
              </label>

              <label htmlFor="campo-telefone-numero">
                Número de telefone
                <input
                  id="campo-telefone-numero"
                  inputMode="numeric"
                  placeholder="999998888"
                  value={dados.telefoneNumero}
                  onChange={(event) => atualizarCampo('telefoneNumero', apenasNumeros(event.target.value).slice(0, 9))}
                  aria-invalid={Boolean(erros.telefoneNumero)}
                />
                {erros.telefoneNumero && <span className="account-error" role="alert">{erros.telefoneNumero}</span>}
              </label>

              <label htmlFor="campo-email">
                E-mail
                <input
                  id="campo-email"
                  type="email"
                  value={dados.email}
                  onChange={(event) => atualizarCampo('email', event.target.value)}
                  aria-invalid={Boolean(erros.email)}
                />
                {erros.email && <span className="account-error" role="alert">{erros.email}</span>}
              </label>
            </div>
          </fieldset>

          <fieldset className="account-form-section">
            <legend>Segurança</legend>
            <div className="account-fields">
              <label htmlFor="campo-senha">
                Senha
                <input
                  id="campo-senha"
                  type="password"
                  value={dados.senha}
                  onChange={(event) => atualizarCampo('senha', event.target.value)}
                  aria-invalid={Boolean(erros.senha)}
                />
                {erros.senha && <span className="account-error" role="alert">{erros.senha}</span>}
              </label>

              <label htmlFor="campo-confirmacao-senha">
                Confirmar senha
                <input
                  id="campo-confirmacao-senha"
                  type="password"
                  value={dados.confirmacaoSenha}
                  onChange={(event) => atualizarCampo('confirmacaoSenha', event.target.value)}
                  aria-invalid={Boolean(erros.confirmacaoSenha)}
                />
                {erros.confirmacaoSenha && <span className="account-error" role="alert">{erros.confirmacaoSenha}</span>}
              </label>
            </div>
          </fieldset>

          <fieldset className="account-form-section">
            <legend>Endereço residencial</legend>
            <div className="account-fields">
              <label htmlFor="campo-tipo-residencia">
                Tipo de residência
                <select
                  id="campo-tipo-residencia"
                  value={dados.tipoResidencia}
                  onChange={(event) => atualizarCampo('tipoResidencia', event.target.value)}
                  aria-invalid={Boolean(erros.tipoResidencia)}
                >
                  <option value="">Selecione</option>
                  <option value="Casa">Casa</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Outro">Outro</option>
                </select>
                {erros.tipoResidencia && <span className="account-error" role="alert">{erros.tipoResidencia}</span>}
              </label>

              <label htmlFor="campo-tipo-logradouro">
                Tipo de logradouro
                <select
                  id="campo-tipo-logradouro"
                  value={dados.tipoLogradouro}
                  onChange={(event) => atualizarCampo('tipoLogradouro', event.target.value)}
                  aria-invalid={Boolean(erros.tipoLogradouro)}
                >
                  <option value="">Selecione</option>
                  <option value="Rua">Rua</option>
                  <option value="Avenida">Avenida</option>
                  <option value="Alameda">Alameda</option>
                  <option value="Travessa">Travessa</option>
                  <option value="Rodovia">Rodovia</option>
                  <option value="Praça">Praça</option>
                  <option value="Outro">Outro</option>
                </select>
                {erros.tipoLogradouro && <span className="account-error" role="alert">{erros.tipoLogradouro}</span>}
              </label>

              <label htmlFor="campo-logradouro">
                Logradouro
                <input
                  id="campo-logradouro"
                  value={dados.logradouro}
                  onChange={(event) => atualizarCampo('logradouro', event.target.value)}
                  aria-invalid={Boolean(erros.logradouro)}
                />
                {erros.logradouro && <span className="account-error" role="alert">{erros.logradouro}</span>}
              </label>

              <label htmlFor="campo-numero">
                Número
                <input
                  id="campo-numero"
                  value={dados.numero}
                  onChange={(event) => atualizarCampo('numero', event.target.value)}
                  aria-invalid={Boolean(erros.numero)}
                />
                {erros.numero && <span className="account-error" role="alert">{erros.numero}</span>}
              </label>

              <label htmlFor="campo-bairro">
                Bairro
                <input
                  id="campo-bairro"
                  value={dados.bairro}
                  onChange={(event) => atualizarCampo('bairro', event.target.value)}
                  aria-invalid={Boolean(erros.bairro)}
                />
                {erros.bairro && <span className="account-error" role="alert">{erros.bairro}</span>}
              </label>

              <label htmlFor="campo-cep">
                CEP
                <input
                  id="campo-cep"
                  inputMode="numeric"
                  placeholder="00000-000"
                  value={dados.cep}
                  onChange={(event) => atualizarCampo('cep', formatarCep(event.target.value))}
                  aria-invalid={Boolean(erros.cep)}
                />
                {erros.cep && <span className="account-error" role="alert">{erros.cep}</span>}
              </label>

              <label htmlFor="campo-cidade">
                Cidade
                <input
                  id="campo-cidade"
                  value={dados.cidade}
                  onChange={(event) => atualizarCampo('cidade', event.target.value)}
                  aria-invalid={Boolean(erros.cidade)}
                />
                {erros.cidade && <span className="account-error" role="alert">{erros.cidade}</span>}
              </label>

              <label htmlFor="campo-estado">
                Estado (UF)
                <input
                  id="campo-estado"
                  maxLength={2}
                  placeholder="SP"
                  value={dados.estado}
                  onChange={(event) => atualizarCampo('estado', event.target.value.toUpperCase())}
                  aria-invalid={Boolean(erros.estado)}
                />
                {erros.estado && <span className="account-error" role="alert">{erros.estado}</span>}
              </label>

              <label htmlFor="campo-pais">
                País
                <input
                  id="campo-pais"
                  value={dados.pais}
                  onChange={(event) => atualizarCampo('pais', event.target.value)}
                  aria-invalid={Boolean(erros.pais)}
                />
                {erros.pais && <span className="account-error" role="alert">{erros.pais}</span>}
              </label>

              <label htmlFor="campo-observacoes">
                Observações (opcional)
                <textarea
                  id="campo-observacoes"
                  rows={2}
                  value={dados.observacoes}
                  onChange={(event) => atualizarCampo('observacoes', event.target.value)}
                />
              </label>
            </div>
          </fieldset>

          {erroEnvio && (
            <div className="account-error-banner" role="alert">
              <strong>Não foi possível realizar o cadastro.</strong>
              <span>{erroEnvio}</span>
            </div>
          )}

          <button className="primary-button account-save-button" type="submit" disabled={enviando}>
            {enviando ? 'Cadastrando...' : 'Cadastrar cliente'}
          </button>
        </form>
      </section>
    </main>
  )
}