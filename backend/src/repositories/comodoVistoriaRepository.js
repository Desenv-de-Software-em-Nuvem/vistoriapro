import { AppDataSource } from '../data-source.js';
import ComodoVistoria from '../entities/ComodoVistoria.js';

const repository = () => AppDataSource.getRepository(ComodoVistoria);

export const ComodoVistoriaRepository = {
  findAll: () => repository().find(),
  findById: (id) => repository().findOneBy({ id }),
  create: (data) => repository().save(data),
  update: async (id, data) => {
    await repository().update(id, data);
    return repository().findOneBy({ id });
  },
  delete: (id) => repository().delete(id),
};
