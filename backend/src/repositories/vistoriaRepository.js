import { AppDataSource } from '../data-source.js';
import Vistoria from '../entities/Vistoria.js';

const repository = () => AppDataSource.getRepository(Vistoria);

export const VistoriaRepository = {
  findAll: () => repository().find(),
  findById: (id) => repository().findOneBy({ id }),
  create: (data) => repository().save(data),
  update: async (id, data) => {
    await repository().update(id, data);
    return repository().findOneBy({ id });
  },
  delete: (id) => repository().delete(id),
};
