/**
 * src/pages/NotesPage.tsx
 *
 * Protected page — the main dashboard showing all user notes.
 *
 * Features:
 *   — Fetches all notes via useNotes hook (TanStack Query)
 *   — Loading skeleton while notes are fetching
 *   — Empty state when user has no notes yet
 *   — Note cards in a responsive grid layout
 *   — Each card shows title, content preview, tags, and date
 *   — Delete note directly from the card with confirmation
 *   — Click card to navigate to note detail/edit page
 *   — Error state if fetch fails
 */

import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  Skeleton,
  Tooltip,
  Typography
} from '@mui/material';

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  NoteAdd as NoteAddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotes, useDeleteNote } from '../hooks/useNotes';
import { useSnackbar } from '../hooks/useSnackbar';
import type { Note } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * formatDate — converts ISO string to a readable date.
 * "2026-03-01T12:00:00.000Z" → "Mar 1, 2026"
 */
const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * truncate — shortens content preview to a max character length.
 * Prevents long notes from overflowing the card.
 */
const truncate = (text: string, max = 120) => {
  return text.length > max ? text.slice(0, max) + '...' : text;
};

// ── Sub-components ───────────────────────────────────────────────────────────

/**
 * NoteCardSkeleton — placeholder card shown while notes are loading.
 * Matches the shape of a real NoteCard so the layout doesn't jump.
 */
const NoteCardSkeleton = () => (
  <Card
    elevation={0}
    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: 200, width: 200 }}
  >
    <CardContent>
      <Skeleton variant='text' width='60%' height={28} sx={{ mb: 1 }} />
      <Skeleton variant='text' width='100%' />
      <Skeleton variant='text' width='80%' sx={{ mb: 2 }} />
      <Skeleton variant='text' width='40%' height={20} />
    </CardContent>
  </Card>
);

/**
 * NoteCard — renders a single note as a clickable card.
 * Delete button is shown on hover via CSS.
 */
const NoteCard = ({
  note,
  onDelete
}: {
  note: Note;
  onDelete: (noteId: string) => void;
}) => {
  const navigate = useNavigate();

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        position: 'relative',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          // Show delete button on hover
          '& .delete-btn': { opacity: 1 }
        }
      }}
    >
      {/* Clicking the card body navigates to the note detail page */}
      <CardActionArea
        onClick={() => navigate(`/notes/${note.noteId}`)}
        sx={{ borderRadius: 2 }}
      >
        <CardContent sx={{ pb: '12px !important' }}>
          {/* Title */}
          <Typography
            variant='h6'
            fontWeight={600}
            gutterBottom
            sx={{
              // Leave space for the delete button
              pr: 4,
              // Clamp to 1 line with ellipsis
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {note.title}
          </Typography>

          {/* Content preview */}
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ mb: 2, lineHeight: 1.6 }}
          >
            {truncate(note.content)}
          </Typography>

          {/* Tags */}
          {note.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
              {note.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size='small'
                  variant='outlined'
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          )}

          {/* Date */}
          <Typography variant='caption' color='text.disabled'>
            {formatDate(note.updatedAt)}
          </Typography>
        </CardContent>
      </CardActionArea>

      {/* Delete button — hidden by default, shown on card hover */}
      {/* stopPropagation prevents the card click from also firing */}
      <Tooltip title='Delete note'>
        <IconButton
          className='delete-btn'
          size='small'
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.noteId);
          }}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            opacity: 0,
            transition: 'opacity 0.2s ease',
            color: 'error.main',
            '&:hover': { bgcolor: 'error.lighter' }
          }}
        >
          <DeleteIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    </Card>
  );
};

// ── Page component ───────────────────────────────────────────────────────────

const NotesPage = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { data, isLoading, isError } = useNotes();
  const deleteNote = useDeleteNote();

  // ── Delete handler ─────────────────────────────────────────────────────────

  /**
   * handleDelete — deletes a note and shows a snackbar on success/error.
   * No confirmation dialog for now — the delete button is intentionally
   * hidden until hover to prevent accidental deletion.
   */
  const handleDelete = (noteId: string) => {
    deleteNote.mutate(noteId, {
      onSuccess: () => {
        showSnackbar('Note deleted', 'success');
      },
      onError: () => {
        showSnackbar('Failed to delete note', 'error');
      }
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Container maxWidth='lg'>

      {/* ── Page header ──────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 4
        }}
      >
        <Box>
          <Typography variant='h4' fontWeight={700}>
            My Notes
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            {data?.notes.length
              ? `${data.notes.length} note${data.notes.length > 1 ? 's' : ''}`
              : 'No notes yet'
            }
          </Typography>
        </Box>

        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => navigate('/notes/new')}
        >
          New Note
        </Button>
      </Box>

      {/* ── Error state ───────────────────────────────────────────── */}
      {isError && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color='error' gutterBottom>
            Failed to load notes
          </Typography>
          <Button variant='outlined' onClick={() => window.location.reload()}>
            Try again
          </Button>
        </Box>
      )}

      {/* ── Loading state — skeleton grid ────────────────────────── */}
      {isLoading && (
        <Grid container spacing={3}>
          {/* Render 6 skeleton cards while loading */}
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <NoteCardSkeleton />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Empty state ───────────────────────────────────────────── */}
      {!isLoading && !isError && data?.notes.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <NoteAddIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
          <Typography variant='h6' color='text.secondary'>
            No notes yet
          </Typography>
          <Typography variant='body2' color='text.disabled'>
            Create your first note to get started
          </Typography>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => navigate('/notes/new')}
            sx={{ mt: 1 }}
          >
            Create note
          </Button>
        </Box>
      )}

      {/* ── Notes grid ────────────────────────────────────────────── */}
      {!isLoading && !isError && data && data.notes.length > 0 && (
        <Grid container spacing={3}>
          {data.notes.map((note) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={note.noteId}>
              <NoteCard note={note} onDelete={handleDelete} />
            </Grid>
          ))}
        </Grid>
      )}

    </Container>
  );
};

export default NotesPage;