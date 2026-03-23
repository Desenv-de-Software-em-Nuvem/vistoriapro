import api from './api';

export interface Imovel {
  id: number;
  nome: string;
  endereco_completo: string;
  unidade?: string;
  cidade: string;
  uf: string;
  cep?: string;
  tipo: string;
  observacoes?: string;
  created_at: string;
  categoria?: string; // Adicionado para suportar fluxo de categoria opcional
}

export const listarImoveis = async (): Promise<Imovel[]> => {
  const response = await api.get('/imoveis');
  return response.data.imoveis;
};
