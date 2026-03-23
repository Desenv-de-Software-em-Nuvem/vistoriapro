import { AppDataSource } from '../data-source.js';
import Imovel from '../entities/Imovel.js';

const repository = () => AppDataSource.getRepository(Imovel);

export const ImovelRepository = {
  findAll: () => repository().find(),
  findById: (id, options = {}) => {
    if (options.empresaId) {
      return repository().findOne({
        where: { id, empresa: { id: options.empresaId } },
      });
    }
    return repository().findOneBy({ id });
  },
  findByEmpresaId: (empresaId) => repository().find({ where: { empresa: { id: empresaId } } }),
  create: (data) => repository().save(data),
  update: async (id, data) => {
    await repository().update(id, data);
    return repository().findOneBy({ id });
  },
  delete: (id) => repository().delete(id),
};
