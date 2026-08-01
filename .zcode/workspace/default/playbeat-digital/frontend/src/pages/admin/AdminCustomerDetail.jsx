import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Loader, ConfirmButton } from '../../components/admin/AdminUI';
import { StatusBadge } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { formatPrice, formatDate } from '../../lib/format';

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const { success, error } = useToast();
  const [data, setData] = useState(null);

  const load = () => adminApi.get(`/admin/customers/${id}`).then(({ data }) => setData(data.data)).catch(() => setData(null));
  useEffect(() => { load(); }, [id]);

  const toggleBlock = async () => {
    const next = data.customer.status === 'blocked' ? 'active' : 'blocked';
    try { await adminApi.put(`/admin/customers/${id}/status`, { status: next }); success(`Customer ${next}`); load(); }
    catch (err) { error(err.message); }
  };

  if (!data) return <Loader />;
  const { customer, orders, tickets, stats } = data;

  return (
    <>
      <Seo title={`${customer.name} · Admin`} />
      <Link to="/admin/customers" className="text-sm text-slate-400 hover:text-electric-light mb-4 inline-block">← All customers</Link>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="glass p-4"><div className="text-xs text-slate-400">Total Spent</div><div className="text-xl font-bold text-emerald-300">{formatPrice(stats.totalSpent)}</div></div>
            <div className="glass p-4"><div className="text-xs text-slate-400">Paid Orders</div><div className="text-xl font-bold text-slate-100">{stats.paidOrders}</div></div>
            <div className="glass p-4"><div className="text-xs text-slate-400">Tickets</div><div className="text-xl font-bold text-slate-100">{tickets.length}</div></div>
          </div>

          <div className="glass-card">
            <h3 className="font-semibold text-slate-100 mb-3">Orders</h3>
            <div className="space-y-2">
              {orders.map((o) => (
                <Link key={o._id} to={`/admin/orders/${o._id}`} className="flex items-center justify-between rounded-lg border border-white/5 p-2 hover:bg-white/5">
                  <div><span className="font-mono text-xs text-electric-light">{o.orderNumber}</span><div className="text-xs text-slate-500">{formatDate(o.createdAt)}</div></div>
                  <div className="flex items-center gap-2"><span className="font-semibold">{formatPrice(o.total, o.currency)}</span><StatusBadge status={o.status} /></div>
                </Link>
              ))}
              {!orders.length && <p className="text-slate-500 text-sm">No orders.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card">
            <h3 className="font-semibold text-slate-100 mb-3">Profile</h3>
            <div className="text-sm space-y-1">
              <div className="text-slate-100">{customer.name}</div>
              <div className="text-slate-400">{customer.email}</div>
              {customer.phone && <div className="text-slate-400">{customer.phone}</div>}
              <div className="text-slate-500 text-xs">Joined {formatDate(customer.createdAt)}</div>
            </div>
            <StatusBadge status={customer.status} />
            <div className="mt-4">
              <ConfirmButton onConfirm={toggleBlock} className={`w-full !py-2 text-sm ${customer.status === 'blocked' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                {customer.status === 'blocked' ? 'Unblock Customer' : 'Block Customer'}
              </ConfirmButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
