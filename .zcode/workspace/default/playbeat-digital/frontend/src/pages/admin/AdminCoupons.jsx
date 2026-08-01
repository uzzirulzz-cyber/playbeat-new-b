import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Toolbar, Modal, Field, ConfirmButton, Loader } from '../../components/admin/AdminUI';
import { StatusBadge } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { COUPON_TYPES } from '../../lib/constants';
import { formatDate } from '../../lib/format';

const empty = { code: '', type: 'percent', value: 10, minSubtotal: 0, usageLimit: '', active: true, expiresAt: '', description: '' };

export default function AdminCoupons() {
  const { success, error } = useToast();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = () => adminApi.get('/admin/coupons').then(({ data }) => setItems(data.data)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit), expiresAt: form.expiresAt || null, value: Number(form.value), minSubtotal: Number(form.minSubtotal) };
    try {
      if (editing === 'new') await adminApi.post('/admin/coupons', payload);
      else await adminApi.put(`/admin/coupons/${editing}`, payload);
      success('Saved'); setEditing(null); load();
    } catch (err) { error(err.message); }
  };

  const remove = async (id) => { try { await adminApi.delete(`/admin/coupons/${id}`); success('Deleted'); load(); } catch (err) { error(err.message); } };

  return (
    <>
      <Seo title="Coupons · Admin" />
      <Toolbar><button onClick={() => { setForm(empty); setEditing('new'); }} className="btn-primary ml-auto">+ Add Coupon</button></Toolbar>
      {!items ? <Loader /> : (
        <div className="glass overflow-x-auto">
          <table className="table">
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Used/Limit</th><th>Expires</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c._id}>
                  <td className="font-mono text-electric-light">{c.code}</td>
                  <td className="capitalize text-slate-300">{c.type}</td>
                  <td className="text-slate-200">{c.type === 'percent' ? `${c.value}%` : `$${c.value}`}</td>
                  <td className="text-slate-400">{c.usedCount}/{c.usageLimit || '∞'}</td>
                  <td className="text-slate-400">{c.expiresAt ? formatDate(c.expiresAt) : '—'}</td>
                  <td><StatusBadge status={c.active ? 'active' : 'archived'} label={c.active ? 'Active' : 'Inactive'} /></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => { setForm({ ...c, expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '', usageLimit: c.usageLimit ?? '' }); setEditing(c._id); }} className="btn-ghost !px-2 !py-1 text-xs">Edit</button>
                      <ConfirmButton onConfirm={() => remove(c._id)} className="!px-2 !py-1 text-xs bg-rose-500/15 text-rose-300">Delete</ConfirmButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && <p className="text-center text-slate-500 py-10">No coupons yet.</p>}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'New Coupon' : 'Edit Coupon'}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Code"><input className="input uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type"><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{COUPON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Value"><input type="number" step="0.01" className="input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min subtotal"><input type="number" step="0.01" className="input" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} /></Field>
            <Field label="Usage limit (blank = unlimited)"><input type="number" className="input" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} /></Field>
          </div>
          <Field label="Expires at (optional)"><input type="date" className="input" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></Field>
          <Field label="Description"><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-electric" /> Active</label>
          <button className="btn-primary">Save</button>
        </form>
      </Modal>
    </>
  );
}
