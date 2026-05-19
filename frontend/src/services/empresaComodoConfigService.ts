import api from './api';

export interface EmpresaComodoConfig {
  id: number;
  empresa_id: number;
  tipo_imovel: string;
  comodo_key: string;
  nome_exibicao: string;
  created_at?: string;
  updated_at?: string;
}

export async function listarComodosConfigEmpresa(tipo_imovel: string): Promise<EmpresaComodoConfig[]> {
  const { data } = await api.get<EmpresaComodoConfig[]>('/empresa-comodos-config', {
    params: { tipo_imovel },
  });
  return data;
}

export async function salvarComodoConfigEmpresa(payload: {
  tipo_imovel: string;
  comodo_key: string;
  nome_exibicao: string;
}): Promise<EmpresaComodoConfig> {
  const { data } = await api.put<EmpresaComodoConfig>('/empresa-comodos-config', payload);
  return data;
}

export async function restaurarComodoConfigPadrao(tipo_imovel: string, comodo_key: string): Promise<void> {
  await api.delete('/empresa-comodos-config', {
    params: { tipo_imovel, comodo_key },
  });
}
