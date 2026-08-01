// Small shared building blocks for the admin panel.
import { useState } from 'react';

export const Modal = ({ open, onClose, title, children, wide = false }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-auto bg-navy-950/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className={`glass-card w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} my-8`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Field = ({ label, children, hint }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </div>
);

export const Toolbar = ({ children }) => (
  <div className="mb-4 flex flex-wrap items-center gap-3">{children}</div>
);

export const SearchInput = ({ value, onChange, placeholder = 'Search…' }) => (
  <input className="input !py-2 text-sm w-64" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
);

export const Pagination = ({ pagination, onPage }) => {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div className="mt-6 flex justify-center gap-2">
      {Array.from({ length: pagination.pages }).map((_, i) => (
        <button key={i} onClick={() => onPage(i + 1)} className={`btn ${pagination.page === i + 1 ? 'btn-primary' : 'btn-ghost'} !px-3 !py-1 text-sm`}>{i + 1}</button>
      ))}
    </div>
  );
};

export const ConfirmButton = ({ onConfirm, children, className = 'btn-ghost text-sm', confirmText = 'Are you sure?' }) => {
  const [state, setState] = useState(false);
  if (!state) return <button className={className} onClick={() => setState(true)}>{children}</button>;
  return (
    <span className="inline-flex gap-1">
      <button className="btn !px-2 !py-1 text-xs bg-rose-500/20 text-rose-300" onClick={onConfirm}>Confirm</button>
      <button className="btn !px-2 !py-1 text-xs btn-ghost" onClick={() => setState(false)}>Cancel</button>
    </span>
  );
};

export const useResource = (fetchFn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = async () => {
    setLoading(true);
    try { const result = await fetchFn(); setData(result); setError(null); }
    catch (err) { setError(err.message || 'Failed to load'); setData(null); }
    finally { setLoading(false); }
  };
  return { data, loading, error, setData, load };
};
