import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Loader } from '../../components/admin/AdminUI';
import { StatusBadge } from '../../components/ui';
import { formatPrice, formatDateTime, timeAgo } from '../../lib/format';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      adminApi.get('/dashboard'),
      adminApi.get('/analytics?days=14'),
    ]).then(([s, a]) => {
      setStats({ ...s.data.data, ...a.data.data });
    }).catch(() => setStats(null));
  }, []);

  if (!stats) return <Loader />;

  const revenueSeries = (stats.revenueByDay || []).map((r) => ({ date: r._id.slice(5), revenue: Math.round(r.revenue), orders: r.count }));

  const cards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), tone: 'text-emerald-300' },
    { label: "Today's Sales", value: formatPrice(stats.todaySales), tone: 'text-electric-light' },
    { label: 'Monthly Sales', value: formatPrice(stats.monthlySales), tone: 'text-accent-light' },
    { label: 'Total Orders', value: stats.totalOrders, tone: 'text-slate-100' },
    { label: 'Pending Orders', value: stats.pendingOrders, tone: 'text-amber-300' },
    { label: 'Completed', value: stats.completedOrders, tone: 'text-emerald-300' },
    { label: 'Customers', value: stats.totalCustomers, tone: 'text-slate-100' },
    { label: 'Active Products', value: stats.activeProducts, tone: 'text-slate-100' },
    { label: 'Low Stock', value: stats.lowStockProducts, tone: 'text-rose-300' },
    { label: 'Failed Payments', value: stats.failedPayments, tone: 'text-rose-300' },
    { label: 'Refunds', value: stats.refunds, tone: 'text-fuchsia-300' },
    { label: 'Open Tickets', value: stats.openTickets, tone: 'text-sky-300' },
  ];

  return (
    <>
      <Seo title="Dashboard · Admin" />
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="glass p-4">
            <div className="text-xs text-slate-400">{c.label}</div>
            <div className={`mt-1 text-2xl font-bold ${c.tone}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card lg:col-span-2">
          <h3 className="font-semibold text-slate-100 mb-4">Revenue (14 days)</h3>
          {revenueSeries.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ background: '#0a0f1e', border: '1px solid #1f2937', borderRadius: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm py-10 text-center">No revenue data yet.</p>}
        </div>

        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100">Recent Orders</h3>
            <Link to="/admin/orders" className="text-sm text-electric-light">All →</Link>
          </div>
          <div className="space-y-2">
            {stats.recentOrders?.length ? stats.recentOrders.map((o) => (
              <Link key={o._id} to={`/admin/orders/${o._id}`} className="flex items-center justify-between rounded-lg border border-white/5 p-2 hover:bg-white/5">
                <div>
                  <div className="font-mono text-xs text-electric-light">{o.orderNumber}</div>
                  <div className="text-xs text-slate-500">{o.user?.email || '—'} · {timeAgo(o.createdAt)}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">{formatPrice(o.total, o.currency)}</div>
                  <StatusBadge status={o.paymentStatus} />
                </div>
              </Link>
            )) : <p className="text-slate-500 text-sm">No orders yet.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
