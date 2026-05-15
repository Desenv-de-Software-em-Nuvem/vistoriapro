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

// Interceptor para tratar respostas de erro
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido - fazer logout
      localStorage.removeItem('vistoriapro_token');
      localStorage.removeItem('vistoriapro_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
