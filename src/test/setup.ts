import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './server';

// Start MSW before all tests — intercepts fetch/XHR at the Node level
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Clean up DOM + reset MSW handlers after every test
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
