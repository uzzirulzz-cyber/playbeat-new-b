import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Toolbar, Modal, Field, ConfirmButton, Loader } from '../../components/admin/AdminUI';
import { StatusBadge } from '../../components/ui';
import { useToast } from '../../components/Toast';

const empty = { name: '', description: '', icon: '', featured: false, status: 'active' };

export default function AdminCategories() {
  const { success, error } = useToast();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = () => adminApi.get('/admin/categories').then(({ data }) => setItems(data.data)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setEditing('new'); };
  const openEdit = (c) => { setForm({ name: c.name, description: c.description, icon: c.icon, featured: c.featured, status: c.status }); setEditing(c._id); };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing === 'new') await adminApi.post('/admin/categories', form);
      else await adminApi.put(`/admin/categories/${editing}`, form);
      success('Saved'); setEditing(null); load();
    } catch (err) { error(err.message); }
  };

  const remove = async (id) => { try { await adminApi.delete(`/admin/categories/${id}`); success('Deleted'); load(); } catch (err) { error(err.message); } };

  return (
    <>
      <Seo title="Categories · Admin" />
      <Toolbar><button onClick={openNew} className="btn-primary ml-auto">+ Add Category</button></Toolbar>
      {!items ? <Loader /> : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <div key={c._id} className="glass-card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{c.icon ? '🗂️' : '🗂️'}</span>
                  <div><div className="font-medium text-slate-100">{c.name}</div><div className="text-xs text-slate-500">/{c.slug}</div></div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-2 text-sm text-slate-400 line-clamp-2">{c.description || 'No description'}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => openEdit(c)} className="btn-ghost text-sm">Edit</button>
                <ConfirmButton onConfirm={() => remove(c._id)} className="!px-2 !py-1 text-xs bg-rose-500/15 text-rose-300">Delete</ConfirmButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'New Category' : 'Edit Category'}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Icon (emoji)"><input className="input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🎮" /></Field>
          <Field label="Description"><textarea className="input" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-electric" /> Featured</label>
          <button className="btn-primary">Save</button>
        </form>
      </Modal>
    </>
  );
}
