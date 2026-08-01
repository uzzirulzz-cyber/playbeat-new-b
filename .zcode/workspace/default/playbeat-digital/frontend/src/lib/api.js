const BASE = import.meta.env.VITE_API_URL || '/api';

const tokenStorage = {
  customer: 'pb_token',
  admin: 'pb_admin_token',
};

const makeInstance = (storageKey) => {
  const instance = axios.create({ baseURL: BASE, withCredentials: true, timeout: 20000 });
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem(storageKey);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Network error';
      if (status === 401 && storageKey === tokenStorage.admin && !window.location.pathname.startsWith('/admin/login')) {
        localStorage.removeItem(tokenStorage.admin);
        window.location.href = '/admin/login';
      }
      return Promise.reject({ status, message, data: error.response?.data, isApiError: true });
    }
  );
  return instance;
};

import axios from 'axios';

export const api = makeInstance(tokenStorage.customer);
export const adminApi = makeInstance(tokenStorage.admin);

export const setToken = (scope, token) => {
  if (token) localStorage.setItem(tokenStorage[scope], token);
  else localStorage.removeItem(tokenStorage[scope]);
};

export { tokenStorage };
