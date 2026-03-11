/**
 * src/components/ProtectedRoute.tsx
 *
 * Route guard for protected pages — pages that require authentication.
 *
 * How it works:
 *   — Checks if a token exists in the Zustand auth store
 *   — If authenticated → renders the requested page normally
 *   — If not authenticated → redirects to /login
 *
 * Usage in App.tsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path='/notes' element={<NotesPage />} />
 *   </Route>
 *
 * React Router's <Outlet /> is how nested routes render their content.
 * Think of it as a placeholder — React Router replaces it with
 * whichever child route matched the current URL.
 *
 * Express equivalent:
 *   router.get('/notes', authMiddleware, notesHandler)
 *   — ProtectedRoute is the authMiddleware for the frontend.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();

  // If not authenticated — redirect to login
  // replace={true} replaces the current history entry so the user
  // cannot press the back button to get back to the protected page
  return isAuthenticated()
    ? <Outlet />
    : <Navigate to='/login' replace />;
};

export default ProtectedRoute;