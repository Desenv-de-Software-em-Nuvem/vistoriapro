import { EntitySchema } from 'typeorm';

export default new EntitySchema({
  name: 'Empresa',
  tableName: 'empresas',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    nome: {
      type: String,
      length: 200,
      nullable: false,
    },
    cnpj: {
      type: String,
      length: 18,
      nullable: true,
      unique: true,
    },
    email: {
      type: String,
      length: 200,
      nullable: true,
    },
    telefone: {
      type: String,
      length: 30,
      nullable: true,
    },
    endereco: {
      type: 'text',
      nullable: true,
    },
    created_at: {
      type: 'timestamp',
      createDate: true,
      default: () => 'CURRENT_TIMESTAMP',
    },
  },
  relations: {
    usuarios: {
      type: 'one-to-many',
      target: 'Usuario',
      inverseSide: 'empresa',
    },
    imoveis: {
      type: 'one-to-many',
      target: 'Imovel',
      inverseSide: 'empresa',
    },
    vistorias: {
      type: 'one-to-many',
      target: 'Vistoria',
      inverseSide: 'empresa',
    },
  },
});
