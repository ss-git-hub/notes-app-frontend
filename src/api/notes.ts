/**
 * src/api/notes.ts
 *
 * All notes related API calls.
 * Each function maps to one backend Lambda endpoint.
 */

import api from './axios';
import type {
  NoteResponse,
  NotesListResponse
} from '../types';

// ── Notes endpoints ──────────────────────────────────────────────────────────

/**
 * GET /notes
 * Protected — returns a paginated page of notes for the logged-in user.
 *
 * params.lastKey — base64-encoded cursor from the previous page's nextKey.
 *                  Omit to fetch the first page.
 * params.limit   — max notes per page (default 20, max 100 on the backend).
 *
 * The response includes nextKey which is passed back as lastKey on the
 * next request to implement cursor-based pagination.
 */
export const getAllNotes = async (params?: {
  lastKey?: string;
  limit?: number;
}): Promise<NotesListResponse> => {
  const res = await api.get<NotesListResponse>('/notes', { params });
  return res.data;
};

/**
 * GET /notes/{id}
 * Protected — returns a single note by noteId.
 */
export const getNote = async (noteId: string): Promise<NoteResponse> => {
  const res = await api.get<NoteResponse>(`/notes/${noteId}`);
  return res.data;
};

/**
 * POST /notes
 * Protected — creates a new note.
 */
export const createNote = async (data: {
  title: string;
  content: string;
  tags?: string[];
}): Promise<NoteResponse> => {
  const res = await api.post<NoteResponse>('/notes', data);
  return res.data;
};

/**
 * PUT /notes/{id}
 * Protected — updates an existing note by noteId.
 */
export const updateNote = async (
  noteId: string,
  data: {
    title?: string;
    content?: string;
    tags?: string[];
  }
): Promise<NoteResponse> => {
  const res = await api.put<NoteResponse>(`/notes/${noteId}`, data);
  return res.data;
};

/**
 * DELETE /notes/{id}
 * Protected — deletes a note by noteId.
 */
export const deleteNote = async (noteId: string): Promise<void> => {
  await api.delete(`/notes/${noteId}`);
};