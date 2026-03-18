/**
 * src/hooks/useAuth.ts
 *
 * TanStack Query hooks for all authentication related operations.
 *
 * TanStack Query separates data fetching into two concepts:
 *   — useQuery    → GET requests (fetching/reading data)
 *   — useMutation → POST/PUT/DELETE requests (writing/changing data)
 *
 * Each hook here wraps an API function from src/api/auth.ts and adds:
 *   — automatic loading states (isPending, isLoading)
 *   — automatic error states (isError, error)
 *   — caching (so repeated calls don't hit the network)
 *   — onSuccess/onError callbacks for side effects like toasts or redirects
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, getProfile, updateProfile, logoutUser } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { extractError } from '../lib/extractError';

// ── Query keys ───────────────────────────────────────────────────────────────

export const AUTH_KEYS = {
  profile: ['profile'] as const
};

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * useLogin
 *
 * Mutation hook for POST /users/login.
 * On success — stores both tokens and user in Zustand, navigates to /notes.
 * The access token is used immediately for API calls; the refresh token is
 * stored for silent renewal when the access token expires.
 */
export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setAuth(data.accessToken, data.refreshToken, data.user);
      navigate('/notes');
    },
    onError: (err: unknown) => extractError(err)
  });
};

/**
 * useRegister
 *
 * Mutation hook for POST /users/register.
 * On success — navigates to /login so the user can sign in.
 * The backend does not issue tokens on register — only on login.
 */
export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      navigate('/login');
    },
    onError: (err: unknown) => extractError(err)
  });
};

/**
 * useProfile
 *
 * Query hook for GET /users/profile.
 * Only runs if the user is authenticated.
 */
export const useProfile = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: AUTH_KEYS.profile,
    queryFn: getProfile,
    enabled: isAuthenticated()
  });
};

/**
 * useUpdateProfile
 *
 * Mutation hook for PUT /users/profile.
 * On success — updates the user in Zustand and invalidates the profile cache.
 */
export const useUpdateProfile = () => {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.profile });
    },
    onError: (err: unknown) => extractError(err)
  });
};

/**
 * useLogout
 *
 * Calls the backend logout endpoint to invalidate the refresh token
 * (so the session cannot be silently extended even if the token is stolen),
 * then clears local auth state and redirects to login.
 *
 * Best-effort server call — local auth is always cleared even if the
 * API call fails (e.g. when offline or the token is already expired).
 */
export const useLogout = () => {
  const { clearAuth, refreshToken } = useAuthStore();
  const navigate = useNavigate();

  const logout = async () => {
    if (refreshToken) {
      try {
        await logoutUser(refreshToken);
      } catch {
        // Swallow — clear local auth regardless of server response
      }
    }
    clearAuth();
    navigate('/login');
  };

  return { logout };
};