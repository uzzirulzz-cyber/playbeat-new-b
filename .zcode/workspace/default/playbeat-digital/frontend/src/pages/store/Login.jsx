import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { Seo } from '../../components/Seo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      success('Welcome back!');
      const from = location.state?.from || '/account';
      navigate(from);
    } catch (err) {
      error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Login" />
      <div className="mx-auto max-w-md">
        <div className="glass-card">
          <h1 className="font-display text-2xl font-bold text-slate-100 mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-6">Login to access your digital products and orders.</p>
          <form onSubmit={submit} className="space-y-4">
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div><label className="label">Password</label><input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
            <button disabled={loading} className="btn-primary w-full">{loading ? 'Signing in…' : 'Login'}</button>
          </form>
          <div className="mt-4 flex justify-between text-sm text-slate-400">
            <Link to="/forgot-password" className="hover:text-electric-light">Forgot password?</Link>
            <Link to="/register" className="hover:text-electric-light">Create account</Link>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          Admin? <Link to="/admin/login" className="text-electric-light hover:underline">Admin login →</Link>
        </p>
      </div>
    </>
  );
}
