/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  // O ambiente de teste
  testEnvironment: 'node',

  // Pasta de testes
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],

  // Caminho para setupFiles
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Cobertura
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/index.js',
  ],

  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],

  // Timeout
  testTimeout: 10000,

  // Verbose
  verbose: true,

  // Silent
  silent: false,

  // Bail on first failure (comentado por padrão)
  // bail: true,

  // Max workers
  maxWorkers: '50%',

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};
