/**
 * Get the base URL for the application based on the environment
 *
 * Priority:
 * 1. NEXTAUTH_URL (explicitly set in .env)
 * 2. VERCEL_URL (automatically set by Vercel)
 * 3. NEXT_PUBLIC_VERCEL_URL (Vercel public URL)
 * 4. Auto-detect from Vercel environment
 * 5. http://localhost:3000 (local development fallback)
 */
export function getBaseUrl(): string {
  // 1. Check for explicitly set NEXTAUTH_URL
  if (process.env.NEXTAUTH_URL) {
    console.log('[getBaseUrl] Using NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    return process.env.NEXTAUTH_URL;
  }

  // 2. Check for Vercel deployment URL
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`;
    console.log('[getBaseUrl] Using VERCEL_URL:', url);
    return url;
  }

  // 3. Check for public Vercel URL
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    const url = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    console.log('[getBaseUrl] Using NEXT_PUBLIC_VERCEL_URL:', url);
    return url;
  }

  // 4. Check if we're in Vercel environment (using Vercel-specific env vars)
  if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) {
    // We're on Vercel but VERCEL_URL isn't set (shouldn't happen)
    // Try to construct from project name
    const vercelProject = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (vercelProject) {
      const url = `https://${vercelProject}`;
      console.log('[getBaseUrl] Using VERCEL_PROJECT_PRODUCTION_URL:', url);
      return url;
    }
  }

  // 5. Fallback to localhost for development
  const fallback = "http://localhost:3000";
  console.log('[getBaseUrl] Using fallback:', fallback);
  console.log('[getBaseUrl] Available env vars:', {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
    VERCEL_URL: process.env.VERCEL_URL || 'not set',
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL || 'not set',
    VERCEL: process.env.VERCEL || 'not set',
    VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    NODE_ENV: process.env.NODE_ENV || 'not set',
  });
  return fallback;
}
