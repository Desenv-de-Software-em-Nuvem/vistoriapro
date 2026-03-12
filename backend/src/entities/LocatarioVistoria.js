import { EntitySchema } from 'typeorm';

export default new EntitySchema({
  name: 'LocatarioVistoria',
  tableName: 'locatarios_vistoria',
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
    nacionalidade: {
      type: String,
      length: 50,
      nullable: true,
    },
    profissao: {
      type: String,
      length: 100,
      nullable: true,
    },
    cpf: {
      type: String,
      length: 20,
      nullable: true,
    },
    rg: {
      type: String,
      length: 30,
      nullable: true,
    },
    rg_orgao: {
      type: String,
      length: 20,
      nullable: true,
    },
    rg_uf: {
      type: String,
      length: 5,
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
    vistoria: {
      type: 'many-to-one',
      target: 'Vistoria',
      joinColumn: { name: 'vistoria_id' },
      onDelete: 'CASCADE',
    },
  },
});
