import axios from 'axios';

// Adicionando logs para depuração
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const baseURL = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
const apiTimeout = Number(import.meta.env.VITE_API_TIMEOUT || 30000);

// Removidos logs de URL em produção para evitar exposição de variáveis sensíveis

// Configuração base da API
const api = axios.create({
  baseURL: baseURL,
  timeout: apiTimeout,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json; charset=utf-8'
  }
});

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vistoriapro_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function isLoginRequest(url: string | undefined): boolean {
  if (!url) return false;
  return /\/usuarios\/login(?:\?|$)/.test(url);
}

// Interceptor para tratar respostas de erro
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = String(error.config?.url || '');
      // Login inválido deve exibir erro na tela, sem recarregar a página.
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
  }
);

export default api;
