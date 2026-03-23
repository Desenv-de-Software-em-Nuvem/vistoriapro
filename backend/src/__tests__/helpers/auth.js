import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vistoriapro-secret-key-2024';

/**
 * Gera um token JWT para uso em testes.
 * @param {object} overrides - Campos a sobrescrever no payload padrão.
 * @returns {string} Token JWT assinado.
 */
export function generateTestToken(overrides = {}) {
  const payload = {
    id: 1,
    nome: 'Test Admin',
    email: 'admin@test.com',
    papel: 'admin',
    empresa_id: 1,
    ...overrides,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

/** Token de admin pré-gerado para reutilização nos testes. */
export const adminToken = generateTestToken({ papel: 'admin' });

/** Token de vistoriador (papel não-admin) para testes de autorização. */
export const vistoriadorToken = generateTestToken({ id: 2, papel: 'vistoriador' });
