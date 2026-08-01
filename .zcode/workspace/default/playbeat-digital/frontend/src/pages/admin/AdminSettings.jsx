import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { Seo } from '../../components/Seo';
import { Loader, Field } from '../../components/admin/AdminUI';
import { useToast } from '../../components/Toast';

const TABS = ['General', 'Payments', 'Email', 'SEO', 'Social', 'Announcements'];

export default function AdminSettings() {
  const { success, error } = useToast();
  const [settings, setSettings] = useState(null);
  const [tab, setTab] = useState('General');
  const [saving, setSaving] = useState(false);

  useEffect(() => { adminApi.get('/admin/settings').then(({ data }) => setSettings(data.data)).catch(() => setSettings({})); }, []);

  const set = (path, value) => {
    setSettings((s) => {
      const next = JSON.parse(JSON.stringify(s));
      const keys = path.split('.');
      let cur = next;
      keys.slice(0, -1).forEach((k) => { cur[k] = cur[k] || {}; cur = cur[k]; });
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try { await adminApi.put('/admin/settings', settings); success('Settings saved'); }
    catch (err) { error(err.message); }
    finally { setSaving(false); }
  };

  if (!settings) return <Loader />;

  return (
    <>
      <Seo title="Settings · Admin" />
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm ${tab === t ? 'bg-electric/15 text-electric-light' : 'text-slate-300 hover:bg-white/5'}`}>{t}</button>
        ))}
      </div>

      <div className="glass-card max-w-2xl space-y-4">
        {tab === 'General' && (
          <>
            <Field label="Site name"><input className="input" value={settings.siteName || ''} onChange={(e) => set('siteName', e.target.value)} /></Field>
            <Field label="Tagline"><input className="input" value={settings.tagline || ''} onChange={(e) => set('tagline', e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Currency code"><input className="input" value={settings.currency || ''} onChange={(e) => set('currency', e.target.value.toUpperCase())} maxLength={3} /></Field>
              <Field label="Currency symbol"><input className="input" value={settings.currencySymbol || ''} onChange={(e) => set('currencySymbol', e.target.value)} /></Field>
            </div>
            <Field label="Tax %"><input type="number" step="0.01" className="input" value={settings.taxPercent || 0} onChange={(e) => set('taxPercent', Number(e.target.value))} /></Field>
            <Field label="Contact email"><input className="input" value={settings.contactEmail || ''} onChange={(e) => set('contactEmail', e.target.value)} /></Field>
          </>
        )}
        {tab === 'Payments' && (
          <>
            <p className="text-xs text-slate-500">Secret keys (Stripe, Lemon Squeezy, SMTP) live in server environment variables, never here.</p>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.payments?.stripeEnabled} onChange={(e) => set('payments.stripeEnabled', e.target.checked)} className="accent-electric" /> Enable Stripe</label>
            <Field label="Stripe publishable key (shown on storefront)"><input className="input" value={settings.payments?.stripePublishableKey || ''} onChange={(e) => set('payments.stripePublishableKey', e.target.value)} /></Field>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.payments?.lemonSqueezyEnabled} onChange={(e) => set('payments.lemonSqueezyEnabled', e.target.checked)} className="accent-electric" /> Enable Lemon Squeezy</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.payments?.manualEnabled} onChange={(e) => set('payments.manualEnabled', e.target.checked)} className="accent-electric" /> Enable Manual / Bank Transfer</label>
            <Field label="Manual payment label"><input className="input" value={settings.payments?.manualLabel || ''} onChange={(e) => set('payments.manualLabel', e.target.value)} /></Field>
            <Field label="Manual payment instructions"><textarea className="input" rows="3" value={settings.payments?.manualInstructions || ''} onChange={(e) => set('payments.manualInstructions', e.target.value)} /></Field>
          </>
        )}
        {tab === 'Email' && (
          <>
            <Field label="From name"><input className="input" value={settings.email?.fromName || ''} onChange={(e) => set('email.fromName', e.target.value)} /></Field>
            <Field label="From email"><input className="input" value={settings.email?.fromEmail || ''} onChange={(e) => set('email.fromEmail', e.target.value)} /></Field>
            <Field label="Order notifications to"><input className="input" value={settings.email?.orderNotificationsTo || ''} onChange={(e) => set('email.orderNotificationsTo', e.target.value)} /></Field>
            <p className="text-xs text-slate-500">Configure SMTP_* env vars on the backend to enable sending.</p>
          </>
        )}
        {tab === 'SEO' && (
          <>
            <Field label="Default title"><input className="input" value={settings.seo?.defaultTitle || ''} onChange={(e) => set('seo.defaultTitle', e.target.value)} /></Field>
            <Field label="Default description"><textarea className="input" rows="2" value={settings.seo?.defaultDescription || ''} onChange={(e) => set('seo.defaultDescription', e.target.value)} /></Field>
            <Field label="OG image URL"><input className="input" value={settings.seo?.ogImage || ''} onChange={(e) => set('seo.ogImage', e.target.value)} /></Field>
          </>
        )}
        {tab === 'Social' && (
          <div className="grid grid-cols-2 gap-3">
            {['twitter', 'instagram', 'youtube', 'discord', 'facebook'].map((s) => (
              <Field key={s} label={s}><input className="input" value={settings.social?.[s] || ''} onChange={(e) => set(`social.${s}`, e.target.value)} /></Field>
            ))}
          </div>
        )}
        {tab === 'Announcements' && (
          <>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.announcements?.enabled} onChange={(e) => set('announcements.enabled', e.target.checked)} className="accent-electric" /> Show announcement bar</label>
            <Field label="Message"><input className="input" value={settings.announcements?.message || ''} onChange={(e) => set('announcements.message', e.target.value)} /></Field>
          </>
        )}

        <button disabled={saving} onClick={save} className="btn-primary mt-2">{saving ? 'Saving…' : 'Save Settings'}</button>
      </div>
    </>
  );
}
