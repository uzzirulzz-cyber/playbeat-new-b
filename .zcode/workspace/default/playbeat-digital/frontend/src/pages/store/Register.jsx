import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { Seo } from '../../components/Seo';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { error('Passwords do not match'); return; }
    if (form.password.length < 8) { error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      success('Account created!');
      navigate('/account');
    } catch (err) {
      error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Create Account" />
      <div className="mx-auto max-w-md">
        <div className="glass-card">
          <h1 className="font-display text-2xl font-bold text-slate-100 mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm mb-6">Join PlayBeat Digital for instant digital delivery.</p>
          <form onSubmit={submit} className="space-y-4">
            <div><label className="label">Full name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div><label className="label">Phone (optional)</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Password</label><input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
              <div><label className="label">Confirm</label><input type="password" className="input" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required /></div>
            </div>
            <button disabled={loading} className="btn-primary w-full">{loading ? 'Creating…' : 'Create Account'}</button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-400">Already have an account? <Link to="/login" className="text-electric-light hover:underline">Login</Link></p>
        </div>
      </div>
    </>
  );
}
