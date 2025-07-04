// User related types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

// Presentation related types
export interface Presentation {
  id: number;
  title: string;
  url: string;
  uploaded_at: string;
  file_info?: {
    file_size?: number;
    file_exists?: boolean;
  };
  type?: 'past' | 'upcoming';
}

export interface UpcomingPresentation {
  id: number;
  title: string;
  scheduled_date: string;
  description?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

// Feedback related types
export interface FeedbackData {
  overview: {
    overallScore: number;
    analysisDate: string;
    videoDuration: string;
    focusAreas: string[];
  };
  speechAnalysis?: SpeechAnalysis;
  visualAnalysis?: VisualAnalysis;
  contentAnalysis?: ContentAnalysis;
  insights?: {
    keyTakeaways: string[];
    detailedInsights: any[];
    nextSteps: string[];
  };
  enhanced_feedback?: EnhancedFeedback;
  [key: string]: any;
}

export interface SpeechAnalysis {
  speechEmotion: AnalysisMetric;
  speakingRate: AnalysisMetric;
  pitchAnalysis: AnalysisMetric;
  fillerWords: AnalysisMetric;
  stutterDetection: AnalysisMetric;
}

export interface VisualAnalysis {
  facialEmotion: AnalysisMetric;
  eyeContact: AnalysisMetric;
  handGestures: AnalysisMetric;
  postureAnalysis: AnalysisMetric;
}

export interface ContentAnalysis {
  keywordRelevance: AnalysisMetric;
  lexicalRichness: AnalysisMetric;
  volumeConsistency: AnalysisMetric;
}

export interface AnalysisMetric {
  value: string | number;
  score: number;
  insight: string;
  recommendation?: string;
}

export interface EnhancedFeedback {
  overall_score?: number;
  summary?: {
    primary_focus_areas?: string[];
  };
  detailed_feedback?: {
    speech_feedback?: {
      specific_feedback?: Record<string, any>;
    };
    visual_feedback?: {
      specific_feedback?: Record<string, any>;
    };
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Component props types
export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
}

// Navigation types
export interface NavigationItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  active?: boolean;
} 