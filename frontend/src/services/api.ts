import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const baseURL = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl.replace(/\/$/, '')}/api`;
const apiTimeout = Number(import.meta.env.VITE_API_TIMEOUT || 30000);

const api = axios.create({
  baseURL,
  timeout: apiTimeout,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json; charset=utf-8',
  },
});

function isLoginRequest(url: string | undefined): boolean {
  if (!url) return false;
  const normalized = url.split('?')[0] ?? '';
  return normalized.endsWith('/usuarios/login') || normalized.endsWith('usuarios/login');
}

api.interceptors.request.use(
  (config) => {
    if (isLoginRequest(config.url)) {
      delete config.headers.Authorization;
      return config;
    }

    const token = localStorage.getItem('vistoriapro_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = String(error.config?.url || '');
      if (isLoginRequest(requestUrl)) {
        return Promise.reject(error);
      }

      localStorage.removeItem('vistoriapro_token');
      localStorage.removeItem('vistoriapro_user');
      window.dispatchEvent(new Event('vistoriapro:session-expired'));
    }
    return Promise.reject(error);
  },
);

export default api;
