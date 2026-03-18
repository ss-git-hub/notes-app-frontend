import { describe, it, expect } from 'vitest';
import axios from 'axios';
import { extractError } from '../extractError';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build an AxiosError with the given HTTP status and response body. */
const makeAxiosError = (status?: number, data?: Record<string, unknown>) => {
  const err = new axios.AxiosError('Request failed');
  if (status !== undefined) {
    err.response = {
      status,
      data:       data ?? {},
      headers:    {},
      config:     err.config!,
      statusText: ''
    };
  }
  return err;
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('extractError', () => {
  it('returns a network error message when there is no response', () => {
    const err = makeAxiosError(); // no .response
    expect(extractError(err)).toBe(
      'Network error — check your connection and try again'
    );
  });

  it('extracts the { error } field from the response body', () => {
    const err = makeAxiosError(400, { error: 'Email already registered' });
    expect(extractError(err)).toBe('Email already registered');
  });

  it('falls back to the { message } field when { error } is absent', () => {
    const err = makeAxiosError(400, { message: 'Something happened' });
    expect(extractError(err)).toBe('Something happened');
  });

  it('prefers { error } over { message } when both are present', () => {
    const err = makeAxiosError(400, { error: 'Specific error', message: 'Generic' });
    expect(extractError(err)).toBe('Specific error');
  });

  it('ignores whitespace-only strings and falls back to status code', () => {
    const err = makeAxiosError(401, { error: '   ' });
    expect(extractError(err)).toBe('Session expired — please log in again');
  });

  it('returns a 401 status message when the body is empty', () => {
    expect(extractError(makeAxiosError(401, {}))).toBe(
      'Session expired — please log in again'
    );
  });

  it('returns a 403 status message', () => {
    expect(extractError(makeAxiosError(403, {}))).toBe('Access denied');
  });

  it('returns a 404 status message', () => {
    expect(extractError(makeAxiosError(404, {}))).toBe('Not found');
  });

  it('returns a 409 conflict message', () => {
    expect(extractError(makeAxiosError(409, {}))).toBe(
      'Conflict — resource already exists'
    );
  });

  it('returns a generic server error message for 5xx status codes', () => {
    expect(extractError(makeAxiosError(500, {}))).toBe(
      'Server error — please try again later'
    );
    expect(extractError(makeAxiosError(503, {}))).toBe(
      'Server error — please try again later'
    );
  });

  it('extracts the message from a standard Error object', () => {
    expect(extractError(new Error('Something broke'))).toBe('Something broke');
  });

  it('returns the default fallback for unknown error shapes', () => {
    expect(extractError('a plain string')).toBe('Something went wrong');
    expect(extractError(null)).toBe('Something went wrong');
    expect(extractError(42)).toBe('Something went wrong');
  });

  it('uses a custom fallback when provided', () => {
    expect(extractError(null, 'Custom fallback')).toBe('Custom fallback');
  });
});
