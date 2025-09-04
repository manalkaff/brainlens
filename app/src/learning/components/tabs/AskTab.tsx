import React, { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { useTopicContext } from '../../context/TopicContext';
import { useChat } from '../../hooks/useChat';
import { ChatInterface } from '../chat/ChatInterface';
import { ChatThreadSidebar } from '../chat/ChatThreadSidebar';
import { Button } from '../../../components/ui/button';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';

export function AskTab() {
  const { topic, isLoading } = useTopicContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    threads,
    activeThread,
    activeThreadId,
    suggestedQuestions,
    loading,
    error,
    createThread,
    selectThread,
    sendMessage,
    deleteThread
  } = useChat({ 
    topicId: topic?.id || '', 
    autoCreateThread: false 
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Topic not found</p>
        </CardContent>
      </Card>
    );
  }

  const handleNewThread = async () => {
    try {
      await createThread(`Chat about ${topic.title}`);
    } catch (error) {
      console.error('Failed to create new thread:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      let threadId = activeThreadId;
      
      if (!threadId) {
        // Create a new thread if none exists
        const newThread = await createThread(`Chat about ${topic.title}`);
        threadId = newThread.id;
      }
      
      if (threadId) {
        await sendMessage(content);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error is already handled by the useChat hook
    }
  };

  return (
    <div className="h-full flex gap-4">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-80 flex-shrink-0">
          <ChatThreadSidebar
            threads={threads}
            activeThreadId={activeThreadId}
            onSelectThread={selectThread}
            onNewThread={handleNewThread}
            onDeleteThread={deleteThread}
            loading={loading}
          />
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Header with sidebar toggle */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2"
          >
            {sidebarOpen ? (
              <>
                <PanelLeftClose className="w-4 h-4" />
                Hide Conversations
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-4 h-4" />
                Show Conversations
              </>
            )}
          </Button>

          {!activeThread && (
            <Button onClick={handleNewThread} disabled={loading}>
              Start New Conversation
            </Button>
          )}
        </div>

        {/* Chat Interface */}
        <div className="flex-1">
          <ChatInterface
            thread={activeThread}
            onSendMessage={handleSendMessage}
            loading={loading}
            error={error}
            suggestedQuestions={suggestedQuestions}
            topicTitle={topic.title}
          />
        </div>
      </div>
    </div>
  );
}