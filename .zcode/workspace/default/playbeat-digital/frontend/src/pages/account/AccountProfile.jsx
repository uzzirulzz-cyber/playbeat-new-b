import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { Seo } from '../../components/Seo';
import { api } from '../../lib/api';

export default function AccountProfile() {
  const { user, updateProfile, setUser } = useAuth();
  const { success, error } = useToast();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { const updated = await updateProfile(form); setUser(updated); success('Profile updated'); }
    catch (err) { error(err.message); }
    finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await api.put('/auth/change-password', pwd); success('Password changed'); setPwd({ currentPassword: '', newPassword: '' }); }
    catch (err) { error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Seo title="Profile" />
      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={saveProfile} className="glass-card space-y-4">
          <h2 className="font-display text-lg font-bold text-slate-100">Profile Details</h2>
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input opacity-60" value={user?.email || ''} disabled /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <button disabled={saving} className="btn-primary">Save Changes</button>
        </form>

        <form onSubmit={changePassword} className="glass-card space-y-4">
          <h2 className="font-display text-lg font-bold text-slate-100">Change Password</h2>
          <div><label className="label">Current password</label><input type="password" className="input" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} required /></div>
          <div><label className="label">New password</label><input type="password" className="input" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} required /></div>
          <button disabled={saving} className="btn-ghost">Update Password</button>
        </form>
      </div>
    </>
  );
}
