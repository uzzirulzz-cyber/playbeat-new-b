import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Loader, EmptyState, StatusBadge } from '../../components/ui';
import { formatPrice, formatDate } from '../../lib/format';
import { useSettings } from '../../hooks/useSettings';

export default function AccountOrders() {
  const { currencySymbol } = useSettings();
  const [orders, setOrders] = useState(null);
  useEffect(() => { api.get('/orders/mine').then(({ data }) => setOrders(data.data)).catch(() => setOrders([])); }, []);

  if (!orders) return <Loader />;
  if (!orders.length) return <EmptyState icon="🧾" title="No orders yet" action={<Link to="/products" className="btn-primary">Start Shopping</Link>} />;

  return (
    <>
      <Seo title="My Orders" />
      <h2 className="font-display text-xl font-bold text-slate-100 mb-4">All Orders</h2>
      <div className="glass overflow-hidden">
        <table className="table">
          <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td className="font-mono text-xs text-electric-light">{o.orderNumber}</td>
                <td className="text-slate-400">{formatDate(o.createdAt)}</td>
                <td className="text-slate-300">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                <td className="font-semibold">{formatPrice(o.total, o.currency, currencySymbol)}</td>
                <td><StatusBadge status={o.paymentStatus} /></td>
                <td><StatusBadge status={o.status} /></td>
                <td><Link to={`/account/orders/${o._id}`} className="text-electric-light text-sm">View →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
