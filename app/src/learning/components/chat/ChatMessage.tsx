import React from 'react';
import { Message } from 'wasp/entities';
import { MessageRole } from '@prisma/client';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ChatMessageProps {
  message: Message;
  onCopy?: (content: string) => void;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
}

export function ChatMessage({ message, onCopy, onFeedback }: ChatMessageProps) {
  const isUser = message.role === MessageRole.USER;
  const isAssistant = message.role === MessageRole.ASSISTANT;

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
    } else {
      navigator.clipboard.writeText(message.content);
    }
  };

  return (
    <div className={cn(
      "flex items-start space-x-3 group",
      isUser && "flex-row-reverse space-x-reverse"
    )}>
      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className={cn(
          "text-xs font-medium",
          isUser ? "bg-blue-500 text-white" : "bg-primary text-primary-foreground"
        )}>
          {isUser ? "You" : "AI"}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-[80%]",
        isUser && "flex flex-col items-end"
      )}>
        <div className={cn(
          "rounded-lg p-3 shadow-sm",
          isUser 
            ? "bg-blue-500 text-white ml-auto" 
            : "bg-background border"
        )}>
          <div className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </div>
          
          {/* Metadata for assistant messages */}
          {isAssistant && message.metadata && (
            <div className="mt-2 pt-2 border-t border-muted text-xs text-muted-foreground">
              {(message.metadata as any).confidence && (
                <div>Confidence: {Math.round((message.metadata as any).confidence * 100)}%</div>
              )}
              {(message.metadata as any).sources && (message.metadata as any).sources.length > 0 && (
                <div>Sources: {(message.metadata as any).sources.length} references</div>
              )}
            </div>
          )}
        </div>

        {/* Message Actions */}
        {isAssistant && (
          <div className="flex items-center space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 px-2 text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
            
            {onFeedback && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFeedback(message.id, 'positive')}
                  className="h-6 px-2 text-xs"
                >
                  <ThumbsUp className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFeedback(message.id, 'negative')}
                  className="h-6 px-2 text-xs"
                >
                  <ThumbsDown className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className={cn(
          "text-xs text-muted-foreground mt-1",
          isUser && "text-right"
        )}>
          {new Date(message.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}