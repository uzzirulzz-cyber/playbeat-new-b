import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const NAV = [
  { to: '/categories/gaming', label: 'Gaming' },
  { to: '/categories/software-saas', label: 'Software' },
  { to: '/categories/gift-cards', label: 'Gift Cards' },
  { to: '/categories/social-media-services', label: 'Social Media' },
  { to: '/categories/web-hosting', label: 'Web Hosting' },
  { to: '/categories/digital-marketing', label: 'Marketing' },
  { to: '/categories/web3', label: 'Web3' },
];

export const Header = () => {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/products?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold shrink-0">
            <span className="text-electric">PLAYBEAT</span>
            <span className="text-accent">.DIGITAL</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <NavLink to="/" className={({ isActive }) => `px-3 py-2 text-sm rounded-lg hover:bg-white/5 ${isActive ? 'text-electric-light' : 'text-slate-300'}`} end>Home</NavLink>
            <NavLink to="/categories" className={({ isActive }) => `px-3 py-2 text-sm rounded-lg hover:bg-white/5 ${isActive ? 'text-electric-light' : 'text-slate-300'}`}>Categories</NavLink>
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className="px-3 py-2 text-sm text-slate-300 rounded-lg hover:bg-white/5 hover:text-electric-light">{item.label}</NavLink>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-xs ml-auto">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="input !py-2 text-sm" />
          </form>

          <div className="flex items-center gap-2 ml-auto md:ml-0">
            <Link to="/cart" className="relative btn-ghost !px-3" aria-label="Cart">
              🛒
              {count > 0 && <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-accent text-navy-950 text-xs font-bold grid place-items-center px-1">{count}</span>}
            </Link>
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/account" className="btn-ghost !px-3 text-sm">Account</Link>
                <button onClick={logout} className="btn-ghost !px-3 text-sm">Logout</button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Register</Link>
              </div>
            )}
            <button onClick={() => setOpen((o) => !o)} className="lg:hidden btn-ghost !px-3" aria-label="Menu">☰</button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden pb-4 flex flex-col gap-2 animate-fade-in">
            <form onSubmit={submitSearch} className="flex">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="input text-sm" />
            </form>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/" onClick={() => setOpen(false)} className="btn-ghost text-sm">Home</Link>
              <Link to="/categories" onClick={() => setOpen(false)} className="btn-ghost text-sm">All Categories</Link>
              {NAV.map((i) => <Link key={i.to} to={i.to} onClick={() => setOpen(false)} className="btn-ghost text-sm">{i.label}</Link>)}
            </div>
            {user ? (
              <>
                <Link to="/account" onClick={() => setOpen(false)} className="btn-primary text-sm">My Account</Link>
                <button onClick={() => { logout(); setOpen(false); }} className="btn-ghost text-sm">Logout</button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm">Login</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary flex-1 text-sm">Register</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export const Footer = ({ settings }) => (
  <footer className="mt-20 border-t border-white/10 bg-navy-950">
    <div className="mx-auto max-w-7xl px-4 py-12 grid gap-8 md:grid-cols-4">
      <div>
        <div className="font-display text-lg font-bold">
          <span className="text-electric">PLAYBEAT</span><span className="text-accent">.DIGITAL</span>
        </div>
        <p className="mt-3 text-sm text-slate-400 max-w-xs">{settings?.tagline || 'Your Digital World. One Powerful Marketplace.'}</p>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-200 mb-3">Marketplace</h4>
        <ul className="space-y-2 text-sm text-slate-400">
          <li><Link to="/products" className="hover:text-electric-light">All Products</Link></li>
          <li><Link to="/categories" className="hover:text-electric-light">Categories</Link></li>
          <li><Link to="/cart" className="hover:text-electric-light">Cart</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-200 mb-3">Account</h4>
        <ul className="space-y-2 text-sm text-slate-400">
          <li><Link to="/account" className="hover:text-electric-light">My Account</Link></li>
          <li><Link to="/account/orders" className="hover:text-electric-light">Orders</Link></li>
          <li><Link to="/account/downloads" className="hover:text-electric-light">Downloads</Link></li>
          <li><Link to="/account/tickets" className="hover:text-electric-light">Support</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-200 mb-3">Trust & Security</h4>
        <ul className="space-y-2 text-sm text-slate-400">
          <li>🔒 Secure Payments</li>
          <li>⚡ Instant Delivery</li>
          <li>🛟 24/7 Support</li>
        </ul>
        <div className="mt-4 flex gap-3 text-slate-500">
          {settings?.social?.twitter && <a href={settings.social.twitter} target="_blank" rel="noreferrer" className="hover:text-electric-light">𝕏</a>}
          {settings?.social?.discord && <a href={settings.social.discord} target="_blank" rel="noreferrer" className="hover:text-electric-light">Discord</a>}
        </div>
      </div>
    </div>
    <div className="border-t border-white/5 py-5 text-center text-xs text-slate-500">
      © {new Date().getFullYear()} PlayBeat Digital. All rights reserved.
    </div>
  </footer>
);
