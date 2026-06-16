/**
 * Secure logging utility
 * Only logs in development environment to prevent sensitive data exposure in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log general information (safe in production)
   */
  info: (...args: any[]) => {
    console.log('[INFO]', ...args);
  },

  /**
   * Log warnings (safe in production)
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Log errors (safe in production)
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Debug logging - ONLY in development
   * Use this for sensitive information like URLs, tokens, emails
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log sensitive data with masking - ONLY in development
   */
  sensitive: (label: string, data: any) => {
    if (isDevelopment) {
      console.log(`[SENSITIVE] ${label}:`, data);
    }
  },
};
