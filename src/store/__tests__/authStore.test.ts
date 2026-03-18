import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';
import type { SafeUser } from '../../types';

const MOCK_USER: SafeUser = {
  userId:    'user-1',
  email:     'test@example.com',
  name:      'Test User',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

beforeEach(() => {
  // Reset store and localStorage before every test
  useAuthStore.setState({ token: null, refreshToken: null, user: null });
  localStorage.clear();
});

describe('authStore — initial state', () => {
  it('starts with null token, refreshToken, and user', () => {
    const { token, refreshToken, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(refreshToken).toBeNull();
    expect(user).toBeNull();
  });

  it('isAuthenticated returns false when no token is stored', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });
});

describe('authStore — setAuth', () => {
  it('stores access token, refresh token, and user', () => {
    useAuthStore.getState().setAuth('access-tok', 'refresh-tok', MOCK_USER);
    const { token, refreshToken, user } = useAuthStore.getState();
    expect(token).toBe('access-tok');
    expect(refreshToken).toBe('refresh-tok');
    expect(user).toEqual(MOCK_USER);
  });

  it('makes isAuthenticated return true', () => {
    useAuthStore.getState().setAuth('access-tok', 'refresh-tok', MOCK_USER);
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });
});

describe('authStore — setToken', () => {
  it('updates only the access token, leaving refreshToken and user intact', () => {
    useAuthStore.getState().setAuth('old-access', 'refresh-tok', MOCK_USER);
    useAuthStore.getState().setToken('new-access');
    const { token, refreshToken, user } = useAuthStore.getState();
    expect(token).toBe('new-access');
    expect(refreshToken).toBe('refresh-tok');
    expect(user).toEqual(MOCK_USER);
  });
});

describe('authStore — setUser', () => {
  it('updates user without touching either token', () => {
    useAuthStore.getState().setAuth('access-tok', 'refresh-tok', MOCK_USER);
    const updated = { ...MOCK_USER, name: 'New Name' };
    useAuthStore.getState().setUser(updated);
    const { token, refreshToken, user } = useAuthStore.getState();
    expect(token).toBe('access-tok');
    expect(refreshToken).toBe('refresh-tok');
    expect(user?.name).toBe('New Name');
  });
});

describe('authStore — clearAuth', () => {
  it('resets all fields to null', () => {
    useAuthStore.getState().setAuth('access-tok', 'refresh-tok', MOCK_USER);
    useAuthStore.getState().clearAuth();
    const { token, refreshToken, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(refreshToken).toBeNull();
    expect(user).toBeNull();
  });

  it('makes isAuthenticated return false after clear', () => {
    useAuthStore.getState().setAuth('access-tok', 'refresh-tok', MOCK_USER);
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });
});
