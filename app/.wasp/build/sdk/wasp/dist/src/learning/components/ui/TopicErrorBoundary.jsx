import React, { Component } from 'react';
import { ErrorBoundaryFallback } from './ErrorDisplay';
export class TopicErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
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
            return (<ErrorBoundaryFallback error={this.state.error} onRetry={this.handleRetry} title="Topic Navigation Error"/>);
        }
        return this.props.children;
    }
}
// Hook version for functional components
export function withTopicErrorBoundary(Component, fallbackComponent) {
    return function WrappedComponent(props) {
        return (<TopicErrorBoundary fallback={fallbackComponent}>
        <Component {...props}/>
      </TopicErrorBoundary>);
    };
}
//# sourceMappingURL=TopicErrorBoundary.jsx.map