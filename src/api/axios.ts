/**
 * src/api/axios.ts
 *
 * Axios instance — the single HTTP client used across the entire app.
 *
 * Instead of calling axios.get/post directly everywhere, we create
 * one configured instance with:
 *   — baseURL set to the API Gateway URL from .env
 *   — request interceptor that automatically attaches the JWT token
 *     to every outgoing request so we never have to do it manually
 *   — response interceptor that handles 401s globally — clears auth
 *     state and redirects to login when the token expires
 *
 * Express equivalent: an axios instance is like a pre-configured
 * fetch wrapper — similar to how you'd set up a base fetch utility.
 */

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  // VITE_API_URL is defined in .env at the root of the project
  // Vite exposes env variables prefixed with VITE_ via import.meta.env
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ── Request interceptor ──────────────────────────────────────────────────────

/**
 * Runs before every outgoing request.
 * Reads the token from Zustand and attaches it as a Bearer token.
 *
 * This means every API call automatically gets the auth header —
 * we never have to manually pass the token in individual API calls.
 *
 * Express equivalent:
 *   axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
 *   but done properly per-request rather than once globally.
 */
api.interceptors.request.use((config) => {
  // getState() reads Zustand store outside of a React component
  // Inside components you use the hook — outside you use getState()
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Response interceptor ─────────────────────────────────────────────────────

/**
 * Runs after every response comes back.
 * The error handler catches any failed request globally.
 *
 * The key job here is handling 401 Unauthorized —
 * which means the JWT token has expired or is invalid.
 * When this happens we:
 *   1. Clear the auth state (token + user) from Zustand + localStorage
 *   2. Redirect to /login
 *
 * Without this, the user would just see confusing errors instead of
 * being sent back to the login page automatically.
 */
api.interceptors.response.use(
  // Success — just pass the response through unchanged
  (response) => response,

  // Error — handle globally
  (error) => {
    // Only redirect to login on 401 if it's NOT the login endpoint itself.
    // A 401 from /users/login means wrong credentials — that's an expected
    // error that the form handles itself via the onError callback.
    // A 401 from any other endpoint means the JWT token has expired
    // or is invalid — in that case we clear auth and redirect to login.
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/users/login")
    ) {
      // Token expired or invalid — clear everything and redirect
      // Skip this for the login endpoint itself so wrong credentials
      // don't cause a page reload before the snackbar can appear
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }

    // Re-throw the error so individual API calls can still
    // catch and handle it with their own error messages
    return Promise.reject(error);
  },
);

export default api;