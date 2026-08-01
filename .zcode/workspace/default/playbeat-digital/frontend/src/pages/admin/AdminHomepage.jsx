import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Loader, Modal, Field, ConfirmButton } from '../../components/admin/AdminUI';
import { useToast } from '../../components/Toast';
import { SECTION_TYPES } from '../../lib/constants';

export default function AdminHomepage() {
  const { success, error } = useToast();
  const [sections, setSections] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = () => adminApi.get('/admin/homepage').then(({ data }) => setSections(data.data)).catch(() => setSections([]));
  useEffect(() => { load(); }, []);

  const move = async (index, dir) => {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    try { await adminApi.put('/admin/homepage/reorder', { orderedIds: next.map((s) => s._id) }); }
    catch (err) { error(err.message); load(); }
  };

  const toggle = async (s) => {
    try { await adminApi.put(`/admin/homepage/${s._id}`, { enabled: !s.enabled }); load(); }
    catch (err) { error(err.message); }
  };

  const remove = async (id) => { try { await adminApi.delete(`/admin/homepage/${id}`); success('Deleted'); load(); } catch (err) { error(err.message); } };

  return (
    <>
      <Seo title="Homepage Builder · Admin" />
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-400 text-sm">Drag-free reorder with arrows. Changes are live on the storefront instantly.</p>
        <button onClick={() => setEditing({ type: 'featured_products', title: '', subtitle: '', enabled: true, config: {} })} className="btn-primary">+ Add Section</button>
      </div>
      {!sections ? <Loader /> : (
        <div className="space-y-2">
          {sections.map((s, i) => (
            <div key={s._id} className="glass-card flex items-center gap-3 !p-3">
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} className="text-slate-500 hover:text-electric-light text-xs">▲</button>
                <button onClick={() => move(i, 1)} className="text-slate-500 hover:text-electric-light text-xs">▼</button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="badge bg-electric/15 text-electric-light">{s.type}</span>
                  <span className="font-medium text-slate-100">{s.title || '(untitled)'}</span>
                </div>
                {s.subtitle && <div className="text-xs text-slate-500">{s.subtitle}</div>}
              </div>
              <button onClick={() => toggle(s)} className={`btn !px-2 !py-1 text-xs ${s.enabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-400'}`}>{s.enabled ? 'Enabled' : 'Disabled'}</button>
              <button onClick={() => setEditing(s)} className="btn-ghost !px-2 !py-1 text-xs">Edit</button>
              <ConfirmButton onConfirm={() => remove(s._id)} className="!px-2 !py-1 text-xs bg-rose-500/15 text-rose-300">Delete</ConfirmButton>
            </div>
          ))}
          {!sections.length && <p className="text-center text-slate-500 py-10">No homepage sections. Add one or run the demo seeder.</p>}
        </div>
      )}

      <SectionEditor section={editing} onClose={() => setEditing(null)} onSaved={() => { success('Saved'); setEditing(null); load(); }} onError={error} />
    </>
  );
}

const SectionEditor = ({ section, onClose, onSaved, onError }) => {
  const [form, setForm] = useState(null);
  useEffect(() => { if (section) setForm({ ...section, config: typeof section.config === 'string' ? {} : (section.config || {}) }); }, [section]);
  if (!form) return null;

  const isNew = !section._id;
  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { type: form.type, title: form.title, subtitle: form.subtitle, enabled: form.enabled, config: form.config };
      if (isNew) await adminApi.post('/admin/homepage', payload);
      else await adminApi.put(`/admin/homepage/${section._id}`, payload);
      onSaved();
    } catch (err) { onError(err.message); }
  };

  return (
    <Modal open={!!section} onClose={onClose} title={isNew ? 'Add Section' : 'Edit Section'} wide>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type"><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{SECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
          <Field label="Title"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        </div>
        <Field label="Subtitle"><input className="input" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></Field>
        <Field label="Config (JSON)" hint="Type-specific: e.g. trending/featured_products use {&quot;limit&quot;:8}; banner uses {&quot;image&quot;:&quot;…&quot;,&quot;link&quot;:&quot;/products&quot;}">
          <textarea className="input font-mono text-xs" rows="10" value={JSON.stringify(form.config || {}, null, 2)} onChange={(e) => { try { setForm({ ...form, config: JSON.parse(e.target.value) }); } catch { /* invalid json, keep editing */ } }} />
        </Field>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="accent-electric" /> Enabled</label>
        <button className="btn-primary">Save</button>
      </form>
    </Modal>
  );
};
