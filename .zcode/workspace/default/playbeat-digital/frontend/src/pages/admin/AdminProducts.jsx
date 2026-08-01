import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Toolbar, SearchInput, Pagination, ConfirmButton, Loader } from '../../components/admin/AdminUI';
import { StatusBadge } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { formatPrice, formatDate } from '../../lib/format';

const STATUSES = ['all', 'active', 'draft', 'archived'];

export default function AdminProducts() {
  const { success, error } = useToast();
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const load = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status !== 'all') params.set('status', status);
    params.set('page', page);
    params.set('limit', 20);
    adminApi.get(`/admin/products?${params}`).then(({ data }) => setData(data)).catch(() => setData({ data: [] }));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, status, page]);

  const remove = async (id) => {
    try { await adminApi.delete(`/admin/products/${id}`); success('Product deleted'); load(); }
    catch (err) { error(err.message); }
  };

  return (
    <>
      <Seo title="Products · Admin" />
      <Toolbar>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input !py-2 text-sm w-auto">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Link to="/admin/products/new" className="btn-primary ml-auto">+ Add Product</Link>
      </Toolbar>

      {!data ? <Loader /> : (
        <div className="glass overflow-x-auto">
          <table className="table">
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Sold</th><th></th></tr></thead>
            <tbody>
              {data.data.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <img src={p.images?.[0]} alt="" className="h-8 w-8 rounded object-cover" />
                      <span className="text-slate-100">{p.name}</span>
                      {p.featured && <span className="badge bg-accent/15 text-accent-light">★</span>}
                      {p.trending && <span className="badge bg-rose-500/15 text-rose-300">🔥</span>}
                    </div>
                  </td>
                  <td className="text-slate-400">{p.category?.name}</td>
                  <td>{formatPrice(p.salePrice ?? p.price)}</td>
                  <td className="text-slate-300">{p.unlimitedStock ? '∞' : p.stockQuantity}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="text-slate-300">{p.soldCount || 0}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/admin/products/${p._id}/edit`} className="btn-ghost !px-2 !py-1 text-xs">Edit</Link>
                      <ConfirmButton onConfirm={() => remove(p._id)} className="!px-2 !py-1 text-xs bg-rose-500/15 text-rose-300">Delete</ConfirmButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.data.length && <p className="text-center text-slate-500 py-10">No products found.</p>}
        </div>
      )}
      {data?.pagination && <Pagination pagination={data.pagination} onPage={setPage} />}
    </>
  );
}
