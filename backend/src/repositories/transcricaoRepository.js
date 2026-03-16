import { AppDataSource } from '../data-source.js';
import Transcricao from '../entities/Transcricao.js';

const repository = () => AppDataSource.getRepository(Transcricao);

export const TranscricaoRepository = {
  findAll: () => repository().find(),
  findById: (id) => repository().findOneBy({ id }),
  create: (data) => repository().save(data),
  update: async (id, data) => {
    await repository().update(id, data);
    return repository().findOneBy({ id });
  },
  delete: (id) => repository().delete(id),
};
