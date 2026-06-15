/**
 * Get the base URL for the application based on the environment
 *
 * Priority:
 * 1. NEXTAUTH_URL (explicitly set in .env)
 * 2. VERCEL_URL (automatically set by Vercel)
 * 3. http://localhost:3000 (local development fallback)
 */
export function getBaseUrl(): string {
  // 1. Check for explicitly set NEXTAUTH_URL
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // 2. Check for Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Fallback to localhost for development
  return "http://localhost:3000";
}
