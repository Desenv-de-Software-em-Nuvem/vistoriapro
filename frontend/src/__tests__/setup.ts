/**
 * Jest setup file
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import '@testing-library/jest-dom';

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de localStorage
const localStorageMock: Partial<Storage> = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
} as unknown as Storage;
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock de sessionStorage
const sessionStorageMock: Partial<Storage> = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
} as unknown as Storage;
Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
});

// Suprimir console durante testes
if (process.env.CI) {
  global.console = {
    ...(console as any),
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Console;
}
