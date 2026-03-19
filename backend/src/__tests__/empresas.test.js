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

jest.mock('../repositories/empresaRepository.js', () => ({
  EmpresaRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

import { EmpresaRepository } from '../repositories/empresaRepository.js';
import app from '../app.js';

const empresaMock = { id: 1, nome: 'Empresa Teste', cnpj: '00.000.000/0001-00' };

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/empresas
// ---------------------------------------------------------------------------
describe('GET /api/empresas', () => {
  it('retorna 200 com lista de empresas (admin)', async () => {
    EmpresaRepository.findAll.mockResolvedValueOnce([empresaMock]);

    const res = await request(app)
      .get('/api/empresas')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/empresas');
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta listar empresas', async () => {
    const res = await request(app)
      .get('/api/empresas')
      .set('Authorization', `Bearer ${vistoriadorToken}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// GET /api/empresas/:id
// ---------------------------------------------------------------------------
describe('GET /api/empresas/:id', () => {
  it('retorna 200 com a empresa encontrada (admin)', async () => {
    EmpresaRepository.findById.mockResolvedValueOnce(empresaMock);

    const res = await request(app)
      .get('/api/empresas/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('retorna 404 quando empresa não encontrada', async () => {
    EmpresaRepository.findById.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/empresas/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/empresas/1');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/empresas
// ---------------------------------------------------------------------------
describe('POST /api/empresas', () => {
  it('retorna 201 ao criar empresa (admin)', async () => {
    EmpresaRepository.create.mockResolvedValueOnce(empresaMock);

    const res = await request(app)
      .post('/api/empresas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Empresa Teste', cnpj: '00.000.000/0001-00' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/api/empresas').send({ nome: 'X' });
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta criar empresa', async () => {
    const res = await request(app)
      .post('/api/empresas')
      .set('Authorization', `Bearer ${vistoriadorToken}`)
      .send({ nome: 'X' });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/empresas/:id
// ---------------------------------------------------------------------------
describe('PUT /api/empresas/:id', () => {
  it('retorna 200 ao atualizar empresa (admin)', async () => {
    EmpresaRepository.update.mockResolvedValueOnce({ ...empresaMock, nome: 'Atualizada' });

    const res = await request(app)
      .put('/api/empresas/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Atualizada' });

    expect(res.status).toBe(200);
  });

  it('retorna 404 quando empresa não encontrada', async () => {
    EmpresaRepository.update.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/empresas/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'X' });

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).put('/api/empresas/1').send({ nome: 'X' });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/empresas/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/empresas/:id', () => {
  it('retorna 204 ao deletar empresa (admin)', async () => {
    EmpresaRepository.delete.mockResolvedValueOnce({ affected: 1 });

    const res = await request(app)
      .delete('/api/empresas/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).delete('/api/empresas/1');
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta deletar empresa', async () => {
    const res = await request(app)
      .delete('/api/empresas/1')
      .set('Authorization', `Bearer ${vistoriadorToken}`);
    expect(res.status).toBe(403);
  });
});
