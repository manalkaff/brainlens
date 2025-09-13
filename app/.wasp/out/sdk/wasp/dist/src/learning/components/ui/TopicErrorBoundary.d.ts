import React, { Component, ReactNode } from 'react';
interface Props {
    children: ReactNode;
    fallback?: (error: Error, retry: () => void) => ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}
interface State {
    hasError: boolean;
    error: Error | null;
}
export declare class TopicErrorBoundary extends Component<Props, State> {
    constructor(props: Props);
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    handleRetry: () => void;
    render(): string | number | boolean | React.JSX.Element | Iterable<React.ReactNode> | null | undefined;
}
export declare function withTopicErrorBoundary<P extends object>(Component: React.ComponentType<P>, fallbackComponent?: (error: Error, retry: () => void) => ReactNode): (props: P) => React.JSX.Element;
export {};
//# sourceMappingURL=TopicErrorBoundary.d.ts.map