import { AppDataSource } from '../data-source.js';
import Foto from '../entities/Foto.js';

const repository = () => AppDataSource.getRepository(Foto);

export const FotoRepository = {
  findAll: () => repository().find(),
  findById: (id) => repository().findOneBy({ id }),
  create: (data) => repository().save(data),
  update: async (id, data) => {
    await repository().update(id, data);
    return repository().findOneBy({ id });
  },
  delete: (id) => repository().delete(id),
};
