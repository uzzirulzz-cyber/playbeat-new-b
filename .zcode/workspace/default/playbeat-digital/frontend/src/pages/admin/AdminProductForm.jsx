import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Field, Loader } from '../../components/admin/AdminUI';
import { useToast } from '../../components/Toast';
import { PRODUCT_STATUS, PRODUCT_TYPES, DELIVERY_TYPES } from '../../lib/constants';

const empty = {
  name: '', sku: '', shortDescription: '', description: '', category: '',
  price: 0, salePrice: '', currency: 'USD', productType: 'digital', deliveryType: 'instant',
  unlimitedStock: false, stockQuantity: 0, status: 'draft', featured: false, trending: false,
  images: [], tags: [], variants: [],
  seo: { title: '', description: '', keywords: [] },
};

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [form, setForm] = useState(empty);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [imageInput, setImageInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    adminApi.get('/admin/categories').then(({ data }) => setCategories(data.data)).catch(() => {});
    if (id) {
      adminApi.get(`/admin/products/${id}`).then(({ data }) => {
        const p = data.data;
        setForm({ ...empty, ...p, salePrice: p.salePrice ?? '', seo: p.seo || empty.seo });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setSeo = (key, value) => setForm((f) => ({ ...f, seo: { ...f.seo, [key]: value } }));

  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, { name: '', price: 0, salePrice: '', stockQuantity: 0, deliveryMethod: 'instant' }] }));
  const updateVariant = (i, key, value) => setForm((f) => ({ ...f, variants: f.variants.map((v, idx) => (idx === i ? { ...v, [key]: value } : v)) }));
  const removeVariant = (i) => setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.category) { error('Select a category'); return; }
    setSaving(true);
    const payload = {
      ...form,
      salePrice: form.salePrice === '' ? null : Number(form.salePrice),
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
      variants: form.variants.map((v) => ({ ...v, salePrice: v.salePrice === '' ? null : Number(v.salePrice), price: Number(v.price), stockQuantity: Number(v.stockQuantity) })),
      seo: { ...form.seo, keywords: Array.isArray(form.seo.keywords) ? form.seo.keywords : String(form.seo.keywords).split(',').map((s) => s.trim()).filter(Boolean) },
    };
    try {
      if (id) { await adminApi.put(`/admin/products/${id}`, payload); success('Product updated'); }
      else { await adminApi.post('/admin/products', payload); success('Product created'); }
      navigate('/admin/products');
    } catch (err) { error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <Loader />;

  return (
    <>
      <Seo title={id ? 'Edit Product' : 'New Product'} />
      <form onSubmit={submit} className="space-y-6">
        <div className="glass-card grid gap-4 md:grid-cols-2">
          <Field label="Product name"><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field>
          <Field label="SKU"><input className="input" value={form.sku} onChange={(e) => set('sku', e.target.value)} /></Field>
          <Field label="Category">
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)} required>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {PRODUCT_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div className="md:col-span-2"><Field label="Short description"><input className="input" value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} /></Field></div>
          <div className="md:col-span-2"><Field label="Full description"><textarea className="input" rows="4" value={form.description} onChange={(e) => set('description', e.target.value)} /></Field></div>
        </div>

        <div className="glass-card grid gap-4 md:grid-cols-3">
          <Field label="Price"><input type="number" step="0.01" className="input" value={form.price} onChange={(e) => set('price', e.target.value)} required /></Field>
          <Field label="Sale price (optional)"><input type="number" step="0.01" className="input" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} /></Field>
          <Field label="Currency"><input className="input" value={form.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} maxLength={3} /></Field>
          <Field label="Product type"><select className="input" value={form.productType} onChange={(e) => set('productType', e.target.value)}>{PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
          <Field label="Delivery type"><select className="input" value={form.deliveryType} onChange={(e) => set('deliveryType', e.target.value)}>{DELIVERY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
          <Field label="Stock quantity"><input type="number" className="input" value={form.stockQuantity} onChange={(e) => set('stockQuantity', e.target.value)} disabled={form.unlimitedStock} /></Field>
          <label className="flex items-center gap-2 mt-6"><input type="checkbox" checked={form.unlimitedStock} onChange={(e) => set('unlimitedStock', e.target.checked)} className="accent-electric" /> Unlimited stock</label>
          <label className="flex items-center gap-2 mt-6"><input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="accent-electric" /> Featured</label>
          <label className="flex items-center gap-2 mt-6"><input type="checkbox" checked={form.trending} onChange={(e) => set('trending', e.target.checked)} className="accent-electric" /> Trending</label>
        </div>

        <div className="glass-card">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-slate-100">Images</h3></div>
          <div className="flex gap-2 mb-3">
            <input className="input" placeholder="Image URL" value={imageInput} onChange={(e) => setImageInput(e.target.value)} />
            <button type="button" className="btn-ghost" onClick={() => { if (imageInput) { set('images', [...form.images, imageInput]); setImageInput(''); } }}>Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.images.map((img, i) => (
              <div key={i} className="relative">
                <img src={img} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <button type="button" onClick={() => set('images', form.images.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-xs">✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-slate-100">Variants</h3><button type="button" onClick={addVariant} className="btn-ghost text-sm">+ Add variant</button></div>
          <div className="space-y-2">
            {form.variants.map((v, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end rounded-lg border border-white/10 p-2">
                <Field label="Name"><input className="input !py-2 text-sm" value={v.name} onChange={(e) => updateVariant(i, 'name', e.target.value)} /></Field>
                <Field label="Price"><input type="number" step="0.01" className="input !py-2 text-sm" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} /></Field>
                <Field label="Sale"><input type="number" step="0.01" className="input !py-2 text-sm" value={v.salePrice || ''} onChange={(e) => updateVariant(i, 'salePrice', e.target.value)} /></Field>
                <Field label="Stock"><input type="number" className="input !py-2 text-sm" value={v.stockQuantity} onChange={(e) => updateVariant(i, 'stockQuantity', e.target.value)} /></Field>
                <button type="button" onClick={() => removeVariant(i)} className="btn-ghost !py-2 text-sm text-rose-300">Remove</button>
              </div>
            ))}
            {!form.variants.length && <p className="text-slate-500 text-sm">No variants. Add some e.g. "3 Months", "6 Months", "1 Year".</p>}
          </div>
        </div>

        <div className="glass-card grid gap-4 md:grid-cols-2">
          <Field label="Tags (comma separated)"><input className="input" value={tagInput} onChange={(e) => { setTagInput(e.target.value); set('tags', e.target.value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)); }} /></Field>
          <Field label="SEO title"><input className="input" value={form.seo.title} onChange={(e) => setSeo('title', e.target.value)} /></Field>
          <div className="md:col-span-2"><Field label="SEO description"><textarea className="input" rows="2" value={form.seo.description} onChange={(e) => setSeo('description', e.target.value)} /></Field></div>
        </div>

        <div className="flex gap-3 sticky bottom-4">
          <button disabled={saving} className="btn-primary">{saving ? 'Saving…' : (id ? 'Update Product' : 'Create Product')}</button>
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </>
  );
}
