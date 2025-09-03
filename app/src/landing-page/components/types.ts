// TypeScript interfaces for landing page components

export interface HeroSectionProps {
  onTopicSubmit: (topic: string) => Promise<void>;
  isLoading?: boolean;
}

export interface InputCardProps {
  onSubmit: (topic: string) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
}

export interface IntroductionSectionProps {
  className?: string;
}

export interface FeaturesSectionProps {
  className?: string;
}

export interface FAQSectionProps {
  className?: string;
}

export interface FooterSectionProps {
  className?: string;
}

// Data models
export interface HeroTitle {
  id: string;
  text: string;
  weight?: number; // For weighted randomization
}

export interface Feature {
  id: string;
  icon: string; // Icon component name or path
  title: string;
  description: string;
  category: 'core' | 'advanced' | 'integration';
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'features' | 'pricing' | 'technical';
}

export interface FooterLink {
  id: string;
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterSection {
  id: string;
  title: string;
  links: FooterLink[];
}

// Input validation types
export interface InputValidation {
  isValid: boolean;
  error?: string;
  minLength: number;
  maxLength: number;
  warnings?: string[];
}

// Error types for better error handling
export interface FormError {
  type: 'validation' | 'network' | 'server' | 'unknown';
  message: string;
  retryable: boolean;
  details?: string;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
  stage?: 'validating' | 'submitting' | 'processing' | 'complete';
}

// Enhanced input card props
export interface InputCardProps {
  onSubmit: (topic: string) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
  maxRetries?: number;
  showCharacterCount?: boolean;
  showValidationHints?: boolean;
}