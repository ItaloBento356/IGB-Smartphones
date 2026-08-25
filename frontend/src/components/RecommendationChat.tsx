import { useState } from 'react'
import { Link } from 'react-router-dom'
import { products } from '../data/products'

export function RecommendationChat() {
  const [aberto, setAberto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [resposta, setResposta] = useState('Posso sugerir aparelhos por marca ou modelo. O que você procura?')
  const recomendados = mensagem.trim() ? products.filter((product) => `${product.name} ${product.brand}`.toLowerCase().includes(mensagem.trim().toLowerCase())).slice(0, 3) : products.slice(0, 3)
  const enviar = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setResposta(recomendados.length ? 'Encontrei estas opções para você:' : 'Não encontrei esse modelo. Tente uma marca como Samsung, Apple, Motorola ou Xiaomi.')
    setMensagem('')
  }
  return <div className="recommendation-chat"><button className="chat-toggle" type="button" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>💬 Recomendar</button>{aberto && <section className="chat-panel" aria-label="Assistente de recomendações"><div className="chat-heading"><strong>Assistente IGB</strong><button type="button" onClick={() => setAberto(false)} aria-label="Fechar assistente">×</button></div><p>{resposta}</p><div className="chat-recommendations">{recomendados.map((product) => <Link to={`/produto/${product.id}`} key={product.id}><img src={product.image} alt="" /><span>{product.name}<small>{product.brand}</small></span></Link>)}</div><form onSubmit={enviar}><input value={mensagem} onChange={(event) => setMensagem(event.target.value)} placeholder="Ex.: Samsung" aria-label="Mensagem para o assistente" /><button type="submit">Enviar</button></form></section>}</div>
}
