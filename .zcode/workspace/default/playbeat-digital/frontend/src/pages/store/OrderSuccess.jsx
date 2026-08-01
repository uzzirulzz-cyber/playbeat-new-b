import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Loader } from '../../components/ui';

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const [status, setStatus] = useState('checking'); // checking | paid | pending

  useEffect(() => {
    if (!orderId) { setStatus('pending'); return; }
    let attempts = 0;
    const poll = async () => {
      try {
        const { data } = await api.get(`/orders/mine/${orderId}`);
        if (['paid', 'delivered', 'completed', 'processing'].includes(data.data.status)) {
          setStatus('paid');
          return;
        }
      } catch { /* ignore while polling */ }
      attempts += 1;
      if (attempts < 10) setTimeout(poll, 1500);
      else setStatus('pending');
    };
    poll();
  }, [orderId]);

  if (status === 'checking') return <Loader full label="Confirming your payment…" />;

  return (
    <>
      <Seo title="Order Confirmed" />
      <div className="glass-card mx-auto max-w-lg text-center py-12 animate-fade-in">
        {status === 'paid' ? (
          <>
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-3xl">✓</div>
            <h1 className="font-display text-2xl font-bold text-slate-100">Payment confirmed!</h1>
            <p className="mt-2 text-slate-400">Your digital products are being prepared. Check your account for delivery details.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to={orderId ? `/account/orders/${orderId}` : '/account/downloads'} className="btn-primary">View Order</Link>
              <Link to="/products" className="btn-ghost">Keep Shopping</Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-amber-500/15 text-3xl">⏳</div>
            <h1 className="font-display text-2xl font-bold text-slate-100">Order received</h1>
            <p className="mt-2 text-slate-400">We're waiting for payment confirmation. If you completed payment, this will update shortly.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to={orderId ? `/account/orders/${orderId}` : '/account/orders'} className="btn-primary">View Order</Link>
              <Link to="/" className="btn-ghost">Home</Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
