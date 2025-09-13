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
export interface HeroTitle {
    id: string;
    text: string;
    weight?: number;
}
export interface Feature {
    id: string;
    icon: string;
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
export interface InputValidation {
    isValid: boolean;
    error?: string;
    minLength: number;
    maxLength: number;
    warnings?: string[];
}
export interface FormError {
    type: 'validation' | 'network' | 'server' | 'unknown';
    message: string;
    retryable: boolean;
    details?: string;
}
export interface LoadingState {
    isLoading: boolean;
    message?: string;
    progress?: number;
    stage?: 'validating' | 'submitting' | 'processing' | 'complete';
}
export interface InputCardProps {
    onSubmit: (topic: string) => Promise<void>;
    isLoading?: boolean;
    placeholder?: string;
    maxRetries?: number;
    showCharacterCount?: boolean;
    showValidationHints?: boolean;
}
//# sourceMappingURL=types.d.ts.map