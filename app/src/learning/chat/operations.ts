import { HttpError } from 'wasp/server';
import type { 
  CreateChatThread,
  GetChatThread,
  GetChatThreads,
  SendMessage,
  UpdateChatThread
} from 'wasp/server/operations';
import type { ChatThread, Message, UserTopicProgress } from 'wasp/entities';
import { conversationManager } from './conversationManager';

// Types for chat operations
type CreateChatThreadInput = {
  topicId: string;
  title?: string;
  userPreferences?: {
    knowledgeLevel?: 'beginner' | 'intermediate' | 'advanced';
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  };
};

type SendMessageInput = {
  threadId: string;
  content: string;
};

type UpdateChatThreadInput = {
  threadId: string;
  title?: string;
  userPreferences?: {
    knowledgeLevel?: 'beginner' | 'intermediate' | 'advanced';
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  };
};

type GetChatThreadsInput = {
  topicId?: string;
  limit?: number;
  offset?: number;
};

type ChatThreadWithMessages = ChatThread & {
  messages: Message[];
  messageCount: number;
  lastMessage?: Message;
};

type SendMessageResponse = {
  userMessage: Message;
  assistantMessage: Message;
  suggestedQuestions: string[];
  metadata: {
    confidence: number;
    processingTime: number;
    sourceCount: number;
  };
};

/**
 * Create a new chat thread for a topic
 */
export const createChatThread: CreateChatThread<CreateChatThreadInput, ChatThread> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { topicId, title, userPreferences } = args;

  if (!topicId) {
    throw new HttpError(400, 'Topic ID is required');
  }

  try {
    // Verify topic exists
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }

    // Create chat thread
    const chatThread = await context.entities.ChatThread.create({
      data: {
        userId: context.user.id,
        topicId,
        title: title || `Chat about ${topic.title}`,
      }
    });

    // Start conversation session
    await conversationManager.startConversation(
      chatThread.id,
      topicId,
      topic.title,
      context.user.id,
      userPreferences
    );

    return chatThread;

  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Failed to create chat thread:', error);
    throw new HttpError(500, 'Failed to create chat thread');
  }
};

/**
 * Get a specific chat thread with messages
 */
export const getChatThread: GetChatThread<{ threadId: string }, ChatThreadWithMessages> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { threadId } = args;

  if (!threadId) {
    throw new HttpError(400, 'Thread ID is required');
  }

  try {
    const chatThread = await context.entities.ChatThread.findUnique({
      where: { 
        id: threadId,
        userId: context.user.id // Ensure user owns the thread
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        topic: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    if (!chatThread) {
      throw new HttpError(404, 'Chat thread not found');
    }

    // Resume conversation session if needed
    if (chatThread.topic) {
      await conversationManager.startConversation(
        chatThread.id,
        chatThread.topicId,
        chatThread.topic.title,
        context.user.id
      );
    }

    return {
      ...chatThread,
      messageCount: chatThread.messages.length,
      lastMessage: chatThread.messages[chatThread.messages.length - 1] || undefined
    };

  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Failed to get chat thread:', error);
    throw new HttpError(500, 'Failed to retrieve chat thread');
  }
};

/**
 * Get all chat threads for a user, optionally filtered by topic
 */
export const getChatThreads: GetChatThreads<GetChatThreadsInput, ChatThreadWithMessages[]> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { topicId, limit = 20, offset = 0 } = args;

  try {
    const whereClause: any = {
      userId: context.user.id
    };

    if (topicId) {
      whereClause.topicId = topicId;
    }

    const chatThreads = await context.entities.ChatThread.findMany({
      where: whereClause,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Only get the last message for preview
        },
        topic: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Get message counts for each thread
    const threadsWithCounts = await Promise.all(
      chatThreads.map(async (thread) => {
        const messageCount = await context.entities.Message.count({
          where: { threadId: thread.id }
        });

        return {
          ...thread,
          messageCount,
          lastMessage: thread.messages[0] || undefined
        };
      })
    );

    return threadsWithCounts;

  } catch (error) {
    console.error('Failed to get chat threads:', error);
    throw new HttpError(500, 'Failed to retrieve chat threads');
  }
};

/**
 * Send a message and get AI response
 */
export const sendMessage: SendMessage<SendMessageInput, SendMessageResponse> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { threadId, content } = args;

  if (!threadId || !content?.trim()) {
    throw new HttpError(400, 'Thread ID and message content are required');
  }

  try {
    // Verify thread exists and user owns it
    const chatThread = await context.entities.ChatThread.findUnique({
      where: { 
        id: threadId,
        userId: context.user.id
      },
      include: {
        topic: true
      }
    });

    if (!chatThread) {
      throw new HttpError(404, 'Chat thread not found');
    }

    // Ensure conversation session is active
    if (!chatThread.topic) {
      throw new HttpError(400, 'Chat thread topic not found');
    }

    await conversationManager.startConversation(
      threadId,
      chatThread.topicId,
      chatThread.topic.title,
      context.user.id
    );

    // Process the message and get AI response
    const result = await conversationManager.processMessage(
      threadId,
      content.trim(),
      context
    );

    // Update thread's updatedAt timestamp
    await context.entities.ChatThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() }
    });

    // Update user's topic progress (time spent)
    await updateTopicProgressFromChat(context.user.id, chatThread.topicId, context);

    return {
      userMessage: result.userMessage,
      assistantMessage: result.assistantMessage,
      suggestedQuestions: result.suggestedQuestions,
      metadata: {
        confidence: result.assistantMessage.confidence || 0,
        processingTime: result.assistantMessage.processingTime || 0,
        sourceCount: result.assistantMessage.sources?.length || 0
      }
    };

  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Failed to send message:', error);
    throw new HttpError(500, 'Failed to process message');
  }
};

/**
 * Update chat thread settings
 */
export const updateChatThread: UpdateChatThread<UpdateChatThreadInput, ChatThread> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { threadId, title, userPreferences } = args;

  if (!threadId) {
    throw new HttpError(400, 'Thread ID is required');
  }

  try {
    // Verify thread exists and user owns it
    const existingThread = await context.entities.ChatThread.findUnique({
      where: { 
        id: threadId,
        userId: context.user.id
      }
    });

    if (!existingThread) {
      throw new HttpError(404, 'Chat thread not found');
    }

    // Update thread in database
    const updateData: any = {};
    if (title !== undefined) {
      updateData.title = title;
    }

    const updatedThread = await context.entities.ChatThread.update({
      where: { id: threadId },
      data: updateData
    });

    // Update conversation session preferences
    if (userPreferences) {
      conversationManager.updateUserPreferences(threadId, userPreferences);
    }

    return updatedThread;

  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Failed to update chat thread:', error);
    throw new HttpError(500, 'Failed to update chat thread');
  }
};

/**
 * Helper function to update topic progress from chat activity
 */
async function updateTopicProgressFromChat(
  userId: string,
  topicId: string,
  context: any
): Promise<void> {
  try {
    const existingProgress = await context.entities.UserTopicProgress.findUnique({
      where: {
        userId_topicId: {
          userId,
          topicId
        }
      }
    });

    const timeSpentIncrement = 60; // 1 minute per message (rough estimate)

    if (existingProgress) {
      await context.entities.UserTopicProgress.update({
        where: {
          userId_topicId: {
            userId,
            topicId
          }
        },
        data: {
          timeSpent: existingProgress.timeSpent + timeSpentIncrement,
          lastAccessed: new Date()
        }
      });
    } else {
      await context.entities.UserTopicProgress.create({
        data: {
          userId,
          topicId,
          completed: false,
          timeSpent: timeSpentIncrement,
          lastAccessed: new Date(),
          preferences: {},
          bookmarks: []
        }
      });
    }
  } catch (error) {
    console.error('Failed to update topic progress from chat:', error);
    // Don't throw error to avoid breaking the chat flow
  }
}