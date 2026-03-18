/**
 * src/components/ErrorBoundary.tsx
 *
 * React Error Boundary — catches render-phase JavaScript errors anywhere in
 * the component tree below it and displays a friendly fallback UI instead of
 * a blank white page.
 *
 * Why a class component?
 *   Error boundaries must be class components because they use the lifecycle
 *   methods getDerivedStateFromError and componentDidCatch. There is no hooks
 *   equivalent — React intentionally kept this as a class-only feature.
 *
 * What errors are caught?
 *   — Runtime errors thrown during rendering (e.g. cannot read property of null)
 *   — Errors in lifecycle methods of child components
 *   — Errors in constructors of child components
 *
 * What errors are NOT caught?
 *   — Errors in event handlers (use try/catch there)
 *   — Errors in async code like useEffect or fetch callbacks
 *   — Errors thrown in the ErrorBoundary component itself
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponentThatMightCrash />
 *   </ErrorBoundary>
 *
 *   Or with a custom fallback:
 *   <ErrorBoundary fallback={<p>Custom error UI</p>}>
 *     ...
 *   </ErrorBoundary>
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

// ── Props and State ───────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI — defaults to the built-in error card */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  /**
   * getDerivedStateFromError — called synchronously when a descendant throws.
   * Returns new state — React uses this to re-render with the fallback UI.
   * This is static so it has no access to `this`.
   */
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message
    };
  }

  /**
   * componentDidCatch — called after getDerivedStateFromError.
   * Good place to log to an error tracking service (Sentry, Datadog, etc.).
   * errorInfo.componentStack shows which component tree caused the error.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  /**
   * handleReset — clears the error state so the user can try again.
   * Also reloads the page as a full reset since the component state
   * may be corrupted after an error.
   */
  handleReset = (): void => {
    window.location.reload();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Show custom fallback if provided
    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Default fallback UI
    return (
      <Container maxWidth='sm'>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            gap: 2
          }}
        >
          <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />

          <Typography variant='h5' fontWeight={700}>
            Something went wrong
          </Typography>

          <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 400 }}>
            An unexpected error occurred. This has been logged automatically.
            Try refreshing the page — if the problem persists, please contact support.
          </Typography>

          {/* Show error message in development only */}
          {import.meta.env.DEV && (
            <Box
              component='pre'
              sx={{
                mt: 1,
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                fontSize: '0.75rem',
                textAlign: 'left',
                maxWidth: '100%',
                overflow: 'auto',
                color: 'error.dark'
              }}
            >
              {this.state.errorMessage}
            </Box>
          )}

          <Button variant='contained' onClick={this.handleReset} sx={{ mt: 1 }}>
            Reload page
          </Button>
        </Box>
      </Container>
    );
  }
}

export default ErrorBoundary;
