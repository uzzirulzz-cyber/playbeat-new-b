import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useToast } from '../../components/Toast';
import { Seo } from '../../components/Seo';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const { error } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      navigate('/admin');
    } catch (err) {
      error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Admin Login" />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card w-full max-w-md">
          <Link to="/" className="font-display text-xl font-bold block mb-1">
            <span className="text-electric">PLAYBEAT</span><span className="text-accent">.DIGITAL</span>
          </Link>
          <p className="text-slate-400 text-sm mb-6">Admin Console</p>
          <form onSubmit={submit} className="space-y-4">
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoFocus /></div>
            <div><label className="label">Password</label><input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
            <button disabled={loading} className="btn-primary w-full">{loading ? 'Signing in…' : 'Sign In'}</button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-500">Protected area · role-based access control enforced server-side.</p>
        </div>
      </div>
    </>
  );
}
