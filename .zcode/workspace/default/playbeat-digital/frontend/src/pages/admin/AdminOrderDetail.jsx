import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Loader, Modal, Field, ConfirmButton } from '../../components/admin/AdminUI';
import { StatusBadge } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { formatPrice, formatDateTime } from '../../lib/format';
import { ORDER_STATUS } from '../../lib/constants';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { success, error } = useToast();
  const [data, setData] = useState(null);
  const [noteModal, setNoteModal] = useState(false);
  const [note, setNote] = useState('');

  const load = () => adminApi.get(`/admin/orders/${id}`).then(({ data }) => setData(data.data)).catch(() => setData(null));
  useEffect(() => { load(); }, [id]);

  const setStatus = async (status) => {
    try { await adminApi.put(`/admin/orders/${id}/status`, { status }); success(`Status → ${status}`); load(); }
    catch (err) { error(err.message); }
  };
  const resend = async () => { try { await adminApi.post(`/admin/orders/${id}/resend-delivery`); success('Delivery email resent'); } catch (err) { error(err.message); } };
  const refund = async () => { try { await adminApi.post(`/admin/orders/${id}/refund`); success('Refund processed'); load(); } catch (err) { error(err.message); } };
  const addNote = async (e) => { e.preventDefault(); try { await adminApi.post(`/admin/orders/${id}/notes`, { text: note }); success('Note added'); setNote(''); setNoteModal(false); load(); } catch (err) { error(err.message); } };

  if (!data) return <Loader />;
  const { order, payments } = data;

  return (
    <>
      <Seo title={`Order ${order.orderNumber} · Admin`} />
      <Link to="/admin/orders" className="text-sm text-slate-400 hover:text-electric-light mb-4 inline-block">← All orders</Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-100">{order.orderNumber}</h2>
                <p className="text-slate-400 text-sm">{formatDateTime(order.createdAt)}</p>
              </div>
              <div className="flex gap-2"><StatusBadge status={order.paymentStatus} /><StatusBadge status={order.status} /></div>
            </div>

            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-white/10 p-3">
                  <img src={item.image} alt="" className="h-12 w-12 rounded object-cover" />
                  <div className="flex-1">
                    <div className="text-slate-100 text-sm">{item.name} {item.variantName && <span className="text-slate-400">— {item.variantName}</span>}</div>
                    <div className="text-xs text-slate-500">{item.qty} × {formatPrice(item.unitPrice, order.currency)}</div>
                  </div>
                  <div className="text-right"><div className="font-semibold text-sm">{formatPrice(item.total, order.currency)}</div><StatusBadge status={item.deliveryStatus} /></div>
                  {item.deliveredAssets?.length > 0 && (
                    <div className="w-48 space-y-1">
                      {item.deliveredAssets.map((a, ai) => (
                        <div key={ai} className="text-xs bg-navy-950/60 rounded p-1 break-all font-mono text-accent-light border border-white/10">{a.payload}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-white/10 pt-3 space-y-1 text-sm sm:w-64 sm:ml-auto">
              <div className="flex justify-between text-slate-300"><span>Subtotal</span><span>{formatPrice(order.subtotal, order.currency)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-emerald-300"><span>Discount</span><span>−{formatPrice(order.discount, order.currency)}</span></div>}
              {order.tax > 0 && <div className="flex justify-between text-slate-300"><span>Tax</span><span>{formatPrice(order.tax, order.currency)}</span></div>}
              <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2"><span>Total</span><span>{formatPrice(order.total, order.currency)}</span></div>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="font-semibold text-slate-100 mb-3">Timeline & Notes</h3>
            <div className="space-y-2 text-sm">
              {order.timeline?.map((t, i) => (
                <div key={i} className="flex gap-2"><span className="text-slate-500 w-32 shrink-0">{formatDateTime(t.at)}</span><span className="text-slate-300">{t.status}{t.note ? ` — ${t.note}` : ''}</span></div>
              ))}
              {order.notes?.map((n, i) => (
                <div key={i} className="flex gap-2 border-t border-white/5 pt-2"><span className="text-slate-500 w-32 shrink-0">{formatDateTime(n.at)}</span><span className="text-slate-300">📝 {n.by}: {n.text}</span></div>
              ))}
            </div>
            <button onClick={() => setNoteModal(true)} className="btn-ghost mt-3 text-sm">+ Add note</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card">
            <h3 className="font-semibold text-slate-100 mb-3">Customer</h3>
            <div className="text-sm space-y-1">
              <div className="text-slate-100">{order.customerInfo?.name}</div>
              <div className="text-slate-400">{order.customerInfo?.email}</div>
              {order.customerInfo?.phone && <div className="text-slate-400">{order.customerInfo.phone}</div>}
              {order.user?._id && <Link to={`/admin/customers/${order.user._id}`} className="text-electric-light text-sm">View customer →</Link>}
            </div>
          </div>

          <div className="glass-card">
            <h3 className="font-semibold text-slate-100 mb-3">Actions</h3>
            <div className="space-y-2">
              <div>
                <label className="label">Update status</label>
                <select className="input !py-2 text-sm" defaultValue={order.status} onChange={(e) => setStatus(e.target.value)}>
                  {ORDER_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {order.paymentMethod === 'manual' && order.paymentStatus !== 'succeeded' && (
                  <p className="text-xs text-sky-300 mt-1">Set status to "paid" to verify a manual payment & trigger delivery.</p>
                )}
              </div>
              <button onClick={resend} className="btn-ghost w-full text-sm">Resend Delivery Email</button>
              {order.paymentStatus === 'succeeded' && (
                <ConfirmButton onConfirm={refund} className="w-full !py-2 bg-rose-500/15 text-rose-300">Issue Refund</ConfirmButton>
              )}
            </div>
          </div>

          {payments?.length > 0 && (
            <div className="glass-card">
              <h3 className="font-semibold text-slate-100 mb-3">Payments</h3>
              <div className="space-y-2 text-sm">
                {payments.map((p) => (
                  <div key={p._id} className="flex items-center justify-between">
                    <span className="capitalize text-slate-300">{p.provider}</span>
                    <div className="text-right"><div>{formatPrice(p.amount, p.currency)}</div><StatusBadge status={p.status} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={noteModal} onClose={() => setNoteModal(false)} title="Add Internal Note">
        <form onSubmit={addNote} className="space-y-3">
          <Field label="Note"><textarea className="input" rows="3" value={note} onChange={(e) => setNote(e.target.value)} required /></Field>
          <button className="btn-primary">Add Note</button>
        </form>
      </Modal>
    </>
  );
}
