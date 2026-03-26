import request from 'supertest';
import { adminToken, vistoriadorToken } from './helpers/auth.js';

// Mock da camada de dados
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

jest.mock('../repositories/usuarioRepository.js', () => ({
  UsuarioRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    validateCredentials: jest.fn(),
  },
}));

import { UsuarioRepository } from '../repositories/usuarioRepository.js';
import app from '../app.js';

const usuarioMock = {
  id: 1,
  nome: 'Test Admin',
  email: 'admin@test.com',
  papel: 'admin',
  empresa_id: 1,
  senha_hash: '$2b$10$hashedpassword',
};

const usuarioSemSenha = { id: 1, nome: 'Test Admin', email: 'admin@test.com', papel: 'admin', empresa_id: 1 };

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// POST /api/usuarios/auth/login
// ---------------------------------------------------------------------------
describe('POST /api/usuarios/auth/login', () => {
  it('retorna 200 com token quando credenciais válidas', async () => {
    UsuarioRepository.validateCredentials.mockResolvedValueOnce(usuarioMock);

    const res = await request(app)
      .post('/api/usuarios/auth/login')
      .send({ email: 'admin@test.com', senha: 'senha123' })

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.message).toBe('Autenticação bem-sucedida');
  });

  it('retorna 400 quando email ou senha não fornecidos', async () => {
    const res = await request(app)
      .post('/api/usuarios/auth/login')
      .send({ email: 'admin@test.com' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('retorna 401 quando credenciais inválidas', async () => {
    UsuarioRepository.validateCredentials.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/usuarios/auth/login')
      .send({ email: 'admin@test.com', senha: 'senha_errada' })

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Email ou senha inválidos');
  });
});

// ---------------------------------------------------------------------------
// GET /api/usuarios/auth/perfil
// ---------------------------------------------------------------------------
describe('GET /api/usuarios/auth/perfil', () => {
  it('retorna 200 com perfil do usuário autenticado', async () => {
    UsuarioRepository.findById.mockResolvedValueOnce(usuarioMock);

    const res = await request(app)
      .get('/api/usuarios/auth/perfil')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('usuario');
    expect(res.body.usuario).not.toHaveProperty('senha_hash');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/usuarios/auth/perfil');
    expect(res.status).toBe(401);
  });

  it('retorna 404 quando usuário não encontrado', async () => {
    UsuarioRepository.findById.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/usuarios/auth/perfil')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /api/usuarios/:id
// ---------------------------------------------------------------------------
describe('GET /api/usuarios/:id', () => {
  it('retorna 200 quando admin busca qualquer usuário', async () => {
    UsuarioRepository.findById.mockResolvedValueOnce(usuarioMock);

    const res = await request(app)
      .get('/api/usuarios/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('senha_hash');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/usuarios/1');
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta acessar outro usuário', async () => {
    const res = await request(app)
      .get('/api/usuarios/99')
      .set('Authorization', `Bearer ${vistoriadorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Acesso negado');
  });

  it('retorna 404 quando usuário não encontrado', async () => {
    UsuarioRepository.findById.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/usuarios/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /api/usuarios
// ---------------------------------------------------------------------------
describe('POST /api/usuarios', () => {
  it('retorna 201 ao criar usuário (admin)', async () => {
    UsuarioRepository.create.mockResolvedValueOnce(usuarioMock);

    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Novo', email: 'novo@test.com', senha_hash: 'senha123' });

    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('senha_hash');
  });

  it('retorna 400 quando campos obrigatórios faltam', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Incompleto' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .send({ nome: 'X', email: 'x@x.com', senha_hash: '123' });
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta criar usuário', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${vistoriadorToken}`)
      .send({ nome: 'X', email: 'x@x.com', senha_hash: '123' });
    expect(res.status).toBe(403);
  });

  it('retorna 409 quando email já cadastrado', async () => {
    UsuarioRepository.create.mockRejectedValueOnce(new Error('duplicate key value'));

    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Dup', email: 'admin@test.com', senha_hash: 'senha123' });

    expect(res.status).toBe(409);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/usuarios/:id
// ---------------------------------------------------------------------------
describe('PUT /api/usuarios/:id', () => {
  it('retorna 200 ao atualizar usuário (admin)', async () => {
    UsuarioRepository.findById.mockResolvedValueOnce(usuarioMock);
    UsuarioRepository.update.mockResolvedValueOnce({ ...usuarioMock, nome: 'Atualizado' });

    const res = await request(app)
      .put('/api/usuarios/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'Atualizado' });

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('senha_hash');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).put('/api/usuarios/1').send({ nome: 'X' });
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta atualizar outro usuário', async () => {
    const res = await request(app)
      .put('/api/usuarios/99')
      .set('Authorization', `Bearer ${vistoriadorToken}`)
      .send({ nome: 'X' });
    expect(res.status).toBe(403);
  });

  it('retorna 404 quando usuário não encontrado', async () => {
    UsuarioRepository.findById.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/usuarios/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nome: 'X' });

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/usuarios/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/usuarios/:id', () => {
  it('retorna 204 ao deletar usuário (admin)', async () => {
    UsuarioRepository.findById.mockResolvedValueOnce(usuarioMock);
    UsuarioRepository.delete.mockResolvedValueOnce({ affected: 1 });

    const res = await request(app)
      .delete('/api/usuarios/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).delete('/api/usuarios/1');
    expect(res.status).toBe(401);
  });

  it('retorna 403 quando vistoriador tenta deletar usuário', async () => {
    const res = await request(app)
      .delete('/api/usuarios/1')
      .set('Authorization', `Bearer ${vistoriadorToken}`);
    expect(res.status).toBe(403);
  });

  it('retorna 404 quando usuário não encontrado', async () => {
    UsuarioRepository.findById.mockResolvedValueOnce(null);

    const res = await request(app)
      .delete('/api/usuarios/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
