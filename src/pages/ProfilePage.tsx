/**
 * src/pages/ProfilePage.tsx
 *
 * Protected page — view and update the logged-in user's profile.
 *
 * Features:
 *   — Displays current user info (name, email, member since)
 *   — Update name via a simple form
 *   — Change password with current password verification
 *   — Both forms use React Hook Form + Zod validation
 *   — Zustand store updated on successful name change so
 *     the Navbar avatar reflects the new name immediately
 *   — Snackbar on success and error for both forms
 *   — Loading states on submit buttons
 *
 * The backend supports updating name and/or password in one request.
 * We split them into two separate forms on the frontend for clarity.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  TextField,
  Typography
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { useUpdateProfile } from '../hooks/useAuth';
import { useSnackbar } from '../hooks/useSnackbar';

// ── Zod schemas ──────────────────────────────────────────────────────────────

/**
 * Schema for the update name form.
 * Only name is required — email is read-only on the backend.
 */
const updateNameSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be under 50 characters')
});

/**
 * Schema for the change password form.
 * currentPassword is required to verify identity before changing.
 * newPassword and confirmNewPassword must match.
 */
const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(8, 'Password must be at least 8 characters'),
    confirmNewPassword: z
      .string()
      .min(1, 'Please confirm your new password')
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword']
  });

// ── Form data types ──────────────────────────────────────────────────────────

type UpdateNameFormData = z.infer<typeof updateNameSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ── Component ────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { user, setUser } = useAuthStore();
  const { showSnackbar } = useSnackbar();
  const updateProfile = useUpdateProfile();

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * getInitials — extracts initials from the user's name for the Avatar.
   * "John Doe" → "JD", "Alice" → "A"
   */
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * formatDate — converts ISO string to a readable date.
   * Used to show "Member since" date.
   */
  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // ── Update name form ───────────────────────────────────────────────────────

  const {
    register: registerName,
    handleSubmit: handleNameSubmit,
    formState: { errors: nameErrors },
    reset: resetName
  } = useForm<UpdateNameFormData>({
    resolver: zodResolver(updateNameSchema),
    defaultValues: { name: user?.name ?? '' }
  });

  /**
   * Sync the name form default value when user data loads.
   * This ensures the form is pre-filled with the current name.
   */
  useEffect(() => {
    if (user?.name) {
      resetName({ name: user.name });
    }
  }, [user?.name, resetName]);

  const onNameSubmit = (data: UpdateNameFormData) => {
    updateProfile.mutate(
      { name: data.name },
      {
        onSuccess: (res) => {
          // Update Zustand store so Navbar reflects new name immediately
          setUser(res.user);
          showSnackbar('Name updated successfully', 'success');
        },
        onError: (err) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })
              ?.response?.data?.message ?? 'Failed to update name';
          showSnackbar(msg, 'error');
        }
      }
    );
  };

  // ── Change password form ───────────────────────────────────────────────────

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    }
  });

  const onPasswordSubmit = (data: ChangePasswordFormData) => {
    updateProfile.mutate(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      },
      {
        onSuccess: () => {
          showSnackbar('Password changed successfully', 'success');
          // Clear the password form after success
          resetPassword();
        },
        onError: (err) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })
              ?.response?.data?.message ?? 'Failed to change password';
          showSnackbar(msg, 'error');
        }
      }
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Container maxWidth='sm'>

      {/* ── Page header ──────────────────────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <Typography variant='h4' fontWeight={700}>
          Profile
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
          Manage your account settings
        </Typography>
      </Box>

      {/* ── User info card ────────────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          mb: 3
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>

            {/* Avatar with initials */}
            <Avatar
              sx={{
                width: 72,
                height: 72,
                bgcolor: 'primary.main',
                fontSize: '1.5rem',
                fontWeight: 700
              }}
            >
              {user?.name ? getInitials(user.name) : <PersonIcon />}
            </Avatar>

            {/* User details */}
            <Box>
              <Typography variant='h5' fontWeight={700}>
                {user?.name}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {user?.email}
              </Typography>
              {user?.createdAt && (
                <Typography variant='caption' color='text.disabled'>
                  Member since {formatDate(user.createdAt)}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ── Update name card ──────────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          mb: 3
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant='h6' fontWeight={600} gutterBottom>
            Update Name
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            Change the name displayed on your account
          </Typography>

          <Box
            component='form'
            onSubmit={handleNameSubmit(onNameSubmit)}
            noValidate
          >
            <TextField
              {...registerName('name')}
              label='Full name'
              error={!!nameErrors.name}
              helperText={nameErrors.name?.message}
              sx={{ mb: 3 }}
            />

            <Button
              type='submit'
              variant='contained'
              disabled={updateProfile.isPending}
              sx={{ minWidth: 140 }}
            >
              {updateProfile.isPending
                ? <CircularProgress size={22} color='inherit' />
                : 'Update Name'
              }
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ── Change password card ──────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant='h6' fontWeight={600} gutterBottom>
            Change Password
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            You must provide your current password to set a new one
          </Typography>

          <Box
            component='form'
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            noValidate
          >
            {/* Current password */}
            <TextField
              {...registerPassword('currentPassword')}
              label='Current password'
              type='password'
              autoComplete='current-password'
              error={!!passwordErrors.currentPassword}
              helperText={passwordErrors.currentPassword?.message}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ mb: 2 }} />

            {/* New password */}
            <TextField
              {...registerPassword('newPassword')}
              label='New password'
              type='password'
              autoComplete='new-password'
              error={!!passwordErrors.newPassword}
              helperText={passwordErrors.newPassword?.message}
              sx={{ mb: 2 }}
            />

            {/* Confirm new password */}
            <TextField
              {...registerPassword('confirmNewPassword')}
              label='Confirm new password'
              type='password'
              autoComplete='new-password'
              error={!!passwordErrors.confirmNewPassword}
              helperText={passwordErrors.confirmNewPassword?.message}
              sx={{ mb: 3 }}
            />

            <Button
              type='submit'
              variant='contained'
              color='error'
              disabled={updateProfile.isPending}
              sx={{ minWidth: 160 }}
            >
              {updateProfile.isPending
                ? <CircularProgress size={22} color='inherit' />
                : 'Change Password'
              }
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ProfilePage;