import api from './api';

export async function criarOuAtualizarComodoVistoria({ vistoria_id, nome, descricao }: {
  vistoria_id: string | number;
  nome: string;
  descricao: string;
}) {
  // POST para criar, PUT para atualizar (aqui só cria, pois não temos id do comodo)
  return api.post('/comodos-vistoria', {
    vistoria_id,
    nome,
    descricao,
  });
}
