/**
 * src/lib/extractError.ts
 *
 * Centralized error message extractor used across all hooks and components.
 *
 * Why centralize this?
 *   Previously extractErrorMessage was duplicated in useAuth.ts and useNotes.ts,
 *   and each copy only handled backend { message } responses — missing the cases
 *   below. One utility fixes the extraction logic in one place for the whole app.
 *
 * Error shapes we handle (in priority order):
 *   1. AxiosError without response — network failure (offline, timeout, DNS)
 *   2. AxiosError with response body { error } — our backend validation errors
 *   3. AxiosError with response body { message } — some backend success/info messages
 *   4. AxiosError with known HTTP status — fallback status-based message
 *   5. Standard JS Error — unexpected throw inside a query function
 *   6. Unknown — anything else falls back to the provided fallback string
 */

import axios from 'axios';

export const extractError = (err: unknown, fallback = 'Something went wrong'): string => {

  if (axios.isAxiosError(err)) {

    // ── Network error — no response received at all ────────────────────────
    // This happens when the user is offline, the API Gateway URL is wrong,
    // DNS lookup fails, or the request times out.
    if (!err.response) {
      return 'Network error — check your connection and try again';
    }

    // ── Backend error body ─────────────────────────────────────────────────
    // Our backend returns { error: string } for all 4xx/5xx responses.
    // Some older endpoints return { message: string } — check both.
    const data = err.response.data as Record<string, unknown>;
    const msg = data?.error ?? data?.message;
    if (typeof msg === 'string' && msg.trim().length > 0) {
      return msg;
    }

    // ── HTTP status fallback ───────────────────────────────────────────────
    // If the body doesn't contain a useful message, use the status code.
    if (err.response.status === 401) return 'Session expired — please log in again';
    if (err.response.status === 403) return 'Access denied';
    if (err.response.status === 404) return 'Not found';
    if (err.response.status === 409) return 'Conflict — resource already exists';
    if (err.response.status >= 500) return 'Server error — please try again later';
  }

  // ── Standard JS Error ─────────────────────────────────────────────────────
  if (err instanceof Error) {
    return err.message;
  }

  return fallback;
};
