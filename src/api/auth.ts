/**
 * src/api/auth.ts
 *
 * All authentication related API calls.
 * Each function maps to one backend Lambda endpoint.
 * These are plain async functions — TanStack Query hooks
 * will wrap these in the hooks/ folder.
 */

import axios from 'axios';
import api from './axios';
import type {
  LoginResponse,
  RegisterResponse,
  ProfileResponse,
  UpdateProfileResponse
} from '../types';

// ── Token refresh ────────────────────────────────────────────────────────────

/**
 * refreshAccessToken — exchanges a valid refresh token for a new access token.
 *
 * Why use raw axios here instead of the configured `api` instance?
 *   The `api` instance has a response interceptor that calls THIS function
 *   on 401s. If we used `api` here we would create a circular call loop.
 *   Using raw axios bypasses the interceptor entirely — the refresh endpoint
 *   either works or it doesn't; we handle the failure in the interceptor itself.
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string }> => {
  const res = await axios.post<{ accessToken: string }>(
    `${import.meta.env.VITE_API_URL}/users/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res.data;
};

/**
 * logoutUser — invalidates the refresh token on the server.
 * Deletes the token row from DynamoDB so it can never be used again.
 * Called before clearing local auth state in useLogout.
 */
export const logoutUser = async (refreshToken: string): Promise<void> => {
  await api.post('/users/logout', { refreshToken });
};

// ── Auth endpoints ───────────────────────────────────────────────────────────

/**
 * POST /users/register
 * Public route — no token needed.
 * Returns the created user (without passwordHash).
 */
export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterResponse> => {
  const res = await api.post<RegisterResponse>('/users/register', data);
  return res.data;
};

/**
 * POST /users/login
 * Public route — no token needed.
 * Returns token + user on success.
 */
export const loginUser = async (data: {
  email: string;
  password: string;
}): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>('/users/login', data);
  return res.data;
};

/**
 * GET /users/profile
 * Protected route — token attached automatically by Axios interceptor.
 * Returns the logged-in user's profile.
 */
export const getProfile = async (): Promise<ProfileResponse> => {
  const res = await api.get<ProfileResponse>('/users/profile');
  return res.data;
};

/**
 * PUT /users/profile
 * Protected route — token attached automatically by Axios interceptor.
 * Accepts name, currentPassword, newPassword — all optional
 * but at least one must be provided (validated on the backend).
 */
export const updateProfile = async (data: {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<UpdateProfileResponse> => {
  const res = await api.put<UpdateProfileResponse>('/users/profile', data);
  return res.data;
};