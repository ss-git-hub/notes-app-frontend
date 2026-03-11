/**
 * src/api/auth.ts
 *
 * All authentication related API calls.
 * Each function maps to one backend Lambda endpoint.
 * These are plain async functions — TanStack Query hooks
 * will wrap these in the hooks/ folder.
 */

import api from './axios';
import type {
  LoginResponse,
  RegisterResponse,
  ProfileResponse,
  UpdateProfileResponse
} from '../types';

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