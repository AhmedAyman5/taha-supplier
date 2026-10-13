import { Route, Routes } from 'react-router'
import DashboardLayout from '../layouts/DashboardLayout/DashboardLayout'
import BannerForm from '../pages/Banners/BannerForm'
import Banners from '../pages/Banners/Banners'
import Brands from '../pages/Brands/Brands'
import Categories from '../pages/Categories/Categories'
import Coupons from '../pages/Coupons/Coupons'
import CustomerDetails from '../pages/Customers/CustomerDetails'
import Customers from '../pages/Customers/Customers'
import Dashboard from '../pages/Dashboard/Dashboard'
import Login from '../pages/Login/Login'
import NotFound from '../pages/NotFound/NotFound'
import Notifications from '../pages/Notifications/Notifications'
import Orders from '../pages/Orders/Orders'
import ProductForm from '../pages/Products/ProductForm'
import Products from '../pages/Products/Products'
import ShippingZones from '../pages/ShippingZones/ShippingZones'
import SubCategories from '../pages/SubCategories/SubCategories'
import ProtectedRoute from './ProtectedRoute'

// ALL routes live here. /login is public; every other page needs a session (ProtectedRoute)
// and renders inside DashboardLayout
function AppRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetails />} />
          <Route path="categories" element={<Categories />} />
          <Route path="sub-categories" element={<SubCategories />} />
          <Route path="brands" element={<Brands />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="banners" element={<Banners />} />
          <Route path="banners/new" element={<BannerForm />} />
          <Route path="banners/:id/edit" element={<BannerForm />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="shipping-zones" element={<ShippingZones />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
