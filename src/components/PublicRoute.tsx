/**
 * src/components/PublicRoute.tsx
 *
 * Route guard for public pages — pages only for unauthenticated users.
 *
 * How it works:
 *   — Checks if a token exists in the Zustand auth store
 *   — If NOT authenticated → renders the page (login, register)
 *   — If already authenticated → redirects to /notes
 *
 * This prevents a logged-in user from visiting /login or /register
 * and seeing forms they don't need. Instead they are sent straight
 * to their notes.
 *
 * Usage in App.tsx:
 *   <Route element={<PublicRoute />}>
 *     <Route path='/login' element={<LoginPage />} />
 *   </Route>
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const PublicRoute = () => {
  const { isAuthenticated } = useAuthStore();

  // If already logged in — redirect to notes
  // If not logged in — render the public page (login/register)
  return isAuthenticated()
    ? <Navigate to='/notes' replace />
    : <Outlet />;
};

export default PublicRoute;