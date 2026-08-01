import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Toolbar, SearchInput, Pagination, Loader } from '../../components/admin/AdminUI';
import { StatusBadge } from '../../components/ui';
import { formatDate } from '../../lib/format';
import { TICKET_STATUS, TICKET_PRIORITY } from '../../lib/constants';

export default function AdminTickets() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [page, setPage] = useState(1);

  const load = () => {
    const params = new URLSearchParams({ page, limit: 20 });
    if (q) params.set('q', q);
    if (status !== 'all') params.set('status', status);
    if (priority !== 'all') params.set('priority', priority);
    adminApi.get(`/admin/tickets?${params}`).then(({ data }) => setData(data)).catch(() => setData({ data: [] }));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, status, priority, page]);

  return (
    <>
      <Seo title="Support Tickets · Admin" />
      <Toolbar>
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Ticket # or subject…" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input !py-2 text-sm w-auto">
          <option value="all">all status</option>
          {TICKET_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="input !py-2 text-sm w-auto">
          <option value="all">all priority</option>
          {TICKET_PRIORITY.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>
      {!data ? <Loader /> : (
        <div className="glass overflow-x-auto">
          <table className="table">
            <thead><tr><th>Ticket</th><th>Subject</th><th>Customer</th><th>Priority</th><th>Status</th><th>Updated</th><th></th></tr></thead>
            <tbody>
              {data.data.map((t) => (
                <tr key={t._id}>
                  <td className="font-mono text-xs text-electric-light">{t.ticketNumber}</td>
                  <td className="text-slate-200">{t.subject}</td>
                  <td className="text-slate-400">{t.user?.email}</td>
                  <td><StatusBadge status={t.priority} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="text-slate-400 text-xs">{formatDate(t.updatedAt)}</td>
                  <td><Link to={`/admin/tickets/${t._id}`} className="text-electric-light text-sm">Open →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.data.length && <p className="text-center text-slate-500 py-10">No tickets found.</p>}
        </div>
      )}
      {data?.pagination && <Pagination pagination={data.pagination} onPage={setPage} />}
    </>
  );
}
