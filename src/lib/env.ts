/**
 * src/lib/env.ts
 *
 * Environment variable validation — called once at application startup.
 *
 * Why validate environment variables?
 *   Vite replaces import.meta.env.VITE_* values at build time.
 *   If a variable is missing the value is undefined, which causes hard-to-debug
 *   runtime failures (e.g. axios calls to "undefined/users/login").
 *   Validating upfront gives a clear, actionable error message instead.
 *
 * Usage:
 *   import { validateEnv } from './lib/env';
 *   validateEnv(); // call before rendering the app
 *
 * To add a new required variable:
 *   1. Add it to REQUIRED_ENV_VARS below
 *   2. Add it to .env and .env.example
 */

const REQUIRED_ENV_VARS = ['VITE_API_URL'] as const;

/**
 * validateEnv — checks that all required VITE_ environment variables are set.
 * Throws a descriptive error if any are missing so the developer sees it
 * immediately rather than encountering a cryptic network failure.
 */
export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Create a .env file at the project root. See .env.example for reference.\n' +
      'Example: VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev'
    );
  }
}
