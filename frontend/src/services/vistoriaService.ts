import api from './api';

export interface Vistoria {
  id: number;
  descricao: string;
  data: string;
  status: string;
  usuario_id: number;
  imovel_id: number;
  empresa_id: number;
  created_at: string;
}

export interface NovaVistoriaPayload {
  imovel_id: number;
  descricao: string;
  data: string;
  status?: string;
}

export const criarVistoria = async (payload: NovaVistoriaPayload): Promise<Vistoria> => {
  const response = await api.post('/vistorias', payload);
  return response.data.vistoria;
};

export const listarVistorias = async (): Promise<Vistoria[]> => {
  const response = await api.get('/vistorias');
  return response.data.vistorias || response.data;
};

export const listarVistoriasPorImovel = async (imovelId: number): Promise<Vistoria[]> => {
  const response = await api.get(`/vistorias?imovel_id=${imovelId}`);
  return response.data.vistorias;
};

export const buscarVistoriaPorId = async (id: string | number): Promise<Vistoria> => {
  const response = await api.get(`/vistorias/${id}`);
  return response.data;
};

export const atualizarVistoria = async (id: number, dados: Partial<Vistoria>): Promise<Vistoria> => {
  const response = await api.put(`/vistorias/${id}`, dados);
  return response.data.vistoria;
};

export const deletarVistoria = async (id: number): Promise<void> => {
  await api.delete(`/vistorias/${id}`);
};
