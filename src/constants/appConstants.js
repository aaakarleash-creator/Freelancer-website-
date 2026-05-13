// File: src/constants/appConstants.js
// Purpose: Centralized constants used throughout the app
// Makes it easy to change values in one place

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  FREELANCER: 'freelancer',
};

// User statuses
export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
};

// Lead statuses
export const LEAD_STATUS = {
  PENDING: 'pending',
  FOLLOW_UP: 'follow-up',
  CONVERTED: 'converted',
  REJECTED: 'rejected',
};

// Payout statuses
export const PAYOUT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REJECTED: 'rejected',
};

// Commission rates (in percentage)
export const COMMISSION_RATES = {
  BASE: 10,        // 10% for regular users
  PREMIUM: 15,     // 15% for top performers (10+ conversions)
  PREMIUM_THRESHOLD: 10, // Need 10+ conversions for premium rate
};

// Validation rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PHONE_PATTERN: /^[\d\s\-\+\(\)]{10,}$/,
};

// Pagination
export const PAGINATION = {
  LEADS_PER_PAGE: 20,
  USERS_PER_PAGE: 50,
  TRANSACTIONS_PER_PAGE: 30,
};

// API response messages
export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Logged in successfully',
    SIGNUP: 'Account created successfully',
    LOGOUT: 'Logged out successfully',
    LEAD_ADDED: 'Lead added successfully',
    LEAD_UPDATED: 'Lead updated successfully',
    LEAD_DELETED: 'Lead deleted successfully',
    USER_SUSPENDED: 'User suspended successfully',
    USER_ACTIVATED: 'User activated successfully',
  },
  ERROR: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    ACCOUNT_SUSPENDED: 'Your account has been suspended',
    UNAUTHORIZED: 'You do not have permission to access this',
    NETWORK_ERROR: 'Network error. Please try again.',
    UNKNOWN_ERROR: 'An unexpected error occurred',
  },
};
