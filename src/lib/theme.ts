/**
 * src/lib/theme.ts
 *
 * Global MUI theme configuration.
 *
 * MUI's createTheme lets you customise colours, typography,
 * component defaults and more in one central place.
 * Every MUI component in the app automatically picks up this theme
 * via the ThemeProvider we add in main.tsx.
 */

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',        // MUI default blue — change to your preference
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f5f5f5',     // light grey page background
      paper: '#ffffff'        // white for cards, modals, drawers
    },
    error: {
      main: '#d32f2f'
    },
    success: {
      main: '#2e7d32'
    }
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 }
  },
  shape: {
    // Slightly more rounded corners than MUI default
    borderRadius: 8
  },
  components: {
    // ── Button defaults ────────────────────────────────────────────
    // All MUI Buttons will have no text transform by default
    // so "Submit" stays as "Submit" not "SUBMIT"
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    // ── TextField defaults ─────────────────────────────────────────
    // All TextFields use outlined variant by default
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true
      }
    },
    // ── Card defaults ──────────────────────────────────────────────
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }
      }
    }
  }
});

export default theme;