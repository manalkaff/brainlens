import React, { useState, useEffect, useRef } from 'react';
import { ChatThread, Message } from 'wasp/entities';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ChatMessage } from './ChatMessage';
import { MessageInput } from './MessageInput';
import { Loader2, Bot, AlertCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ChatThreadWithMessages extends ChatThread {
  messages: Message[];
  messageCount: number;
  lastMessage?: Message;
}

interface ChatInterfaceProps {
  thread?: ChatThreadWithMessages;
  onSendMessage: (content: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  suggestedQuestions?: string[];
  topicTitle?: string;
}

export function ChatInterface({
  thread,
  onSendMessage,
  loading = false,
  error,
  suggestedQuestions = [],
  topicTitle
}: ChatInterfaceProps) {
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thread?.messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    try {
      setIsTyping(true);
      await onSendMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Could add a toast notification here
  };

  const handleMessageFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    // TODO: Implement feedback tracking
    console.log('Message feedback:', messageId, feedback);
  };

  // Generate default suggested questions if none provided
  const defaultSuggestions = topicTitle ? [
    `What are the fundamentals of ${topicTitle}?`,
    `How is ${topicTitle} used in practice?`,
    `What are common challenges with ${topicTitle}?`,
    `How do I get started with ${topicTitle}?`
  ] : [];

  const currentSuggestions = suggestedQuestions.length > 0 ? suggestedQuestions : defaultSuggestions;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-sm font-medium">
            <Bot className="w-4 h-4 mr-2 text-primary" />
            AI Learning Assistant
            {thread && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {thread.messageCount} messages
              </Badge>
            )}
          </CardTitle>
        </div>
        
        {topicTitle && (
          <p className="text-sm text-muted-foreground">
            Ask questions about <strong>{topicTitle}</strong> and get contextual answers
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 min-h-0">
          <ScrollArea ref={scrollAreaRef} className="h-full px-4">
            <div className="space-y-4 py-4">
              {/* Welcome Message */}
              {(!thread || thread.messages.length === 0) && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                    AI
                  </div>
                  <div className="flex-1">
                    <div className="bg-background border rounded-lg p-3 shadow-sm">
                      <p className="text-sm">
                        Hello! I'm your AI learning assistant{topicTitle && ` for ${topicTitle}`}. 
                        I can help answer questions, explain concepts, and guide you through the learning material. 
                        What would you like to know?
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {thread?.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onCopy={handleCopyMessage}
                  onFeedback={handleMessageFeedback}
                />
              ))}

              {/* Typing Indicator */}
              {(loading || isTyping) && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                    AI
                  </div>
                  <div className="flex-1">
                    <div className="bg-background border rounded-lg p-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center text-white text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <p className="text-sm text-destructive">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={!thread}
            loading={loading || isTyping}
            placeholder={
              thread 
                ? "Ask a question about this topic..." 
                : "Start a new conversation to begin chatting"
            }
            suggestedQuestions={thread && thread.messages.length === 0 ? currentSuggestions : []}
            onSelectSuggestion={handleSendMessage}
          />
        </div>
      </CardContent>
    </Card>
  );
}