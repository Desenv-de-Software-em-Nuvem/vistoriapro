import request from 'supertest';

// Mock AppDataSource before importing app
jest.mock('../data-source.js', () => ({
  AppDataSource: {
    initialize: jest.fn().mockResolvedValue(true),
    query: jest.fn(),
    getRepository: jest.fn(),
  },
}));

// Mock swagger-ui-express to avoid file system issues
jest.mock('swagger-ui-express', () => ({
  serve: (req, res, next) => next(),
  setup: () => (req, res) => res.status(200).json({ swagger: 'mocked' }),
}));

import { AppDataSource } from '../data-source.js';
import app from '../app.js';

describe('GET /', () => {
  it('retorna 200 com mensagem da API', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: 'API VistoriaPro rodando!',
      version: '1.0.0',
    });
  });
});

describe('GET /test-db', () => {
  it('retorna 200 quando o banco responde com sucesso', async () => {
    AppDataSource.query.mockResolvedValueOnce([
      { current_time: '2024-01-01T00:00:00.000Z', db_version: 'PostgreSQL 15' },
    ]);

    const res = await request(app).get('/test-db');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.message).toBe('Conexão com banco de dados funcionando!');
  });

  it('retorna 500 quando o banco falha', async () => {
    AppDataSource.query.mockRejectedValueOnce(new Error('connection refused'));

    const res = await request(app).get('/test-db');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('connection refused');
  });
});
