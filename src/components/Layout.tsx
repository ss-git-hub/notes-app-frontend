/**
 * src/components/Layout.tsx
 *
 * The main layout wrapper for all protected pages.
 *
 * Responsibilities:
 *   — Renders the Navbar at the top
 *   — Renders the page content below it via <Outlet />
 *   — Provides consistent page padding and background
 *
 * All protected routes in App.tsx will be wrapped with this layout.
 * We'll update App.tsx after this step to nest protected routes inside it.
 *
 * Structure:
 *   <Layout>
 *     <Navbar />
 *     <main>
 *       <Outlet />   ← current page renders here
 *     </main>
 *   </Layout>
 */

import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default'
      }}
    >
      {/* Top navigation bar */}
      <Navbar />

      {/* Page content area */}
      {/* flexGrow: 1 makes this section fill the remaining vertical space */}
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          py: 4,
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        {/* React Router renders the matched child route here */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;