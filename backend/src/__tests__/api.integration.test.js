/**
 * Testes de integração da API
 */

const request = require('supertest');

// Mock simples do app Express
const createMockApp = () => {
  const express = require('express');
  const app = express();

  app.use(express.json());

  // Rota de health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Rota de versão
  app.get('/api/version', (req, res) => {
    res.status(200).json({ version: '1.0.0', api: 'VistoriaPro API' });
  });

  // Mock de login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    if (email === 'admin@empresa.com' && password === 'admin123') {
      return res.status(200).json({
        token: 'fake-jwt-token',
        user: { id: 1, email: 'admin@empresa.com', role: 'admin' },
      });
    }

    res.status(401).json({ error: 'Credenciais inválidas' });
  });

  return app;
};

describe('API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createMockApp();
  });

  describe('GET /health', () => {
    it('deve retornar status OK', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/version', () => {
    it('deve retornar versão da API', async () => {
      const response = await request(app)
        .get('/api/version')
        .expect(200);

      expect(response.body.version).toBe('1.0.0');
      expect(response.body.api).toBe('VistoriaPro API');
    });
  });

  describe('POST /api/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@empresa.com', password: 'admin123' })
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('admin@empresa.com');
      expect(response.body.user.role).toBe('admin');
    });

    it('deve rejeitar credenciais inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@empresa.com', password: 'wrongpassword' })
        .expect(401);

      expect(response.body.error).toBe('Credenciais inválidas');
    });

    it('deve validar campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@empresa.com' })
        .expect(400);

      expect(response.body.error).toBe('Email e senha são obrigatórios');
    });
  });
});

module.exports = { createMockApp };
