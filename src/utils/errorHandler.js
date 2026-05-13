// File: src/utils/errorHandler.js
// Purpose: Centralized error handling and user-friendly messages
// Makes error messages consistent across the app

/**
 * Parse error messages and make them user-friendly
 * 
 * @param {error} error - Error object from Supabase or JS
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  // If error is a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // Supabase Auth errors
  if (error?.message) {
    const msg = error.message.toLowerCase();

    if (msg.includes('invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Please confirm your email before logging in.';
    }
    if (msg.includes('user already registered')) {
      return 'An account with this email already exists.';
    }
    if (msg.includes('password')) {
      return 'Password must be at least 6 characters.';
    }
    if (msg.includes('email')) {
      return 'Please enter a valid email address.';
    }

    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Log error to console in development
 * 
 * @param {string} context - Where the error occurred
 * @param {error} error - Error object
 */
export const logError = (context, error) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error);
  }
};

/**
 * Handle API errors consistently
 * 
 * @param {error} error - Error from API call
 * @param {string} context - Context for logging
 * @returns {object} { success: false, error: message }
 */
export const handleApiError = (error, context = 'API Error') => {
  logError(context, error);
  return {
    success: false,
    error: getErrorMessage(error),
  };
};
