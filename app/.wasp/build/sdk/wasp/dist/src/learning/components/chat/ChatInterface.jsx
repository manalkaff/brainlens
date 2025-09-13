import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Badge } from '../../../components/ui/badge';
import { ChatMessage } from './ChatMessage';
import { MessageInput } from './MessageInput';
import { Loader2, AlertCircle, Brain } from 'lucide-react';
export function ChatInterface({ thread, onSendMessage, loading = false, error, suggestedQuestions = [], topicTitle }) {
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const scrollAreaRef = useRef(null);
    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [thread?.messages]);
    const handleSendMessage = async (content) => {
        if (!content.trim() || loading)
            return;
        try {
            setIsTyping(true);
            await onSendMessage(content);
        }
        catch (error) {
            console.error('Failed to send message:', error);
        }
        finally {
            setIsTyping(false);
        }
    };
    // Clear typing state if loading changes externally (e.g. from useChat hook)
    useEffect(() => {
        if (!loading && isTyping) {
            setIsTyping(false);
        }
    }, [loading, isTyping]);
    // Debug logging for loading states
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('ChatInterface loading states:', {
                loading,
                isTyping,
                hasThread: !!thread,
                messageCount: thread?.messages?.length || 0,
                error
            });
        }
    }, [loading, isTyping, thread, error]);
    const handleCopyMessage = (content) => {
        navigator.clipboard.writeText(content);
        // Could add a toast notification here
    };
    const handleMessageFeedback = (messageId, feedback) => {
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
    return (<Card className="h-full flex flex-col">
      {/* Modern Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg">
              <Brain className="w-5 h-5"/>
            </div>
            <div>
              <h2 className="font-semibold text-foreground">AI Learning Assistant</h2>
              {topicTitle && (<p className="text-sm text-muted-foreground font-normal">
                  Ask questions about <span className="font-medium text-foreground">{topicTitle}</span>
                </p>)}
            </div>
          </CardTitle>
          
          {thread && (<Badge variant="secondary" className="rounded-full">
              {thread.messages.length} {thread.messages.length === 1 ? 'message' : 'messages'}
            </Badge>)}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 min-h-0 relative">
          <ScrollArea ref={scrollAreaRef} className="h-full">
            <div className="px-6 py-4 space-y-6">
              {/* Welcome Message */}
              {(!thread || thread.messages.length === 0) && (<div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    AI
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="bg-muted/50 rounded-2xl rounded-tl-md p-4 max-w-2xl">
                      <p className="text-sm leading-relaxed">
                        Hello! I'm your AI learning assistant{topicTitle && ` for ${topicTitle}`}. 
                        I can help answer questions, explain concepts, and provide detailed explanations to help you learn effectively.
                        What would you like to explore today?
                      </p>
                    </div>
                  </div>
                </div>)}

              {/* Chat Messages */}
              {thread?.messages.map((message) => (<ChatMessage key={message.id} message={message} onCopy={handleCopyMessage} onFeedback={handleMessageFeedback}/>))}

              {/* Typing Indicator */}
              {(loading || isTyping) && (<div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    AI
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted/50 rounded-2xl rounded-tl-md p-4 max-w-xs">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary"/>
                        <span className="text-sm text-muted-foreground">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>)}

              {/* Error Message */}
              {error && (<div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    <AlertCircle className="w-4 h-4"/>
                  </div>
                  <div className="flex-1">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl rounded-tl-md p-4 max-w-2xl">
                      <p className="text-sm text-destructive">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>)}

              <div ref={messagesEndRef}/>
            </div>
          </ScrollArea>
        </div>

        {/* Modern Message Input */}
        <div className="shrink-0 border-t p-4">
          <MessageInput onSendMessage={handleSendMessage} disabled={false} loading={loading || isTyping} placeholder={thread
            ? "Ask a question about this topic..."
            : "Ask a question to start a new conversation..."} suggestedQuestions={thread && thread.messages.length === 0 ? currentSuggestions : []} onSelectSuggestion={handleSendMessage}/>
        </div>
      </CardContent>
    </Card>);
}
//# sourceMappingURL=ChatInterface.jsx.map