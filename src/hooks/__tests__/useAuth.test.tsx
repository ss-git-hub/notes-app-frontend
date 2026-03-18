import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { createWrapper } from '../../test/testUtils';
import { TEST_USER } from '../../test/handlers';
import { useLogin, useRegister, useLogout } from '../useAuth';
import { useAuthStore } from '../../store/authStore';

beforeEach(() => {
  useAuthStore.setState({ token: null, refreshToken: null, user: null });
  localStorage.clear();
});

// ── useLogin ─────────────────────────────────────────────────────────────────

describe('useLogin', () => {
  it('stores access token, refresh token, and user in the auth store on success', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ email: 'test@example.com', password: 'password123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { token, refreshToken, user } = useAuthStore.getState();
    expect(token).toBe('test-access-token');
    expect(refreshToken).toBe('test-refresh-token');
    expect(user?.email).toBe(TEST_USER.email);
    expect(user?.name).toBe(TEST_USER.name);
  });

  it('enters error state when the server returns 401', async () => {
    server.use(
      http.post('http://localhost/users/login', () =>
        HttpResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      )
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ email: 'wrong@example.com', password: 'wrong' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Auth store must remain empty — no partial state on failure
    expect(useAuthStore.getState().token).toBeNull();
  });
});

// ── useRegister ───────────────────────────────────────────────────────────────

describe('useRegister', () => {
  it('enters success state after a successful registration', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRegister(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('enters error state when the server returns 409 (email taken)', async () => {
    server.use(
      http.post('http://localhost/users/register', () =>
        HttpResponse.json({ error: 'Email already registered' }, { status: 409 })
      )
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRegister(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({
        name: 'Test User',
        email: 'taken@example.com',
        password: 'password123'
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ── useLogout ─────────────────────────────────────────────────────────────────

describe('useLogout', () => {
  it('clears the auth store after a successful logout', async () => {
    useAuthStore.getState().setAuth('access-tok', 'refresh-tok', TEST_USER);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.logout();
    });

    const { token, refreshToken, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(refreshToken).toBeNull();
    expect(user).toBeNull();
  });

  it('clears the auth store even when the logout API call fails', async () => {
    server.use(
      http.post('http://localhost/users/logout', () =>
        HttpResponse.json({ error: 'Server error' }, { status: 500 })
      )
    );

    useAuthStore.getState().setAuth('access-tok', 'refresh-tok', TEST_USER);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.logout();
    });

    // Local auth must be cleared regardless of server response
    expect(useAuthStore.getState().token).toBeNull();
  });
});
