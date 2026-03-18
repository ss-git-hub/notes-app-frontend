/**
 * src/components/Navbar.tsx
 *
 * Top navigation bar — visible on all protected pages.
 *
 * Features:
 *   — App title/logo on the left — links to /notes
 *   — "New Note" button for quick access to create page
 *   — User avatar with dropdown menu on the right
 *   — Dropdown contains: Profile, Logout
 *   — Shows the logged-in user's name and email in the dropdown
 *   — useLogout hook clears auth and redirects to /login on logout
 */

import { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useAuth';

const Navbar = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { logout } = useLogout();

  // Controls whether the user dropdown menu is open
  // anchorEl is the DOM element the menu is anchored to (the avatar button)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  // ── Menu handlers ──────────────────────────────────────────────────────────

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  // ── Avatar helpers ─────────────────────────────────────────────────────────

  /**
   * getInitials — extracts initials from the user's name for the Avatar.
   * "John Doe" → "JD", "Alice" → "A"
   */
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2); // max 2 characters
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppBar
      position='sticky'
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>

        {/* ── Left — App title ───────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/notes')}
        >
          <NotesIcon color='primary' />
          <Typography variant='h6' fontWeight={700} color='primary'>
            Notes App
          </Typography>
        </Box>

        {/* ── Right — Actions ────────────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

          {/* New Note button */}
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            size='small'
            onClick={() => navigate('/notes/new')}
          >
            New Note
          </Button>

          {/* User avatar — opens dropdown menu on click */}
          <Tooltip title='Account menu'>
            <IconButton
              onClick={handleMenuOpen}
              size='small'
              aria-label='Open account menu'
              aria-controls={menuOpen ? 'account-menu' : undefined}
              aria-haspopup='true'
              aria-expanded={menuOpen ? 'true' : undefined}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                {user?.name ? getInitials(user.name) : <PersonIcon />}
              </Avatar>
            </IconButton>
          </Tooltip>

        </Box>
      </Toolbar>

      {/* ── User dropdown menu ─────────────────────────────────────────────── */}
      <Menu
        id='account-menu'
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 2,
            sx: { mt: 1, minWidth: 200 }
          }
        }}
      >
        {/* User info at top of menu — not clickable */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant='subtitle2' fontWeight={600} noWrap>
            {user?.name}
          </Typography>
          <Typography variant='caption' color='text.secondary' noWrap>
            {user?.email}
          </Typography>
        </Box>

        <Divider />

        {/* Profile */}
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <PersonIcon fontSize='small' />
          </ListItemIcon>
          Profile
        </MenuItem>

        {/* Logout */}
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize='small' color='error' />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Navbar;