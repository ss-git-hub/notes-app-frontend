/**
 * src/hooks/useNotes.ts
 *
 * TanStack Query hooks for all notes related operations.
 *
 * Key changes from the original:
 *   — useNotes uses useInfiniteQuery for cursor-based pagination.
 *     The backend returns { notes, count, nextKey }. nextKey is the
 *     base64-encoded DynamoDB cursor passed back as lastKey on next fetch.
 *   — useDeleteNote uses optimistic updates — removes the note from the
 *     local cache immediately so the UI responds instantly, then rolls
 *     back if the server returns an error.
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData
} from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAllNotes, getNote, createNote, updateNote, deleteNote } from '../api/notes';
import { extractError } from '../lib/extractError';
import type { NotesListResponse } from '../types';

// ── Query keys ───────────────────────────────────────────────────────────────

export const NOTES_KEYS = {
  all: ['notes'] as const,
  detail: (id: string) => ['notes', id] as const
};

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * useNotes
 *
 * Infinite query for GET /notes — supports cursor-based pagination.
 *
 * Data shape from useInfiniteQuery:
 *   data.pages           — array of NotesListResponse (one per page loaded)
 *   data.pages[n].notes  — notes for that page
 *   data.pages[n].nextKey — cursor to pass when fetching the next page
 *
 * In the component, flatten all pages:
 *   const notes = data?.pages.flatMap(p => p.notes) ?? [];
 *
 * To load the next page:
 *   fetchNextPage()  — fetches next page using the last page's nextKey
 *   hasNextPage      — true if the last page returned a non-null nextKey
 */
export const useNotes = () => {
  return useInfiniteQuery({
    queryKey: NOTES_KEYS.all,
    queryFn: ({ pageParam }) =>
      getAllNotes({ lastKey: pageParam }),
    // First page has no cursor — undefined means start from the beginning
    initialPageParam: undefined as string | undefined,
    // getNextPageParam extracts the cursor from each page response.
    // nextKey is null on the last page — returning undefined tells
    // TanStack Query there are no more pages (hasNextPage = false).
    getNextPageParam: (lastPage) => lastPage.nextKey ?? undefined
  });
};

/**
 * useNote
 *
 * Query hook for GET /notes/{id}.
 * Fetches a single note by noteId.
 */
export const useNote = (noteId: string) => {
  return useQuery({
    queryKey: NOTES_KEYS.detail(noteId),
    queryFn: () => getNote(noteId),
    enabled: !!noteId
  });
};

/**
 * useCreateNote
 *
 * Mutation for POST /notes.
 * On success — invalidates the notes list (refetches from page 1)
 * and navigates to /notes.
 */
export const useCreateNote = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEYS.all });
      navigate('/notes');
    },
    onError: (err: unknown) => extractError(err)
  });
};

/**
 * useUpdateNote
 *
 * Mutation for PUT /notes/{id}.
 * On success — invalidates both the list and this note's detail cache.
 */
export const useUpdateNote = (noteId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title?: string; content?: string; tags?: string[] }) =>
      updateNote(noteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: NOTES_KEYS.detail(noteId) });
    },
    onError: (err: unknown) => extractError(err)
  });
};

/**
 * useDeleteNote
 *
 * Mutation for DELETE /notes/{id} with optimistic updates.
 *
 * Optimistic update pattern:
 *   onMutate  — remove the note from cache immediately (instant UI response)
 *   onError   — restore the previous cache state if the server rejects it
 *   onSettled — always refetch to ensure client/server are in sync
 *
 * Why optimistic delete?
 *   Without it, the user clicks Delete and waits for the network round-trip
 *   before the card disappears. With it, the card disappears instantly and
 *   the server catches up asynchronously. The rollback on error ensures
 *   correctness — the note reappears if deletion fails.
 */
export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,

    onMutate: async (noteId) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: NOTES_KEYS.all });

      // Snapshot the current cache so we can roll back on error
      const previous = queryClient.getQueryData<InfiniteData<NotesListResponse>>(
        NOTES_KEYS.all
      );

      // Remove the deleted note from every page in the infinite query cache
      queryClient.setQueryData<InfiniteData<NotesListResponse>>(
        NOTES_KEYS.all,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              notes: page.notes.filter((n) => n.noteId !== noteId),
              count: Math.max(0, page.count - 1)
            }))
          };
        }
      );

      // Return snapshot for potential rollback
      return { previous };
    },

    onError: (_err, _noteId, context) => {
      // Roll back to the snapshot if the delete failed
      if (context?.previous) {
        queryClient.setQueryData(NOTES_KEYS.all, context.previous);
      }
    },

    onSettled: () => {
      // Always sync with the server after the mutation settles
      queryClient.invalidateQueries({ queryKey: NOTES_KEYS.all });
    }
  });
};