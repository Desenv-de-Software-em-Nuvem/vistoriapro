import { EntitySchema } from 'typeorm';

export default new EntitySchema({
  name: 'ComodoVistoria',
  tableName: 'comodos_vistoria',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    nome: {
      type: String,
      length: 100,
      nullable: false,
    },
    observacoes: {
      type: 'text',
      nullable: true,
    },
    estado_geral: {
      type: 'enum',
      enum: ['Bom', 'Regular', 'Ruim'],
      default: 'Bom',
    },
  },
  relations: {
    vistoria: {
      type: 'many-to-one',
      target: 'Vistoria',
      joinColumn: { name: 'vistoria_id' },
      onDelete: 'CASCADE',
    },
    fotos: {
      type: 'one-to-many',
      target: 'Foto',
      inverseSide: 'comodo',
    },
  },
});
