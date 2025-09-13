import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  suggestedQuestions?: string[];
  onSelectSuggestion?: (question: string) => void;
}

export function MessageInput({ 
  onSendMessage, 
  disabled = false, 
  loading = false,
  placeholder = "Ask a question about this topic...",
  suggestedQuestions = [],
  onSelectSuggestion
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled && !loading) {
      onSendMessage(trimmedMessage);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (question: string) => {
    if (onSelectSuggestion) {
      onSelectSuggestion(question);
    } else {
      setMessage(question);
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="space-y-3">
      {/* Suggested Questions */}
      {suggestedQuestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleSuggestionClick(question)}
              disabled={disabled || loading}
              className="text-xs h-auto py-1 px-2 whitespace-normal text-left"
            >
              {question}
            </Button>
          ))}
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || loading}
            className={cn(
              "min-h-[40px] max-h-[120px] resize-none pr-12",
              "focus:ring-2 focus:ring-primary focus:border-transparent"
            )}
            rows={1}
          />
          
          {/* Character count */}
          {message.length > 0 && (
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {message.length}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={!message.trim() || disabled || loading}
          size="sm"
          className="self-end"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>

      {/* Input hints */}
      <div className="text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}