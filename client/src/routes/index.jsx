import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';
import Home from '../customer/pages/Home.jsx';
import Shop from '../customer/pages/Shop.jsx';
import Product from '../customer/pages/Product.jsx';
import Cart from '../customer/pages/Cart.jsx';
import Checkout from '../customer/pages/Checkout.jsx';
import OrderSuccess from '../customer/pages/OrderSuccess.jsx';
import Track from '../customer/pages/Track.jsx';
import Contact from '../customer/pages/Contact.jsx';
import Faq from '../customer/pages/Faq.jsx';
import Unsubscribe from '../customer/pages/Unsubscribe.jsx';
import CmsPage from '../customer/pages/CmsPage.jsx';

const AdminApp = lazy(() => import('../admin/AdminApp.jsx'));

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={<Suspense fallback={<div className="grid min-h-screen place-items-center text-muted" role="status">…</div>}><AdminApp /></Suspense>}
      />
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:slug" element={<Product />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-success" element={<OrderSuccess />} />
        <Route path="track" element={<Track />} />
        <Route path="contact" element={<Contact />} />
        <Route path="faq" element={<Faq />} />
        <Route path="unsubscribe" element={<Unsubscribe />} />
        <Route path="about" element={<CmsPage slug="about" />} />
        <Route path="privacy" element={<CmsPage slug="privacy" />} />
        <Route path="terms" element={<CmsPage slug="terms" />} />
        <Route path="returns" element={<CmsPage slug="returns" />} />
        <Route path="shipping" element={<CmsPage slug="shipping" />} />
        <Route path="payment" element={<CmsPage slug="payment" />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
