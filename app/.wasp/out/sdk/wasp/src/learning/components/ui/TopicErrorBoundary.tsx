import React, { Component, ReactNode } from 'react';
import { ErrorBoundaryFallback } from './ErrorDisplay';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TopicErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TopicErrorBoundary caught an error:', error, errorInfo);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }
      
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          title="Topic Navigation Error"
        />
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function withTopicErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: (error: Error, retry: () => void) => ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <TopicErrorBoundary fallback={fallbackComponent}>
        <Component {...props} />
      </TopicErrorBoundary>
    );
  };
}