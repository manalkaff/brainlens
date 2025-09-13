import React, { Component } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { AlertTriangle, RefreshCw, Bug, WifiOff, Shield, Clock, Zap } from 'lucide-react';
import { classifyError, logError, isLearningPlatformError, ErrorType, ErrorSeverity } from '../../errors/errorTypes';
// Re-export error types for backward compatibility
export { ErrorType as StreamingErrorType } from '../../errors/errorTypes';
class StreamingErrorBoundary extends Component {
    retryTimeoutId = null;
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0,
            isRetrying: false,
            lastErrorTime: 0
        };
    }
    static getDerivedStateFromError(error) {
        const learningError = isLearningPlatformError(error) ? error : classifyError(error);
        return {
            hasError: true,
            error: learningError,
            lastErrorTime: Date.now()
        };
    }
    componentDidCatch(error, errorInfo) {
        const learningError = isLearningPlatformError(error) ? error : classifyError(error);
        // Log the error with context
        logError(learningError, {
            component: 'StreamingErrorBoundary',
            errorInfo,
            retryCount: this.state.retryCount
        });
        this.setState({
            errorInfo
        });
    }
    componentWillUnmount() {
        if (this.retryTimeoutId) {
            clearTimeout(this.retryTimeoutId);
        }
    }
    handleRetry = () => {
        const { error, retryCount } = this.state;
        if (!error?.recoverable || retryCount >= 3) {
            return;
        }
        this.setState({ isRetrying: true });
        const retryDelay = error.retryAfter || 3000;
        this.retryTimeoutId = setTimeout(() => {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                retryCount: retryCount + 1,
                isRetrying: false,
                lastErrorTime: 0
            });
            this.props.onRetry?.();
        }, retryDelay);
    };
    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0,
            isRetrying: false,
            lastErrorTime: 0
        });
        this.props.onReset?.();
    };
    getErrorIcon = (errorType) => {
        switch (errorType) {
            case ErrorType.NETWORK_ERROR:
            case ErrorType.CONNECTION_ERROR:
                return <WifiOff className="w-5 h-5 text-red-500"/>;
            case ErrorType.TIMEOUT_ERROR:
                return <Clock className="w-5 h-5 text-yellow-500"/>;
            case ErrorType.AUTHENTICATION_ERROR:
            case ErrorType.AUTHORIZATION_ERROR:
                return <Shield className="w-5 h-5 text-red-500"/>;
            case ErrorType.AI_RATE_LIMIT_ERROR:
            case ErrorType.AI_QUOTA_EXCEEDED:
                return <Zap className="w-5 h-5 text-orange-500"/>;
            case ErrorType.AI_API_ERROR:
            case ErrorType.VECTOR_STORE_ERROR:
            case ErrorType.RESEARCH_PIPELINE_ERROR:
                return <Bug className="w-5 h-5 text-red-500"/>;
            case ErrorType.VALIDATION_ERROR:
                return <AlertTriangle className="w-5 h-5 text-yellow-500"/>;
            default:
                return <AlertTriangle className="w-5 h-5 text-red-500"/>;
        }
    };
    getErrorMessage = (error) => {
        return error.userMessage || error.message;
    };
    getErrorSuggestions = (error) => {
        switch (error.type) {
            case ErrorType.NETWORK_ERROR:
            case ErrorType.CONNECTION_ERROR:
                return [
                    'Check your internet connection',
                    'Try refreshing the page',
                    'Disable VPN if active'
                ];
            case ErrorType.TIMEOUT_ERROR:
                return [
                    'Try again in a few moments',
                    'Check server status',
                    'Reduce request complexity'
                ];
            case ErrorType.AUTHENTICATION_ERROR:
            case ErrorType.AUTHORIZATION_ERROR:
                return [
                    'Log out and log back in',
                    'Clear browser cache',
                    'Check account status'
                ];
            case ErrorType.AI_RATE_LIMIT_ERROR:
            case ErrorType.AI_QUOTA_EXCEEDED:
                return [
                    'Wait before making more requests',
                    'Upgrade your plan for higher limits',
                    'Reduce request frequency'
                ];
            case ErrorType.VALIDATION_ERROR:
                return [
                    'Check your input format',
                    'Ensure all required fields are filled',
                    'Remove any invalid characters'
                ];
            case ErrorType.AI_API_ERROR:
                return [
                    'Try again in a few moments',
                    'Check if the service is available',
                    'Contact support if problem persists'
                ];
            case ErrorType.VECTOR_STORE_ERROR:
                return [
                    'Search functionality may be temporarily unavailable',
                    'Try a simpler search query',
                    'Contact support if problem persists'
                ];
            case ErrorType.RESEARCH_PIPELINE_ERROR:
                return [
                    'Research may be temporarily unavailable',
                    'Try with a different topic',
                    'Contact support if problem persists'
                ];
            default:
                return [
                    'Try refreshing the page',
                    'Contact support if problem persists',
                    'Check browser console for details'
                ];
        }
    };
    render() {
        const { hasError, error, errorInfo, retryCount, isRetrying } = this.state;
        const { children, fallback, showDetails = false, className = '' } = this.props;
        if (hasError && error) {
            if (fallback) {
                return fallback;
            }
            return (<Card className={`border-red-200 bg-red-50 ${className}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {this.getErrorIcon(error.type)}
              <CardTitle className="text-red-800">
                {error.severity === ErrorSeverity.CRITICAL ? 'Critical Error' :
                    error.severity === ErrorSeverity.HIGH ? 'System Error' :
                        'Application Error'}
              </CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4"/>
              <AlertDescription>
                {this.getErrorMessage(error)}
              </AlertDescription>
            </Alert>

            {/* Error suggestions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Suggestions:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {this.getErrorSuggestions(error).map((suggestion, index) => (<li key={index} className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{suggestion}</span>
                  </li>))}
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              {error.recoverable && retryCount < 3 && (<Button onClick={this.handleRetry} disabled={isRetrying} variant="outline" size="sm">
                  {isRetrying ? (<>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin"/>
                      Retrying...
                    </>) : (<>
                      <RefreshCw className="w-4 h-4 mr-2"/>
                      Retry ({3 - retryCount} attempts left)
                    </>)}
                </Button>)}
              
              <Button onClick={this.handleReset} variant="outline" size="sm">
                Reset
              </Button>
            </div>

            {/* Error details (for development) */}
            {showDetails && (<details className="mt-4">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                  <div><strong>Error Code:</strong> {error.code}</div>
                  <div><strong>Error Type:</strong> {error.type}</div>
                  <div><strong>Severity:</strong> {error.severity}</div>
                  <div><strong>Message:</strong> {error.message}</div>
                  <div><strong>Recoverable:</strong> {error.recoverable ? 'Yes' : 'No'}</div>
                  {error.retryAfter && (<div><strong>Retry After:</strong> {error.retryAfter}ms</div>)}
                  {error.context && (<div><strong>Context:</strong> {JSON.stringify(error.context, null, 2)}</div>)}
                  {errorInfo && (<div className="mt-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                    </div>)}
                </div>
              </details>)}
          </CardContent>
        </Card>);
        }
        return children;
    }
}
export default StreamingErrorBoundary;
//# sourceMappingURL=StreamingErrorBoundary.jsx.map