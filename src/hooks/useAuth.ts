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
import { loginUser, registerUser, getProfile, updateProfile } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

// ── Query keys ───────────────────────────────────────────────────────────────

/**
 * Query keys are how TanStack Query identifies and caches data.
 * Centralising them here prevents typos and makes cache
 * invalidation easy — if you want to refetch profile data anywhere
 * in the app, you just invalidate AUTH_KEYS.profile.
 */
export const AUTH_KEYS = {
  profile: ['profile'] as const
};

// ── Helper ───────────────────────────────────────────────────────────────────

/**
 * extractErrorMessage
 *
 * Extracts a human-readable error message from an Axios error.
 * Our backend always returns { message: string } in the error body.
 * If for some reason it doesn't, we fall back to a generic message.
 */
const extractErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? 'Something went wrong';
  }
  return 'Something went wrong';
};

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * useLogin
 *
 * Mutation hook for POST /users/login.
 * On success — stores token and user in Zustand, navigates to /notes.
 * On error — returns the error message for the form to display.
 */
export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Store token and user in Zustand (persisted to localStorage)
      setAuth(data.token, data.user);
      // Redirect to the notes list page
      navigate('/notes');
    },
    onError: (err: unknown) => extractErrorMessage(err)
  });
};

/**
 * useRegister
 *
 * Mutation hook for POST /users/register.
 * On success — navigates to /login so the user can sign in.
 * We don't auto-login after register because the backend
 * doesn't return a token on register — only on login.
 */
export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      navigate('/login');
    },
    onError: (err: unknown) => extractErrorMessage(err)
  });
};

/**
 * useProfile
 *
 * Query hook for GET /users/profile.
 * Only runs if the user is authenticated (token exists in Zustand).
 * Caches the profile data under AUTH_KEYS.profile.
 */
export const useProfile = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: AUTH_KEYS.profile,
    queryFn: getProfile,
    // Don't fetch if the user is not logged in
    // This prevents unnecessary API calls on public pages
    enabled: isAuthenticated()
  });
};

/**
 * useUpdateProfile
 *
 * Mutation hook for PUT /users/profile.
 * On success — updates the user in Zustand and invalidates
 * the profile query so it refetches fresh data.
 */
export const useUpdateProfile = () => {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      // Update user in Zustand store so navbar/header reflects changes
      setUser(data.user);
      // Invalidate the profile cache so useProfile refetches
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.profile });
    },
    onError: (err: unknown) => extractErrorMessage(err)
  });
};

/**
 * useLogout
 *
 * Not a TanStack Query hook — logout is purely client-side.
 * No API call needed — we just clear Zustand + localStorage
 * and redirect to login.
 */
export const useLogout = () => {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  return { logout };
};