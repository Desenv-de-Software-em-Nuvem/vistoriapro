import { EntitySchema } from 'typeorm';

export default new EntitySchema({
  name: 'Imovel',
  tableName: 'imoveis',
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
    endereco_completo: {
      type: 'text',
      nullable: false,
    },
    unidade: {
      type: String,
      length: 50,
      nullable: true,
    },
    cidade: {
      type: String,
      length: 100,
      nullable: false,
    },
    uf: {
      type: String,
      length: 2,
      nullable: false,
    },
    cep: {
      type: String,
      length: 20,
      nullable: false,
    },
    tipo: {
      type: String,
      length: 50,
      nullable: false,
    },
    observacoes: {
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
    empresa: {
      type: 'many-to-one',
      target: 'Empresa',
      joinColumn: {
        name: 'empresa_id',
      },
      onDelete: 'CASCADE',
    },
    vistorias: {
      type: 'one-to-many',
      target: 'Vistoria',
      inverseSide: 'imovel',
    },
  },
});
