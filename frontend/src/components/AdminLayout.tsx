import { Link } from 'react-router-dom'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <strong>IGB</strong>
          <span>Smartphones</span>
        </div>

        <nav className="admin-nav">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/clientes">Clientes</Link>
          <Link to="/admin/pedidos">Pedidos</Link>
          <Link to="/admin/analise">Análise</Link>
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <span>Painel administrativo</span>
          <span>Administrador</span>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}