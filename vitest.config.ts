import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Provide the API base URL so the axios instance has a real URL to target
    // MSW intercepts all requests to this origin
    env: {
      VITE_API_URL: 'http://localhost'
    },
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**',
        'src/store/**',
        'src/hooks/**'
      ],
      reporter: ['text', 'lcov']
    }
  }
});
