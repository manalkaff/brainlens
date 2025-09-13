import React from 'react';
import type { TopicError } from '../../hooks/useTopicErrorHandler';
interface ErrorDisplayProps {
    error: TopicError;
    onRetry?: () => void;
    onDismiss?: () => void;
    isRetrying?: boolean;
    compact?: boolean;
}
export declare function ErrorDisplay({ error, onRetry, onDismiss, isRetrying, compact }: ErrorDisplayProps): React.JSX.Element;
interface ErrorBoundaryFallbackProps {
    error: Error;
    onRetry?: () => void;
    title?: string;
}
export declare function ErrorBoundaryFallback({ error, onRetry, title }: ErrorBoundaryFallbackProps): React.JSX.Element;
interface InlineErrorProps {
    message: string;
    onRetry?: () => void;
    isRetrying?: boolean;
}
export declare function InlineError({ message, onRetry, isRetrying }: InlineErrorProps): React.JSX.Element;
export {};
//# sourceMappingURL=ErrorDisplay.d.ts.map