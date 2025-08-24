import React, { useState, useEffect, useRef } from 'react';
import { ChatThread, Message } from 'wasp/entities';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { ChatMessage } from './ChatMessage';
import { MessageInput } from './MessageInput';
import { ChatExportDialog } from './ChatExportDialog';
import { CodeSandbox } from './CodeSandbox';
import { Loader2, Bot, AlertCircle, TrendingUp, Code, Download, Settings, Brain } from 'lucide-react';
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
  
  // Dialog states
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showCodeSandbox, setShowCodeSandbox] = useState(false);
  const [activeCodeSnippet, setActiveCodeSnippet] = useState<string>('');
  const [activeTab, setActiveTab] = useState('chat');
  
  // Mock data for missing features
  const conversationStats = {
    messageCount: thread?.messages?.length || 0,
    avgConfidence: 0.85,
    topicsDiscussed: ['JavaScript', 'React', 'TypeScript']
  };
  
  const userPreferences = {
    knowledgeLevel: 'intermediate',
    learningStyle: 'visual',
    responseLength: 'detailed',
    preferredResponseLength: 'detailed',
    codeExamples: true,
    practicalExamples: true,
    includeCode: true,
    includeExamples: true
  };

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

  const handleCodeExecution = (code: string) => {
    setActiveCodeSnippet(code);
    setShowCodeSandbox(true);
  };

  const handlePreferenceChange = (key: string, value: any) => {
    // TODO: Implement preference persistence
    console.log('Preference change:', key, value);
  };

  // Generate default suggested questions if none provided
  const defaultSuggestions = topicTitle ? [
    `What are the fundamentals of ${topicTitle}?`,
    `How is ${topicTitle} used in practice?`,
    `What are common challenges with ${topicTitle}?`,
    `How do I get started with ${topicTitle}?`
  ] : [];

  const currentSuggestions = suggestedQuestions.length > 0 ? suggestedQuestions : defaultSuggestions;

  const renderChatTab = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-sm font-medium">
            <Bot className="w-4 h-4 mr-2 text-primary" />
            AI Learning Assistant
            {thread && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {conversationStats.messageCount} messages
              </Badge>
            )}
            {conversationStats.avgConfidence > 0 && (
              <Badge variant="outline" className="ml-2 text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                {Math.round(conversationStats.avgConfidence * 100)}% confidence
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCodeSandbox(true)}
              className="flex items-center gap-2"
            >
              <Code className="w-4 h-4" />
              Code Lab
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
        
        {topicTitle && (
          <p className="text-sm text-muted-foreground">
            Ask questions about <strong>{topicTitle}</strong> and get contextual answers with examples and code
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
                        I can help answer questions, explain concepts, and guide you through the learning material with interactive code examples and personalized explanations.
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

  const renderSettingsTab = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Conversation Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Knowledge Level */}
        <div>
          <label className="text-sm font-medium mb-2 block">Knowledge Level</label>
          <div className="grid grid-cols-3 gap-2">
            {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
              <Button
                key={level}
                variant={userPreferences.knowledgeLevel === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreferenceChange('knowledgeLevel', level)}
                className="capitalize"
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        {/* Learning Style */}
        <div>
          <label className="text-sm font-medium mb-2 block">Learning Style</label>
          <div className="grid grid-cols-2 gap-2">
            {(['visual', 'auditory', 'kinesthetic', 'reading'] as const).map((style) => (
              <Button
                key={style}
                variant={userPreferences.learningStyle === style ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreferenceChange('learningStyle', style)}
                className="capitalize"
              >
                {style}
              </Button>
            ))}
          </div>
        </div>

        {/* Response Preferences */}
        <div>
          <label className="text-sm font-medium mb-2 block">Response Length</label>
          <div className="grid grid-cols-3 gap-2">
            {(['brief', 'detailed', 'comprehensive'] as const).map((length) => (
              <Button
                key={length}
                variant={userPreferences.preferredResponseLength === length ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePreferenceChange('preferredResponseLength', length)}
                className="capitalize"
              >
                {length}
              </Button>
            ))}
          </div>
        </div>

        {/* Content Preferences */}
        <div className="space-y-3">
          <label className="text-sm font-medium block">Include in Responses</label>
          <div className="flex items-center justify-between">
            <span className="text-sm">Code Examples</span>
            <Button
              variant={userPreferences.includeCode ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePreferenceChange('includeCode', !userPreferences.includeCode)}
            >
              {userPreferences.includeCode ? 'On' : 'Off'}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Practical Examples</span>
            <Button
              variant={userPreferences.includeExamples ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePreferenceChange('includeExamples', !userPreferences.includeExamples)}
            >
              {userPreferences.includeExamples ? 'On' : 'Off'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAnalyticsTab = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Learning Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {conversationStats.messageCount}
              </div>
              <div className="text-sm text-muted-foreground">Total Messages</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(conversationStats.avgConfidence * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Confidence</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Learning Progress</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Understanding Level</span>
                <span className="font-medium capitalize">{userPreferences.knowledgeLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Learning Style</span>
                <span className="font-medium capitalize">{userPreferences.learningStyle}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(conversationStats.avgConfidence * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Key Topics Explored</h4>
            <div className="flex flex-wrap gap-2">
              {conversationStats.topicsDiscussed.slice(0, 8).map((topic, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 mt-0">
          {renderChatTab()}
        </TabsContent>
        
        <TabsContent value="settings" className="flex-1 mt-0">
          {renderSettingsTab()}
        </TabsContent>
        
        <TabsContent value="analytics" className="flex-1 mt-0">
          {renderAnalyticsTab()}
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      {showExportDialog && (
        <ChatExportDialog
          thread={thread}
          onClose={() => setShowExportDialog(false)}
          topicTitle={topicTitle || 'Conversation'}
        />
      )}

      {/* Code Sandbox */}
      {showCodeSandbox && (
        <CodeSandbox
          initialCode={activeCodeSnippet}
          onClose={() => setShowCodeSandbox(false)}
          topicContext={topicTitle || 'Code Exploration'}
        />
      )}
    </div>
  );
}