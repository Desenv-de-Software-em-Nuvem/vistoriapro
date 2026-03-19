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

jest.mock('../repositories/imovelRepository.js', () => ({
  ImovelRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmpresaId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

import { ImovelRepository } from '../repositories/imovelRepository.js';
import app from '../app.js';

const imovelMock = { id: 1, endereco: 'Rua Teste, 123', empresa_id: 1 };

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/imoveis
// ---------------------------------------------------------------------------
describe('GET /api/imoveis', () => {
  it('retorna 200 com lista de imóveis', async () => {
    ImovelRepository.findAll.mockResolvedValueOnce([imovelMock]);

    const res = await request(app)
      .get('/api/imoveis')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('filtra por empresa_id quando fornecido', async () => {
    ImovelRepository.findByEmpresaId.mockResolvedValueOnce([imovelMock]);

    const res = await request(app)
      .get('/api/imoveis?empresa_id=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(ImovelRepository.findByEmpresaId).toHaveBeenCalledWith('1');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/imoveis');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/imoveis/:id
// ---------------------------------------------------------------------------
describe('GET /api/imoveis/:id', () => {
  it('retorna 200 com o imóvel encontrado', async () => {
    ImovelRepository.findById.mockResolvedValueOnce(imovelMock);

    const res = await request(app)
      .get('/api/imoveis/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('retorna 404 quando imóvel não encontrado', async () => {
    ImovelRepository.findById.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/imoveis/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/imoveis/1');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/imoveis
// ---------------------------------------------------------------------------
describe('POST /api/imoveis', () => {
  it('retorna 201 ao criar imóvel (admin)', async () => {
    ImovelRepository.create.mockResolvedValueOnce(imovelMock);

    const res = await request(app)
      .post('/api/imoveis')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ endereco: 'Rua Teste, 123', empresa_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/api/imoveis').send({ endereco: 'X' });
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta criar imóvel', async () => {
    const res = await request(app)
      .post('/api/imoveis')
      .set('Authorization', `Bearer ${vistoriadorToken}`)
      .send({ endereco: 'X' });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/imoveis/:id
// ---------------------------------------------------------------------------
describe('PUT /api/imoveis/:id', () => {
  it('retorna 200 ao atualizar imóvel (admin)', async () => {
    ImovelRepository.update.mockResolvedValueOnce({ ...imovelMock, endereco: 'Novo Endereço' });

    const res = await request(app)
      .put('/api/imoveis/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ endereco: 'Novo Endereço' });

    expect(res.status).toBe(200);
  });

  it('retorna 404 quando imóvel não encontrado', async () => {
    ImovelRepository.update.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/imoveis/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ endereco: 'X' });

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).put('/api/imoveis/1').send({ endereco: 'X' });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/imoveis/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/imoveis/:id', () => {
  it('retorna 204 ao deletar imóvel (admin)', async () => {
    ImovelRepository.delete.mockResolvedValueOnce({ affected: 1 });

    const res = await request(app)
      .delete('/api/imoveis/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).delete('/api/imoveis/1');
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta deletar imóvel', async () => {
    const res = await request(app)
      .delete('/api/imoveis/1')
      .set('Authorization', `Bearer ${vistoriadorToken}`);
    expect(res.status).toBe(403);
  });
});
