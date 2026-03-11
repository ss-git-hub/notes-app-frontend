/**
 * src/pages/LoginPage.tsx
 *
 * Public page — accessible only when not authenticated.
 * PublicRoute in App.tsx redirects logged-in users away from here.
 *
 * Features:
 *   — MUI components for layout and inputs
 *   — React Hook Form for form state management
 *   — Zod for input validation
 *   — useLogin hook (TanStack Query mutation) for the API call
 *   — Snackbar notification on error
 *   — Loading state on submit button during API call
 *   — Link to Register page
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  TextField,
  Typography,
  Link as MuiLink
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth';
import { useSnackbar } from '../hooks/useSnackbar';
import type { LoginFormData } from '../types';

// ── Zod validation schema ────────────────────────────────────────────────────

/**
 * Defines the validation rules for the login form.
 * zodResolver connects this schema to React Hook Form —
 * validation runs automatically on submit and on field change.
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
});

// ── Component ────────────────────────────────────────────────────────────────

const LoginPage = () => {
  const { showSnackbar } = useSnackbar();
  const login = useLogin();

  // ── Form setup ─────────────────────────────────────────────────────────────

  /**
   * useForm connects React Hook Form with our Zod schema via zodResolver.
   * register — connects each input to the form
   * handleSubmit — wraps our submit handler with validation
   * formState — contains errors and other form state
   */
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // ── Submit handler ─────────────────────────────────────────────────────────

  /**
   * onSubmit is only called if Zod validation passes.
   * React Hook Form blocks submission if any field is invalid.
   * On success, useLogin navigates to /notes automatically.
   * onError fires exactly once per failure — correct for snackbars.
   */
  const onSubmit = (data: LoginFormData) => {
    login.mutate(
      { email: data.email, password: data.password },
      {
        onError: (err) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })
              ?.response?.data?.message ?? 'Login failed. Please try again.';
          showSnackbar(msg, 'error');
        }
      }
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}
    >
      <Container maxWidth='sm'>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          {/* ── Header ───────────────────────────────────────────── */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant='h4' fontWeight={700} gutterBottom>
              Welcome back
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Sign in to access your notes
            </Typography>
          </Box>

          {/* ── Form ─────────────────────────────────────────────── */}
          {/*
            noValidate disables browser's built-in validation
            so Zod handles everything consistently.
          */}
          <Box
            component='form'
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {/* Email field */}
            <TextField
              {...register('email')}
              label='Email address'
              type='email'
              autoComplete='email'
              autoFocus
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 2 }}
            />

            {/* Password field */}
            <TextField
              {...register('password')}
              label='Password'
              type='password'
              autoComplete='current-password'
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ mb: 3 }}
            />

            {/* Submit button */}
            {/*
              disabled during pending state to prevent double submission.
              CircularProgress replaces the label while loading.
            */}
            <Button
              type='submit'
              variant='contained'
              fullWidth
              size='large'
              disabled={login.isPending}
              sx={{ mb: 2 }}
            >
              {login.isPending
                ? <CircularProgress size={24} color='inherit' />
                : 'Sign in'
              }
            </Button>
          </Box>

          {/* ── Footer ───────────────────────────────────────────── */}
          <Divider sx={{ my: 3 }} />
          <Typography variant='body2' textAlign='center' color='text.secondary'>
            Don&apos;t have an account?{' '}
            <MuiLink component={Link} to='/register' underline='hover'>
              Create one
            </MuiLink>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;