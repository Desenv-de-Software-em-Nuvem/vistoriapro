import { AppDataSource } from '../data-source.js';
import LocatarioVistoria from '../entities/LocatarioVistoria.js';

const repository = () => AppDataSource.getRepository(LocatarioVistoria);

export const LocatarioVistoriaRepository = {
  findAll: () => repository().find(),
  findById: (id) => repository().findOneBy({ id }),
  create: (data) => repository().save(data),
  update: async (id, data) => {
    await repository().update(id, data);
    return repository().findOneBy({ id });
  },
  delete: (id) => repository().delete(id),
};
