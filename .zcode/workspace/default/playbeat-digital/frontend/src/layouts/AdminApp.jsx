import { Routes, Route, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from '../context/AdminAuthContext';
import { ToastProvider } from '../components/Toast';
import { HelmetProvider } from 'react-helmet-async';
import { AdminRoute } from '../components/AdminRoute';
import { Loader } from '../components/ui';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminProducts from '../pages/admin/AdminProducts';
import AdminProductForm from '../pages/admin/AdminProductForm';
import AdminCategories from '../pages/admin/AdminCategories';
import AdminInventory from '../pages/admin/AdminInventory';
import AdminOrders from '../pages/admin/AdminOrders';
import AdminOrderDetail from '../pages/admin/AdminOrderDetail';
import AdminCustomers from '../pages/admin/AdminCustomers';
import AdminCustomerDetail from '../pages/admin/AdminCustomerDetail';
import AdminPayments from '../pages/admin/AdminPayments';
import AdminCoupons from '../pages/admin/AdminCoupons';
import AdminHomepage from '../pages/admin/AdminHomepage';
import AdminTickets from '../pages/admin/AdminTickets';
import AdminTicketDetail from '../pages/admin/AdminTicketDetail';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminAuditLogs from '../pages/admin/AdminAuditLogs';
import AdminUsers from '../pages/admin/AdminUsers';

const NAV = [
  { section: 'Overview', items: [
    { to: '/admin', label: 'Dashboard', icon: '📊', perm: 'dashboard', end: true },
    { to: '/admin/analytics', label: 'Analytics', icon: '📈', perm: 'analytics' },
  ]},
  { section: 'Catalog', items: [
    { to: '/admin/products', label: 'Products', icon: '📦', perm: 'products' },
    { to: '/admin/categories', label: 'Categories', icon: '🗂️', perm: 'categories' },
    { to: '/admin/inventory', label: 'Inventory', icon: '🔑', perm: 'inventory' },
    { to: '/admin/coupons', label: 'Coupons', icon: '🏷️', perm: 'coupons' },
  ]},
  { section: 'Sales', items: [
    { to: '/admin/orders', label: 'Orders', icon: '🧾', perm: 'orders' },
    { to: '/admin/payments', label: 'Payments', icon: '💳', perm: 'payments' },
    { to: '/admin/customers', label: 'Customers', icon: '👥', perm: 'customers' },
  ]},
  { section: 'Content & Support', items: [
    { to: '/admin/homepage', label: 'Homepage Builder', icon: '🏗️', perm: 'homepage' },
    { to: '/admin/tickets', label: 'Support Tickets', icon: '🎫', perm: 'tickets' },
  ]},
  { section: 'System', items: [
    { to: '/admin/settings', label: 'Settings', icon: '⚙️', perm: 'settings' },
    { to: '/admin/users', label: 'Admin Users', icon: '🛡️', perm: 'settings' },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: '📜', perm: 'audit' },
  ]},
];

const ROLE_PERMS = {
  superadmin: ['*'],
  admin: ['dashboard','analytics','products','categories','inventory','orders','customers','payments','coupons','homepage','tickets','settings','reviews','audit'],
  manager: ['dashboard','products','categories','inventory','orders'],
  support: ['dashboard','tickets','customers','orders'],
};

const canSee = (admin, perm) => {
  if (!admin) return false;
  const allowed = ROLE_PERMS[admin.role] || [];
  return allowed.includes('*') || allowed.includes(perm);
};

const Sidebar = () => {
  const { admin, logout } = useAdminAuth();
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-white/10 bg-navy-950/60 p-3 h-screen sticky top-0 overflow-y-auto">
      <NavLink to="/admin" className="font-display text-lg font-bold px-2 py-3" end>
        <span className="text-electric">PLAYBEAT</span><span className="text-accent">.ADMIN</span>
      </NavLink>
      <nav className="flex-1 space-y-4 mt-2">
        {NAV.map((group) => {
          const items = group.items.filter((i) => canSee(admin, i.perm));
          if (!items.length) return null;
          return (
            <div key={group.section}>
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{group.section}</div>
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition ${isActive ? 'bg-electric/15 text-electric-light' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  <span>{item.icon}</span>{item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/10 pt-3 mt-3">
        <div className="px-2 text-xs text-slate-400">{admin?.name}<br /><span className="text-slate-500 capitalize">{admin?.role}</span></div>
        <button onClick={logout} className="mt-2 w-full btn-ghost text-sm !py-1.5">Logout</button>
      </div>
    </aside>
  );
};

const TopBar = () => {
  const { admin } = useAdminAuth();
  const location = useLocation();
  const crumbs = location.pathname.split('/').filter(Boolean).slice(1).join(' / ') || 'Dashboard';
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-navy-950/80 backdrop-blur-xl px-4 lg:px-6 py-3">
      <div>
        <h1 className="font-display text-lg font-bold capitalize text-slate-100">{crumbs}</h1>
        <p className="text-xs text-slate-500">PlayBeat Digital Admin</p>
      </div>
      <div className="flex items-center gap-3">
        <NavLink to="/" target="_blank" className="btn-ghost text-sm">View Store ↗</NavLink>
        <div className="hidden sm:flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-electric to-accent text-navy-950 text-sm font-bold">
            {admin?.name?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

const AdminLayout = () => (
  <div className="flex min-h-screen">
    <Sidebar />
    <div className="flex-1 min-w-0 flex flex-col">
      <TopBar />
      <main className="flex-1 p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  </div>
);

// Mobile fallback nav (simple horizontal) since sidebar is lg-only.
const MobileNav = () => {
  const { admin } = useAdminAuth();
  const items = NAV.flatMap((g) => g.items).filter((i) => canSee(admin, i.perm));
  return (
    <div className="lg:hidden sticky top-0 z-40 border-b border-white/10 bg-navy-950/90 backdrop-blur-xl overflow-x-auto">
      <div className="flex gap-1 p-2">
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs ${isActive ? 'bg-electric/15 text-electric-light' : 'text-slate-300'}`}>
            {i.icon} {i.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

const AdminShell = () => {
  const { loading } = useAdminAuth();
  if (loading) return <Loader full />;
  return (
    <>
      <MobileNav />
      <AdminLayout />
    </>
  );
};

export const AdminApp = () => (
  <HelmetProvider>
    <AdminAuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route element={<AdminRoute><AdminShell /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id/edit" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:id" element={<AdminCustomerDetail />} />
            <Route path="homepage" element={<AdminHomepage />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="tickets/:id" element={<AdminTicketDetail />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AdminAuthProvider>
  </HelmetProvider>
);
