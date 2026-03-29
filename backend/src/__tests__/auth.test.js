/**
 * Testes para autenticação e middlewares
 */

const jwt = require('jsonwebtoken');

// Mock do middleware de autenticação
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

describe('Autenticação', () => {
  describe('JWT Validation', () => {
    it('deve gerar um token válido', () => {
      const payload = { id: 1, email: 'test@example.com', role: 'user' };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret-key', {
        expiresIn: '7d',
      });

      expect(token).toBeDefined();
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
      expect(decoded.id).toBe(1);
      expect(decoded.email).toBe('test@example.com');
    });

    it('deve rejeitar tokens expirados', () => {
      const payload = { id: 1, email: 'test@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret-key', {
        expiresIn: '-1s', // Expirado
      });

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
      }).toThrow();
    });

    it('deve rejeitar tokens com chave inválida', () => {
      const payload = { id: 1, email: 'test@example.com' };
      const token = jwt.sign(payload, 'wrong-secret-key', {
        expiresIn: '7d',
      });

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
      }).toThrow();
    });
  });

  describe('Password Hashing', () => {
    let bcrypt;

    beforeAll(() => {
      bcrypt = require('bcrypt');
    });

    it('deve fazer hash de uma senha', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
    });

    it('deve comparar uma senha com seu hash', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const isMatch = await bcrypt.compare(password, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it('deve rejeitar uma senha incorreta', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const isMatch = await bcrypt.compare('wrongpassword', hashedPassword);

      expect(isMatch).toBe(false);
    });
  });
});

module.exports = { authMiddleware };
