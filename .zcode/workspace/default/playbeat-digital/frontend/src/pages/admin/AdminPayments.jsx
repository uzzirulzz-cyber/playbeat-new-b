import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Toolbar, Pagination, Loader } from '../../components/admin/AdminUI';
import { StatusBadge } from '../../components/ui';
import { formatPrice, formatDateTime } from '../../lib/format';
import { PAYMENT_STATUS } from '../../lib/constants';

export default function AdminPayments() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('all');
  const [provider, setProvider] = useState('all');
  const [page, setPage] = useState(1);

  const load = () => {
    const params = new URLSearchParams({ page, limit: 20 });
    if (status !== 'all') params.set('status', status);
    if (provider !== 'all') params.set('provider', provider);
    adminApi.get(`/admin/payments?${params}`).then(({ data }) => setData(data)).catch(() => setData({ data: [] }));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, provider, page]);

  return (
    <>
      <Seo title="Payments · Admin" />
      <Toolbar>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input !py-2 text-sm w-auto">
          <option value="all">all status</option>
          {PAYMENT_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={provider} onChange={(e) => { setProvider(e.target.value); setPage(1); }} className="input !py-2 text-sm w-auto">
          <option value="all">all providers</option>
          <option value="stripe">stripe</option>
          <option value="lemonsqueezy">lemonsqueezy</option>
          <option value="manual">manual</option>
        </select>
        <Link to="/admin/settings" className="btn-ghost ml-auto text-sm">Configure methods →</Link>
      </Toolbar>
      {!data ? <Loader /> : (
        <div className="glass overflow-x-auto">
          <table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Provider</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {data.data.map((p) => (
                <tr key={p._id}>
                  <td className="font-mono text-xs text-electric-light">{p.order?.orderNumber}</td>
                  <td className="text-slate-200">{p.user?.email || '—'}</td>
                  <td className="capitalize text-slate-300">{p.provider}</td>
                  <td className="font-semibold">{formatPrice(p.amount, p.currency)}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="text-slate-400 text-xs">{formatDateTime(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.data.length && <p className="text-center text-slate-500 py-10">No transactions found.</p>}
        </div>
      )}
      {data?.pagination && <Pagination pagination={data.pagination} onPage={setPage} />}
    </>
  );
}
