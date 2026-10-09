import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext.jsx';
import { ProtectedRoute, RequirePermission } from './ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admins from './pages/Admins.jsx';
import Categories from './pages/Categories.jsx';
import Products from './pages/Products.jsx';
import ProductForm from './pages/ProductForm.jsx';
import Inventory from './pages/Inventory.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Customers from './pages/Customers.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';
import Support from './pages/Support.jsx';
import Faqs from './pages/Faqs.jsx';
import Chatbot from './pages/Chatbot.jsx';
import Reviews from './pages/Reviews.jsx';
import Marketing from './pages/Marketing.jsx';
import Subscribers from './pages/Subscribers.jsx';
import Campaigns from './pages/Campaigns.jsx';
import Ads from './pages/Ads.jsx';
import Settings from './pages/Settings.jsx';
import Homepage from './pages/Homepage.jsx';
import ComingSoon from './pages/ComingSoon.jsx';

// Mounted at /admin/* (lazy-loaded, so customers never download admin code).
export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route index element={<RequirePermission perm="dashboard:view"><Dashboard /></RequirePermission>} />
          <Route path="admins" element={<RequirePermission perm="admins:manage"><Admins /></RequirePermission>} />
          <Route path="categories" element={<RequirePermission perm="categories:write"><Categories /></RequirePermission>} />
          <Route path="products" element={<RequirePermission perm="products:read"><Products /></RequirePermission>} />
          <Route path="products/new" element={<RequirePermission perm="products:write"><ProductForm /></RequirePermission>} />
          <Route path="products/:id" element={<RequirePermission perm="products:write"><ProductForm /></RequirePermission>} />
          <Route path="inventory" element={<RequirePermission perm="products:read"><Inventory /></RequirePermission>} />
          <Route path="orders" element={<RequirePermission perm="orders:read"><Orders /></RequirePermission>} />
          <Route path="orders/:id" element={<RequirePermission perm="orders:read"><OrderDetail /></RequirePermission>} />
          <Route path="customers" element={<RequirePermission perm="customers:read"><Customers /></RequirePermission>} />
          <Route path="customers/:id" element={<RequirePermission perm="customers:read"><CustomerDetail /></RequirePermission>} />
          <Route path="support" element={<RequirePermission perm="support:manage"><Support /></RequirePermission>} />
          <Route path="faq" element={<RequirePermission perm="content:manage"><Faqs /></RequirePermission>} />
          <Route path="chatbot" element={<RequirePermission perm="chatbot:manage"><Chatbot /></RequirePermission>} />
          <Route path="reviews" element={<RequirePermission perm="reviews:moderate"><Reviews /></RequirePermission>} />
          <Route path="marketing" element={<RequirePermission perm="marketing:manage"><Marketing /></RequirePermission>} />
          <Route path="subscribers" element={<RequirePermission perm="marketing:manage"><Subscribers /></RequirePermission>} />
          <Route path="campaigns" element={<RequirePermission perm="marketing:manage"><Campaigns /></RequirePermission>} />
          <Route path="ads" element={<RequirePermission perm="ads:manage"><Ads /></RequirePermission>} />
          <Route path="settings" element={<RequirePermission perm="settings:read"><Settings /></RequirePermission>} />
          <Route path="homepage" element={<RequirePermission perm="content:manage"><Homepage /></RequirePermission>} />
          <Route path=":section" element={<ComingSoon />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
