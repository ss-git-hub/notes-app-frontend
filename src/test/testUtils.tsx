/**
 * src/test/testUtils.tsx
 *
 * Shared test wrapper factory.
 *
 * Every call creates a fresh QueryClient so tests cannot share cached data.
 * MemoryRouter satisfies useNavigate/useLocation inside hooks without
 * needing a full data router (hooks under test don't use useBlocker).
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

export const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries:   { retry: false, gcTime: 0 },
      mutations: { retry: false }
    }
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );

  return { queryClient, Wrapper };
};
