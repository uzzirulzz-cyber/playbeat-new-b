import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/Toast';
import { StoreLayout } from './layouts/StoreLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

import Home from './pages/store/Home';
import Products from './pages/store/Products';
import ProductDetail from './pages/store/ProductDetail';
import Categories from './pages/store/Categories';
import Category from './pages/store/Category';
import Cart from './pages/store/Cart';
import Checkout from './pages/store/Checkout';
import OrderSuccess from './pages/store/OrderSuccess';
import OrderFailed from './pages/store/OrderFailed';
import Login from './pages/store/Login';
import Register from './pages/store/Register';
import ForgotPassword from './pages/store/ForgotPassword';
import ResetPassword from './pages/store/ResetPassword';
import NotFound from './pages/store/NotFound';
import { AccountLayout } from './layouts/AccountLayout';
import AccountDashboard from './pages/account/AccountDashboard';
import AccountOrders from './pages/account/AccountOrders';
import AccountOrderDetail from './pages/account/AccountOrderDetail';
import AccountDownloads from './pages/account/AccountDownloads';
import AccountTickets from './pages/account/AccountTickets';
import AccountTicketDetail from './pages/account/AccountTicketDetail';
import AccountWishlist from './pages/account/AccountWishlist';
import AccountProfile from './pages/account/AccountProfile';

import { AdminApp } from './layouts/AdminApp';

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<StoreLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:slug" element={<ProductDetail />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/categories/:slug" element={<Category />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/order/success" element={<OrderSuccess />} />
                  <Route path="/order/failed" element={<OrderFailed />} />
                  <Route path="/403" element={<NotFound code={403} message="You don't have access to this page." />} />
                  <Route path="/500" element={<NotFound code={500} message="Something went wrong on our end." />} />
                  <Route path="*" element={<NotFound />} />
                </Route>

                <Route path="/account" element={<ProtectedRoute><AccountLayout /></ProtectedRoute>}>
                  <Route index element={<AccountDashboard />} />
                  <Route path="orders" element={<AccountOrders />} />
                  <Route path="orders/:id" element={<AccountOrderDetail />} />
                  <Route path="downloads" element={<AccountDownloads />} />
                  <Route path="tickets" element={<AccountTickets />} />
                  <Route path="tickets/:id" element={<AccountTicketDetail />} />
                  <Route path="wishlist" element={<AccountWishlist />} />
                  <Route path="profile" element={<AccountProfile />} />
                  <Route path="*" element={<Navigate to="/account" replace />} />
                </Route>

                <Route path="/admin/*" element={<AdminApp />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
