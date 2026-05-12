import api from './api';

export async function descreverFotoComIa({
  imagem,
  comodo_nome,
}: {
  imagem: string;
  comodo_nome: string;
}) {
  const response = await api.post('/ia/descrever-foto', {
    imagem,
    comodo_nome,
  }, {
    timeout: 60000,
  });

  return response.data.descricao as string;
}
