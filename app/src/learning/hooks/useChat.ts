import { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'wasp/client/operations';
import { 
  createChatThread, 
  getChatThread, 
  getChatThreads, 
  sendMessage,
  updateChatThread,
  exportChatThread
} from 'wasp/client/operations';
import type { ChatThread, Message } from 'wasp/entities';

interface ChatThreadWithMessages extends ChatThread {
  messages: Message[];
  messageCount: number;
  lastMessage?: Message;
}

interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
  suggestedQuestions: string[];
  metadata: {
    confidence: number;
    processingTime: number;
    sourceCount: number;
  };
}

interface UseChatOptions {
  topicId: string;
  autoCreateThread?: boolean;
}

export function useChat({ topicId, autoCreateThread = false }: UseChatOptions) {
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  // Fetch all chat threads for this topic
  const { 
    data: threads = [], 
    isLoading: threadsLoading,
    error: threadsError,
    refetch: refetchThreads
  } = useQuery(getChatThreads, { topicId });

  // Fetch active thread details
  const { 
    data: activeThread,
    isLoading: threadLoading,
    error: threadError,
    refetch: refetchThread
  } = useQuery(
    getChatThread, 
    activeThreadId ? { threadId: activeThreadId } : undefined,
    { enabled: !!activeThreadId }
  );

  // Auto-select first thread or create new one
  useEffect(() => {
    if (!activeThreadId && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    } else if (!activeThreadId && autoCreateThread && !threadsLoading && threads.length === 0) {
      handleCreateThread();
    }
  }, [threads, activeThreadId, autoCreateThread, threadsLoading]);

  // Create new chat thread
  const handleCreateThread = useCallback(async (title?: string) => {
    try {
      setLoading(true);
      setError(undefined);

      const newThread = await createChatThread({
        topicId,
        title
      });

      setActiveThreadId(newThread.id);
      await refetchThreads();
      
      return newThread;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create chat thread';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [topicId, refetchThreads]);

  // Send message to active thread
  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeThreadId) {
      throw new Error('No active chat thread');
    }

    try {
      setLoading(true);
      setError(undefined);

      const response = await sendMessage({
        threadId: activeThreadId,
        content
      }) as SendMessageResponse;

      // Update suggested questions
      if (response.suggestedQuestions) {
        setSuggestedQuestions(response.suggestedQuestions);
      }

      // Refresh thread data to get new messages
      await refetchThread();
      await refetchThreads();

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeThreadId, refetchThread, refetchThreads]);

  // Select a different thread
  const handleSelectThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
    setError(undefined);
    setSuggestedQuestions([]);
  }, []);

  // Update thread settings
  const handleUpdateThread = useCallback(async (threadId: string, updates: { title?: string }) => {
    try {
      setLoading(true);
      setError(undefined);

      const updatedThread = await updateChatThread({
        threadId,
        ...updates
      });

      await refetchThreads();
      if (threadId === activeThreadId) {
        await refetchThread();
      }

      return updatedThread;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update thread';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeThreadId, refetchThread, refetchThreads]);

  // Delete thread (placeholder - would need to implement delete operation)
  const handleDeleteThread = useCallback(async (threadId: string) => {
    // TODO: Implement delete thread operation
    console.log('Delete thread:', threadId);
    
    // If deleting active thread, select another one
    if (threadId === activeThreadId) {
      const remainingThreads = threads.filter(t => t.id !== threadId);
      if (remainingThreads.length > 0) {
        setActiveThreadId(remainingThreads[0].id);
      } else {
        setActiveThreadId(undefined);
      }
    }
  }, [activeThreadId, threads]);

  // Export thread
  const handleExportThread = useCallback(async (threadId: string, format: 'text' | 'json' | 'markdown') => {
    try {
      setLoading(true);
      setError(undefined);

      const result = await exportChatThread({
        threadId,
        format
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export thread';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  return {
    // Data
    threads: threads as ChatThreadWithMessages[],
    activeThread: activeThread as ChatThreadWithMessages | undefined,
    activeThreadId,
    suggestedQuestions,
    
    // Loading states
    loading: loading || threadLoading,
    threadsLoading,
    
    // Error states
    error: error || threadsError?.message || threadError?.message,
    
    // Actions
    createThread: handleCreateThread,
    selectThread: handleSelectThread,
    sendMessage: handleSendMessage,
    updateThread: handleUpdateThread,
    deleteThread: handleDeleteThread,
    exportThread: handleExportThread,
    clearError,
    
    // Refresh functions
    refetchThreads,
    refetchThread
  };
}