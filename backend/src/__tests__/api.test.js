import request from 'supertest';

jest.mock('../data-source.js', () => ({
  AppDataSource: {
    initialize: jest.fn().mockResolvedValue(true),
    query: jest.fn(),
    getRepository: jest.fn(),
  },
}));

jest.mock('swagger-ui-express', () => ({
  serve: (req, res, next) => next(),
  setup: () => (req, res) => res.status(200).json({ swagger: 'mocked' }),
}));

import app from '../app.js';

describe('GET /api', () => {
  it('retorna 200 com mensagem da API', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: 'API do VistoriaPro está funcionando!' });
  });
});

describe('GET /api/docs/swagger.json', () => {
  it('retorna 200 com JSON do Swagger', async () => {
    const res = await request(app).get('/api/docs/swagger.json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
