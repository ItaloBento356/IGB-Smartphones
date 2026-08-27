import { useEffect, useState } from 'react'
import { obterClientes, obterPedidos, PEDIDOS_UPDATED_EVENT, type Pedido } from '../data/adminData'

const statusQueGeramFaturamento = ['PAGAMENTO REALIZADO', 'EM TRÂNSITO', 'ENTREGUE']
const formatarValor = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminDashboardPage(){
  const [pedidos, setPedidos] = useState<Pedido[]>(obterPedidos)
  const clientes = obterClientes()
  useEffect(() => { const atualizar = () => setPedidos(obterPedidos()); window.addEventListener(PEDIDOS_UPDATED_EVENT, atualizar); return () => window.removeEventListener(PEDIDOS_UPDATED_EVENT, atualizar) }, [])
  const quantidadeDeTrocas = pedidos.reduce((total, pedido) => total + (pedido.itens?.filter((item) => item.troca).length ?? 0), 0)
  const faturamento = pedidos.filter((pedido) => statusQueGeramFaturamento.includes(pedido.status)).reduce((total, pedido) => total + pedido.valor, 0)
  const statusDoGrafico = ['EM ABERTO', 'EM PROCESSAMENTO', 'PAGAMENTO REALIZADO', 'EM TRÂNSITO', 'ENTREGUE', 'TROCA SOLICITADA'] as const
  const pedidosPorStatus = statusDoGrafico.map((status) => ({ status, quantidade: pedidos.filter((pedido) => pedido.status === status).length }))
  const maiorQuantidade = Math.max(...pedidosPorStatus.map((item) => item.quantidade), 1)
    return(
        <section className="admin-dashboard">
            <header className="admin-page-header">
                <h1>Dashboard</h1>
                <p>Visão geral da operação da IGB Smartphones.</p>
        </header>

        <div className="admin-stats">
            <div className="admin-stat">
                <span>Pedidos</span>
              <strong>{pedidos.length}</strong>
        </div>

        <div className="admin-stat">
          <span>Clientes</span>
          <strong>{clientes.length}</strong>
        </div>

        <div className="admin-stat">
          <span>Trocas</span>
          <strong>{quantidadeDeTrocas}</strong>
        </div>

        <div className="admin-stat">
          <span>Faturamento</span>
          <strong>{formatarValor(faturamento)}</strong>
        </div>
      </div>

      <div className="admin-analysis">
        <h2>Pedidos por status</h2>
      <p>Quantidade de pedidos em cada etapa atual. Período: todos os pedidos registrados.</p>
      <div className="admin-chart-legend"><span><i /> Pedidos</span><small>Escala: quantidade de pedidos</small></div>

        <div className="admin-chart" role="img" aria-label="Quantidade de pedidos por status">
          {pedidosPorStatus.map((item) => <div className="admin-chart-column" key={item.status}><strong>{item.quantidade}</strong><span style={{ height: `${Math.max((item.quantidade / maiorQuantidade) * 100, item.quantidade ? 12 : 2)}%` }} /><small>{item.status}</small></div>)}
        </div>
      </div>
    </section>
  )

}
