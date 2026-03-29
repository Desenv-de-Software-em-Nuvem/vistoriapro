// Setup para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
process.env.DB_NAME = process.env.DB_NAME || 'vistoriapro_test';

// Suprimir logs durante testes
if (process.env.CI) {
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
  };
}
