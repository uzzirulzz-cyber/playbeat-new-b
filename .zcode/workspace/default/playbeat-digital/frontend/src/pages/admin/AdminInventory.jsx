import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Toolbar, SearchInput, Modal, Field, Pagination, Loader } from '../../components/admin/AdminUI';
import { StatusBadge } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { INVENTORY_TYPES, INVENTORY_STATUS } from '../../lib/constants';

export default function AdminInventory() {
  const { success, error } = useToast();
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // {mode:'single'|'bulk'}
  const [reveal, setReveal] = useState(null);
  const [products, setProducts] = useState([]);

  const load = () => {
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (q) params.set('batchId', q);
    params.set('page', page); params.set('limit', 25);
    adminApi.get(`/admin/inventory?${params}`).then(({ data }) => setData(data)).catch(() => setData({ data: [] }));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, status, page]);
  useEffect(() => { adminApi.get('/admin/products?limit=100').then(({ data }) => setProducts(data.data)).catch(() => {}); }, []);

  const exportCsv = () => { window.open(`${adminApi.defaults.baseURL}/admin/inventory/export`, '_blank'); };

  const stats = data?.stats || {};
  return (
    <>
      <Seo title="Inventory · Admin" />
      <Toolbar>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Batch ID…" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input !py-2 text-sm w-auto">
          <option value="all">all</option>
          {INVENTORY_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setModal({ mode: 'single' })} className="btn-primary">+ Add Item</button>
          <button onClick={() => setModal({ mode: 'bulk' })} className="btn-ghost">Bulk Import</button>
          <button onClick={exportCsv} className="btn-ghost">Export CSV</button>
        </div>
      </Toolbar>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {INVENTORY_STATUS.map((s) => (
          <div key={s} className="glass p-3 text-center"><div className="text-xs text-slate-400 capitalize">{s}</div><div className="text-lg font-bold text-slate-100">{stats[s] || 0}</div></div>
        ))}
      </div>

      {!data ? <Loader /> : (
        <div className="glass overflow-x-auto">
          <table className="table">
            <thead><tr><th>Product</th><th>Variant</th><th>Type</th><th>Status</th><th>Batch</th><th>Added</th><th></th></tr></thead>
            <tbody>
              {data.data.map((it) => (
                <tr key={it._id}>
                  <td className="text-slate-100">{it.product?.name || '—'}</td>
                  <td className="text-slate-400">{it.variantName || '—'}</td>
                  <td className="text-slate-300">{it.type}</td>
                  <td><StatusBadge status={it.status} /></td>
                  <td className="font-mono text-xs text-slate-500">{it.batchId || '—'}</td>
                  <td className="text-slate-400 text-xs">{new Date(it.createdAt).toLocaleDateString()}</td>
                  <td><button onClick={() => setReveal(it._id)} className="btn-ghost !px-2 !py-1 text-xs">Reveal</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.data.length && <p className="text-center text-slate-500 py-10">No inventory items.</p>}
        </div>
      )}
      {data?.pagination && <Pagination pagination={data.pagination} onPage={setPage} />}

      <RevealModal id={reveal} onClose={() => setReveal(null)} onCopied={() => success('Copied')} />
      <AddItemModal modal={modal} products={products} onClose={() => setModal(null)} onDone={() => { success('Saved'); setModal(null); load(); }} onError={error} />
    </>
  );
}

const RevealModal = ({ id, onClose, onCopied }) => {
  const [payload, setPayload] = useState(null);
  useEffect(() => {
    if (!id) { setPayload(null); return; }
    adminApi.get(`/admin/inventory/${id}/reveal`).then(({ data }) => setPayload(data.data.payload)).catch(() => setPayload('[error]'));
  }, [id]);
  if (!id) return null;
  return (
    <Modal open={!!id} onClose={onClose} title="Reveal Inventory Payload">
      <p className="text-xs text-amber-300 mb-2">⚠️ This is sensitive data. Revealing is recorded in the audit log.</p>
      <div className="rounded-lg bg-navy-950 border border-white/10 p-3 break-all font-mono text-sm text-accent-light">
        {payload === null ? 'Loading…' : payload}
      </div>
      {payload && <button onClick={() => { navigator.clipboard.writeText(payload); onCopied(); }} className="btn-ghost mt-3 text-sm">Copy</button>}
    </Modal>
  );
};

const AddItemModal = ({ modal, products, onClose, onDone, onError }) => {
  const [form, setForm] = useState({ productId: '', variantName: '', type: 'license_key', payload: '', payloads: '' });
  if (!modal) return null;
  const bulk = modal.mode === 'bulk';

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (bulk) {
        const payloads = form.payloads.split('\n').map((s) => s.trim()).filter(Boolean);
        await adminApi.post('/admin/inventory/bulk', { productId: form.productId, variantName: form.variantName, type: form.type, payloads });
      } else {
        await adminApi.post('/admin/inventory', { productId: form.productId, variantName: form.variantName, type: form.type, payload: form.payload });
      }
      onDone();
    } catch (err) { onError(err.message); }
  };

  return (
    <Modal open={!!modal} onClose={onClose} title={bulk ? 'Bulk Import Inventory' : 'Add Inventory Item'} wide>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Product"><select className="input" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
          <option value="">Select product…</option>
          {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select></Field>
        <Field label="Variant name (optional)"><input className="input" value={form.variantName} onChange={(e) => setForm({ ...form, variantName: e.target.value })} placeholder="e.g. 3 Months" /></Field>
        <Field label="Type"><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{INVENTORY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
        {bulk ? (
          <Field label="Payloads (one per line)"><textarea className="input font-mono" rows="8" value={form.payloads} onChange={(e) => setForm({ ...form, payloads: e.target.value })} placeholder="KEY-1&#10;KEY-2&#10;KEY-3" required /></Field>
        ) : (
          <Field label="Payload"><textarea className="input font-mono" rows="3" value={form.payload} onChange={(e) => setForm({ ...form, payload: e.target.value })} required /></Field>
        )}
        <button className="btn-primary">{bulk ? 'Import' : 'Add'}</button>
      </form>
    </Modal>
  );
};
