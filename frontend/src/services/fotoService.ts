import api from './api';

export interface Foto {
  id: number;
  vistoria_id: number;
  url: string;
  descricao?: string;
  comodo_nome?: string;
  comodo_id?: number;
  created_at?: string;
}

// Faz upload de uma foto para o backend, retorna a foto criada
export async function uploadFoto({ vistoria_id, file, descricao, comodo_nome, comodo_id }: {
  vistoria_id: string | number;
  file: File;
  descricao?: string;
  comodo_nome?: string;
  comodo_id?: string | number;
}) {
  const formData = new FormData();
  formData.append('vistoria_id', String(vistoria_id));
  formData.append('foto', file);
  if (descricao) formData.append('descricao', descricao);
  if (comodo_nome) formData.append('comodo_nome', comodo_nome);
  // Só envia comodo_id se for numérico
  if (typeof comodo_id === 'number' && !isNaN(comodo_id)) {
    formData.append('comodo_id', String(comodo_id));
  }
  const response = await api.post('/fotos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return response.data.foto;
}

export async function listarFotosPorVistoria(vistoriaId: string | number): Promise<Foto[]> {
  const response = await api.get('/fotos', {
    params: { vistoria_id: vistoriaId },
  });
  return response.data;
}
