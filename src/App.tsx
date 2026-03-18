/**
 * src/App.tsx
 *
 * Application router — built with createBrowserRouter (data router API).
 *
 * Why createBrowserRouter instead of <BrowserRouter>?
 *   useBlocker (used in CreateNotePage and NoteDetailPage for the unsaved-
 *   changes warning) only works inside a data router. Component-based routers
 *   like <BrowserRouter> do not support it.
 *
 * Route structure:
 *
 *   /                     → redirects to /notes
 *   PublicRoute           → only accessible when NOT logged in
 *     /login              → LoginPage
 *     /register           → RegisterPage
 *   ProtectedRoute        → only accessible when logged in
 *     Layout              → Navbar + page content wrapper
 *       /notes            → NotesPage
 *       /notes/new        → CreateNotePage
 *       /notes/:noteId    → NoteDetailPage
 *       /profile          → ProfilePage
 *   *                     → redirects to /notes (catch-all)
 *
 * Code splitting: all page components are loaded lazily so each route gets
 * its own JS chunk. Suspense renders a centered spinner while loading.
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Layout from './components/Layout';

// Pages loaded lazily — each becomes a separate JS chunk
const LoginPage      = lazy(() => import('./pages/LoginPage'));
const RegisterPage   = lazy(() => import('./pages/RegisterPage'));
const NotesPage      = lazy(() => import('./pages/NotesPage'));
const CreateNotePage = lazy(() => import('./pages/CreateNotePage'));
const NoteDetailPage = lazy(() => import('./pages/NoteDetailPage'));
const ProfilePage    = lazy(() => import('./pages/ProfilePage'));

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <CircularProgress />
  </Box>
);

// Wrap all routes in Suspense so lazy pages show a spinner while loading
const SuspenseOutlet = () => (
  <Suspense fallback={<PageLoader />}>
    <Outlet />
  </Suspense>
);

const router = createBrowserRouter([
  {
    element: <SuspenseOutlet />,
    children: [
      { path: '/', element: <Navigate to='/notes' replace /> },

      // Public routes — redirect to /notes if already logged in
      {
        element: <PublicRoute />,
        children: [
          { path: '/login',    element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> }
        ]
      },

      // Protected routes — redirect to /login if not authenticated
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <Layout />,
            children: [
              { path: '/notes',          element: <NotesPage /> },
              { path: '/notes/new',      element: <CreateNotePage /> },
              { path: '/notes/:noteId',  element: <NoteDetailPage /> },
              { path: '/profile',        element: <ProfilePage /> }
            ]
          }
        ]
      },

      { path: '*', element: <Navigate to='/notes' replace /> }
    ]
  }
]);

const App = () => <RouterProvider router={router} />;

export default App;