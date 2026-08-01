import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Loader, EmptyState } from '../../components/ui';
import { StatusBadge } from '../../components/ui';
import { formatPrice, formatDate } from '../../lib/format';
import { useSettings } from '../../hooks/useSettings';

export default function AccountDashboard() {
  const { currencySymbol } = useSettings();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.get('/orders/mine').then(({ data }) => setOrders(data.data.slice(0, 5))).catch(() => setOrders([]));
  }, []);

  if (!orders) return <Loader />;

  return (
    <>
      <Seo title="My Account" />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="stat-card"><span className="text-xs text-slate-400">Total Orders</span><span className="text-2xl font-bold text-slate-100">{orders.length}</span></div>
        <div className="stat-card"><span className="text-xs text-slate-400">Active</span><span className="text-2xl font-bold text-electric-light">{orders.filter((o) => ['processing', 'delivered'].includes(o.status)).length}</span></div>
        <div className="stat-card"><span className="text-xs text-slate-400">Completed</span><span className="text-2xl font-bold text-emerald-300">{orders.filter((o) => o.status === 'completed').length}</span></div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl font-bold text-slate-100">Recent Orders</h2>
        <Link to="/account/orders" className="text-sm text-electric-light hover:underline">View all →</Link>
      </div>
      {!orders.length ? (
        <EmptyState icon="🧾" title="No orders yet" description="Your purchases will appear here." action={<Link to="/products" className="btn-primary">Start Shopping</Link>} />
      ) : (
        <div className="glass overflow-hidden">
          <table className="table">
            <thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="font-mono text-xs text-electric-light">{o.orderNumber}</td>
                  <td className="text-slate-400">{formatDate(o.createdAt)}</td>
                  <td className="font-semibold">{formatPrice(o.total, o.currency, currencySymbol)}</td>
                  <td><StatusBadge status={o.paymentStatus} /></td>
                  <td><Link to={`/account/orders/${o._id}`} className="text-electric-light text-sm">View →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
