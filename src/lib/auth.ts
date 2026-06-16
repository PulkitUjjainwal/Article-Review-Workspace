import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
}

/**
 * Validate email format with comprehensive checks
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  // Trim whitespace
  email = email.trim().toLowerCase();

  // Check length
  if (email.length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check for consecutive dots
  if (email.includes('..')) {
    return { valid: false, error: 'Email cannot contain consecutive dots' };
  }

  // Check for leading/trailing dots in local part
  const [localPart, domain] = email.split('@');
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check domain has at least one dot
  if (!domain.includes('.')) {
    return { valid: false, error: 'Email domain must have a valid extension' };
  }

  return { valid: true };
}
