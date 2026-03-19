import request from 'supertest';
import { adminToken, vistoriadorToken } from './helpers/auth.js';

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

jest.mock('../repositories/vistoriaRepository.js', () => ({
  VistoriaRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

import { VistoriaRepository } from '../repositories/vistoriaRepository.js';
import app from '../app.js';

const vistoriaMock = { id: 1, tipo: 'entrada', status: 'pendente', empresa_id: 1 };

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/vistorias
// ---------------------------------------------------------------------------
describe('GET /api/vistorias', () => {
  it('retorna 200 com lista de vistorias', async () => {
    VistoriaRepository.findAll.mockResolvedValueOnce([vistoriaMock]);

    const res = await request(app)
      .get('/api/vistorias')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/vistorias');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/vistorias/:id
// ---------------------------------------------------------------------------
describe('GET /api/vistorias/:id', () => {
  it('retorna 200 com a vistoria encontrada', async () => {
    VistoriaRepository.findById.mockResolvedValueOnce(vistoriaMock);

    const res = await request(app)
      .get('/api/vistorias/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('retorna 404 quando vistoria não encontrada', async () => {
    VistoriaRepository.findById.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/vistorias/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/vistorias/1');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/vistorias
// ---------------------------------------------------------------------------
describe('POST /api/vistorias', () => {
  it('retorna 201 ao criar vistoria (admin)', async () => {
    VistoriaRepository.create.mockResolvedValueOnce(vistoriaMock);

    const res = await request(app)
      .post('/api/vistorias')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tipo: 'entrada', empresa_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/api/vistorias').send({ tipo: 'entrada' });
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta criar vistoria', async () => {
    const res = await request(app)
      .post('/api/vistorias')
      .set('Authorization', `Bearer ${vistoriadorToken}`)
      .send({ tipo: 'entrada' });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/vistorias/:id
// ---------------------------------------------------------------------------
describe('PUT /api/vistorias/:id', () => {
  it('retorna 200 ao atualizar vistoria (admin)', async () => {
    VistoriaRepository.update.mockResolvedValueOnce({ ...vistoriaMock, status: 'concluida' });

    const res = await request(app)
      .put('/api/vistorias/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'concluida' });

    expect(res.status).toBe(200);
  });

  it('retorna 404 quando vistoria não encontrada', async () => {
    VistoriaRepository.update.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/vistorias/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'X' });

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).put('/api/vistorias/1').send({ status: 'X' });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/vistorias/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/vistorias/:id', () => {
  it('retorna 204 ao deletar vistoria (admin)', async () => {
    VistoriaRepository.delete.mockResolvedValueOnce({ affected: 1 });

    const res = await request(app)
      .delete('/api/vistorias/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).delete('/api/vistorias/1');
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta deletar vistoria', async () => {
    const res = await request(app)
      .delete('/api/vistorias/1')
      .set('Authorization', `Bearer ${vistoriadorToken}`);
    expect(res.status).toBe(403);
  });
});
