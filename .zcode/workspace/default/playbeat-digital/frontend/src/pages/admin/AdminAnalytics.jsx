import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Loader } from '../../components/admin/AdminUI';
import { formatPrice } from '../../lib/format';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#ec4899', '#06b6d4', '#ef4444', '#84cc16'];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    adminApi.get(`/analytics?days=${days}`).then(({ data }) => setData(data.data)).catch(() => setData(null));
  }, [days]);

  if (!data) return <Loader />;

  const revenueSeries = (data.revenueByDay || []).map((r) => ({ date: r._id.slice(5), revenue: Math.round(r.revenue) }));
  const orderSeries = (data.ordersByDay || []).map((r) => ({ date: r._id.slice(5), orders: r.count }));
  const categoryPie = (data.categoryPerformance || []).map((c) => ({ name: c._id, value: Math.round(c.revenue) }));

  return (
    <>
      <Seo title="Analytics · Admin" />
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-display text-xl font-bold text-slate-100">Analytics</h2>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="input !py-2 text-sm w-auto">
          {[7, 14, 30, 90, 365].map((d) => <option key={d} value={d}>Last {d} days</option>)}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="glass-card">
          <h3 className="font-semibold text-slate-100 mb-4">Revenue</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ background: '#0a0f1e', border: '1px solid #1f2937', borderRadius: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card">
          <h3 className="font-semibold text-slate-100 mb-4">Orders</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={orderSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#0a0f1e', border: '1px solid #1f2937', borderRadius: 12 }} />
              <Bar dataKey="orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card">
          <h3 className="font-semibold text-slate-100 mb-4">Top Products</h3>
          <div className="space-y-2">
            {(data.topProducts || []).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 grid place-items-center rounded-full bg-electric/20 text-electric-light text-xs font-bold">{i + 1}</span>
                <span className="flex-1 text-slate-200 truncate">{p._id}</span>
                <span className="text-slate-400 text-sm">{p.units} sold</span>
                <span className="font-semibold text-emerald-300 w-20 text-right">{formatPrice(p.revenue)}</span>
              </div>
            ))}
            {!data.topProducts?.length && <p className="text-slate-500 text-sm">No sales yet.</p>}
          </div>
        </div>
        <div className="glass-card">
          <h3 className="font-semibold text-slate-100 mb-4">Revenue by Category</h3>
          {categoryPie.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
                  {categoryPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0a0f1e', border: '1px solid #1f2937', borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm">No category sales yet.</p>}
        </div>
      </div>
    </>
  );
}
