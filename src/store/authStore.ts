/**
 * src/store/authStore.ts
 *
 * Zustand store for authentication state.
 *
 * Two-token auth pattern:
 *   token        — short-lived JWT access token (15 min). Sent as the
 *                  Authorization header on every protected API call.
 *                  When it expires the axios interceptor silently refreshes it.
 *   refreshToken — long-lived UUID (7 days). Stored here and used only by
 *                  the axios interceptor to call POST /users/refresh.
 *                  Never sent to any protected route directly.
 *
 * The persist middleware automatically saves/loads state to localStorage
 * so both tokens and the user profile survive page refreshes.
 *
 * Usage in any component:
 *   const { token, setAuth, clearAuth } = useAuthStore();
 *
 * Usage outside a component (e.g. axios interceptor):
 *   useAuthStore.getState().token
 *   useAuthStore.getState().setToken(newAccessToken)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SafeUser } from '../types';

// ── Store shape ──────────────────────────────────────────────────────────────

/**
 * Defines both the state and the actions in one interface.
 * This is the Zustand pattern — state and updater functions live together.
 */
interface AuthStore {
  // ── State ──────────────────────────────────────────────────────────────────
  token: string | null;         // access token — sent in Authorization header
  refreshToken: string | null;  // refresh token — used only to get new access tokens
  user: SafeUser | null;

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * setAuth — called after successful login.
   * Stores the access token, refresh token, and user profile.
   */
  setAuth: (accessToken: string, refreshToken: string, user: SafeUser) => void;

  /**
   * setToken — called by the axios interceptor after a silent token refresh.
   * Updates only the access token — leaves refreshToken and user unchanged.
   */
  setToken: (accessToken: string) => void;

  /**
   * setUser — called after a successful profile update.
   * Updates just the user object without touching the tokens.
   */
  setUser: (user: SafeUser) => void;

  /**
   * clearAuth — called on logout or when refresh fails.
   * Wipes all auth state from the store and localStorage.
   */
  clearAuth: () => void;

  /**
   * isAuthenticated — derived boolean.
   * True if an access token exists.
   * Used by ProtectedRoute and PublicRoute.
   */
  isAuthenticated: () => boolean;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()(

  // persist wraps the store and automatically saves/loads
  // the specified state keys to/from localStorage.
  persist(
    (set, get) => ({

      // ── Initial state ────────────────────────────────────────────
      token: null,
      refreshToken: null,
      user: null,

      // ── Actions ──────────────────────────────────────────────────

      setAuth: (accessToken, refreshToken, user) =>
        set({ token: accessToken, refreshToken, user }),

      // Only update the access token — called by the silent refresh interceptor.
      setToken: (accessToken) => set({ token: accessToken }),

      setUser: (user) => set({ user }),

      clearAuth: () => set({ token: null, refreshToken: null, user: null }),

      isAuthenticated: () => !!get().token,
    }),

    {
      // The localStorage key this store is saved under.
      // You will see this key in DevTools → Application → localStorage.
      name: 'auth-storage',

      // partialize controls which parts of the store are persisted.
      // We persist both tokens and user — not the functions.
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user
      })
    }
  )
);