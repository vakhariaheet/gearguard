// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  RECENT_SEARCHES: 'recent_searches',
  DRAFT_DATA: 'draft_data',
} as const;

// Route Paths
export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  ADMIN: '/admin',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
} as const;

// File Upload Configuration
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: ['application/pdf', 'text/plain', 'application/msword'],
    ALL: ['image/*', 'application/pdf', 'text/*'],
  },
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  EMAIL_MAX_LENGTH: 254,
  PHONE_REGEX: /^\+?[\d\s\-()]{10,}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// Theme Configuration
export const THEME = {
  COLORS: {
    PRIMARY: '#3b82f6',
    SECONDARY: '#6b7280',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    INFO: '#3b82f6',
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px',
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
  INVALID_FILE_TYPE: 'Invalid file type.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVED: 'Changes saved successfully!',
  CREATED: 'Created successfully!',
  UPDATED: 'Updated successfully!',
  DELETED: 'Deleted successfully!',
  UPLOADED: 'File uploaded successfully!',
  EMAIL_SENT: 'Email sent successfully!',
} as const;
