import api from './api';

export async function deletarFoto(fotoId: string | number) {
  await api.delete(`/fotos/${fotoId}`);
}
