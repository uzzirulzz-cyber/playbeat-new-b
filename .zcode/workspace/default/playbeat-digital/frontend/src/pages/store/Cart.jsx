import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { useSettings } from '../../hooks/useSettings';
import { Seo } from '../../components/Seo';
import { EmptyState, Loader } from '../../components/ui';
import { formatPrice } from '../../lib/format';

export default function Cart() {
  const { cart, loading, updateQty, remove, applyCoupon, removeCoupon } = useCart();
  const { user } = useAuth();
  const { success, error } = useToast();
  const { currencySymbol } = useSettings();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState('');
  const [applying, setApplying] = useState(false);

  const handleCoupon = async (e) => {
    e.preventDefault();
    setApplying(true);
    try { await applyCoupon(coupon); success('Coupon applied'); setCoupon(''); }
    catch (err) { error(err.message); }
    finally { setApplying(false); }
  };

  if (loading) return <Loader full />;
  if (!cart.items?.length) {
    return <EmptyState icon="🛒" title="Your cart is empty" description="Browse the marketplace and add some digital products." action={<Link to="/products" className="btn-primary">Browse Products</Link>} />;
  }

  const totals = cart.totals || { subtotal: 0, discount: 0, tax: 0, total: 0 };

  return (
    <>
      <Seo title="Cart" />
      <h1 className="font-display text-3xl font-bold text-slate-100 mb-6">Shopping Cart</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => (
            <div key={item.id || item.productId} className="glass-card flex items-center gap-4 !p-4">
              <img src={item.image || `https://picsum.photos/seed/${item.productId}/120/90`} alt={item.name} className="h-20 w-24 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.slug}`} className="font-medium text-slate-100 hover:text-electric-light truncate block">{item.name}</Link>
                {item.variantName && <span className="text-xs text-slate-400">{item.variantName}</span>}
                {!item.inStock && <span className="block text-xs text-rose-300">Out of stock</span>}
                <div className="mt-1 text-sm text-electric-light">{formatPrice(item.unitPrice, cart.currency, currencySymbol)}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.id || item.productId, Math.max(1, item.qty - 1))} className="btn-ghost !px-2 !py-1">−</button>
                <span className="w-8 text-center text-sm">{item.qty}</span>
                <button onClick={() => updateQty(item.id || item.productId, item.qty + 1)} className="btn-ghost !px-2 !py-1">+</button>
              </div>
              <div className="w-24 text-right font-semibold text-slate-100">{formatPrice(item.lineTotal, cart.currency, currencySymbol)}</div>
              <button onClick={() => remove(item.id || item.productId)} className="text-slate-500 hover:text-rose-400">✕</button>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="glass-card">
            <h3 className="font-semibold text-slate-100 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-300"><span>Subtotal</span><span>{formatPrice(totals.subtotal, cart.currency, currencySymbol)}</span></div>
              {totals.discount > 0 && <div className="flex justify-between text-emerald-300"><span>Discount {cart.couponCode ? `(${cart.couponCode})` : ''}</span><span>−{formatPrice(totals.discount, cart.currency, currencySymbol)}</span></div>}
              {totals.tax > 0 && <div className="flex justify-between text-slate-300"><span>Tax</span><span>{formatPrice(totals.tax, cart.currency, currencySymbol)}</span></div>}
              <div className="border-t border-white/10 pt-2 flex justify-between text-lg font-bold text-slate-100"><span>Total</span><span>{formatPrice(totals.total, cart.currency, currencySymbol)}</span></div>
            </div>

            <form onSubmit={handleCoupon} className="mt-4 flex gap-2">
              <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" className="input !py-2 text-sm" />
              <button disabled={applying} className="btn-ghost text-sm">{applying ? '…' : 'Apply'}</button>
            </form>
            {cart.couponCode && <button onClick={() => removeCoupon()} className="mt-2 text-xs text-slate-500 hover:text-rose-400">Remove coupon</button>}

            <button onClick={() => navigate(user ? '/checkout' : '/login', { state: { from: '/checkout' } })} className="mt-4 btn-primary w-full">
              {user ? 'Proceed to Checkout' : 'Login to Checkout'} →
            </button>
            <p className="mt-2 text-center text-xs text-slate-500">🔒 Secure encrypted checkout</p>
          </div>
        </div>
      </div>
    </>
  );
}
