import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import ProductPage from './pages/ProductPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/AdminLayout'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminClientesPage from './pages/AdminClientesPage'




function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/catalogo" element={<CatalogPage />} />
    <Route path="/produto/:id" element={<ProductPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/cadastro" element={<RegisterPage />} />
    <Route path="/carrinho" element={<CartPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route
      path="/admin"
      element={
        <AdminLayout>
          <AdminDashboardPage/>
        </AdminLayout>
      }
    />
    <Route
      path="/admin/clientes"
      element={
        <AdminLayout>
          <AdminClientesPage />
        </AdminLayout>
      }
    />
  </Routes></BrowserRouter>
}

export default App
