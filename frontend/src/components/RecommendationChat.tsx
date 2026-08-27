import { useState } from 'react'
import { Link } from 'react-router-dom'
import { products } from '../data/products'

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const converterValor = (valor: string) => {
  const textoLimpo = valor.replace(/\./g, '').replace(',', '.')
  return Number.parseFloat(textoLimpo) || 0
}

const interpretarMensagem = (mensagem: string) => {
  const texto = normalizar(mensagem.trim())

  if (!texto) {
    return { tipo: 'vazio' as const }
  }

  const marcas = [...new Set(products.map((product) => product.brand.toLowerCase()))]
  const marcaEncontrada = marcas.find((marca) => texto.includes(marca))
  const produtoExato = products.find((product) => texto.includes(normalizar(product.name)))
  const intervalos = [
    texto.match(/(?:entre|de)\s*([\d.]+)\s*(?:e|a)\s*([\d.]+)/),
    texto.match(/([\d.]+)\s*(?:a|até|ate)\s*([\d.]+)/),
  ].find(Boolean)

  const limite = texto.match(/(?:ate|até|ate|abaixo de|menos de)\s*\$?\s*([\d.]+)/)?.[1]
  const limiteNumero = limite ? converterValor(limite) : undefined
  const faixa = intervalos
    ? [converterValor(intervalos[1]), converterValor(intervalos[2])]
    : undefined

  const querEscolher = /(ajuda|escolher|recomendar|sugestao|sugestão|procurando|procuro)/.test(texto)
  const perguntaForaDoContexto = !/(smartphone|celular|telefone|aparelho|iphone|galaxy|samsung|apple|motorola|xiaomi|redmi|preço|valor|compra|comprar|marca|modelo)/.test(texto)

  if (perguntaForaDoContexto && !querEscolher && !marcaEncontrada && !produtoExato && !limiteNumero && !faixa) {
    return { tipo: 'fora-do-contexto' as const }
  }

  let produtos = products

  if (marcaEncontrada) {
    produtos = products.filter((product) => normalizar(product.brand) === marcaEncontrada)
  }

  if (produtoExato && !marcaEncontrada) {
    produtos = products.filter((product) => normalizar(product.name).includes(normalizar(produtoExato.name)))
  }

  if (faixa) {
    const [inicio, fim] = faixa
    produtos = produtos.filter((product) => product.price >= inicio && product.price <= fim)
  }

  if (limiteNumero !== undefined) {
    produtos = produtos.filter((product) => product.price <= limiteNumero)
  }

  if (/(barato|mais barato|economico|menor valor)/.test(texto)) {
    produtos = [...produtos].sort((a, b) => a.price - b.price).slice(0, 6)
  }

  if (!marcaEncontrada && !produtoExato && !faixa && !limiteNumero && querEscolher) {
    produtos = products.slice(0, 4)
  }

  return {
    tipo: 'catalogo' as const,
    produtos: [...new Map(produtos.map((product) => [product.id, product])).values()],
  }
}

export function RecommendationChat() {
  const [aberto, setAberto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [resposta, setResposta] = useState('Posso ajudar com smartphones, preços e marcas da loja. O que você procura?')
  const [recomendados, setRecomendados] = useState<typeof products>([])

  const enviar = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!mensagem.trim()) {
      return
    }

    const interpretacao = interpretarMensagem(mensagem)

    if (interpretacao.tipo === 'vazio') {
      return
    }

    if (interpretacao.tipo === 'fora-do-contexto') {
      setResposta('Posso ajudar com smartphones, marcas, modelos e preços da loja. Se quiser, posso indicar opções por marca ou faixa de preço.')
      setRecomendados([])
      setMensagem('')
      return
    }

    setRecomendados(interpretacao.produtos)

    if (interpretacao.produtos.length === 0) {
      setResposta('Não encontrei um resultado exato para sua busca. Posso sugerir opções por marca ou preço.')
    } else {
      const texto = interpretacao.produtos.length === 1 ? 'Encontrei 1 opção relevante:' : `Encontrei ${interpretacao.produtos.length} opções relevantes:`
      setResposta(texto)
    }

    setMensagem('')
  }

  return (
    <div className="recommendation-chat">
      <button className="chat-toggle" type="button" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
        💬 Assistente IGB
      </button>

      {aberto && (
        <section className="chat-panel" aria-label="Assistente de recomendações">
          <div className="chat-heading">
            <strong>Assistente IGB</strong>
            <button type="button" onClick={() => setAberto(false)} aria-label="Fechar assistente">
              ×
            </button>
          </div>

          <p>{resposta}</p>

          <div className="chat-recommendations">
            {recomendados.length > 0 ? (
              recomendados.map((product) => (
                <Link to={`/produto/${product.id}`} key={product.id}>
                  <img src={product.image} alt="" />
                  <span>
                    {product.name}
                    <small>
                      {product.brand} · {formatPrice(product.price)}
                    </small>
                  </span>
                </Link>
              ))
            ) : (
              <p className="chat-empty">Diga uma marca, modelo ou faixa de preço.</p>
            )}
          </div>

          <form onSubmit={enviar}>
            <input
              value={mensagem}
              onChange={(event) => setMensagem(event.target.value)}
              placeholder="Ex.: quero um Samsung até R$ 3000"
              aria-label="Mensagem para o assistente"
            />
            <button type="submit">Enviar</button>
          </form>
        </section>
      )}
    </div>
  )
}

const formatPrice = (price: number) => price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
