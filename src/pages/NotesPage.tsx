/**
 * src/pages/NotesPage.tsx
 *
 * Protected page — the main dashboard showing all user notes.
 *
 * Features:
 *   — Infinite scroll / Load More pagination (cursor-based via nextKey)
 *   — Client-side search by title and content
 *   — Client-side filter by tag (click a tag chip to filter by it)
 *   — Loading skeleton while notes are fetching
 *   — Empty state with different messages for no notes vs no search results
 *   — Responsive note card grid
 *   — Optimistic delete — card disappears instantly before server confirms
 *   — ARIA labels on all icon buttons
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Skeleton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Clear as ClearIcon,
  Delete as DeleteIcon,
  NoteAdd as NoteAddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotes, useDeleteNote } from '../hooks/useNotes';
import { useSnackbar } from '../hooks/useSnackbar';
import type { Note } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

const truncate = (text: string, max = 120) =>
  text.length > max ? text.slice(0, max) + '...' : text;

// ── Sub-components ───────────────────────────────────────────────────────────

const NoteCardSkeleton = () => (
  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: 200 }}>
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
 *
 * Accessibility:
 *   The delete IconButton has an aria-label so screen readers announce
 *   "Delete note: <title>" instead of just "button".
 */
const NoteCard = ({
  note,
  onDelete,
  activeTag,
  onTagClick
}: {
  note: Note;
  onDelete: (noteId: string) => void;
  activeTag: string | null;
  onTagClick: (tag: string) => void;
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
          '& .delete-btn': { opacity: 1 }
        }
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/notes/${note.noteId}`)}
        sx={{ borderRadius: 2 }}
        aria-label={`Open note: ${note.title}`}
      >
        <CardContent sx={{ pb: '12px !important' }}>
          <Typography
            variant='h6'
            fontWeight={600}
            gutterBottom
            sx={{ pr: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {note.title}
          </Typography>

          <Typography variant='body2' color='text.secondary' sx={{ mb: 2, lineHeight: 1.6 }}>
            {truncate(note.content)}
          </Typography>

          {note.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
              {note.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size='small'
                  variant={activeTag === tag ? 'filled' : 'outlined'}
                  color={activeTag === tag ? 'primary' : 'default'}
                  sx={{ fontSize: '0.7rem', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick(tag);
                  }}
                  aria-label={`Filter by tag: ${tag}`}
                  aria-pressed={activeTag === tag}
                />
              ))}
            </Box>
          )}

          <Typography variant='caption' color='text.disabled'>
            {formatDate(note.updatedAt)}
          </Typography>
        </CardContent>
      </CardActionArea>

      <Tooltip title={`Delete note: ${note.title}`}>
        <IconButton
          className='delete-btn'
          size='small'
          aria-label={`Delete note: ${note.title}`}
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
            color: 'error.main'
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

  // ── Search and filter state ────────────────────────────────────────────────

  const [searchText, setSearchText] = useState('');
  // activeTag — when set, only notes with this tag are shown
  const [activeTag, setActiveTag] = useState<string | null>(null);
  // pendingDeleteId — noteId waiting for delete confirmation; null when dialog is closed
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // ── Data ───────────────────────────────────────────────────────────────────

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useNotes();

  const deleteNote = useDeleteNote();

  // Flatten all pages into a single notes array
  const allNotes: Note[] = useMemo(
    () => data?.pages.flatMap((p) => p.notes) ?? [],
    [data]
  );

  // ── Client-side search + filter ────────────────────────────────────────────

  /**
   * filteredNotes — derived from allNotes, applies:
   *   1. Text search: matches title OR content (case-insensitive)
   *   2. Tag filter: when activeTag is set, only notes that include it
   *
   * Both filters compose — you can search AND filter by tag simultaneously.
   * Client-side filtering is instant and works across all loaded pages.
   */
  const filteredNotes = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return allNotes.filter((note) => {
      const matchesSearch =
        !query ||
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query);
      const matchesTag =
        !activeTag || note.tags.includes(activeTag);
      return matchesSearch && matchesTag;
    });
  }, [allNotes, searchText, activeTag]);

  const totalLoaded = allNotes.length;

  // ── Handlers ───────────────────────────────────────────────────────────────

  // Opens the confirmation dialog — actual deletion happens in handleConfirmDelete
  const handleDelete = (noteId: string) => {
    setPendingDeleteId(noteId);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    deleteNote.mutate(id, {
      onSuccess: () => showSnackbar('Note deleted', 'success'),
      onError: () => showSnackbar('Failed to delete note', 'error')
    });
  };

  const handleTagClick = (tag: string) => {
    // Toggle: clicking the active tag clears the filter
    setActiveTag((prev) => (prev === tag ? null : tag));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Container maxWidth='lg'>

      {/* ── Page header ──────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant='h4' fontWeight={700}>
            My Notes
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            {isLoading
              ? 'Loading…'
              : `${filteredNotes.length} of ${totalLoaded} note${totalLoaded !== 1 ? 's' : ''} shown`
            }
          </Typography>
        </Box>

        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => navigate('/notes/new')}
          aria-label='Create new note'
        >
          New Note
        </Button>
      </Box>

      {/* ── Search + active tag filter bar ────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder='Search notes…'
          size='small'
          sx={{ minWidth: 240, flexGrow: 1, maxWidth: 400 }}
          inputProps={{ 'aria-label': 'Search notes' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' color='action' />
              </InputAdornment>
            ),
            endAdornment: searchText && (
              <InputAdornment position='end'>
                <Tooltip title='Clear search'>
                  <IconButton
                    size='small'
                    aria-label='Clear search'
                    onClick={() => setSearchText('')}
                  >
                    <ClearIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            )
          }}
        />

        {/* Active tag chip — shows which tag is being filtered, click to clear */}
        {activeTag && (
          <Chip
            label={`Tag: ${activeTag}`}
            onDelete={() => setActiveTag(null)}
            color='primary'
            size='small'
            aria-label={`Remove tag filter: ${activeTag}`}
          />
        )}
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

      {/* ── Loading skeleton ──────────────────────────────────────── */}
      {isLoading && (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <NoteCardSkeleton />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Empty state — no notes at all ─────────────────────────── */}
      {!isLoading && !isError && allNotes.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <NoteAddIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
          <Typography variant='h6' color='text.secondary'>No notes yet</Typography>
          <Typography variant='body2' color='text.disabled'>
            Create your first note to get started
          </Typography>
          <Button variant='contained' startIcon={<AddIcon />} onClick={() => navigate('/notes/new')} sx={{ mt: 1 }}>
            Create note
          </Button>
        </Box>
      )}

      {/* ── Empty state — search/filter returned no results ───────── */}
      {!isLoading && !isError && allNotes.length > 0 && filteredNotes.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color='text.secondary' gutterBottom>
            No notes match your search
          </Typography>
          <Button variant='text' onClick={() => { setSearchText(''); setActiveTag(null); }}>
            Clear filters
          </Button>
        </Box>
      )}

      {/* ── Notes grid ────────────────────────────────────────────── */}
      {!isLoading && !isError && filteredNotes.length > 0 && (
        <>
          <Grid container spacing={3}>
            {filteredNotes.map((note) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={note.noteId}>
                <NoteCard
                  note={note}
                  onDelete={handleDelete}
                  activeTag={activeTag}
                  onTagClick={handleTagClick}
                />
              </Grid>
            ))}
          </Grid>

          {/* ── Load More button ──────────────────────────────────── */}
          {/* Only shown when there are more pages and no active filter
              (filtering is client-side so more pages may contain matches) */}
          {hasNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant='outlined'
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                aria-label='Load more notes'
                startIcon={
                  isFetchingNextPage
                    ? <CircularProgress size={16} color='inherit' />
                    : undefined
                }
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </Box>
          )}
        </>
      )}

      {/* ── Delete confirmation dialog ───────────────────────────── */}
      <Dialog open={!!pendingDeleteId} onClose={() => setPendingDeleteId(null)}>
        <DialogTitle fontWeight={600}>Delete note?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This note will be permanently deleted and cannot be recovered.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPendingDeleteId(null)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color='error' variant='contained'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default NotesPage;