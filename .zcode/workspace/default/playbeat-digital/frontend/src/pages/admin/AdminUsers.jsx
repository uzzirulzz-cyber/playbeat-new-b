import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Toolbar, Modal, Field, ConfirmButton, Loader } from '../../components/admin/AdminUI';
import { StatusBadge } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { ADMIN_ROLES } from '../../lib/constants';
import { formatDate } from '../../lib/format';

const empty = { name: '', email: '', password: '', role: 'admin' };

export default function AdminUsers() {
  const { success, error } = useToast();
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);

  const load = () => adminApi.get('/admin/auth/users').then(({ data }) => setItems(data.data)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'new') await adminApi.post('/admin/auth/users', form);
      else await adminApi.put(`/admin/auth/users/${modal}`, { name: form.name, role: form.role, active: form.active });
      success('Saved'); setModal(null); load();
    } catch (err) { error(err.message); }
  };

  if (!items) return <Loader />;

  return (
    <>
      <Seo title="Admin Users · Admin" />
      <Toolbar><button onClick={() => { setForm(empty); setModal('new'); }} className="btn-primary ml-auto">+ Add Admin</button></Toolbar>
      <div className="glass overflow-x-auto">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last login</th><th></th></tr></thead>
          <tbody>
            {items.map((a) => (
              <tr key={a._id}>
                <td className="text-slate-100">{a.name}</td>
                <td className="text-slate-400">{a.email}</td>
                <td><StatusBadge status={a.role} /></td>
                <td>{a.active ? <span className="badge bg-emerald-500/15 text-emerald-300">Active</span> : <span className="badge bg-rose-500/15 text-rose-300">Disabled</span>}</td>
                <td className="text-slate-400 text-xs">{a.lastLoginAt ? formatDate(a.lastLoginAt) : '—'}</td>
                <td><button onClick={() => { setForm({ name: a.name, role: a.role, active: a.active }); setModal(a._id); }} className="btn-ghost !px-2 !py-1 text-xs">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? 'Add Admin User' : 'Edit Admin'}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Email"><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required={modal === 'new'} disabled={modal !== 'new'} /></Field>
          {modal === 'new' && <Field label="Password (min 10 chars)" hint="User will be forced to change it on first login."><input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>}
          <Field label="Role"><select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ADMIN_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select></Field>
          {modal !== 'new' && <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-electric" /> Active</label>}
          <button className="btn-primary">Save</button>
        </form>
      </Modal>
    </>
  );
}
