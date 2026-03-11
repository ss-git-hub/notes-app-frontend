/**
 * src/lib/SnackbarProvider.tsx
 *
 * Global Snackbar provider — wraps the app and holds the snackbar state.
 *
 * This file only exports a component (SnackbarProvider) to keep
 * Vite fast refresh working correctly. Context and hook live in
 * separate files for the same reason.
 *
 * How it works:
 *   1. SnackbarProvider wraps the entire app in main.tsx
 *   2. It holds the snackbar state (open, message, severity)
 *   3. It exposes showSnackbar via SnackbarContext
 *   4. Any component calls useSnackbar() to access showSnackbar
 *   5. Calling showSnackbar() updates the state here and
 *      triggers the MUI Snackbar to appear
 *
 * Usage from any component:
 *   const { showSnackbar } = useSnackbar();
 *   showSnackbar('Note created', 'success');
 *   showSnackbar('Something went wrong', 'error');
 */

import { useState, useCallback, type ReactNode } from 'react';
import { Snackbar, Alert, type AlertColor } from '@mui/material';
import { SnackbarContext } from './SnackbarContext';

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Internal state shape for the Snackbar.
 * Not exported — this is an implementation detail of the provider.
 */
interface SnackbarState {
  open: boolean;       // controls whether the Snackbar is visible
  message: string;     // the text displayed inside the notification
  severity: AlertColor // controls the colour: success=green, error=red, etc.
}

// ── Component ────────────────────────────────────────────────────────────────

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {

  // ── State ──────────────────────────────────────────────────────────────────
  const [state, setState] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * showSnackbar — the function exposed via context.
   *
   * useCallback ensures this function reference is stable —
   * it won't be recreated on every render, which would cause
   * unnecessary re-renders in components that consume the context.
   */
  const showSnackbar = useCallback(
    (message: string, severity: AlertColor = 'info') => {
      setState({ open: true, message, severity });
    },
    [] // no dependencies — this function never needs to change
  );

  /**
   * handleClose — called when the Snackbar auto-hides or the
   * user clicks the close button.
   * We only set open to false — we keep message and severity
   * so the text doesn't disappear mid-fade-out animation.
   */
  const handleClose = () => {
    setState((prev) => ({ ...prev, open: false }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}

      {/*
        MUI Snackbar — the container that handles positioning,
        timing, and the open/close animation.
        autoHideDuration: 4000ms = 4 seconds before auto-close.
        anchorOrigin: bottom-left is a common non-intrusive position.
      */}
      <Snackbar
        open={state.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {/*
          Alert renders the coloured notification box inside the Snackbar.
          variant='filled' gives us a solid background colour
          which is more visible than the default outlined style.
        */}
        <Alert
          onClose={handleClose}
          severity={state.severity}
          variant='filled'
          sx={{ width: '100%' }}
        >
          {state.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};