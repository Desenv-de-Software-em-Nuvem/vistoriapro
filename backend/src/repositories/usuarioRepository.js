import { AppDataSource } from '../data-source.js';
import Usuario from '../entities/Usuario.js';

const repository = () => AppDataSource.getRepository(Usuario);

export const UsuarioRepository = {
  findAll: () => repository().find(),
  findById: (id) => repository().findOneBy({ id }),
  create: (data) => repository().save(data),
  update: async (id, data) => {
    await repository().update(id, data);
    return repository().findOneBy({ id });
  },
  delete: (id) => repository().delete(id),
};
