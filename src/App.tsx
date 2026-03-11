/**
 * src/App.tsx
 *
 * Root component — defines all application routes.
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
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotesPage from './pages/NotesPage';
import CreateNotePage from './pages/CreateNotePage';
import NoteDetailPage from './pages/NoteDetailPage';
import ProfilePage from './pages/ProfilePage';

const App = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path='/' element={<Navigate to='/notes' replace />} />

      {/* ── Public routes ──────────────────────────────────────── */}
      <Route element={<PublicRoute />}>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
      </Route>

      {/* ── Protected routes ───────────────────────────────────── */}
      {/* ProtectedRoute checks auth, Layout renders Navbar + content */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path='/notes' element={<NotesPage />} />
          <Route path='/notes/new' element={<CreateNotePage />} />
          <Route path='/notes/:noteId' element={<NoteDetailPage />} />
          <Route path='/profile' element={<ProfilePage />} />
        </Route>
      </Route>

      {/* ── Catch-all ──────────────────────────────────────────── */}
      <Route path='*' element={<Navigate to='/notes' replace />} />
    </Routes>
  );
};

export default App;