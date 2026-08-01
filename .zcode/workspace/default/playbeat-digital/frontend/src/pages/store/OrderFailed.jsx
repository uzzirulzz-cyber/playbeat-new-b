import { Link, useSearchParams } from 'react-router-dom';
import { Seo } from '../../components/Seo';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';

export default function OrderFailed() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const { success, error } = useToast();

  const retry = async () => {
    try {
      const { data } = await api.post(`/payments/stripe/session/${orderId}`);
      if (data.data.sessionUrl) window.location.href = data.data.sessionUrl;
    } catch (err) { error(err.message || 'Could not resume checkout'); success(''); }
  };

  return (
    <>
      <Seo title="Payment Failed" />
      <div className="glass-card mx-auto max-w-lg text-center py-12">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-rose-500/15 text-3xl">✕</div>
        <h1 className="font-display text-2xl font-bold text-slate-100">Payment not completed</h1>
        <p className="mt-2 text-slate-400">Your reservation has been released. No charge was made. You can try again anytime.</p>
        <div className="mt-6 flex justify-center gap-3">
          {orderId && <button onClick={retry} className="btn-primary">Try Again</button>}
          <Link to="/cart" className="btn-ghost">Back to Cart</Link>
        </div>
      </div>
    </>
  );
}
