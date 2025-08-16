import { ANALYSIS_CONFIG } from '../constants';

// Date and Time utilities
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Score normalization
export const normalizeScore = (score: number | undefined | null): number => {
  if (typeof score !== 'number' || isNaN(score)) return 0;
  const { MAX_SCORE } = ANALYSIS_CONFIG.SCORE_NORMALIZATION;
  return score > MAX_SCORE 
    ? Math.round((score / MAX_SCORE) * MAX_SCORE) / 10 
    : Math.round(score * 10) / 10;
};

// File utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

// String utilities
export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Array utilities
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const uniqueArray = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

// Object utilities
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const isValidUsername = (username: string): boolean => {
  // 3-20 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Local Storage utilities
export const getFromStorage = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

export const setToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

export const removeFromStorage = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Color utilities
export const getScoreColor = (score: number): string => {
  if (score >= 8) return '#10B981'; // Green
  if (score >= 6) return '#F59E0B'; // Yellow
  if (score >= 4) return '#F97316'; // Orange
  return '#EF4444'; // Red
};

export const getScoreLabel = (score: number): string => {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Fair';
  return 'Needs Improvement';
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Error message generator for model-specific issues
export const getModelErrorInfo = (modelName: string): { message: string; tips: string[] } => {
  const errorInfo: { [key: string]: { message: string; tips: string[] } } = {
    'eye_contact': {
      message: "Eye contact analysis could not be completed due to insufficient face detection",
      tips: [
        "Ensure your face is clearly visible and well-lit",
        "Position yourself closer to the camera (within 2-3 feet)",
        "Avoid wearing glasses that reflect light or sunglasses",
        "Make sure your face is centered in the frame",
        "Record in a well-lit environment with even lighting"
      ]
    },
    'facial_emotion': {
      message: "Facial emotion analysis could not be completed due to insufficient face detection",
      tips: [
        "Ensure your face is clearly visible and well-lit",
        "Position yourself closer to the camera (within 2-3 feet)",
        "Avoid wearing face coverings or large accessories",
        "Make sure your face is centered and not cut off",
        "Record in a well-lit environment with natural lighting"
      ]
    },
    'hand_gesture': {
      message: "Hand gesture analysis could not be completed due to insufficient hand detection",
      tips: [
        "Ensure your hands are visible in the frame",
        "Use natural hand movements during your presentation",
        "Avoid keeping hands in pockets or behind your back",
        "Position camera to capture your upper body and arms",
        "Use gestures to emphasize key points in your speech"
      ]
    },
    'posture_analysis': {
      message: "Posture analysis could not be completed due to insufficient body detection",
      tips: [
        "Ensure your full upper body is visible in the frame",
        "Sit or stand straight with shoulders back",
        "Position camera to capture from waist up",
        "Avoid slouching or leaning too far forward",
        "Maintain good posture throughout the presentation"
      ]
    },
    'speech_emotion': {
      message: "Speech emotion analysis could not be completed due to insufficient audio quality",
      tips: [
        "Speak clearly and at a moderate pace",
        "Use a good quality microphone if available",
        "Record in a quiet environment with minimal background noise",
        "Ensure your voice is clearly audible",
        "Avoid speaking too softly or too loudly"
      ]
    },
    'pitch_analysis': {
      message: "Pitch analysis could not be completed due to insufficient audio quality",
      tips: [
        "Speak clearly and at a moderate pace",
        "Use a good quality microphone if available",
        "Record in a quiet environment with minimal background noise",
        "Vary your pitch naturally during speech",
        "Avoid speaking in a monotone voice"
      ]
    },
    'volume_consistency': {
      message: "Volume consistency analysis could not be completed due to insufficient audio quality",
      tips: [
        "Maintain consistent volume throughout your presentation",
        "Use a good quality microphone if available",
        "Record in a quiet environment with minimal background noise",
        "Practice speaking at a steady, audible level",
        "Avoid sudden volume changes or whispering"
      ]
    },
    'wpm_analysis': {
      message: "Speaking rate analysis could not be completed due to insufficient audio quality",
      tips: [
        "Speak clearly and at a moderate pace",
        "Use a good quality microphone if available",
        "Record in a quiet environment with minimal background noise",
        "Practice speaking at 150-160 words per minute",
        "Include natural pauses between sentences"
      ]
    },
    'filler_detection': {
      message: "Filler word analysis could not be completed due to insufficient audio quality",
      tips: [
        "Speak clearly and at a moderate pace",
        "Use a good quality microphone if available",
        "Record in a quiet environment with minimal background noise",
        "Practice avoiding filler words like 'um', 'uh', 'like'",
        "Take brief pauses instead of using filler words"
      ]
    },
    'stutter_detection': {
      message: "Fluency analysis could not be completed due to insufficient audio quality",
      tips: [
        "Speak clearly and at a moderate pace",
        "Use a good quality microphone if available",
        "Record in a quiet environment with minimal background noise",
        "Practice speaking slowly and deliberately",
        "Take deep breaths and pause when needed"
      ]
    },
    'lexical_richness': {
      message: "Vocabulary analysis could not be completed due to insufficient transcription",
      tips: [
        "Speak clearly and enunciate your words",
        "Use a good quality microphone if available",
        "Record in a quiet environment with minimal background noise",
        "Use varied and appropriate vocabulary for your topic",
        "Ensure your speech is long enough for analysis (at least 30 seconds)"
      ]
    },
    'keyword_relevance': {
      message: "Content relevance analysis could not be completed due to insufficient transcription",
      tips: [
        "Speak clearly and enunciate your words",
        "Use a good quality microphone if available",
        "Record in a quiet environment with minimal background noise",
        "Stay focused on your main topic and key points",
        "Use relevant keywords and terminology for your subject"
      ]
    },
    'confidence_detector': {
      message: "Confidence analysis could not be completed due to insufficient data",
      tips: [
        "Speak clearly and with conviction",
        "Use a good quality microphone if available",
        "Record in a quiet environment with minimal background noise",
        "Maintain good posture and eye contact",
        "Practice your presentation to build confidence"
      ]
    }
  };

  // Get specific error info or return default
  const specificInfo = errorInfo[modelName.toLowerCase()];
  if (specificInfo) {
    return specificInfo;
  }

  // Default error message for unknown models
  return {
    message: "Analysis could not be completed due to insufficient data",
    tips: [
      "Ensure good audio and video quality",
      "Speak clearly and at a moderate pace",
      "Position yourself properly in the frame",
      "Record in a well-lit, quiet environment",
      "Use appropriate equipment (microphone, camera)"
    ]
  };
}; 