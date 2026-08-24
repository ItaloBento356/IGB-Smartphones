import { obterClientes, obterPedidos } from '../data/adminData'

const statusQueRepresentamTroca = ['TROCA', 'ITEM']
const statusQueGeramFaturamento = ['PAGAMENTO REALIZADO', 'EM TRÂNSITO', 'ENTREGUE']
const pedidos = obterPedidos()

const quantidadeDeTrocas = pedidos.filter((pedido) =>
  statusQueRepresentamTroca.some((status) => pedido.status.includes(status)),
).length

const faturamento = pedidos
  .filter((pedido) => statusQueGeramFaturamento.includes(pedido.status))
  .reduce((total, pedido) => total + pedido.valor, 0)

const formatarValor = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminDashboardPage(){
  const clientes = obterClientes()
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
        <h2>Análise de pedidos</h2>
        <p>Visualização dos pedidos por status.</p>

        <div className="admin-chart-placeholder">
          Gráfico de análise
        </div>
      </div>
    </section>
  )

}
