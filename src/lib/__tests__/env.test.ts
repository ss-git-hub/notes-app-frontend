import { describe, it, expect, vi, afterEach } from 'vitest';
import { validateEnv } from '../env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('validateEnv', () => {
  it('does not throw when VITE_API_URL is set', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com');
    expect(() => validateEnv()).not.toThrow();
  });

  it('throws when VITE_API_URL is an empty string', () => {
    vi.stubEnv('VITE_API_URL', '');
    expect(() => validateEnv()).toThrow('VITE_API_URL');
  });

  it('includes .env setup guidance in the error message', () => {
    vi.stubEnv('VITE_API_URL', '');
    expect(() => validateEnv()).toThrow('.env');
  });
});
