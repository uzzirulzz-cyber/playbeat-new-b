import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { adminApi, setToken } from '../lib/api';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('pb_admin_token')) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await adminApi.get('/admin/auth/me');
      setAdmin(data.data);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (credentials) => {
    const { data } = await adminApi.post('/admin/auth/login', credentials);
    setToken('admin', data.data.token);
    setAdmin(data.data.admin);
    return data.data.admin;
  };

  const logout = async () => {
    try { await adminApi.post('/admin/auth/logout'); } catch { /* noop */ }
    setToken('admin', null);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, refresh, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};
