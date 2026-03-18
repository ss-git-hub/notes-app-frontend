/**
 * src/pages/NoteDetailPage.tsx
 *
 * Protected page — view and edit a single note.
 *
 * Features:
 *   — Fetches note by noteId from URL params via useNote hook
 *   — View mode by default — shows title, content, tags, and dates
 *   — Edit mode — pre-fills form with existing note data
 *   — Toggle between view and edit mode
 *   — React Hook Form + Zod validation in edit mode
 *   — Tags management same as CreateNotePage
 *   — Loading skeleton while note is fetching
 *   — Delete note with confirmation dialog
 *   — Snackbar on success and error
 *   — Back button navigates to /notes
 */

import { useState, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Skeleton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocalOffer as TagIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNote, useUpdateNote, useDeleteNote } from '../hooks/useNotes';
import { useSnackbar } from '../hooks/useSnackbar';
import type { NoteFormData } from '../types';

// ── Zod validation schema ────────────────────────────────────────────────────

const editNoteSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be under 100 characters'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be under 10,000 characters'),
  tags: z.array(z.string())
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * formatDate — converts ISO string to a readable date and time.
 * "2026-03-01T12:00:00.000Z" → "Mar 1, 2026, 12:00 PM"
 */
const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ── Component ────────────────────────────────────────────────────────────────

const NoteDetailPage = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  // ── State ──────────────────────────────────────────────────────────────────

  // Controls whether we are in view or edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Tags managed separately from RHF — same pattern as CreateNotePage
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Controls the delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data, isLoading, isError } = useNote(noteId ?? '');
  const updateNote = useUpdateNote(noteId ?? '');
  const deleteNote = useDeleteNote();

  // ── Form setup ─────────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<NoteFormData>({
    resolver: zodResolver(editNoteSchema),
    defaultValues: { title: '', content: '', tags: [] }
  });

  // ── Unsaved changes warning ────────────────────────────────────────────────

  /**
   * useBlocker intercepts in-app navigation (React Router link clicks,
   * navigate() calls) when the user has unsaved edits.
   * It gives us a chance to show a confirmation dialog before leaving.
   *
   * When blocker.state === 'blocked':
   *   blocker.proceed() — leave the page and discard changes
   *   blocker.reset()   — stay on the page and keep editing
   */
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isEditing && isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  /**
   * beforeunload — warns when the user tries to close/refresh the browser tab.
   * The browser shows its own generic confirmation dialog in this case.
   * We can't customize the message (browsers removed that for security reasons).
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing && isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing, isDirty]);

  /**
   * When note data loads, populate the form with existing values.
   * reset() is from React Hook Form — it's not a React setState call,
   * so calling it inside useEffect is fine with the linter.
   *
   * Tags are NOT synced here to avoid the "setState in effect" lint rule.
   * Instead, tags are initialized when the user clicks Edit (handleStartEditing).
   */
  useEffect(() => {
    if (data?.note) {
      reset({
        title: data.note.title,
        content: data.note.content,
        tags: data.note.tags
      });
    }
  }, [data?.note, reset]);

  // ── Tag handlers ───────────────────────────────────────────────────────────

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  // ── Edit mode handlers ─────────────────────────────────────────────────────

  /**
   * handleStartEditing — enters edit mode and initializes the tags array
   * from the note's current tags. Tags are managed separately from RHF
   * (because they're built up interactively), so we sync them here rather
   * than inside a useEffect (which would trigger the setState-in-effect rule).
   */
  const handleStartEditing = () => {
    setTags(data?.note?.tags ?? []);
    setIsEditing(true);
  };

  /**
   * handleCancelEdit — exits edit mode and resets form + tags back to
   * the original note values so unsaved changes are discarded.
   */
  const handleCancelEdit = () => {
    if (data?.note) {
      reset({
        title: data.note.title,
        content: data.note.content,
        tags: data.note.tags
      });
      setTags(data.note.tags);
    }
    setIsEditing(false);
  };

  // ── Submit handler ─────────────────────────────────────────────────────────

  const onSubmit = (formData: NoteFormData) => {
    updateNote.mutate(
      {
        title: formData.title,
        content: formData.content,
        tags
      },
      {
        onSuccess: () => {
          showSnackbar('Note updated successfully', 'success');
          setIsEditing(false);
        },
        onError: (err) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })
              ?.response?.data?.message ?? 'Failed to update note';
          showSnackbar(msg, 'error');
        }
      }
    );
  };

  // ── Delete handlers ────────────────────────────────────────────────────────

  const handleDeleteConfirm = () => {
    deleteNote.mutate(noteId ?? '', {
      onSuccess: () => {
        showSnackbar('Note deleted', 'success');
        navigate('/notes');
      },
      onError: () => {
        showSnackbar('Failed to delete note', 'error');
        setDeleteDialogOpen(false);
      }
    });
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Container maxWidth='md'>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Skeleton variant='circular' width={36} height={36} />
          <Skeleton variant='text' width={200} height={40} />
        </Box>
        <Card
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Skeleton variant='text' width='50%' height={40} sx={{ mb: 2 }} />
            <Skeleton variant='rectangular' height={200} sx={{ mb: 2 }} />
            <Skeleton variant='text' width='30%' />
          </CardContent>
        </Card>
      </Container>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (isError || !data?.note) {
    return (
      <Container maxWidth='md'>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color='error' gutterBottom>
            Note not found or failed to load
          </Typography>
          <Button variant='outlined' onClick={() => navigate('/notes')}>
            Back to notes
          </Button>
        </Box>
      </Container>
    );
  }

  const { note } = data;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Container maxWidth='md'>

      {/* ── Page header ──────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 4
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/notes')} size='small' aria-label='Back to notes'>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant='h5' fontWeight={700}>
            {isEditing ? 'Edit Note' : 'View Note'}
          </Typography>
        </Box>

        {/* Action buttons — differ between view and edit mode */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isEditing ? (
            <>
              {/* View mode — Edit and Delete buttons */}
              <Tooltip title='Edit note'>
                <IconButton
                  onClick={handleStartEditing}
                  color='primary'
                  aria-label='Edit note'
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title='Delete note'>
                <IconButton
                  onClick={() => setDeleteDialogOpen(true)}
                  color='error'
                  aria-label='Delete note'
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              {/* Edit mode — Cancel and Save buttons */}
              <Button
                variant='outlined'
                startIcon={<CloseIcon />}
                onClick={handleCancelEdit}
                disabled={updateNote.isPending}
              >
                Cancel
              </Button>
              <Button
                variant='contained'
                startIcon={
                  updateNote.isPending
                    ? <CircularProgress size={16} color='inherit' />
                    : <SaveIcon />
                }
                onClick={handleSubmit(onSubmit)}
                disabled={updateNote.isPending}
              >
                {updateNote.isPending ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* ── Note card ─────────────────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {isEditing ? (

            // ── Edit mode — form fields ──────────────────────────────
            <Box component='form' noValidate>

              {/* Title field */}
              <TextField
                {...register('title')}
                label='Title'
                autoFocus
                error={!!errors.title}
                helperText={errors.title?.message}
                sx={{ mb: 3 }}
              />

              {/* Content field */}
              <TextField
                {...register('content')}
                label='Content'
                multiline
                rows={12}
                error={!!errors.content}
                helperText={errors.content?.message}
                sx={{ mb: 3 }}
              />

              {/* Tags field */}
              <Box>
                <TextField
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={addTag}
                  label='Tags'
                  placeholder='Type a tag and press Enter...'
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <TagIcon fontSize='small' color='action' />
                      </InputAdornment>
                    )
                  }}
                  helperText='Press Enter or comma to add a tag. Max 10 tags.'
                />
                {tags.length > 0 && (
                  <Box
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}
                  >
                    {tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size='small'
                        onDelete={() => removeTag(tag)}
                        color='primary'
                        variant='outlined'
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>

          ) : (

            // ── View mode — read only display ────────────────────────
            <Box>

              {/* Title */}
              <Typography variant='h4' fontWeight={700} gutterBottom>
                {note.title}
              </Typography>

              {/* Dates */}
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Typography variant='caption' color='text.disabled'>
                  Created: {formatDate(note.createdAt)}
                </Typography>
                <Typography variant='caption' color='text.disabled'>
                  Updated: {formatDate(note.updatedAt)}
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Content */}
              <Typography
                variant='body1'
                sx={{
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap', // preserves line breaks
                  mb: 3
                }}
              >
                {note.content}
              </Typography>

              {/* Tags */}
              {note.tags.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {note.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size='small'
                      variant='outlined'
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Unsaved changes dialog ────────────────────────────────────────────
           Shown when the user tries to navigate away while editing with
           unsaved changes. blocker.state becomes 'blocked' when useBlocker
           intercepts a navigation attempt that matches its condition. */}
      <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()}>
        <DialogTitle fontWeight={600}>Unsaved changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. If you leave now, your edits will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => blocker.reset?.()}>Stay and keep editing</Button>
          <Button onClick={() => blocker.proceed?.()} color='warning' variant='contained'>
            Leave and discard
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete confirmation dialog ─────────────────────────────────────── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle fontWeight={600}>Delete note?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{note.title}"? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteNote.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color='error'
            variant='contained'
            disabled={deleteNote.isPending}
          >
            {deleteNote.isPending
              ? <CircularProgress size={20} color='inherit' />
              : 'Delete'
            }
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default NoteDetailPage;