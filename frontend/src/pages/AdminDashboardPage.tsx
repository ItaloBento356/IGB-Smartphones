export default function AdminDashboardPage(){
    return(
        <section className="admin-dashboard">
            <header className="admin-page-header">
                <h1>Dashboard</h1>
                <p>Visão geral da operação da IGB Smartphones.</p>
        </header>

        <div className="admin-stats">
            <div className="admin-stat">
                <span>Pedidos</span>
                <strong>12</strong>
        </div>

        <div className="admin-stat">
          <span>Clientes</span>
          <strong>4</strong>
        </div>

        <div className="admin-stat">
          <span>Trocas</span>
          <strong>3</strong>
        </div>

        <div className="admin-stat">
          <span>Faturamento</span>
          <strong>R$ 27.580,00</strong>
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
