import swaggerJsDoc from 'swagger-jsdoc';

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VistoriaPro API',
      version: '1.0.0',
      description: 'Documentação da API VistoriaPro',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor local (desenvolvimento)',
      },
    ],
    components: {
      schemas: {
        Empresa: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nome: { type: 'string' },
            cnpj: { type: 'string' },
            email: { type: 'string' },
            telefone: { type: 'string' },
            endereco: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
          required: ['nome'],
        },
        Usuario: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            empresa_id: { type: 'integer' },
            nome: { type: 'string' },
            email: { type: 'string' },
            papel: { type: 'string', enum: ['admin', 'vistoriador', 'cliente'] },
            created_at: { type: 'string', format: 'date-time' },
          },
          required: ['empresa_id', 'nome', 'email'],
        },
        Imovel: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            empresa_id: { type: 'integer' },
            nome: { type: 'string' },
            endereco_completo: { type: 'string' },
            unidade: { type: 'string' },
            cidade: { type: 'string' },
            uf: { type: 'string' },
            cep: { type: 'string' },
            tipo: { type: 'string' },
            observacoes: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
          required: ['empresa_id', 'nome', 'endereco_completo', 'cidade', 'uf', 'cep', 'tipo'],
        },
        Vistoria: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            empresa_id: { type: 'integer' },
            usuario_id: { type: 'integer' },
            imovel_id: { type: 'integer' },
            descricao: { type: 'string' },
            data: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['em_andamento', 'finalizada', 'cancelada'] },
            observacoes_gerais: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
          required: ['empresa_id', 'usuario_id', 'imovel_id', 'data'],
        },
        ComodoVistoria: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            vistoria_id: { type: 'integer' },
            nome: { type: 'string' },
            observacoes: { type: 'string' },
            estado_geral: { type: 'string', enum: ['Bom', 'Regular', 'Ruim'] },
          },
          required: ['vistoria_id', 'nome'],
        },
        Foto: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            vistoria_id: { type: 'integer' },
            url: { type: 'string' },
            descricao: { type: 'string' },
            comodo_nome: { type: 'string' },
            comodo_id: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
          },
          required: ['vistoria_id', 'url'],
        },
        Transcricao: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            vistoria_id: { type: 'integer' },
            url_audio: { type: 'string' },
            texto: { type: 'string' },
            foto_id: { type: 'integer' },
            comodo_nome: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
          required: ['vistoria_id', 'url_audio', 'texto'],
        },
        LocatarioVistoria: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            vistoria_id: { type: 'integer' },
            nome: { type: 'string' },
            nacionalidade: { type: 'string' },
            profissao: { type: 'string' },
            cpf: { type: 'string' },
            rg: { type: 'string' },
            rg_orgao: { type: 'string' },
            rg_uf: { type: 'string' },
            endereco: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
          required: ['vistoria_id', 'nome'],
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

export const getSwaggerSpec = () => swaggerJsDoc(swaggerOptions);
