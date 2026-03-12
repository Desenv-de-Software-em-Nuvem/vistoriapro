import { EntitySchema } from 'typeorm';

export default new EntitySchema({
  name: 'Usuario',
  tableName: 'usuarios',
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
    email: {
      type: String,
      length: 200,
      nullable: false,
      unique: true,
    },
    senha_hash: {
      type: String,
      length: 200,
      nullable: false,
    },
    papel: {
      type: 'enum',
      enum: ['admin', 'vistoriador', 'cliente'],
      default: 'vistoriador',
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
      inverseSide: 'usuario',
    },
  },
});
