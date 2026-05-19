import api from './api';

export async function criarOuAtualizarComodoVistoria({ vistoria_id, nome, descricao, comodo_key }: {
  vistoria_id: string | number;
  nome: string;
  descricao: string;
  comodo_key?: string;
}) {
  return api.post('/comodos-vistoria', {
    vistoria_id,
    nome,
    descricao,
    comodo_key,
  });
}
