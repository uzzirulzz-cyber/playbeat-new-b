export const Rating = ({ value = 0, count, size = 'sm' }) => {
  const stars = [1, 2, 3, 4, 5];
  const fontSize = size === 'lg' ? 'text-xl' : 'text-sm';
  return (
    <div className={`inline-flex items-center gap-1 ${fontSize}`}>
      <span className="text-accent-light">
        {stars.map((s) => (
          <span key={s} className={value >= s - 0.25 ? '' : 'text-navy-600'}>★</span>
        ))}
      </span>
      <span className="text-slate-400 text-xs">
        {value ? value.toFixed(1) : 'New'}
        {count !== undefined && ` (${count})`}
      </span>
    </div>
  );
};

export const Badge = ({ children, tone, className = '' }) => (
  <span className={`badge ${tone || 'bg-white/10 text-slate-300'} ${className}`}>{children}</span>
);

export const Loader = ({ label = 'Loading…', full = false }) => (
  <div className={`flex flex-col items-center justify-center gap-3 ${full ? 'min-h-[60vh]' : 'py-12'}`}>
    <div className="h-8 w-8 rounded-full border-2 border-electric/30 border-t-electric animate-spin" />
    <p className="text-sm text-slate-400">{label}</p>
  </div>
);

export const EmptyState = ({ icon = '📦', title, description, action }) => (
  <div className="glass-card text-center flex flex-col items-center gap-3 py-16">
    <div className="text-4xl">{icon}</div>
    <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
    {description && <p className="text-slate-400 max-w-md">{description}</p>}
    {action}
  </div>
);

export const StatusBadge = ({ status, label }) => (
  <Badge tone={STATUS_TONES[status]}>{label || pretty(status)}</Badge>
);

import { STATUS_TONES, pretty } from '../lib/constants';
