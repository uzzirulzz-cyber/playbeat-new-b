import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Seo } from '../../components/Seo';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password: form.password });
      success('Password reset! You can now log in.');
      navigate('/login');
    } catch (err) {
      error(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Reset Password" />
      <div className="mx-auto max-w-md">
        <div className="glass-card">
          <h1 className="font-display text-2xl font-bold text-slate-100 mb-6">Set a new password</h1>
          <form onSubmit={submit} className="space-y-4">
            <div><label className="label">New password</label><input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
            <div><label className="label">Confirm</label><input type="password" className="input" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required /></div>
            <button disabled={loading} className="btn-primary w-full">{loading ? 'Resetting…' : 'Reset Password'}</button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-400"><Link to="/login" className="text-electric-light hover:underline">← Back to login</Link></p>
        </div>
      </div>
    </>
  );
}
