import api from './api';

export async function descreverFotoComIa({
  imagem,
  imagens,
  comodo_nome,
  instrucoes,
}: {
  imagem?: string;
  imagens?: string[];
  comodo_nome: string;
  instrucoes?: string;
}) {
  const response = await api.post('/ia/descrever-foto', {
    imagem,
    imagens,
    comodo_nome,
    instrucoes,
  }, {
    timeout: 60000,
  });

  return response.data.descricao as string;
}
