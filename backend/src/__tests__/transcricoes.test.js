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

jest.mock('../repositories/transcricaoRepository.js', () => ({
  TranscricaoRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

import { TranscricaoRepository } from '../repositories/transcricaoRepository.js';
import app from '../app.js';

const transcricaoMock = { id: 1, texto: 'Transcrição de teste', vistoria_id: 1 };

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/transcricoes
// ---------------------------------------------------------------------------
describe('GET /api/transcricoes', () => {
  it('retorna 200 com lista de transcrições', async () => {
    TranscricaoRepository.findAll.mockResolvedValueOnce([transcricaoMock]);

    const res = await request(app)
      .get('/api/transcricoes')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/transcricoes');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/transcricoes/:id
// ---------------------------------------------------------------------------
describe('GET /api/transcricoes/:id', () => {
  it('retorna 200 com a transcrição encontrada', async () => {
    TranscricaoRepository.findById.mockResolvedValueOnce(transcricaoMock);

    const res = await request(app)
      .get('/api/transcricoes/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('retorna 404 quando transcrição não encontrada', async () => {
    TranscricaoRepository.findById.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/transcricoes/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/transcricoes/1');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/transcricoes
// ---------------------------------------------------------------------------
describe('POST /api/transcricoes', () => {
  it('retorna 201 ao criar transcrição (admin)', async () => {
    TranscricaoRepository.create.mockResolvedValueOnce(transcricaoMock);

    const res = await request(app)
      .post('/api/transcricoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ texto: 'Transcrição de teste', vistoria_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1 });
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/api/transcricoes').send({ texto: 'X' });
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta criar transcrição', async () => {
    const res = await request(app)
      .post('/api/transcricoes')
      .set('Authorization', `Bearer ${vistoriadorToken}`)
      .send({ texto: 'X' });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/transcricoes/:id
// ---------------------------------------------------------------------------
describe('PUT /api/transcricoes/:id', () => {
  it('retorna 200 ao atualizar transcrição (admin)', async () => {
    TranscricaoRepository.update.mockResolvedValueOnce({ ...transcricaoMock, texto: 'Atualizada' });

    const res = await request(app)
      .put('/api/transcricoes/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ texto: 'Atualizada' });

    expect(res.status).toBe(200);
  });

  it('retorna 404 quando transcrição não encontrada', async () => {
    TranscricaoRepository.update.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/transcricoes/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ texto: 'X' });

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).put('/api/transcricoes/1').send({ texto: 'X' });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/transcricoes/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/transcricoes/:id', () => {
  it('retorna 204 ao deletar transcrição (admin)', async () => {
    TranscricaoRepository.delete.mockResolvedValueOnce({ affected: 1 });

    const res = await request(app)
      .delete('/api/transcricoes/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).delete('/api/transcricoes/1');
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta deletar transcrição', async () => {
    const res = await request(app)
      .delete('/api/transcricoes/1')
      .set('Authorization', `Bearer ${vistoriadorToken}`);
    expect(res.status).toBe(403);
  });
});
