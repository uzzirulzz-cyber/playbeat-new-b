import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Loader } from '../../components/admin/AdminUI';
import { StatusBadge } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { formatDateTime } from '../../lib/format';
import { TICKET_STATUS, TICKET_PRIORITY } from '../../lib/constants';

export default function AdminTicketDetail() {
  const { id } = useParams();
  const { success, error } = useToast();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const load = () => adminApi.get(`/admin/tickets/${id}`).then(({ data }) => setTicket(data.data)).catch(() => setTicket(null));
  useEffect(() => { load(); }, [id]);

  const sendReply = async (e) => {
    e.preventDefault();
    setSending(true);
    try { const { data } = await adminApi.post(`/admin/tickets/${id}/reply`, { message: reply, internal }); setTicket(data.data); setReply(''); setInternal(false); success('Reply sent'); }
    catch (err) { error(err.message); }
    finally { setSending(false); }
  };

  const update = async (changes) => { try { const { data } = await adminApi.put(`/admin/tickets/${id}`, changes); setTicket(data.data); success('Updated'); } catch (err) { error(err.message); } };

  if (!ticket) return <Loader />;

  return (
    <>
      <Seo title={`Ticket ${ticket.ticketNumber} · Admin`} />
      <Link to="/admin/tickets" className="text-sm text-slate-400 hover:text-electric-light mb-4 inline-block">← All tickets</Link>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card">
            <h2 className="font-display text-lg font-bold text-slate-100">{ticket.subject}</h2>
            <p className="text-xs text-slate-500">{ticket.ticketNumber} · {ticket.user?.email} · {ticket.category}</p>
          </div>
          <div className="space-y-3">
            {ticket.messages?.map((m, i) => (
              <div key={i} className={`rounded-2xl p-4 ${m.senderType === 'admin' ? 'bg-accent/10 border border-accent/30 ml-8' : 'glass mr-8'} ${m.internal ? 'opacity-60 border-dashed' : ''}`}>
                <div className="text-xs text-slate-400 mb-1">{m.senderName} · {formatDateTime(m.at)} {m.internal && '· 🔒 internal'}</div>
                <p className="text-slate-200 whitespace-pre-line">{m.body}</p>
              </div>
            ))}
          </div>
          <form onSubmit={sendReply} className="glass-card space-y-2">
            <textarea className="input" rows="3" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to customer…" required />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-400"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="accent-electric" /> Internal note (not visible to customer)</label>
              <button disabled={sending} className="btn-primary">{sending ? '…' : 'Send'}</button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="glass-card space-y-3">
            <h3 className="font-semibold text-slate-100">Controls</h3>
            <div>
              <label className="label">Status</label>
              <select className="input !py-2 text-sm" value={ticket.status} onChange={(e) => update({ status: e.target.value })}>
                {TICKET_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input !py-2 text-sm" value={ticket.priority} onChange={(e) => update({ priority: e.target.value })}>
                {TICKET_PRIORITY.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex justify-between"><span className="text-slate-400 text-sm">Payment</span><StatusBadge status={ticket.status} /></div>
            {ticket.order && <div className="text-sm"><span className="text-slate-400">Order: </span><Link to={`/admin/orders/${ticket.order._id}`} className="text-electric-light">{ticket.order.orderNumber}</Link></div>}
          </div>
        </div>
      </div>
    </>
  );
}
