import { AppDataSource } from '../data-source.js';
import Empresa from '../entities/Empresa.js';

const repository = () => AppDataSource.getRepository(Empresa);

export const EmpresaRepository = {
  findAll: () => repository().find(),
  findById: (id) => repository().findOneBy({ id }),
  create: (data) => repository().save(data),
  update: async (id, data) => {
    await repository().update(id, data);
    return repository().findOneBy({ id });
  },
  delete: (id) => repository().delete(id),
};
