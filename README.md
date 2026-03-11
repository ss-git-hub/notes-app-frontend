# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# Notes App — Frontend

React frontend for the Notes App serverless backend.

## Tech Stack

| Tool | Purpose |
|------|---------|
| Vite + React + TypeScript | Project foundation |
| Material UI | UI components and theming |
| TanStack Query | API calls and caching |
| Zustand | Auth state and JWT token |
| Axios | HTTP client |
| React Hook Form + Zod | Forms and validation |
| React Router v6 | Navigation and route protection |

## Project Structure
```
src/
  api/          — Axios instance and API call functions
  components/   — Reusable UI components (Layout, Navbar, route guards)
  hooks/        — TanStack Query hooks and custom hooks
  lib/          — MUI theme, Snackbar context and provider
  pages/        — Full page components
  store/        — Zustand auth store
  types/        — TypeScript interfaces
```

## Pages

| Page | Path | Auth |
|------|------|------|
| Login | /login | Public |
| Register | /register | Public |
| Notes List | /notes | Protected |
| Create Note | /notes/new | Protected |
| Note Detail / Edit | /notes/:noteId | Protected |
| Profile | /profile | Protected |

## Getting Started

1. Install dependencies:
```bash
   npm install
```

2. Create a `.env` file:
```bash
   cp .env.example .env
```
   Fill in `VITE_API_URL` with your API Gateway URL.

3. Start the dev server:
```bash
   npm run dev
```

4. Build for production:
```bash
   npm run build
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API Gateway base URL from Serverless deployment |

## Auth Flow

- Login returns a JWT token stored in Zustand + localStorage via persist middleware
- Token is automatically attached to every request via Axios request interceptor
- Token expires after 7 days — Axios response interceptor clears auth and redirects to /login on 401
- 401 from `/users/login` is excluded from the redirect (wrong credentials, not expired token)
```

---

**Final folder structure check** — your `src/` should look like this:
```
src/
  api/
    axios.ts
    auth.ts
    notes.ts
  components/
    Layout.tsx
    Navbar.tsx
    ProtectedRoute.tsx
    PublicRoute.tsx
  hooks/
    useAuth.ts
    useNotes.ts
    useSnackbar.ts
  lib/
    SnackbarContext.ts
    SnackbarProvider.tsx
    theme.ts
  pages/
    LoginPage.tsx
    RegisterPage.tsx
    NotesPage.tsx
    CreateNotePage.tsx
    NoteDetailPage.tsx
    ProfilePage.tsx
  store/
    authStore.ts
  types/
    index.ts
  App.tsx
  main.tsx
  index.css
```

---

**Final end-to-end test checklist:**

Go through each of these manually:
```
Auth
  ✅ Register a new user
  ✅ Login with wrong password — error snackbar appears
  ✅ Login with correct credentials — redirects to /notes
  ✅ Refresh page — stays logged in (Zustand persist)
  ✅ Logout — clears session, redirects to /login
  ✅ Visit /notes when logged out — redirects to /login
  ✅ Visit /login when logged in — redirects to /notes

Notes
  ✅ Notes list loads with all notes
  ✅ Empty state shows when no notes exist
  ✅ Create a note — appears in the list
  ✅ Click a note — opens view mode
  ✅ Edit a note — saves and shows success snackbar
  ✅ Cancel edit — discards changes
  ✅ Delete from list — removes card with snackbar
  ✅ Delete from detail page — dialog confirms, navigates to /notes

Profile
  ✅ Profile page shows current name and email
  ✅ Update name — Navbar avatar initials update immediately
  ✅ Change password with wrong current password — error snackbar
  ✅ Change password correctly — success snackbar, form clears
