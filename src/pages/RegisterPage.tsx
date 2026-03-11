/**
 * src/pages/RegisterPage.tsx
 *
 * Public page — accessible only when not authenticated.
 * PublicRoute in App.tsx redirects logged-in users away from here.
 *
 * Features:
 *   — MUI components for layout and inputs
 *   — React Hook Form for form state management
 *   — Zod for input validation including confirmPassword match check
 *   — useRegister hook (TanStack Query mutation) for the API call
 *   — Snackbar notification on error and success
 *   — Loading state on submit button during API call
 *   — Link to Login page
 */

import { useEffect } from 'react';
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
import { useRegister } from '../hooks/useAuth';
import { useSnackbar } from '../hooks/useSnackbar';
import type { RegisterFormData } from '../types';

// ── Zod validation schema ────────────────────────────────────────────────────

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password')
  })
  // Cross-field validation — checks that both password fields match.
  // .refine() runs after individual field validation passes.
  // path: ['confirmPassword'] attaches the error to that specific field.
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

// ── Component ────────────────────────────────────────────────────────────────

const RegisterPage = () => {
  const { showSnackbar } = useSnackbar();
  const register_ = useRegister(); // renamed to avoid clash with RHF's register

  // ── Form setup ─────────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (register_.error) {
      const msg =
        (register_.error as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Registration failed. Please try again.';
      showSnackbar(msg, 'error');
    }
  }, [register_.error, showSnackbar]);

  // ── Success handling ───────────────────────────────────────────────────────

  /**
   * Show a success snackbar when registration completes.
   * useRegister navigates to /login on success, so this snackbar
   * will briefly appear before the redirect.
   */
  useEffect(() => {
    if (register_.isSuccess) {
      showSnackbar('Account created! Please sign in.', 'success');
    }
  }, [register_.isSuccess, showSnackbar]);

  // ── Submit handler ─────────────────────────────────────────────────────────

  const onSubmit = (data: RegisterFormData) => {
    // confirmPassword is frontend-only — not sent to the backend
    register_.mutate({
      name: data.name,
      email: data.email,
      password: data.password
    });
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
              Create account
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Start organising your notes today
            </Typography>
          </Box>

          {/* ── Form ─────────────────────────────────────────────── */}
          <Box
            component='form'
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {/* Name field */}
            <TextField
              {...register('name')}
              label='Full name'
              type='text'
              autoComplete='name'
              autoFocus
              error={!!errors.name}
              helperText={errors.name?.message}
              sx={{ mb: 2 }}
            />

            {/* Email field */}
            <TextField
              {...register('email')}
              label='Email address'
              type='email'
              autoComplete='email'
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 2 }}
            />

            {/* Password field */}
            <TextField
              {...register('password')}
              label='Password'
              type='password'
              autoComplete='new-password'
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ mb: 2 }}
            />

            {/* Confirm password field */}
            <TextField
              {...register('confirmPassword')}
              label='Confirm password'
              type='password'
              autoComplete='new-password'
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              sx={{ mb: 3 }}
            />

            {/* Submit button */}
            <Button
              type='submit'
              variant='contained'
              fullWidth
              size='large'
              disabled={register_.isPending}
              sx={{ mb: 2 }}
            >
              {register_.isPending
                ? <CircularProgress size={24} color='inherit' />
                : 'Create account'
              }
            </Button>
          </Box>

          {/* ── Footer ───────────────────────────────────────────── */}
          <Divider sx={{ my: 3 }} />
          <Typography variant='body2' textAlign='center' color='text.secondary'>
            Already have an account?{' '}
            <MuiLink component={Link} to='/login' underline='hover'>
              Sign in
            </MuiLink>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;