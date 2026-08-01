import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Loader, EmptyState, StatusBadge } from '../../components/ui';
import { formatDate } from '../../lib/format';

export default function AccountTickets() {
  const [tickets, setTickets] = useState(null);
  useEffect(() => { api.get('/tickets').then(({ data }) => setTickets(data.data)).catch(() => setTickets([])); }, []);

  if (!tickets) return <Loader />;

  return (
    <>
      <Seo title="Support Tickets" />
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-slate-100">Support Tickets</h2>
        <Link to="/account/tickets/new" className="btn-primary text-sm">+ New Ticket</Link>
      </div>
      {!tickets.length ? (
        <EmptyState icon="🎫" title="No support tickets" description="Need help with an order? Open a ticket and our team will assist you." action={<Link to="/account/tickets/new" className="btn-primary">Open a Ticket</Link>} />
      ) : (
        <div className="glass overflow-hidden">
          <table className="table">
            <thead><tr><th>Ticket</th><th>Subject</th><th>Status</th><th>Updated</th><th></th></tr></thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id}>
                  <td className="font-mono text-xs text-electric-light">{t.ticketNumber}</td>
                  <td className="text-slate-200">{t.subject}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="text-slate-400">{formatDate(t.updatedAt)}</td>
                  <td><Link to={`/account/tickets/${t._id}`} className="text-electric-light text-sm">Open →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
