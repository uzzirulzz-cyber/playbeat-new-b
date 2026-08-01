import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Toolbar, Pagination, Loader } from '../../components/admin/AdminUI';
import { formatDateTime } from '../../lib/format';

export default function AdminAuditLogs() {
  const [data, setData] = useState(null);
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    const params = new URLSearchParams({ page, limit: 30 });
    if (action) params.set('action', action);
    adminApi.get(`/admin/audit-logs?${params}`).then(({ data }) => setData(data)).catch(() => setData({ data: [] }));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [action, page]);

  return (
    <>
      <Seo title="Audit Logs · Admin" />
      <Toolbar>
        <input className="input !py-2 text-sm w-64" placeholder="Filter action (e.g. product)…" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} />
      </Toolbar>
      {!data ? <Loader /> : (
        <div className="glass overflow-x-auto">
          <table className="table">
            <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Resource</th><th>IP</th></tr></thead>
            <tbody>
              {data.data.map((l) => (
                <tr key={l._id}>
                  <td className="text-slate-400 text-xs">{formatDateTime(l.createdAt)}</td>
                  <td className="text-slate-200">{l.adminEmail}</td>
                  <td className="font-mono text-xs text-electric-light">{l.action}</td>
                  <td className="text-slate-400">{l.resource}{l.resourceId ? ` · ${String(l.resourceId).slice(-6)}` : ''}</td>
                  <td className="text-slate-500 text-xs">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.data.length && <p className="text-center text-slate-500 py-10">No audit entries.</p>}
        </div>
      )}
      {data?.pagination && <Pagination pagination={data.pagination} onPage={setPage} />}
    </>
  );
}
