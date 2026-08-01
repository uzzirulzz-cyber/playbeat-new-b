import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/Toast';
import { useSettings } from '../../hooks/useSettings';
import { Seo } from '../../components/Seo';
import { Loader, EmptyState } from '../../components/ui';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/format';

export default function Checkout() {
  const { cart } = useCart();
  const { success, error } = useToast();
  const { currencySymbol, settings } = useSettings();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [info, setInfo] = useState({ name: '', email: '', phone: '' });

  const payments = settings?.payments || {};
  const methods = [
    payments.stripeEnabled && { id: 'stripe', label: '💳 Card (Stripe)', desc: 'Visa, Mastercard, Amex' },
    payments.lemonSqueezyEnabled && { id: 'lemonsqueezy', label: '🍋 Lemon Squeezy', desc: 'Card / PayPal' },
    payments.manualEnabled && { id: 'manual', label: payments.manualLabel || '🏦 Bank Transfer', desc: 'Manual verification' },
  ].filter(Boolean);
  const [method, setMethod] = useState(methods[0]?.id);

  if (!cart.items?.length) {
    return <EmptyState icon="🛒" title="Nothing to check out" action={<Link to="/products" className="btn-primary">Browse Products</Link>} />;
  }

  const totals = cart.totals || {};

  const placeOrder = async () => {
    if (!method) { error('Select a payment method'); return; }
    if (!info.name || !info.email) { error('Please fill in your name and email'); return; }
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', { paymentMethod: method, customerInfo: info });
      const { order, payment } = data.data;
      if (payment.sessionUrl) {
        window.location.href = payment.sessionUrl;
      } else if (method === 'manual') {
        success('Order placed! Follow the payment instructions.');
        navigate(`/account/orders/${order._id}?pending=1`);
      } else {
        navigate(`/account/orders/${order._id}`);
      }
    } catch (err) {
      error(err.message || 'Checkout failed');
      setPlacing(false);
    }
  };

  return (
    <>
      <Seo title="Checkout" />
      <h1 className="font-display text-3xl font-bold text-slate-100 mb-6">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card">
            <h3 className="font-semibold text-slate-100 mb-4">Customer Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">Full name</label><input className="input" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} required /></div>
              <div><label className="label">Email</label><input type="email" className="input" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} required /></div>
              <div><label className="label">Phone (optional)</label><input className="input" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} /></div>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="font-semibold text-slate-100 mb-4">Payment Method</h3>
            {!methods.length ? (
              <p className="text-rose-300 text-sm">No payment methods are currently enabled. An admin must enable one in Settings.</p>
            ) : (
              <div className="space-y-2">
                {methods.map((m) => (
                  <label key={m.id} className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition ${method === m.id ? 'border-electric bg-electric/10' : 'border-white/10 hover:border-white/30'}`}>
                    <input type="radio" name="method" checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-electric" />
                    <div><div className="font-medium text-slate-100">{m.label}</div><div className="text-xs text-slate-400">{m.desc}</div></div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="glass-card sticky top-20">
            <h3 className="font-semibold text-slate-100 mb-3">Order Summary</h3>
            <div className="space-y-2 max-h-60 overflow-auto pr-1">
              {cart.items.map((item) => (
                <div key={item.id || item.productId} className="flex items-center gap-2 text-sm">
                  <img src={item.image} alt="" className="h-10 w-10 rounded object-cover" />
                  <span className="flex-1 truncate text-slate-300">{item.qty}× {item.name}</span>
                  <span className="text-slate-400">{formatPrice(item.lineTotal, cart.currency, currencySymbol)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2 border-t border-white/10 pt-3 text-sm">
              <div className="flex justify-between text-slate-300"><span>Subtotal</span><span>{formatPrice(totals.subtotal, cart.currency, currencySymbol)}</span></div>
              {totals.discount > 0 && <div className="flex justify-between text-emerald-300"><span>Discount</span><span>−{formatPrice(totals.discount, cart.currency, currencySymbol)}</span></div>}
              {totals.tax > 0 && <div className="flex justify-between text-slate-300"><span>Tax</span><span>{formatPrice(totals.tax, cart.currency, currencySymbol)}</span></div>}
              <div className="flex justify-between text-lg font-bold text-slate-100 border-t border-white/10 pt-2"><span>Total</span><span>{formatPrice(totals.total, cart.currency, currencySymbol)}</span></div>
            </div>
            <button onClick={placeOrder} disabled={placing || !methods.length} className="mt-4 btn-primary w-full">
              {placing ? <Loader label="" /> : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
