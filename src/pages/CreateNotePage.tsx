/**
 * src/pages/CreateNotePage.tsx
 *
 * Protected page — form to create a new note.
 *
 * Features:
 *   — React Hook Form + Zod validation
 *   — Title and content fields
 *   — Tags input — user types a tag and presses Enter or comma to add it
 *   — Tags displayed as MUI Chips with delete option
 *   — Loading state on submit button
 *   — Snackbar on error
 *   — Cancel button navigates back to /notes
 *   — On success, useCreateNote navigates to /notes automatically
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { KeyboardEvent } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocalOffer as TagIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCreateNote } from '../hooks/useNotes';
import { useSnackbar } from '../hooks/useSnackbar';
import type { NoteFormData } from '../types';

// ── Zod validation schema ────────────────────────────────────────────────────

const createNoteSchema = z.object({
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

// ── Component ────────────────────────────────────────────────────────────────

const CreateNotePage = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const createNote = useCreateNote();

  // Tags are managed separately from React Hook Form
  // because they are an array that gets built up interactively
  const [tags, setTags] = useState<string[]>([]);

  // The current value of the tag input field
  const [tagInput, setTagInput] = useState('');

  // ── Form setup ─────────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<NoteFormData>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: '',
      content: '',
      tags: []
    }
  });

  // ── Tag handlers ───────────────────────────────────────────────────────────

  /**
   * addTag — adds the current tagInput value to the tags array.
   * Trims whitespace, lowercases, and prevents duplicates.
   * Called when user presses Enter or comma in the tag input.
   */
  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  };

  /**
   * handleTagKeyDown — intercepts Enter and comma keypresses
   * in the tag input to trigger tag addition instead of form submission.
   */
  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      // Prevent Enter from submitting the form
      e.preventDefault();
      addTag();
    }
    // Backspace on empty input removes the last tag
    if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  // ── Submit handler ─────────────────────────────────────────────────────────

  const onSubmit = (data: NoteFormData) => {
    createNote.mutate(
      {
        title: data.title,
        content: data.content,
        tags
      },
      {
        onError: (err) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })
              ?.response?.data?.message ?? 'Failed to create note';
          showSnackbar(msg, 'error');
        }
      }
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Container maxWidth='md'>

      {/* ── Page header ──────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => navigate('/notes')} size='small'>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant='h4' fontWeight={700}>
            New Note
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Create a new note
          </Typography>
        </Box>
      </Box>

      {/* ── Form card ─────────────────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box
            component='form'
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >

            {/* Title field */}
            <TextField
              {...register('title')}
              label='Title'
              placeholder='Note title...'
              autoFocus
              error={!!errors.title}
              helperText={errors.title?.message}
              sx={{ mb: 3 }}
            />

            {/* Content field */}
            <TextField
              {...register('content')}
              label='Content'
              placeholder='Write your note here...'
              multiline
              rows={10}
              error={!!errors.content}
              helperText={errors.content?.message}
              sx={{ mb: 3 }}
            />

            {/* Tags field */}
            <Box sx={{ mb: 4 }}>

              {/* Tags input */}
              <TextField
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag} // add tag when input loses focus
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

              {/* Tag chips */}
              {tags.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    mt: 1.5
                  }}
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

            {/* ── Action buttons ──────────────────────────────────── */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant='outlined'
                onClick={() => navigate('/notes')}
                disabled={createNote.isPending}
              >
                Cancel
              </Button>

              <Button
                type='submit'
                variant='contained'
                disabled={createNote.isPending}
                sx={{ minWidth: 120 }}
              >
                {createNote.isPending
                  ? <CircularProgress size={22} color='inherit' />
                  : 'Create Note'
                }
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CreateNotePage;