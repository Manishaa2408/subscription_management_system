/**
 * Validates password rules according to specification:
 * - More than 8 characters (min 9)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one special character
 */
const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required'
    };
  }

  if (password.length <= 8) {
    return {
      isValid: false,
      message: 'Password must contain more than 8 characters'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character'
    };
  }

  return {
    isValid: true,
    message: 'Password meets all security criteria'
  };
};

module.exports = {
  validatePasswordStrength
};
