/**
 * src/hooks/useNotes.ts
 *
 * TanStack Query hooks for all notes related operations.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAllNotes, getNote, createNote, updateNote, deleteNote } from '../api/notes';
import axios from 'axios';

// ── Query keys ───────────────────────────────────────────────────────────────

export const NOTES_KEYS = {
  all: ['notes'] as const,
  // detail key includes the noteId so each note is cached separately
  detail: (id: string) => ['notes', id] as const
};

// ── Helper ───────────────────────────────────────────────────────────────────

const extractErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? 'Something went wrong';
  }
  return 'Something went wrong';
};

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * useNotes
 *
 * Query hook for GET /notes.
 * Fetches all notes for the logged-in user.
 * Cached under NOTES_KEYS.all — invalidated after any create/update/delete.
 */
export const useNotes = () => {
  return useQuery({
    queryKey: NOTES_KEYS.all,
    queryFn: getAllNotes
  });
};

/**
 * useNote
 *
 * Query hook for GET /notes/{id}.
 * Fetches a single note by noteId.
 * Only runs if noteId is provided.
 */
export const useNote = (noteId: string) => {
  return useQuery({
    queryKey: NOTES_KEYS.detail(noteId),
    queryFn: () => getNote(noteId),
    // Don't run if noteId is somehow empty
    enabled: !!noteId
  });
};

/**
 * useCreateNote
 *
 * Mutation hook for POST /notes.
 * On success — invalidates the notes list cache and navigates to /notes.
 */
export const useCreateNote = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      // Invalidate notes list so it refetches with the new note included
      queryClient.invalidateQueries({ queryKey: NOTES_KEYS.all });
      navigate('/notes');
    },
    onError: (err: unknown) => extractErrorMessage(err)
  });
};

/**
 * useUpdateNote
 *
 * Mutation hook for PUT /notes/{id}.
 * On success — invalidates both the list and the specific note cache.
 */
export const useUpdateNote = (noteId: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: { title?: string; content?: string; tags?: string[] }) =>
      updateNote(noteId, data),
    onSuccess: () => {
      // Invalidate both the list and this specific note's cache
      queryClient.invalidateQueries({ queryKey: NOTES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: NOTES_KEYS.detail(noteId) });
      navigate('/notes');
    },
    onError: (err: unknown) => extractErrorMessage(err)
  });
};

/**
 * useDeleteNote
 *
 * Mutation hook for DELETE /notes/{id}.
 * On success — invalidates the notes list cache.
 */
export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      // Refetch the notes list after deletion
      queryClient.invalidateQueries({ queryKey: NOTES_KEYS.all });
    },
    onError: (err: unknown) => extractErrorMessage(err)
  });
};