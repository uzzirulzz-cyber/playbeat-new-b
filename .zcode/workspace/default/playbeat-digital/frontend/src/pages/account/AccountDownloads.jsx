import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Loader, EmptyState } from '../../components/ui';
import { useToast } from '../../components/Toast';

export default function AccountDownloads() {
  const { success } = useToast();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.get('/orders/mine').then(({ data }) => setOrders(data.data)).catch(() => setOrders([]));
  }, []);

  if (!orders) return <Loader />;

  // Fetch full detail for delivered orders so we can show assets.
  const [detailed, setDetailed] = useState([]);
  useEffect(() => {
    const delivered = orders.filter((o) => ['delivered', 'completed', 'processing'].includes(o.status));
    Promise.all(delivered.map((o) => api.get(`/orders/mine/${o._id}`).then((r) => r.data.data).catch(() => null)))
      .then((rows) => setDetailed(rows.filter(Boolean)));
  }, [orders]);

  const copy = (text) => { navigator.clipboard.writeText(text); success('Copied'); };

  const assets = detailed.flatMap((o) =>
    o.items.flatMap((item) =>
      (item.deliveredAssets || []).map((a) => ({ ...a, order: o.orderNumber, product: item.name, orderId: o._id }))
    )
  );

  if (!assets.length) {
    return (
      <>
        <Seo title="My Downloads" />
        <EmptyState icon="📥" title="No digital products yet" description="Your licenses, keys and downloads will appear here after a successful purchase." action={<Link to="/products" className="btn-primary">Browse Products</Link>} />
      </>
    );
  }

  return (
    <>
      <Seo title="My Downloads" />
      <h2 className="font-display text-xl font-bold text-slate-100 mb-4">Digital Library</h2>
      <div className="space-y-3">
        {assets.map((a, i) => (
          <div key={i} className="glass-card flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="font-medium text-slate-100">{a.product}</div>
              <div className="text-xs text-slate-500">Order {a.order} · <span className="uppercase">{a.type.replace(/_/g, ' ')}</span></div>
            </div>
            <code className="flex-1 text-accent-light text-sm break-all bg-navy-950/60 rounded-lg p-2 border border-white/10">{a.payload}</code>
            <div className="flex gap-2">
              <button onClick={() => copy(a.payload)} className="btn-ghost text-sm">Copy</button>
              <Link to={`/account/orders/${a.orderId}`} className="btn-ghost text-sm">Order</Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
