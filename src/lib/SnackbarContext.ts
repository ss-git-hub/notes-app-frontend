/**
 * src/lib/SnackbarContext.ts
 *
 * Defines the Snackbar context and its value shape.
 *
 * Separated into its own file because Vite's fast refresh requires
 * that files exporting React context are separate from files
 * exporting components or hooks. Mixing them disables fast refresh.
 *
 * This file is the "contract" — it defines what the Snackbar
 * system exposes to the rest of the app. Both SnackbarProvider
 * (which fulfils the contract) and useSnackbar (which consumes it)
 * import from here.
 */

import { createContext } from 'react';
import type { AlertColor } from '@mui/material';

/**
 * SnackbarContextValue — the shape of what the context exposes.
 *
 * showSnackbar is the single function any component calls to
 * trigger a notification. severity defaults to 'info' if omitted.
 *
 * AlertColor is a MUI type: 'success' | 'error' | 'warning' | 'info'
 */
export interface SnackbarContextValue {
  showSnackbar: (message: string, severity?: AlertColor) => void;
}

/**
 * SnackbarContext — the actual React context object.
 *
 * Initialised as null so that useSnackbar can detect if it is
 * being used outside of SnackbarProvider and throw a helpful error.
 *
 * createContext<T>(null) is a common pattern for contexts that
 * require a provider — null signals "not yet provided".
 */
export const SnackbarContext = createContext<SnackbarContextValue | null>(null);