/**
 * Password validation utility (frontend)
 * Matches backend validation rules
 */

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

/**
 * Validates a password according to security requirements
 * @param password - The password to validate
 * @returns Validation result with errors array
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password) {
    return {
      valid: false,
      errors: ['Password is required']
    };
  }

  // Check minimum length
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  // Check maximum length (prevent DoS attacks)
  if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Password must be no more than ${MAX_PASSWORD_LENGTH} characters long`);
  }

  // Check for common weak passwords (basic check)
  const commonWeakPasswords = [
    'password',
    'password123',
    '12345678',
    'qwerty123',
    'admin123',
    'letmein',
    'welcome123'
  ];
  if (commonWeakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Gets a user-friendly error message for password validation
 * @param validationResult - The result from validatePassword
 * @returns First error message or null if valid
 */
export function getPasswordErrorMessage(validationResult: PasswordValidationResult): string | null {
  if (validationResult.valid) {
    return null;
  }
  return validationResult.errors[0] || 'Password does not meet requirements';
}

