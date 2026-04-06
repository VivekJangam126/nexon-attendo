/**
 * Password Validation Utility
 * Enforces strong password requirements:
 * - Minimum 8 characters, maximum 16 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 special character (!@#$%^&*)
 * - At least 1 number (0-9)
 */

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
  requirements: {
    minLength: boolean;
    maxLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    specialChar: boolean;
    number: boolean;
  };
}

const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 16,
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  SPECIAL_CHAR: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
  NUMBER: /[0-9]/,
};

export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];
  
  const requirements = {
    minLength: password.length >= PASSWORD_RULES.MIN_LENGTH,
    maxLength: password.length <= PASSWORD_RULES.MAX_LENGTH,
    uppercase: PASSWORD_RULES.UPPERCASE.test(password),
    lowercase: PASSWORD_RULES.LOWERCASE.test(password),
    specialChar: PASSWORD_RULES.SPECIAL_CHAR.test(password),
    number: PASSWORD_RULES.NUMBER.test(password),
  };

  if (!requirements.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.MIN_LENGTH} characters long`);
  }

  if (!requirements.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_RULES.MAX_LENGTH} characters`);
  }

  if (!requirements.uppercase) {
    errors.push("Password must contain at least 1 uppercase letter (A-Z)");
  }

  if (!requirements.lowercase) {
    errors.push("Password must contain at least 1 lowercase letter (a-z)");
  }

  if (!requirements.specialChar) {
    errors.push("Password must contain at least 1 special character (!@#$%^&*)");
  }

  if (!requirements.number) {
    errors.push("Password must contain at least 1 number (0-9)");
  }

  // Calculate strength
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  if (metRequirements >= 6) strength = 'strong';
  else if (metRequirements >= 5) strength = 'good';
  else if (metRequirements >= 3) strength = 'fair';

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    requirements,
  };
};

export const getPasswordStrengthColor = (strength: string): string => {
  switch (strength) {
    case 'strong':
      return 'bg-green-500';
    case 'good':
      return 'bg-blue-500';
    case 'fair':
      return 'bg-yellow-500';
    default:
      return 'bg-red-500';
  }
};

export const getPasswordStrengthLabel = (strength: string): string => {
  switch (strength) {
    case 'strong':
      return 'Strong';
    case 'good':
      return 'Good';
    case 'fair':
      return 'Fair';
    default:
      return 'Weak';
  }
};
