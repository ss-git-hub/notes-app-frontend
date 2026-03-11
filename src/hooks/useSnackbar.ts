/**
 * src/hooks/useSnackbar.ts
 *
 * Custom hook to consume the SnackbarContext from anywhere in the app.
 *
 * Separated from SnackbarProvider.tsx and SnackbarContext.ts to keep
 * Vite fast refresh happy — each file should export only one type
 * of thing (component, context, or hook).
 *
 * How to use:
 *   import { useSnackbar } from '../hooks/useSnackbar';
 *
 *   const { showSnackbar } = useSnackbar();
 *   showSnackbar('Note deleted', 'success');
 *   showSnackbar('Failed to save', 'error');
 *   showSnackbar('Loading...', 'info');
 *   showSnackbar('Check your input', 'warning');
 *
 * Throws a clear error if used outside of SnackbarProvider —
 * this catches setup mistakes early during development.
 */

import { useContext } from 'react';
import {
  SnackbarContext,
  type SnackbarContextValue
} from '../lib/SnackbarContext';

export const useSnackbar = (): SnackbarContextValue => {
  const ctx = useContext(SnackbarContext);

  // If ctx is null it means this hook was called outside of
  // SnackbarProvider — throw a descriptive error so it's easy to debug.
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider');

  return ctx;
};