import { EntitySchema } from 'typeorm';

export default new EntitySchema({
  name: 'Transcricao',
  tableName: 'transcricoes',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    url_audio: {
      type: 'text',
      nullable: false,
    },
    texto: {
      type: 'text',
      nullable: false,
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
    foto: {
      type: 'many-to-one',
      target: 'Foto',
      joinColumn: { name: 'foto_id' },
      onDelete: 'SET NULL',
    },
  },
});
