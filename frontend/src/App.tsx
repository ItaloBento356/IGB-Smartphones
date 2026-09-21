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
import ConsultaClientesPage from './pages/ConsultaClientesPage'
import EditarClientePage from './pages/EditarClientePage'
import AdminPedidosPage from './pages/AdminPedidosPage'
import ClientAccountPage from './pages/ClientAccountPage'
import CheckoutReviewPage from './pages/CheckoutReviewPage'
import MyOrdersPage from './pages/MyOrdersPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import AdminTrocasPage from './pages/AdminTrocasPage'
import CouponsPage from './pages/CouponsPage'




function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/catalogo" element={<CatalogPage />} />
    <Route path="/produto/:id" element={<ProductPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/cadastro" element={<RegisterPage />} />
    <Route path="/carrinho" element={<CartPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/checkout/revisao" element={<CheckoutReviewPage />} />
    <Route path="/pedido-confirmado/:id" element={<OrderConfirmationPage />} />
    <Route path="/meus-pedidos" element={<MyOrdersPage />} />
    <Route path="/minha-conta" element={<ClientAccountPage />} />
    <Route path="/cupons" element={<CouponsPage />} />
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
    <Route
      path="/admin/clientes/consulta"
      element={
        <AdminLayout>
          <ConsultaClientesPage />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/clientes/editar/:id"
      element={
        <AdminLayout>
          <EditarClientePage />
        </AdminLayout>
      }
    />
    <Route
      path="/admin/pedidos"
      element={
        <AdminLayout>
          <AdminPedidosPage />
        </AdminLayout>
      }
    />
    <Route path="/admin/trocas" element={<AdminLayout><AdminTrocasPage /></AdminLayout>} />
  </Routes></BrowserRouter>
}

export default App
