import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Toolbar, SearchInput, Pagination, Loader } from '../../components/admin/AdminUI';
import { StatusBadge } from '../../components/ui';
import { formatPrice, formatDate } from '../../lib/format';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../lib/constants';

export default function AdminOrders() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [page, setPage] = useState(1);

  const load = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status !== 'all') params.set('status', status);
    if (paymentStatus !== 'all') params.set('paymentStatus', paymentStatus);
    params.set('page', page); params.set('limit', 20);
    adminApi.get(`/admin/orders?${params}`).then(({ data }) => setData(data)).catch(() => setData({ data: [] }));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, status, paymentStatus, page]);

  return (
    <>
      <Seo title="Orders · Admin" />
      <Toolbar>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Order # or email…" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input !py-2 text-sm w-auto">
          <option value="all">all status</option>
          {ORDER_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} className="input !py-2 text-sm w-auto">
          <option value="all">all payments</option>
          {PAYMENT_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>
      {!data ? <Loader /> : (
        <div className="glass overflow-x-auto">
          <table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {data.data.map((o) => (
                <tr key={o._id}>
                  <td className="font-mono text-xs text-electric-light">{o.orderNumber}</td>
                  <td className="text-slate-200">{o.user?.email || o.customerInfo?.email}</td>
                  <td className="text-slate-400">{o.items?.length || 0}</td>
                  <td className="font-semibold">{formatPrice(o.total, o.currency)}</td>
                  <td><StatusBadge status={o.paymentStatus} /></td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-slate-400 text-xs">{formatDate(o.createdAt)}</td>
                  <td><Link to={`/admin/orders/${o._id}`} className="text-electric-light text-sm">View →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.data.length && <p className="text-center text-slate-500 py-10">No orders found.</p>}
        </div>
      )}
      {data?.pagination && <Pagination pagination={data.pagination} onPage={setPage} />}
    </>
  );
}
