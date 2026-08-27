import { Link, useLocation } from 'react-router-dom'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()

  return (
    <div className="admin-layout">
      <header className="admin-topbar">
        <div className="admin-brand">
          <strong>IGB</strong>
          <span>Smartphones</span>
        </div>

        <nav className="admin-nav" aria-label="Navegação administrativa">
          <Link to="/admin" aria-current={location.pathname === '/admin' ? 'page' : undefined}>Dashboard</Link>
          <Link to="/admin/clientes" aria-current={location.pathname === '/admin/clientes' ? 'page' : undefined}>Clientes</Link>
          <Link to="/admin/pedidos" aria-current={location.pathname === '/admin/pedidos' ? 'page' : undefined}>Pedidos</Link>
          <Link to="/admin/trocas" aria-current={location.pathname === '/admin/trocas' ? 'page' : undefined}>Trocas</Link>
        </nav>

        <span className="admin-user-pill">Administrador</span>
      </header>

      <main className="admin-content">
        {children}
      </main>
    </div>
  )
}