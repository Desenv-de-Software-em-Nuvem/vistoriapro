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

jest.mock('../repositories/fotoRepository.js', () => ({
  FotoRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

import { FotoRepository } from '../repositories/fotoRepository.js';
import app from '../app.js';

const fotoMock = { id: 1, url: 'https://example.com/foto.jpg', comodo_id: 1 };

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/fotos
// ---------------------------------------------------------------------------
describe('GET /api/fotos', () => {
  it('retorna 200 com lista de fotos', async () => {
    FotoRepository.findAll.mockResolvedValueOnce([fotoMock]);

    const res = await request(app)
      .get('/api/fotos')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/fotos');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/fotos/:id
// ---------------------------------------------------------------------------
describe('GET /api/fotos/:id', () => {
  it('retorna 200 com a foto encontrada', async () => {
    FotoRepository.findById.mockResolvedValueOnce(fotoMock);

    const res = await request(app)
      .get('/api/fotos/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('retorna 404 quando foto não encontrada', async () => {
    FotoRepository.findById.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/fotos/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/fotos/1');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/fotos
// ---------------------------------------------------------------------------
describe('POST /api/fotos', () => {
  it('retorna 201 ao criar foto (admin)', async () => {
    FotoRepository.create.mockResolvedValueOnce(fotoMock);

    const res = await request(app)
      .post('/api/fotos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ url: 'https://example.com/foto.jpg', comodo_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/api/fotos').send({ url: 'X' });
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta criar foto', async () => {
    const res = await request(app)
      .post('/api/fotos')
      .set('Authorization', `Bearer ${vistoriadorToken}`)
      .send({ url: 'X' });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/fotos/:id
// ---------------------------------------------------------------------------
describe('PUT /api/fotos/:id', () => {
  it('retorna 200 ao atualizar foto (admin)', async () => {
    FotoRepository.update.mockResolvedValueOnce({ ...fotoMock, url: 'https://example.com/nova.jpg' });

    const res = await request(app)
      .put('/api/fotos/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ url: 'https://example.com/nova.jpg' });

    expect(res.status).toBe(200);
  });

  it('retorna 404 quando foto não encontrada', async () => {
    FotoRepository.update.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/fotos/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ url: 'X' });

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).put('/api/fotos/1').send({ url: 'X' });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/fotos/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/fotos/:id', () => {
  it('retorna 204 ao deletar foto (admin)', async () => {
    FotoRepository.delete.mockResolvedValueOnce({ affected: 1 });

    const res = await request(app)
      .delete('/api/fotos/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).delete('/api/fotos/1');
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta deletar foto', async () => {
    const res = await request(app)
      .delete('/api/fotos/1')
      .set('Authorization', `Bearer ${vistoriadorToken}`);
    expect(res.status).toBe(403);
  });
});
