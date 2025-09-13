import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, AlertCircle, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import type { InputCardProps, FormError, LoadingState } from './types';
import { 
  validateTopicInput, 
  sanitizeInput, 
  isSubmitShortcut, 
  INPUT_CONSTRAINTS,
  classifyError,
  createRetryHandler,
  getLoadingMessage
} from './utils';

export const InputCard: React.FC<InputCardProps> = ({
  onSubmit,
  isLoading = false,
  placeholder = INPUT_CONSTRAINTS.PLACEHOLDER,
  maxRetries = 3,
  showCharacterCount = true,
  showValidationHints = true
}) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<FormError | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    stage: 'validating'
  });
  const [retryCount, setRetryCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const retryHandler = useRef(createRetryHandler(maxRetries));

  const validation = validateTopicInput(input);
  const isSubmitDisabled = !validation.isValid || loadingState.isLoading;

  // Enhanced submit handler with retry logic
  const handleSubmit = useCallback(async () => {
    if (isSubmitDisabled) return;

    const sanitizedInput = sanitizeInput(input);
    const finalValidation = validateTopicInput(sanitizedInput);

    if (!finalValidation.isValid) {
      setError({
        type: 'validation',
        message: finalValidation.error || 'Invalid input',
        retryable: false
      });
      return;
    }

    // Reset states
    setError(null);
    setRetryCount(0);
    setShowSuccess(false);
    setLoadingState({
      isLoading: true,
      stage: 'validating',
      message: getLoadingMessage('validating')
    });

    try {
      await retryHandler.current(
        async () => {
          setLoadingState(prev => ({
            ...prev,
            stage: 'submitting',
            message: getLoadingMessage('submitting', retryCount + 1)
          }));
          
          await onSubmit(sanitizedInput);
        },
        (attempt, error) => {
          setRetryCount(attempt);
          setLoadingState(prev => ({
            ...prev,
            message: getLoadingMessage('submitting', attempt + 1)
          }));
        }
      );

      // Success state
      setLoadingState({
        isLoading: true,
        stage: 'complete',
        message: getLoadingMessage('complete')
      });
      
      setShowSuccess(true);
      setInput(''); // Clear input on successful submission
      
      // Hide success message after a delay
      setTimeout(() => {
        setShowSuccess(false);
        setLoadingState({ isLoading: false, stage: 'validating' });
      }, 2000);

    } catch (err) {
      const errorInfo = classifyError(err);
      setError(errorInfo);
      setLoadingState({ isLoading: false, stage: 'validating' });
      console.error('Topic submission error:', err);
    }
  }, [input, isSubmitDisabled, onSubmit, maxRetries, retryCount]);

  const handleRetry = useCallback(() => {
    setError(null);
    handleSubmit();
  }, [handleSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isSubmitShortcut(e.nativeEvent)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Clear error and success states when user starts typing
    if (error) {
      setError(null);
    }
    if (showSuccess) {
      setShowSuccess(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`;
    }
  }, [input]);

  // Character count color logic
  const getCharacterCountColor = () => {
    const length = input.length;
    const maxLength = INPUT_CONSTRAINTS.MAX_LENGTH;
    
    if (length > maxLength * 0.9) return 'text-destructive';
    if (length > maxLength * 0.7) return 'text-yellow-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 lg:px-0">
      <div className={`relative bg-card/90 backdrop-blur-sm rounded-2xl shadow-xl border transition-all duration-300 ease-out p-4 sm:p-6 lg:p-8 group ${
        error 
          ? 'border-destructive/50 focus-within:border-destructive focus-within:ring-destructive/30' 
          : showSuccess
          ? 'border-green-500/50 focus-within:border-green-500 focus-within:ring-green-500/30'
          : 'border-border/50 hover:border-border focus-within:border-primary/50 focus-within:ring-primary/30'
      } ${
        loadingState.isLoading ? 'hover:shadow-xl' : 'hover:shadow-2xl'
      } focus-within:shadow-2xl focus-within:ring-2`}>
        
        {/* Textarea */}
        <label htmlFor="topic-input" className="sr-only">
          Enter a topic you want to learn about
        </label>
        <textarea
          id="topic-input"
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full min-h-[100px] sm:min-h-[120px] lg:min-h-[140px] resize-none border-0 bg-transparent text-base sm:text-lg lg:text-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-0 leading-relaxed touch-manipulation transition-all duration-200 ${
            loadingState.isLoading ? 'opacity-75' : ''
          }`}
          disabled={loadingState.isLoading}
          maxLength={INPUT_CONSTRAINTS.MAX_LENGTH}
          aria-describedby={[
            'input-instructions',
            error ? 'input-error' : null,
            validation.warnings ? 'input-warnings' : null,
            showCharacterCount ? 'character-count' : null
          ].filter(Boolean).join(' ')}
          aria-invalid={error ? 'true' : 'false'}
          aria-required="true"
          role="textbox"
          aria-multiline="true"
        />

        {/* Instructions for screen readers */}
        <div id="input-instructions" className="sr-only">
          Enter a topic you want to learn about. Use Command+Enter or click the submit button to create your learning path.
        </div>

        {/* Submit Button and Controls */}
        <div className="flex items-end justify-between mt-3 sm:mt-4 lg:mt-6 gap-3">
          <div className="flex flex-col space-y-2 sm:space-y-1 text-xs sm:text-sm text-muted-foreground flex-1 min-w-0">
            {/* Keyboard shortcut */}
            <div className="flex items-center space-x-2">
              <kbd 
                className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded whitespace-nowrap transition-colors duration-200 group-focus-within:bg-accent group-focus-within:text-accent-foreground"
                aria-label="Keyboard shortcut: Command plus Enter"
              >
                ⌘ + Enter
              </kbd>
              <span className="hidden sm:inline text-xs transition-opacity duration-200 group-focus-within:opacity-80">to submit</span>
            </div>
            
            {/* Character count */}
            {showCharacterCount && (
              <div id="character-count" className="flex items-center space-x-2" aria-live="polite">
                <span 
                  className={`text-xs transition-colors duration-200 ${getCharacterCountColor()}`}
                  aria-label={`${input.length} of ${INPUT_CONSTRAINTS.MAX_LENGTH} characters used`}
                >
                  {input.length}/{INPUT_CONSTRAINTS.MAX_LENGTH}
                </span>
                {input.length > INPUT_CONSTRAINTS.MAX_LENGTH * 0.9 && (
                  <AlertTriangle 
                    className="w-3 h-3 text-yellow-600" 
                    aria-label="Warning: approaching character limit"
                  />
                )}
              </div>
            )}

            {/* Loading message */}
            {loadingState.isLoading && loadingState.message && (
              <div className="flex items-center space-x-2 text-xs text-primary" aria-live="polite">
                <div 
                  className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" 
                  aria-hidden="true"
                />
                <span>{loadingState.message}</span>
              </div>
            )}
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            type="submit"
            className={`
              flex items-center justify-center min-w-[48px] min-h-[48px] w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background touch-manipulation flex-shrink-0 focus:ring-4
              ${isSubmitDisabled 
                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' 
                : showSuccess
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl focus:bg-green-700'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 focus:bg-primary/90 focus:scale-105'
              }
            `}
            aria-label={
              loadingState.isLoading 
                ? `${loadingState.message || 'Submitting'} - Please wait` 
                : showSuccess 
                ? 'Topic created successfully!' 
                : 'Create learning path for this topic'
            }
            aria-describedby="topic-input"
          >
            {loadingState.isLoading ? (
              <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : showSuccess ? (
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
            ) : (
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 transition-transform duration-200 group-hover:translate-x-0.5" />
            )}
          </button>
        </div>


        {/* Error Message with Retry */}
        {error && (
          <div 
            id="input-error" 
            className="mt-4 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-in slide-in-from-top-2 duration-300"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start space-x-2">
              <AlertCircle 
                className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" 
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium">{error.message}</p>
                {error.details && (
                  <p className="text-xs text-destructive/70 mt-1">{error.details}</p>
                )}
                {error.retryable && (
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center space-x-1 mt-2 text-xs text-destructive hover:text-destructive/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 focus:ring-offset-background rounded px-2 py-1 min-h-[32px]"
                    type="button"
                    aria-label="Retry submitting the topic"
                  >
                    <RefreshCw className="w-3 h-3" aria-hidden="true" />
                    <span>Try again</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div 
            className="mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl animate-in slide-in-from-top-2 duration-300"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle 
                className="w-4 h-4 text-green-600" 
                aria-hidden="true"
              />
              <p className="text-sm text-green-800 font-medium">Topic created successfully! Redirecting to your learning path...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};