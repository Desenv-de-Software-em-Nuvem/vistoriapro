import { EntitySchema } from 'typeorm';

export default new EntitySchema({
  name: 'Vistoria',
  tableName: 'vistorias',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    descricao: {
      type: 'text',
      nullable: true,
    },
    data: {
      type: 'date',
      nullable: false,
    },
    status: {
      type: 'enum',
      enum: ['em_andamento', 'finalizada', 'cancelada'],
      default: 'em_andamento',
    },
    observacoes_gerais: {
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
      joinColumn: { name: 'empresa_id' },
      onDelete: 'CASCADE',
    },
    usuario: {
      type: 'many-to-one',
      target: 'Usuario',
      joinColumn: { name: 'usuario_id' },
      onDelete: 'SET NULL',
    },
    imovel: {
      type: 'many-to-one',
      target: 'Imovel',
      joinColumn: { name: 'imovel_id' },
      onDelete: 'CASCADE',
    },
    comodos: {
      type: 'one-to-many',
      target: 'ComodoVistoria',
      inverseSide: 'vistoria',
    },
    fotos: {
      type: 'one-to-many',
      target: 'Foto',
      inverseSide: 'vistoria',
    },
    transcricoes: {
      type: 'one-to-many',
      target: 'Transcricao',
      inverseSide: 'vistoria',
    },
    locatarios: {
      type: 'one-to-many',
      target: 'LocatarioVistoria',
      inverseSide: 'vistoria',
    },
  },
});
