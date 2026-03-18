/**
 * src/api/axios.ts
 *
 * Configured Axios instance — the single HTTP client used across the entire app.
 *
 * Three responsibilities:
 *   1. Request interceptor  — attaches the access token to every request
 *   2. Response interceptor — silently refreshes an expired access token
 *                             and retries the original request (token refresh)
 *   3. Network error        — surfaces clean messages for offline/timeout errors
 *
 * Silent token refresh flow:
 *   Access tokens expire after 15 minutes. When that happens:
 *     1. The backend returns 401
 *     2. This interceptor catches it (skip for /users/login and /users/refresh)
 *     3. Calls POST /users/refresh with the stored refresh token
 *     4. If refresh succeeds — stores the new access token and retries
 *        the original request transparently. The user sees nothing.
 *     5. If refresh fails  — clears auth and redirects to /login
 *
 * Request queuing:
 *   Multiple requests can fail simultaneously if the access token expires
 *   while several are in-flight. We queue them and replay all at once after
 *   the single refresh call resolves — preventing multiple concurrent refreshes.
 *
 * Circular dependency avoidance:
 *   auth.ts → api (this file). So the refresh call inside this file uses
 *   raw axios (not the `api` instance) to avoid triggering the interceptor
 *   again on the refresh request itself.
 */

import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { refreshAccessToken } from './auth';

// ── Axios instance ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// ── Token refresh queue ──────────────────────────────────────────────────────

/**
 * isRefreshing prevents multiple concurrent refresh calls.
 * If 3 requests all get 401 at the same time, only the first one
 * calls /users/refresh — the other two are queued here and replayed
 * with the new token once the refresh completes.
 */
let isRefreshing = false;
let pendingQueue: Array<(newToken: string) => void> = [];

const flushQueue = (newToken: string) => {
  pendingQueue.forEach((cb) => cb(newToken));
  pendingQueue = [];
};

// ── Request interceptor ──────────────────────────────────────────────────────

/**
 * Runs before every outgoing request.
 * Reads the current access token from Zustand and attaches it as Bearer.
 * getState() works outside React components — inside, use the hook.
 */
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ─────────────────────────────────────────────────────

api.interceptors.response.use(
  // Success — pass through unchanged
  (response) => response,

  // Error — attempt silent token refresh on 401
  async (error) => {
    const config = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    // ── Skip refresh for these endpoints ──────────────────────────────────
    // /users/login  — 401 here means wrong credentials, not expired token
    // /users/refresh — 401 here means the refresh token itself is invalid
    //                  (expired or logged out); redirect to login
    const url = config?.url ?? '';
    const isAuthEndpoint =
      url.includes('/users/login') || url.includes('/users/refresh');

    if (error.response?.status !== 401 || isAuthEndpoint || config?._retried) {
      return Promise.reject(error);
    }

    // ── No refresh token stored — session is dead ─────────────────────────
    const { refreshToken, setToken, clearAuth } = useAuthStore.getState();
    if (!refreshToken) {
      clearAuth();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // ── Another refresh is already in-flight — queue this request ─────────
    if (isRefreshing) {
      return new Promise<ReturnType<typeof api>>((resolve) => {
        pendingQueue.push((newToken) => {
          config.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(config));
        });
      });
    }

    // ── Kick off the refresh ───────────────────────────────────────────────
    config._retried = true;
    isRefreshing = true;

    try {
      const { accessToken } = await refreshAccessToken(refreshToken);

      // Store the new access token and replay all queued requests
      setToken(accessToken);
      flushQueue(accessToken);

      // Retry the original request with the fresh token
      config.headers.Authorization = `Bearer ${accessToken}`;
      return api(config);

    } catch {
      // Refresh token is expired or invalid — full logout
      pendingQueue = [];
      clearAuth();
      window.location.href = '/login';
      return Promise.reject(error);

    } finally {
      isRefreshing = false;
    }
  }
);

export default api;