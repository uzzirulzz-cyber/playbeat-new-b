import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Header, Footer } from '../components/Header';
import { useSettings } from '../hooks/useSettings';

const NAV = [
  { to: '/account', label: 'Dashboard', end: true },
  { to: '/account/orders', label: 'Orders' },
  { to: '/account/downloads', label: 'Downloads' },
  { to: '/account/tickets', label: 'Support' },
  { to: '/account/wishlist', label: 'Wishlist' },
  { to: '/account/profile', label: 'Profile' },
];

export const AccountLayout = () => {
  const { user, logout } = useAuth();
  const { fetchCart } = useCart();
  const navigate = useNavigate();
  const { settings } = useSettings();

  const handleLogout = async () => {
    await logout();
    fetchCart();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-slate-100">My Account</h1>
          <p className="text-slate-400 text-sm">Welcome back, {user?.name}.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="glass p-3 h-fit lg:sticky lg:top-20">
            <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${isActive ? 'bg-electric/15 text-electric-light' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  {item.label}
                </NavLink>
              ))}
              <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10">Logout</button>
            </nav>
          </aside>
          <div><Outlet /></div>
        </div>
      </main>
      <Footer settings={settings} />
    </div>
  );
};
