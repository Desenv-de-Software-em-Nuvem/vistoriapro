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

jest.mock('../repositories/comodoVistoriaRepository.js', () => ({
  ComodoVistoriaRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

import { ComodoVistoriaRepository } from '../repositories/comodoVistoriaRepository.js';
import app from '../app.js';

const comodoMock = { id: 1, nome: 'Sala', vistoria_id: 1 };

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/comodos
// ---------------------------------------------------------------------------
describe('GET /api/comodos', () => {
  it('retorna 200 com lista de cômodos', async () => {
    ComodoVistoriaRepository.findAll.mockResolvedValueOnce([comodoMock]);

    const res = await request(app)
      .get('/api/comodos')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/comodos');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/comodos/:id
// ---------------------------------------------------------------------------
describe('GET /api/comodos/:id', () => {
  it('retorna 200 com o cômodo encontrado', async () => {
    ComodoVistoriaRepository.findById.mockResolvedValueOnce(comodoMock);

    const res = await request(app)
      .get('/api/comodos/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('retorna 404 quando cômodo não encontrado', async () => {
    ComodoVistoriaRepository.findById.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/comodos/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/comodos/1');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/comodos
// ---------------------------------------------------------------------------
describe('POST /api/comodos', () => {
  it('retorna 201 ao criar cômodo (admin)', async () => {
    ComodoVistoriaRepository.create.mockResolvedValueOnce(comodoMock);

    const res = await request(app)
      .post('/api/comodos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Sala', vistoria_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/api/comodos').send({ nome: 'X' });
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta criar cômodo', async () => {
    const res = await request(app)
      .post('/api/comodos')
      .set('Authorization', `Bearer ${vistoriadorToken}`)
      .send({ nome: 'X' });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/comodos/:id
// ---------------------------------------------------------------------------
describe('PUT /api/comodos/:id', () => {
  it('retorna 200 ao atualizar cômodo (admin)', async () => {
    ComodoVistoriaRepository.update.mockResolvedValueOnce({ ...comodoMock, nome: 'Quarto' });

    const res = await request(app)
      .put('/api/comodos/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Quarto' });

    expect(res.status).toBe(200);
  });

  it('retorna 404 quando cômodo não encontrado', async () => {
    ComodoVistoriaRepository.update.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/comodos/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'X' });

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).put('/api/comodos/1').send({ nome: 'X' });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/comodos/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/comodos/:id', () => {
  it('retorna 204 ao deletar cômodo (admin)', async () => {
    ComodoVistoriaRepository.delete.mockResolvedValueOnce({ affected: 1 });

    const res = await request(app)
      .delete('/api/comodos/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).delete('/api/comodos/1');
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta deletar cômodo', async () => {
    const res = await request(app)
      .delete('/api/comodos/1')
      .set('Authorization', `Bearer ${vistoriadorToken}`);
    expect(res.status).toBe(403);
  });
});
