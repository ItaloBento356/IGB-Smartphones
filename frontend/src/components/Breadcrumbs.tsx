import { Link } from 'react-router-dom'

interface BreadcrumbItem { label: string; to?: string }

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return <nav className="breadcrumbs" aria-label="Navegação estrutural">{items.map((item, index) => <span key={item.label}>{index > 0 && <span aria-hidden="true"> &gt; </span>}{item.to ? <Link to={item.to}>{item.label}</Link> : <strong>{item.label}</strong>}</span>)}</nav>
}
