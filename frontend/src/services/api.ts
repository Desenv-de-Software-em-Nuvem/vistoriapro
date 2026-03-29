import axios from 'axios';

// Adicionando logs para depuração
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const baseURL = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;

console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Base URL que será usada:', baseURL);

// Configuração base da API
const api = axios.create({
  baseURL: baseURL,
  timeout: 10000,
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
