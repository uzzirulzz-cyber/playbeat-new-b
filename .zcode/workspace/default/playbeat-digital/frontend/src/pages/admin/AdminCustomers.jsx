import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Toolbar, SearchInput, Pagination, Loader } from '../../components/admin/AdminUI';
import { StatusBadge } from '../../components/ui';
import { formatPrice, formatDate } from '../../lib/format';

export default function AdminCustomers() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('page', page); params.set('limit', 20);
    adminApi.get(`/admin/customers?${params}`).then(({ data }) => setData(data)).catch(() => setData({ data: [] }));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, page]);

  return (
    <>
      <Seo title="Customers · Admin" />
      <Toolbar><SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Name or email…" /></Toolbar>
      {!data ? <Loader /> : (
        <div className="glass overflow-x-auto">
          <table className="table">
            <thead><tr><th>Customer</th><th>Joined</th><th>Orders</th><th>Spent</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {data.data.map((c) => (
                <tr key={c._id}>
                  <td><div className="text-slate-100">{c.name}</div><div className="text-xs text-slate-500">{c.email}</div></td>
                  <td className="text-slate-400">{formatDate(c.createdAt)}</td>
                  <td className="text-slate-300">{c.orderCount}</td>
                  <td className="font-semibold">{formatPrice(c.totalSpent)}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td><Link to={`/admin/customers/${c._id}`} className="text-electric-light text-sm">View →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.data.length && <p className="text-center text-slate-500 py-10">No customers found.</p>}
        </div>
      )}
      {data?.pagination && <Pagination pagination={data.pagination} onPage={setPage} />}
    </>
  );
}
