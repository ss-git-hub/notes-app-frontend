import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { createWrapper } from '../../test/testUtils';
import { TEST_NOTE } from '../../test/handlers';
import { useNotes, useDeleteNote } from '../useNotes';
import { useAuthStore } from '../../store/authStore';

beforeEach(() => {
  useAuthStore.setState({ token: null, refreshToken: null, user: null });
  localStorage.clear();
});

// ── useNotes ──────────────────────────────────────────────────────────────────

describe('useNotes', () => {
  it('returns the first page of notes', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotes(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const notes = result.current.data?.pages.flatMap((p) => p.notes) ?? [];
    expect(notes).toHaveLength(1);
    expect(notes[0].noteId).toBe(TEST_NOTE.noteId);
    expect(notes[0].title).toBe(TEST_NOTE.title);
  });

  it('hasNextPage is false when the server returns nextKey: null', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotes(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  it('hasNextPage is true when the server returns a cursor', async () => {
    server.use(
      http.get('http://localhost/notes', () =>
        HttpResponse.json({ notes: [TEST_NOTE], count: 1, nextKey: 'cursor-abc' })
      )
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotes(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(true);
  });

  it('enters error state when the API returns 500', async () => {
    server.use(
      http.get('http://localhost/notes', () =>
        HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
      )
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotes(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ── useDeleteNote (optimistic updates) ───────────────────────────────────────

describe('useDeleteNote', () => {
  it('optimistically removes the note from cache before the server responds', async () => {
    // Hold the delete response so onSettled's refetch never fires during our check.
    // This lets us assert the intermediate optimistic state.
    let resolveDelete!: () => void;
    server.use(
      http.delete('http://localhost/notes/:noteId', () =>
        new Promise<Response>((res) => {
          resolveDelete = () => res(HttpResponse.json({ message: 'Note deleted' }));
        })
      )
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => ({ notes: useNotes(), deleteNote: useDeleteNote() }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.notes.isSuccess).toBe(true));
    expect(result.current.notes.data?.pages.flatMap((p) => p.notes)).toHaveLength(1);

    act(() => {
      result.current.deleteNote.mutate(TEST_NOTE.noteId);
    });

    // onMutate is async (awaits cancelQueries) so use waitFor, but the server
    // response is held — no onSettled refetch can restore the note yet.
    await waitFor(() => {
      const after = result.current.notes.data?.pages.flatMap((p) => p.notes) ?? [];
      expect(after).toHaveLength(0);
    });

    // Let the server respond so the test cleans up without hanging
    resolveDelete();
  });

  it('rolls back the optimistic removal when the server returns an error', async () => {
    server.use(
      http.delete('http://localhost/notes/:noteId', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      )
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => ({ notes: useNotes(), deleteNote: useDeleteNote() }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.notes.isSuccess).toBe(true));

    act(() => {
      result.current.deleteNote.mutate(TEST_NOTE.noteId);
    });

    // After error + onSettled refetch, the note must be back
    await waitFor(() => expect(result.current.deleteNote.isError).toBe(true));

    await waitFor(() => {
      const notes = result.current.notes.data?.pages.flatMap((p) => p.notes) ?? [];
      expect(notes).toHaveLength(1);
    });
  });
});
