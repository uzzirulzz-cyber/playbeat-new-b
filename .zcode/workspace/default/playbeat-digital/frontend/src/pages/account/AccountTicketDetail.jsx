import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Loader, StatusBadge, EmptyState } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { formatDateTime } from '../../lib/format';
import { TICKET_CATEGORIES } from '../../lib/constants';

export default function AccountTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const isNew = id === 'new';
  const [ticket, setTicket] = useState(null);
  const [form, setForm] = useState({ category: 'order', subject: '', message: '', orderId: '' });
  const [orders, setOrders] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isNew) {
      api.get('/orders/mine').then(({ data }) => setOrders(data.data)).catch(() => {});
      setTicket({});
      return;
    }
    api.get(`/tickets/${id}`).then(({ data }) => setTicket(data.data)).catch(() => setTicket(null));
  }, [id, isNew]);

  const submitNew = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await api.post('/tickets', {
        category: form.category, subject: form.subject, message: form.message,
        orderId: form.orderId || null,
      });
      success('Ticket created');
      navigate(`/account/tickets/${data.data._id}`);
    } catch (err) { error(err.message); }
    finally { setSending(false); }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await api.post(`/tickets/${id}/reply`, { message: reply });
      setTicket(data.data);
      setReply('');
    } catch (err) { error(err.message); }
    finally { setSending(false); }
  };

  const close = async () => {
    try {
      const { data } = await api.post(`/tickets/${id}/close`);
      setTicket(data.data);
      success('Ticket closed');
    } catch (err) { error(err.message); }
  };

  if (!ticket) return <Loader />;
  if (ticket === null) return <EmptyState title="Ticket not found" />;

  if (isNew) {
    return (
      <>
        <Seo title="New Ticket" />
        <Link to="/account/tickets" className="text-sm text-slate-400 hover:text-electric-light mb-4 inline-block">← Back</Link>
        <div className="glass-card max-w-2xl">
          <h2 className="font-display text-xl font-bold text-slate-100 mb-4">Open a Support Ticket</h2>
          <form onSubmit={submitNew} className="space-y-4">
            <div><label className="label">Subject</label><input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Category</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {TICKET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">Related order (optional)</label>
                <select className="input" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}>
                  <option value="">None</option>
                  {orders.map((o) => <option key={o._id} value={o._id}>{o.orderNumber}</option>)}
                </select>
              </div>
            </div>
            <div><label className="label">Message</label><textarea className="input" rows="5" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></div>
            <button disabled={sending} className="btn-primary">{sending ? 'Sending…' : 'Submit Ticket'}</button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title={`Ticket ${ticket.ticketNumber}`} />
      <Link to="/account/tickets" className="text-sm text-slate-400 hover:text-electric-light mb-4 inline-block">← All tickets</Link>
      <div className="glass-card mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-100">{ticket.subject}</h2>
            <p className="text-xs text-slate-500 font-mono">{ticket.ticketNumber} · {ticket.category}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={ticket.status} />
            {ticket.status !== 'closed' && <button onClick={close} className="btn-ghost text-sm">Close</button>}
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {ticket.messages?.map((m, i) => (
          <div key={i} className={`flex ${m.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${m.senderType === 'customer' ? 'bg-electric/15 border border-electric/30' : 'glass'}`}>
              <div className="text-xs text-slate-400 mb-1">{m.senderName} · {formatDateTime(m.at)}</div>
              <p className="text-slate-200 whitespace-pre-line">{m.body}</p>
            </div>
          </div>
        ))}
      </div>

      {ticket.status !== 'closed' && (
        <form onSubmit={sendReply} className="glass-card flex gap-2">
          <input className="input" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply…" required />
          <button disabled={sending} className="btn-primary">{sending ? '…' : 'Send'}</button>
        </form>
      )}
    </>
  );
}
