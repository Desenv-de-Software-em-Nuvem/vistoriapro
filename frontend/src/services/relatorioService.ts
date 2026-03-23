// Imóvel
export async function getPropertyDetails(propertyId: number | string) {
  const { data } = await api.get(`/imoveis/${propertyId}`);
  return data.imovel;
}
export async function updatePropertyDetails(propertyId: number | string, payload: any) {
  await api.put(`/imoveis/${propertyId}`, payload);
}

// Vistoria
export async function getInspectionDetails(inspectionId: number | string) {
  const { data } = await api.get(`/vistorias/${inspectionId}`);
  return data;
}
export async function updateInspectionDetails(inspectionId: number | string, payload: any) {
  await api.put(`/vistorias/${inspectionId}`, payload);
}

// Locatários
export async function getLocatarios(inspectionId: number | string) {
  const { data } = await api.get(`/locatarios-vistoria/vistoria/${inspectionId}`);
  return data;
}
export async function addLocatario(inspectionId: number | string, payload: any) {
  await api.post(`/locatarios-vistoria`, { ...payload, vistoria_id: inspectionId });
}
export async function updateLocatario(id: number, payload: any) {
  await api.put(`/locatarios-vistoria/${id}`, payload);
}
export async function deleteLocatario(id: number) {
  await api.delete(`/locatarios-vistoria/${id}`);
}
import api from './api';

export interface Relatorio {
  id: number;
  vistoria_id: number;
  url_arquivo: string;
  dados_adicionais?: string;
  created_at: string;
}

export const listarRelatorios = async (): Promise<Relatorio[]> => {
  const response = await api.get('/relatorios');
  return response.data;
};

export const downloadRelatorio = async (id: number): Promise<Blob> => {
  const response = await api.get(`/relatorios/${id}/download`, { responseType: 'blob' });
  return response.data;
};

export const gerarRelatorio = async (vistoria_id: number, dados_adicionais?: any) => {
  const response = await api.post('/relatorios/gerar', { vistoria_id, dados_adicionais });
  return response.data;
};
