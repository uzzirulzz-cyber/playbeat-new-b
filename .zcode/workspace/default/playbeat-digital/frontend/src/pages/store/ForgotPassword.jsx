import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Seo } from '../../components/Seo';

export default function ForgotPassword() {
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      success('If that email exists, a reset link has been sent.');
      if (data.devToken) {
        // Dev convenience when SMTP isn't configured.
        setSent(`(Dev mode) Use this token: ${data.devToken}`);
      }
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo title="Forgot Password" />
      <div className="mx-auto max-w-md">
        <div className="glass-card">
          <h1 className="font-display text-2xl font-bold text-slate-100 mb-1">Reset your password</h1>
          <p className="text-slate-400 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
          <form onSubmit={submit} className="space-y-4">
            <div><label className="label">Email</label><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <button disabled={loading} className="btn-primary w-full">{loading ? 'Sending…' : 'Send Reset Link'}</button>
          </form>
          {sent && <p className="mt-3 text-xs text-electric-light break-all">{sent}</p>}
          <p className="mt-4 text-center text-sm text-slate-400"><Link to="/login" className="text-electric-light hover:underline">← Back to login</Link></p>
        </div>
      </div>
    </>
  );
}
