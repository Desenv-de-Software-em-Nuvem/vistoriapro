import api from '../services/api';

export async function fetchEmpresas() {
  const response = await api.get('/empresas');
  return response.data;
}
