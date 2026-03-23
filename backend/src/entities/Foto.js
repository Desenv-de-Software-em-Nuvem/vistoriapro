import { EntitySchema } from 'typeorm';

export default new EntitySchema({
  name: 'Foto',
  tableName: 'fotos',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    url: {
      type: 'text',
      nullable: false,
    },
    descricao: {
      type: 'text',
      nullable: true,
    },
    comodo_nome: {
      type: String,
      length: 100,
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
    comodo: {
      type: 'many-to-one',
      target: 'ComodoVistoria',
      joinColumn: { name: 'comodo_id' },
      onDelete: 'SET NULL',
    },
  },
});
