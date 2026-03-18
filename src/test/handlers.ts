/**
 * src/test/handlers.ts
 *
 * MSW request handlers — define the "happy path" API responses used across
 * all tests. Individual tests can override specific handlers with
 * server.use(...) when testing error states.
 */

import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost';

// ── Shared test fixtures ──────────────────────────────────────────────────────

export const TEST_USER = {
  userId:    'user-1',
  email:     'test@example.com',
  name:      'Test User',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

export const TEST_NOTE = {
  userId:    'user-1',
  noteId:    'note-1',
  title:     'Test Note',
  content:   'Test content',
  tags:      ['work'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

// ── Handlers ─────────────────────────────────────────────────────────────────

export const handlers = [
  // Auth
  http.post(`${BASE}/users/login`, () =>
    HttpResponse.json({
      message:      'Login successful',
      accessToken:  'test-access-token',
      refreshToken: 'test-refresh-token',
      user:         TEST_USER
    })
  ),

  http.post(`${BASE}/users/register`, () =>
    HttpResponse.json({ message: 'User registered', user: TEST_USER }, { status: 201 })
  ),

  http.post(`${BASE}/users/logout`, () =>
    HttpResponse.json({ message: 'Logged out' })
  ),

  http.get(`${BASE}/users/profile`, () =>
    HttpResponse.json({ user: TEST_USER })
  ),

  http.put(`${BASE}/users/profile`, () =>
    HttpResponse.json({ message: 'Profile updated', user: { ...TEST_USER, name: 'Updated Name' } })
  ),

  // Notes
  http.get(`${BASE}/notes`, () =>
    HttpResponse.json({ notes: [TEST_NOTE], count: 1, nextKey: null })
  ),

  http.post(`${BASE}/notes`, () =>
    HttpResponse.json({ note: TEST_NOTE }, { status: 201 })
  ),

  http.delete(`${BASE}/notes/:noteId`, () =>
    HttpResponse.json({ message: 'Note deleted' })
  )
];
