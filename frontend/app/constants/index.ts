// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      VERIFY_OTP: '/auth/verify-otp',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      SEND_VERIFICATION_OTP: '/auth/send-verification-otp',
      RESTORE_ACCOUNT: '/auth/restore-account',
      RESTORE_ACCOUNT_OTP: '/auth/restore-account-otp',
    },
    USER: {
      PROFILE: '/users/profile',
      UPDATE: '/users/update',
      DELETE: '/users/delete',
    },
    PRESENTATIONS: {
      LIST: '/presentations',
      DETAIL: (id: number) => `/presentations/${id}`,
      UPLOAD: '/presentations/upload',
      DELETE: (id: number) => `/presentations/${id}`,
    },
    FEEDBACK: {
      GET: (presentationId: number) => `/feedback/presentation/${presentationId}/feedback`,
    },
    UPCOMING_PRESENTATIONS: {
      LIST: '/upcoming-presentations',
      CREATE: '/upcoming-presentations',
      UPDATE: (id: number) => `/upcoming-presentations/${id}`,
      DELETE: (id: number) => `/upcoming-presentations/${id}`,
    },
  },
} as const;

// Application Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/Login',
  SIGNUP: '/SignUp',
  DASHBOARD: '/Dashboard',
  FEEDBACK: '/Feedback',
  PROFILE: '/ProfileInfo',
  SUBMITTED_TRIALS: '/SubmittedTrials',
  CALENDAR: '/Calendar',
  RECORD: '/Record',
  UPLOAD: '/Upload',
  UPLOAD_RECORD: '/UploadRecordVideos',
  FORGOT_PASSWORD: '/ForgotPassword',
  RESET_PASSWORD: '/ResetPassword',
  OTP_VERIFICATION: '/OTPVerifcation',
  PASSWORD_RESET_OTP: '/PasswordResetOTP',
  RESTORE_ACCOUNT: '/RestoreAccount',
  RESTORE_ACCOUNT_OTP: '/RestoreAccountOTP',
  CHANGE_PASSWORD: '/ChangePassword',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  PRESENTATION_ID: 'presentationId',
  FEEDBACK_DATA: 'feedbackData',
} as const;

// UI Constants
export const UI = {
  COLORS: {
    PRIMARY: '#9966FF',
    SECONDARY: '#F0C419',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#3B82F6',
    BACKGROUND: '#F8FAFC',
    SURFACE: '#FFFFFF',
    TEXT_PRIMARY: '#1F2937',
    TEXT_SECONDARY: '#6B7280',
    BORDER: '#E5E7EB',
  },
  SPACING: {
    XS: '0.25rem',
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
    XL: '2rem',
    XXL: '3rem',
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    XXL: '1536px',
  },
  BORDER_RADIUS: {
    SM: '0.25rem',
    MD: '0.375rem',
    LG: '0.5rem',
    XL: '0.75rem',
    FULL: '9999px',
  },
} as const;

// Navigation Items
export const NAVIGATION_ITEMS = [
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: 'dashboard',
  },
  {
    label: 'Record',
    path: ROUTES.RECORD,
    icon: 'record',
  },
  {
    label: 'Upload',
    path: ROUTES.UPLOAD,
    icon: 'upload',
  },
  {
    label: 'Submitted Trials',
    path: ROUTES.SUBMITTED_TRIALS,
    icon: 'trials',
  },
  {
    label: 'Calendar',
    path: ROUTES.CALENDAR,
    icon: 'calendar',
  },
] as const;

// Error Messages
export const ERROR_MESSAGES = {
  AUTHENTICATION_EXPIRED: 'Authentication expired. Please log in again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a valid video file.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  REGISTRATION_SUCCESS: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PRESENTATION_UPLOADED: 'Presentation uploaded successfully!',
  PRESENTATION_DELETED: 'Presentation deleted successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  EMAIL_SENT: 'Email sent successfully!',
} as const;

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_TYPES: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
  MAX_DURATION: 300, // 5 minutes in seconds
} as const;

// Analysis Configuration
export const ANALYSIS_CONFIG = {
  SCORE_NORMALIZATION: {
    MAX_SCORE: 10,
    MIN_SCORE: 0,
  },
  FOCUS_AREAS: {
    SPEECH: 'Speech & Voice',
    VISUAL: 'Visual Presentation',
    CONTENT: 'Content & Delivery',
    BODY_LANGUAGE: 'Body Language',
  },
} as const; 