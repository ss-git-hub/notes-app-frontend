/**
 * src/main.tsx
 *
 * Application entry point.
 *
 * This is where we wrap the app with all the global providers:
 *   — ThemeProvider     → MUI theme available to every component
 *   — CssBaseline       → MUI's CSS reset (normalises browser defaults)
 *   — QueryClientProvider → TanStack Query available to every component
 *   — BrowserRouter     → React Router available to every component
 *   — SnackbarProvider  → global toast notifications available everywhere
 *
 * Order matters — providers that depend on others must be nested inside them.
 * For example SnackbarProvider uses MUI components so it must be inside
 * ThemeProvider.
 */

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { SnackbarProvider } from './lib/SnackbarProvider';
import theme from './lib/theme';
import App from './App';
import './index.css';

/**
 * QueryClient — the TanStack Query cache and configuration.
 *
 * defaultOptions apply to every query/mutation in the app:
 *   — retry: 1 → retry failed requests once before showing an error
 *   — staleTime: 1 minute → cached data is considered fresh for 1 minute
 *     before TanStack Query refetches it in the background
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 // 1 minute
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SnackbarProvider>
            <App />
          </SnackbarProvider>
        </BrowserRouter>
        {/* ReactQueryDevtools — only visible in development */}
        {/* Shows cache state, query status, and lets you manually refetch */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);