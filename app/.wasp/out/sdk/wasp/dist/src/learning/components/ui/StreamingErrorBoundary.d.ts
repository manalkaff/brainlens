import React, { Component, ReactNode } from 'react';
import { LearningPlatformError, ErrorType } from '../../errors/errorTypes';
interface StreamingErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onRetry?: () => void;
    onReset?: () => void;
    showDetails?: boolean;
    className?: string;
}
interface StreamingErrorBoundaryState {
    hasError: boolean;
    error: LearningPlatformError | null;
    errorInfo: any;
    retryCount: number;
    isRetrying: boolean;
    lastErrorTime: number;
}
export { ErrorType as StreamingErrorType } from '../../errors/errorTypes';
declare class StreamingErrorBoundary extends Component<StreamingErrorBoundaryProps, StreamingErrorBoundaryState> {
    private retryTimeoutId;
    constructor(props: StreamingErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): Partial<StreamingErrorBoundaryState>;
    componentDidCatch(error: Error, errorInfo: any): void;
    componentWillUnmount(): void;
    handleRetry: () => void;
    handleReset: () => void;
    getErrorIcon: (errorType: ErrorType) => React.JSX.Element;
    getErrorMessage: (error: LearningPlatformError) => string;
    getErrorSuggestions: (error: LearningPlatformError) => string[];
    render(): string | number | boolean | React.JSX.Element | Iterable<React.ReactNode> | null | undefined;
}
export default StreamingErrorBoundary;
//# sourceMappingURL=StreamingErrorBoundary.d.ts.map