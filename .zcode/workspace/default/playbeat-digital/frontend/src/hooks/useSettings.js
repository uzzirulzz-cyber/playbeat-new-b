import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// Cached public settings so every page gets currency/support info without re-fetching.
let cache = null;

export const useSettings = () => {
  const [settings, setSettings] = useState(cache);

  useEffect(() => {
    let active = true;
    if (cache) { setSettings(cache); return; }
    api.get('/settings').then(({ data }) => {
      if (active) { cache = data.data; setSettings(data.data); }
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  return { settings, currencySymbol: settings?.currencySymbol || '$' };
};
