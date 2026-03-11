/**
 * src/store/authStore.ts
 *
 * Zustand store for authentication state.
 *
 * Zustand is simpler than Redux — no actions, reducers, or dispatchers.
 * You define state and functions to update it in one place.
 *
 * The persist middleware from zustand automatically syncs this store
 * to localStorage so the token and user survive page refreshes.
 * Without persist, Zustand state is in-memory only and is lost on refresh.
 *
 * Usage in any component:
 *   const { token, user, setAuth, clearAuth } = useAuthStore();
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
  token: string | null;   // raw JWT string — sent as Bearer token in every request
  user: SafeUser | null;  // logged-in user's profile data

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * setAuth — called after successful login or register.
   * Stores the token and user in the store (and localStorage via persist).
   */
  setAuth: (token: string, user: SafeUser) => void;

  /**
   * setUser — called after a successful profile update.
   * Updates just the user object without touching the token.
   */
  setUser: (user: SafeUser) => void;

  /**
   * clearAuth — called on logout or when a 401 is received.
   * Wipes both token and user from the store and localStorage.
   */
  clearAuth: () => void;

  /**
   * isAuthenticated — derived boolean.
   * True if a token exists in the store.
   * Used by ProtectedRoute and PublicRoute to decide where to redirect.
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
      user: null,

      // ── Actions ──────────────────────────────────────────────────

      setAuth: (token, user) => set({ token, user }),

      setUser: (user) => set({ user }),

      clearAuth: () => set({ token: null, user: null }),

      // get() reads the current state from within the store.
      // This is how you access state inside an action in Zustand.
      isAuthenticated: () => !!get().token,
    }),

    {
      // The localStorage key this store is saved under.
      // You will see this key in DevTools → Application → localStorage.
      name: 'auth-storage',

      // partialize controls which parts of the store are persisted.
      // We only persist token and user — not the functions.
      // Functions are always re-created when the store initialises.
      partialize: (state) => ({
        token: state.token,
        user: state.user
      })
    }
  )
);