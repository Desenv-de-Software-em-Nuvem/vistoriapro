import axios from 'axios';

const PRODUCTION_API_URL = 'https://vistoriapro-production.up.railway.app';

function resolveApiUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  if (configuredUrl) {
    return configuredUrl;
  }

  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return PRODUCTION_API_URL;
    }
  }

  return 'http://localhost:3001';
}

const apiUrl = resolveApiUrl();
const baseURL = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
const apiTimeout = Number(import.meta.env.VITE_API_TIMEOUT || 30000);

const api = axios.create({
  baseURL,
  timeout: apiTimeout,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json; charset=utf-8',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vistoriapro_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

function isLoginRequest(url: string | undefined): boolean {
  if (!url) return false;
  return /\/usuarios\/login(?:\?|$)/.test(url);
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = String(error.config?.url || '');
      if (isLoginRequest(requestUrl)) {
        return Promise.reject(error);
      }

      const hadSession = Boolean(localStorage.getItem('vistoriapro_token'));
      localStorage.removeItem('vistoriapro_token');
      localStorage.removeItem('vistoriapro_user');

      if (hadSession && !window.location.pathname.startsWith('/login')) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  },
);

export default api;
