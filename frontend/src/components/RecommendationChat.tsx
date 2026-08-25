import { useState } from 'react'
import { Link } from 'react-router-dom'
import { products } from '../data/products'

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const interpretarMensagem = (mensagem: string) => {
  const texto = normalizar(mensagem)
  const marcas = [...new Set(products.map((product) => product.brand))]
  const marca = marcas.find((item) => texto.includes(normalizar(item)))
  const mencionaIphone = texto.includes('iphone')
  const encontrouModelo = products.some((product) => {
    const nome = normalizar(product.name)
    return texto.includes(nome) || nome.split(' ').some((parte) => parte.length > 3 && texto.includes(parte))
  })
  const falaDeAparelho = /celular|smartphone|aparelho|telefone|mobile/.test(texto)
  const falaDeCompra = /quero|comprar|compra|procuro|preciso|tem algum|recomenda|sugestao/.test(texto)
  const falaDePreco = /preco|valor|barato|mais barato|menor preco|economico|ate|menos de|abaixo de/.test(texto)
  const falaDeCaracteristica = /camera|bateria|memoria|armazenamento|desempenho|jogo|jogar|tela|5g/.test(texto)
  const mensagemRelevante = Boolean(marca || mencionaIphone || encontrouModelo || falaDeAparelho || falaDeCompra || falaDePreco || falaDeCaracteristica)
  const faixaEncontrada = texto.match(/entre\s*r?\$?\s*([\d.]+(?:,\d{1,2})?)\s*e\s*r?\$?\s*([\d.]+(?:,\d{1,2})?)/)
  const limiteEncontrado = texto.match(/(?:ate|menos de|abaixo de)\s*r?\$?\s*([\d.]+(?:,\d{1,2})?)/)
  const converterValor = (valor: string) => Number(valor.replace(/\./g, '').replace(',', '.'))
  const faixa = faixaEncontrada ? [converterValor(faixaEncontrada[1]), converterValor(faixaEncontrada[2])] : undefined
  const limite = limiteEncontrado ? converterValor(limiteEncontrado[1]) : undefined
  const mencionaPrecoBaixo = /barato|mais barato|menor preco|economico/.test(texto)
  if (!mensagemRelevante) return { produtos: [], limite, relevante: false }
  if (!marca && !mencionaIphone && !encontrouModelo && !limite && !faixa && !mencionaPrecoBaixo && !falaDeCaracteristica && !falaDeAparelho) return { produtos: [], limite, relevante: false }
  const filtros = products.filter((product) => {
    const correspondeMarca = marca ? product.brand === marca : mencionaIphone ? product.brand === 'Apple' : true
    const correspondeNome = encontrouModelo && !marca && !mencionaIphone ? normalizar(`${product.name} ${product.brand}`).split(' ').some((parte) => parte.length > 3 && texto.includes(parte)) : true
    const correspondePreco = faixa ? product.price >= faixa[0] && product.price <= faixa[1] : limite === undefined || product.price <= limite
    return correspondeMarca && correspondeNome && correspondePreco
  })

  return { produtos: [...filtros].sort((a, b) => mencionaPrecoBaixo ? a.price - b.price : 0).slice(0, marca || mencionaIphone || encontrouModelo || limite || faixa || mencionaPrecoBaixo ? products.length : 3), limite, relevante: true }
}

export function RecommendationChat() {
  const [aberto, setAberto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [resposta, setResposta] = useState('Posso sugerir aparelhos por marca ou modelo. O que você procura?')
  const [recomendados, setRecomendados] = useState<typeof products>([])
  const enviar = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!mensagem.trim()) {
      setRecomendados([])
      setResposta('Digite uma mensagem para receber uma recomendação.')
      return
    }
    const interpretacao = interpretarMensagem(mensagem)
    setRecomendados(interpretacao.produtos)
    setResposta(interpretacao.produtos.length ? `Encontrei ${interpretacao.produtos.length} opção(ões) reais no catálogo:` : interpretacao.relevante && interpretacao.limite !== undefined ? 'Não encontrei produtos dentro desse limite de preço. Tente um valor maior ou outra marca.' : interpretacao.relevante ? 'Não encontrei esse modelo ou marca no catálogo. Tente Samsung, Apple, Motorola ou Xiaomi.' : /oi|ola|bom dia|boa tarde|boa noite/.test(normalizar(mensagem)) ? 'Olá! Posso ajudar você a encontrar um smartphone. Você pode me dizer uma marca, modelo ou faixa de preço?' : 'Posso ajudar você a encontrar smartphones, comparar produtos, marcas e preços. O que você procura?')
    setMensagem('')
  }
  return <div className="recommendation-chat"><button className="chat-toggle" type="button" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>💬 Recomendar</button>{aberto && <section className="chat-panel" aria-label="Assistente de recomendações"><div className="chat-heading"><strong>Assistente IGB</strong><button type="button" onClick={() => setAberto(false)} aria-label="Fechar assistente">×</button></div><p>{resposta}</p><div className="chat-recommendations">{recomendados.map((product) => <Link to={`/produto/${product.id}`} key={product.id}><img src={product.image} alt="" /><span>{product.name}<small>{product.brand} · {formatPrice(product.price)}</small></span></Link>)}</div><form onSubmit={enviar}><input value={mensagem} onChange={(event) => setMensagem(event.target.value)} placeholder="Ex.: Samsung" aria-label="Mensagem para o assistente" /><button type="submit">Enviar</button></form></section>}</div>
}

const formatPrice = (price: number) => price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
