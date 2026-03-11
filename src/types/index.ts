/**
 * src/types/index.ts
 *
 * Central TypeScript interfaces for the frontend.
 * These mirror the backend shared/types.ts so the shapes
 * are always consistent between frontend and backend.
 */

// ── User ────────────────────────────────────────────────────────────────────

/**
 * SafeUser — what the API returns for any user-related response.
 * passwordHash is never returned by the backend, so we don't define it here.
 */
export interface SafeUser {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// ── Note ────────────────────────────────────────────────────────────────────

/**
 * Note — mirrors the Note interface in the backend exactly.
 */
export interface Note {
  userId: string;
  noteId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Auth ────────────────────────────────────────────────────────────────────

/**
 * AuthState — shape of what we store in Zustand.
 * token is the raw JWT string returned by the login endpoint.
 * user is the SafeUser returned alongside the token.
 */
export interface AuthState {
  token: string | null;
  user: SafeUser | null;
}

// ── API Response shapes ──────────────────────────────────────────────────────

/**
 * These match exactly what each backend Lambda returns in its response body.
 * Typing API responses means TypeScript will catch any mismatch between
 * what the backend sends and what the frontend expects.
 */

export interface LoginResponse {
  message: string;
  token: string;
  user: SafeUser;
}

export interface RegisterResponse {
  message: string;
  user: SafeUser;
}

export interface ProfileResponse {
  user: SafeUser;
}

export interface UpdateProfileResponse {
  message: string;
  user: SafeUser;
}

export interface NoteResponse {
  message: string;
  note: Note;
}

export interface NotesListResponse {
  notes: Note[];
}

// ── API Error ────────────────────────────────────────────────────────────────

/**
 * ApiError — shape of error responses from the backend.
 * Every error Lambda returns { message: string }.
 * We use this in the Axios interceptor to extract the error message.
 */
export interface ApiError {
  message: string;
}

// ── Form input types ─────────────────────────────────────────────────────────

/**
 * These are the shapes of form data before it hits the API.
 * Defined here so Zod schemas and React Hook Form can reference them.
 */

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string; // frontend only — not sent to the backend
  name: string;
}

export interface UpdateProfileFormData {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string; // frontend only — not sent to the backend
}

export interface NoteFormData {
  title: string;
  content: string;
  tags: string[];
}