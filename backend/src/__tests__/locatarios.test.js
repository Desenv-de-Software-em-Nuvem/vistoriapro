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

jest.mock('../repositories/locatarioVistoriaRepository.js', () => ({
  LocatarioVistoriaRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

import { LocatarioVistoriaRepository } from '../repositories/locatarioVistoriaRepository.js';
import app from '../app.js';

const locatarioMock = { id: 1, nome: 'João Silva', cpf: '000.000.000-00', vistoria_id: 1 };

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/locatarios
// ---------------------------------------------------------------------------
describe('GET /api/locatarios', () => {
  it('retorna 200 com lista de locatários', async () => {
    LocatarioVistoriaRepository.findAll.mockResolvedValueOnce([locatarioMock]);

    const res = await request(app)
      .get('/api/locatarios')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/locatarios');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/locatarios/:id
// ---------------------------------------------------------------------------
describe('GET /api/locatarios/:id', () => {
  it('retorna 200 com o locatário encontrado', async () => {
    LocatarioVistoriaRepository.findById.mockResolvedValueOnce(locatarioMock);

    const res = await request(app)
      .get('/api/locatarios/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('retorna 404 quando locatário não encontrado', async () => {
    LocatarioVistoriaRepository.findById.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/locatarios/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/locatarios/1');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/locatarios
// ---------------------------------------------------------------------------
describe('POST /api/locatarios', () => {
  it('retorna 201 ao criar locatário (admin)', async () => {
    LocatarioVistoriaRepository.create.mockResolvedValueOnce(locatarioMock);

    const res = await request(app)
      .post('/api/locatarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'João Silva', cpf: '000.000.000-00', vistoria_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/api/locatarios').send({ nome: 'X' });
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta criar locatário', async () => {
    const res = await request(app)
      .post('/api/locatarios')
      .set('Authorization', `Bearer ${vistoriadorToken}`)
      .send({ nome: 'X' });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/locatarios/:id
// ---------------------------------------------------------------------------
describe('PUT /api/locatarios/:id', () => {
  it('retorna 200 ao atualizar locatário (admin)', async () => {
    LocatarioVistoriaRepository.update.mockResolvedValueOnce({ ...locatarioMock, nome: 'Maria Silva' });

    const res = await request(app)
      .put('/api/locatarios/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Maria Silva' });

    expect(res.status).toBe(200);
  });

  it('retorna 404 quando locatário não encontrado', async () => {
    LocatarioVistoriaRepository.update.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/locatarios/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'X' });

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).put('/api/locatarios/1').send({ nome: 'X' });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/locatarios/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/locatarios/:id', () => {
  it('retorna 204 ao deletar locatário (admin)', async () => {
    LocatarioVistoriaRepository.delete.mockResolvedValueOnce({ affected: 1 });

    const res = await request(app)
      .delete('/api/locatarios/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).delete('/api/locatarios/1');
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta deletar locatário', async () => {
    const res = await request(app)
      .delete('/api/locatarios/1')
      .set('Authorization', `Bearer ${vistoriadorToken}`);
    expect(res.status).toBe(403);
  });
});
