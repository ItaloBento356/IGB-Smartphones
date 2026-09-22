import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  atualizarCliente,
  obterClientePorId,
  adicionarEnderecoEntrega,
  atualizarEnderecoEntrega,
  listarCartoes,
  definirCartaoComoPreferencial,
  ErroAtualizacaoCliente,
  type EnderecoCliente,
  type CartaoCliente,
} from '../data/clienteApi'
import { apenasNumeros, EMAIL_REGEX, formatarCep, formatarCpf } from '../utils/formatadores'

interface FormularioEdicao {
  nome: string
  genero: string
  dataNascimento: string
  cpf: string
  telefoneTipo: string
  ddd: string
  telefoneNumero: string
  email: string
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
}

const FORMULARIO_VAZIO: FormularioEdicao = {
  nome: '',
  genero: '',
  dataNascimento: '',
  cpf: '',
  telefoneTipo: '',
  ddd: '',
  telefoneNumero: '',
  email: '',
  tipoResidencia: '',
  tipoLogradouro: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cep: '',
  cidade: '',
  estado: '',
  pais: '',
  observacoes: '',
}
interface FormularioEnderecoEntrega {
  nome: string
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
}

const ENDERECO_ENTREGA_VAZIO: FormularioEnderecoEntrega = {
  nome: '',
  tipoResidencia: '',
  tipoLogradouro: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cep: '',
  cidade: '',
  estado: '',
  pais: '',
  observacoes: '',
}
type ErrosFormulario = Partial<Record<keyof FormularioEdicao, string>>

function validarFormulario(dados: FormularioEdicao): ErrosFormulario {
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

  if (!dados.tipoResidencia) erros.tipoResidencia = 'Selecione o tipo de residência.'
  if (!dados.tipoLogradouro) erros.tipoLogradouro = 'Selecione o tipo de logradouro.'
  if (!dados.logradouro.trim()) erros.logradouro = 'Informe o logradouro.'
  if (!dados.numero.trim()) erros.numero = 'Informe o número.'
  if (!dados.bairro.trim()) erros.bairro = 'Informe o bairro.'
  if (apenasNumeros(dados.cep).length !== 8) erros.cep = 'Informe um CEP válido com 8 dígitos.'
  if (!dados.cidade.trim()) erros.cidade = 'Informe a cidade.'
  if (!dados.estado.trim()) erros.estado = 'Informe o estado.'
  if (!dados.pais.trim()) erros.pais = 'Informe o país.'

  return erros
}

export default function EditarClientePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState('')
  const [codigoCliente, setCodigoCliente] = useState('')
  const [dados, setDados] = useState<FormularioEdicao>(FORMULARIO_VAZIO)
  const [erros, setErros] = useState<ErrosFormulario>({})
  const [erroEnvio, setErroEnvio] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [cartoes, setCartoes] = useState<CartaoCliente[]>([])
  const [carregandoCartoes, setCarregandoCartoes] = useState(false)
  const [erroCartoes, setErroCartoes] = useState('')
  const [enderecosEntrega, setEnderecosEntrega] = useState<EnderecoCliente[]>([])
  const [formularioEnderecoEntrega, setFormularioEnderecoEntrega] =
    useState<FormularioEnderecoEntrega>(ENDERECO_ENTREGA_VAZIO)
  const [editandoEnderecoEntrega, setEditandoEnderecoEntrega] = useState<number | null>(null)
  const [adicionandoEnderecoEntrega, setAdicionandoEnderecoEntrega] = useState(false)
  const [salvandoEnderecoEntrega, setSalvandoEnderecoEntrega] = useState(false)
  const [erroEnderecoEntrega, setErroEnderecoEntrega] = useState('')

  useEffect(() => {
  if (!id) return

  setCarregando(true)
  setErroCarregamento('')
  setCarregandoCartoes(true)
  setErroCartoes('')

  obterClientePorId(Number(id))
    .then(async (cliente) => {
      setCodigoCliente(cliente.codigoCliente)
      setEnderecosEntrega(cliente.enderecosEntrega)

      setDados({
        nome: cliente.nome,
        genero: cliente.genero,
        dataNascimento: cliente.dataNascimento,
        cpf: formatarCpf(cliente.cpf),
        telefoneTipo: cliente.telefoneTipo,
        ddd: cliente.ddd,
        telefoneNumero: cliente.telefoneNumero,
        email: cliente.email,
        tipoResidencia: cliente.enderecoCobranca.tipoResidencia,
        tipoLogradouro: cliente.enderecoCobranca.tipoLogradouro,
        logradouro: cliente.enderecoCobranca.logradouro,
        numero: cliente.enderecoCobranca.numero,
        bairro: cliente.enderecoCobranca.bairro,
        cep: formatarCep(cliente.enderecoCobranca.cep),
        cidade: cliente.enderecoCobranca.cidade,
        estado: cliente.enderecoCobranca.estado,
        pais: cliente.enderecoCobranca.pais,
        observacoes: cliente.enderecoCobranca.observacoes ?? '',
      })

      try {
        const cartoesCliente = await listarCartoes(Number(id))
        setCartoes(cartoesCliente)
      } catch (erro) {
        setErroCartoes(
          erro instanceof Error
            ? erro.message
            : 'Não foi possível carregar os cartões.',
        )
      } finally {
        setCarregandoCartoes(false)
      }
    })
    .catch((erro) => {
      setErroCarregamento(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível carregar o cliente.',
      )
      setCarregandoCartoes(false)
    })
    .finally(() => setCarregando(false))
}, [id])


  const atualizarCampo = <K extends keyof FormularioEdicao>(campo: K, valor: string) => {
    setDados((atual) => ({ ...atual, [campo]: valor }))
  }


const atualizarCampoEnderecoEntrega = <K extends keyof FormularioEnderecoEntrega>(
  campo: K,
  valor: string,
) => {
  setFormularioEnderecoEntrega((atual) => ({
    ...atual,
    [campo]: valor,
  }))
}

const iniciarNovoEnderecoEntrega = () => {
  setFormularioEnderecoEntrega(ENDERECO_ENTREGA_VAZIO)
  setEditandoEnderecoEntrega(null)
  setAdicionandoEnderecoEntrega(true)
  setErroEnderecoEntrega('')
}

const iniciarEdicaoEnderecoEntrega = (endereco: EnderecoCliente) => {
  setFormularioEnderecoEntrega({
    nome: endereco.nome ?? '',
    tipoResidencia: endereco.tipoResidencia,
    tipoLogradouro: endereco.tipoLogradouro,
    logradouro: endereco.logradouro,
    numero: endereco.numero,
    bairro: endereco.bairro,
    cep: formatarCep(endereco.cep),
    cidade: endereco.cidade,
    estado: endereco.estado,
    pais: endereco.pais,
    observacoes: endereco.observacoes ?? '',
  })

  setEditandoEnderecoEntrega(endereco.id)
  setAdicionandoEnderecoEntrega(false)
  setErroEnderecoEntrega('')
}

const cancelarEdicaoEnderecoEntrega = () => {
  setEditandoEnderecoEntrega(null)
  setAdicionandoEnderecoEntrega(false)
  setFormularioEnderecoEntrega(ENDERECO_ENTREGA_VAZIO)
  setErroEnderecoEntrega('')
}
  const salvarEnderecoEntrega = async () => {
  if (!id) return

  setErroEnderecoEntrega('')

  if (!formularioEnderecoEntrega.nome.trim()) {
    setErroEnderecoEntrega('Informe uma identificação para o endereço.')
    return
  }

  if (!formularioEnderecoEntrega.tipoResidencia) {
    setErroEnderecoEntrega('Selecione o tipo de residência.')
    return
  }

  if (!formularioEnderecoEntrega.tipoLogradouro) {
    setErroEnderecoEntrega('Selecione o tipo de logradouro.')
    return
  }

  if (!formularioEnderecoEntrega.logradouro.trim()) {
    setErroEnderecoEntrega('Informe o logradouro.')
    return
  }

  if (!formularioEnderecoEntrega.numero.trim()) {
    setErroEnderecoEntrega('Informe o número.')
    return
  }

  if (!formularioEnderecoEntrega.bairro.trim()) {
    setErroEnderecoEntrega('Informe o bairro.')
    return
  }

  if (apenasNumeros(formularioEnderecoEntrega.cep).length !== 8) {
    setErroEnderecoEntrega('Informe um CEP válido com 8 dígitos.')
    return
  }

  if (!formularioEnderecoEntrega.cidade.trim()) {
    setErroEnderecoEntrega('Informe a cidade.')
    return
  }

  if (!formularioEnderecoEntrega.estado.trim()) {
    setErroEnderecoEntrega('Informe o estado.')
    return
  }

  if (!formularioEnderecoEntrega.pais.trim()) {
    setErroEnderecoEntrega('Informe o país.')
    return
  }

  setSalvandoEnderecoEntrega(true)

  const dados = {
    nome: formularioEnderecoEntrega.nome.trim(),
    tipoResidencia: formularioEnderecoEntrega.tipoResidencia,
    tipoLogradouro: formularioEnderecoEntrega.tipoLogradouro,
    logradouro: formularioEnderecoEntrega.logradouro.trim(),
    numero: formularioEnderecoEntrega.numero.trim(),
    bairro: formularioEnderecoEntrega.bairro.trim(),
    cep: apenasNumeros(formularioEnderecoEntrega.cep),
    cidade: formularioEnderecoEntrega.cidade.trim(),
    estado: formularioEnderecoEntrega.estado.trim().toUpperCase(),
    pais: formularioEnderecoEntrega.pais.trim(),
    observacoes: formularioEnderecoEntrega.observacoes.trim() || undefined,
  }

  try {
    const clienteAtualizado = editandoEnderecoEntrega
      ? await atualizarEnderecoEntrega(Number(id), editandoEnderecoEntrega, dados)
      : await adicionarEnderecoEntrega(Number(id), dados)

    setEnderecosEntrega(clienteAtualizado.enderecosEntrega)
    cancelarEdicaoEnderecoEntrega()
  } catch (erro) {
    setErroEnderecoEntrega(
      erro instanceof Error
        ? erro.message
        : 'Não foi possível salvar o endereço de entrega.',
    )
  } finally {
    setSalvandoEnderecoEntrega(false)
  }
}

  const tornarCartaoPreferencial = async (cartaoId: number) => {
    if (!id) return

    setErroCartoes('')

    try {
      await definirCartaoComoPreferencial(Number(id), cartaoId)

      const cartoesAtualizados = await listarCartoes(Number(id))
      setCartoes(cartoesAtualizados)
    } catch (erro) {
      setErroCartoes(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível definir o cartão como preferencial.',
      )
    }
  }

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (salvando || !id) return

    setErroEnvio('')
    const errosValidacao = validarFormulario(dados)
    setErros(errosValidacao)
    if (Object.keys(errosValidacao).length > 0) return

    setSalvando(true)
    try {
      await atualizarCliente(Number(id), {
        nome: dados.nome.trim(),
        genero: dados.genero,
        dataNascimento: dados.dataNascimento,
        cpf: apenasNumeros(dados.cpf),
        telefoneTipo: dados.telefoneTipo,
        ddd: apenasNumeros(dados.ddd),
        telefoneNumero: apenasNumeros(dados.telefoneNumero),
        email: dados.email.trim(),
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
      })

      navigate('/admin/clientes/consulta', { state: { mensagemSucesso: 'Cliente atualizado com sucesso.' } })
    } catch (erro) {
      if (erro instanceof ErroAtualizacaoCliente) {
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
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <section className="admin-clientes">
        <header className="admin-page-header">
          <h1>Editar cliente</h1>
        </header>
        <div className="admin-list-panel">
          <p>Carregando dados do cliente...</p>
        </div>
      </section>
    )
  }

  if (erroCarregamento) {
    return (
      <section className="admin-clientes">
        <header className="admin-page-header">
          <h1>Editar cliente</h1>
        </header>
        <div className="admin-list-panel">
          <div className="account-error-banner" role="alert">
            <strong>Não foi possível carregar o cliente.</strong>
            <span>{erroCarregamento}</span>
          </div>
          <Link to="/admin/clientes/consulta">Voltar para a consulta</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="admin-clientes">
      <header className="admin-page-header">
        <h1>Editar cliente</h1>
        <p>Código do cliente: <strong>{codigoCliente}</strong></p>
      </header>

      <form className="admin-list-panel account-form" onSubmit={salvar} noValidate>
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
          <legend>Endereço de cobrança</legend>
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
                <fieldset className="account-form-section">
          <legend>Endereços de entrega</legend>

          {enderecosEntrega.length === 0 && !adicionandoEnderecoEntrega && (
            <p>Nenhum endereço de entrega cadastrado.</p>
          )}

          {enderecosEntrega.map((endereco) => (
            <div key={endereco.id} className="admin-detail-panel">
              <div className="admin-detail-heading">
                <div>
                  <strong>{endereco.nome}</strong>
                  <p>
                    {endereco.tipoLogradouro} {endereco.logradouro}, {endereco.numero}
                    {' — '}
                    {endereco.bairro}, {endereco.cidade} - {endereco.estado}
                  </p>
                </div>

                <button
                  className="admin-action-button"
                  type="button"
                  onClick={() => iniciarEdicaoEnderecoEntrega(endereco)}
                >
                  Editar
                </button>
              </div>
            </div>
          ))}

          {(adicionandoEnderecoEntrega || editandoEnderecoEntrega !== null) && (
            <div className="account-form-section">
              <h3>
                {editandoEnderecoEntrega !== null
                  ? 'Editar endereço de entrega'
                  : 'Novo endereço de entrega'}
              </h3>

              <div className="account-fields">
                <label htmlFor="entrega-nome">
                  Identificação
                  <input
                    id="entrega-nome"
                    value={formularioEnderecoEntrega.nome}
                    placeholder="Ex.: Casa, Trabalho"
                    onChange={(event) =>
                      atualizarCampoEnderecoEntrega('nome', event.target.value)
                    }
                  />
                </label>

                <label htmlFor="entrega-tipo-residencia">
                  Tipo de residência
                  <select
                    id="entrega-tipo-residencia"
                    value={formularioEnderecoEntrega.tipoResidencia}
                    onChange={(event) =>
                      atualizarCampoEnderecoEntrega('tipoResidencia', event.target.value)
                    }
                  >
                    <option value="">Selecione</option>
                    <option value="Casa">Casa</option>
                    <option value="Apartamento">Apartamento</option>
                    <option value="Outro">Outro</option>
                  </select>
                </label>

                <label htmlFor="entrega-tipo-logradouro">
                  Tipo de logradouro
                  <select
                    id="entrega-tipo-logradouro"
                    value={formularioEnderecoEntrega.tipoLogradouro}
                    onChange={(event) =>
                      atualizarCampoEnderecoEntrega('tipoLogradouro', event.target.value)
                    }
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
                </label>

                <label htmlFor="entrega-logradouro">
                  Logradouro
                  <input
                    id="entrega-logradouro"
                    value={formularioEnderecoEntrega.logradouro}
                    onChange={(event) =>
                      atualizarCampoEnderecoEntrega('logradouro', event.target.value)
                    }
                  />
                </label>

                <label htmlFor="entrega-numero">
                  Número
                  <input
                    id="entrega-numero"
                    value={formularioEnderecoEntrega.numero}
                    onChange={(event) =>
                      atualizarCampoEnderecoEntrega('numero', event.target.value)
                    }
                  />
                </label>

                <label htmlFor="entrega-bairro">
                  Bairro
                  <input
                    id="entrega-bairro"
                    value={formularioEnderecoEntrega.bairro}
                    onChange={(event) =>
                      atualizarCampoEnderecoEntrega('bairro', event.target.value)
                    }
                  />
                </label>

                <label htmlFor="entrega-cep">
                  CEP
                  <input
                    id="entrega-cep"
                    inputMode="numeric"
                    placeholder="00000-000"
                    value={formularioEnderecoEntrega.cep}
                    onChange={(event) =>
                      atualizarCampoEnderecoEntrega(
                        'cep',
                        formatarCep(event.target.value),
                      )
                    }
                  />
                </label>

                <label htmlFor="entrega-cidade">
                  Cidade
                  <input
                    id="entrega-cidade"
                    value={formularioEnderecoEntrega.cidade}
                    onChange={(event) =>
                      atualizarCampoEnderecoEntrega('cidade', event.target.value)
                    }
                  />
                </label>

                <label htmlFor="entrega-estado">
                  Estado (UF)
                  <input
                    id="entrega-estado"
                    maxLength={2}
                    value={formularioEnderecoEntrega.estado}
                    onChange={(event) =>
                      atualizarCampoEnderecoEntrega(
                        'estado',
                        event.target.value.toUpperCase(),
                      )
                    }
                  />
                </label>

                <label htmlFor="entrega-pais">
                  País
                  <input
                    id="entrega-pais"
                    value={formularioEnderecoEntrega.pais}
                    onChange={(event) =>
                      atualizarCampoEnderecoEntrega('pais', event.target.value)
                    }
                  />
                </label>

                <label htmlFor="entrega-observacoes">
                  Observações (opcional)
                  <textarea
                    id="entrega-observacoes"
                    rows={2}
                    value={formularioEnderecoEntrega.observacoes}
                    onChange={(event) =>
                      atualizarCampoEnderecoEntrega(
                        'observacoes',
                        event.target.value,
                      )
                    }
                  />
                </label>
              </div>

              {erroEnderecoEntrega && (
                <div className="account-error-banner" role="alert">
                  {erroEnderecoEntrega}
                </div>
              )}

              <div className="admin-filtros-acoes">
                <button
                  className="primary-button"
                  type="button"
                  onClick={salvarEnderecoEntrega}
                  disabled={salvandoEnderecoEntrega}
                >
                  {salvandoEnderecoEntrega ? 'Salvando...' : 'Salvar endereço'}
                </button>

                <button
                  className="admin-action-button"
                  type="button"
                  onClick={cancelarEdicaoEnderecoEntrega}
                  disabled={salvandoEnderecoEntrega}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {!adicionandoEnderecoEntrega && editandoEnderecoEntrega === null && (
            <button
              className="admin-action-button"
              type="button"
              onClick={iniciarNovoEnderecoEntrega}
            >
              + Adicionar endereço de entrega
            </button>
          )}
        </fieldset>

        {erroEnvio && (
          <div className="account-error-banner" role="alert">
            <strong>Não foi possível salvar as alterações.</strong>
            <span>{erroEnvio}</span>
          </div>
        )}

        <div className="admin-filtros-acoes">
          <button className="primary-button account-save-button" type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <Link className="admin-action-button" to="/admin/clientes/consulta">Cancelar</Link>
        </div>
      </form>
    </section>
  )
}
