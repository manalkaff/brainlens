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

type ExportChatThreadInput = {
  threadId: string;
  format: 'text' | 'json' | 'markdown';
};

type ExportChatThreadResponse = {
  content: string;
  filename: string;
  mimeType: string;
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

    // Get user's topic progress for personalization
    const userProgress = await context.entities.UserTopicProgress.findUnique({
      where: {
        userId_topicId: {
          userId: context.user.id,
          topicId: chatThread.topicId
        }
      }
    });

    // Extract user preferences from progress
    const preferences = userProgress?.preferences as any;
    const userPreferences = preferences ? {
      knowledgeLevel: preferences.knowledgeLevel || 'intermediate',
      learningStyle: preferences.learningStyle || 'reading'
    } : undefined;

    await conversationManager.startConversation(
      threadId,
      chatThread.topicId,
      chatThread.topic.title,
      context.user.id,
      userPreferences
    );

    // Process the message and get AI response
    const result = await conversationManager.processMessage(
      threadId,
      content.trim(),
      context
    );

    // Generate smart question suggestions based on reading history
    const smartSuggestions = await generateSmartQuestionSuggestions(
      context.user.id,
      chatThread.topicId,
      content,
      result.assistantMessage.content,
      context
    );

    // Combine AI-generated suggestions with smart suggestions
    const allSuggestions = [
      ...result.suggestedQuestions,
      ...smartSuggestions
    ].slice(0, 4); // Limit to 4 suggestions

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
      suggestedQuestions: allSuggestions,
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
 * Generate smart question suggestions based on user's reading history
 */
async function generateSmartQuestionSuggestions(
  userId: string,
  topicId: string,
  userQuestion: string,
  assistantResponse: string,
  context: any
): Promise<string[]> {
  try {
    // Get user's bookmarks and reading history
    const userProgress = await context.entities.UserTopicProgress.findUnique({
      where: {
        userId_topicId: {
          userId,
          topicId
        }
      }
    });

    // Get related subtopics that user hasn't explored much
    const topicTree = await context.entities.Topic.findMany({
      where: {
        OR: [
          { parentId: topicId },
          { id: topicId }
        ]
      },
      include: {
        userProgress: {
          where: { userId }
        }
      }
    });

    // Find unexplored or lightly explored subtopics
    const unexploredTopics = topicTree.filter((topic: any) => {
      const progress = topic.userProgress[0];
      return !progress || progress.timeSpent < 300; // Less than 5 minutes
    });

    // Generate suggestions based on unexplored areas
    const suggestions: string[] = [];

    if (unexploredTopics.length > 0) {
      const randomTopic = unexploredTopics[Math.floor(Math.random() * unexploredTopics.length)];
      suggestions.push(`Tell me more about ${randomTopic.title}`);
    }

    // Add bookmark-based suggestions
    if (userProgress?.bookmarks && userProgress.bookmarks.length > 0) {
      suggestions.push('Can you explain something from my bookmarked content?');
    }

    // Add difficulty progression suggestions
    const knowledgeLevel = userProgress?.preferences?.knowledgeLevel || 'intermediate';
    if (knowledgeLevel === 'beginner') {
      suggestions.push('What are some practical examples of this?');
    } else if (knowledgeLevel === 'advanced') {
      suggestions.push('What are the advanced applications or edge cases?');
    }

    return suggestions.slice(0, 2); // Return max 2 smart suggestions

  } catch (error) {
    console.error('Failed to generate smart question suggestions:', error);
    return [];
  }
}

/**
 * Export conversation thread as text or JSON
 */
export const exportChatThread = async (args: ExportChatThreadInput, context: any): Promise<ExportChatThreadResponse> => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { threadId, format } = args;

  try {
    // Verify thread exists and user owns it
    const chatThread = await context.entities.ChatThread.findUnique({
      where: { 
        id: threadId,
        userId: context.user.id
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        topic: {
          select: {
            title: true,
            slug: true
          }
        }
      }
    });

    if (!chatThread) {
      throw new HttpError(404, 'Chat thread not found');
    }

    const exportData = {
      title: chatThread.title,
      topic: chatThread.topic?.title,
      createdAt: chatThread.createdAt,
      messageCount: chatThread.messages.length,
      messages: chatThread.messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
        metadata: msg.metadata
      }))
    };

    switch (format) {
      case 'json':
        return {
          content: JSON.stringify(exportData, null, 2),
          filename: `chat-${chatThread.topic?.slug || 'conversation'}-${new Date().toISOString().split('T')[0]}.json`,
          mimeType: 'application/json'
        };

      case 'markdown':
        const markdownContent = generateMarkdownExport(exportData);
        return {
          content: markdownContent,
          filename: `chat-${chatThread.topic?.slug || 'conversation'}-${new Date().toISOString().split('T')[0]}.md`,
          mimeType: 'text/markdown'
        };

      case 'text':
      default:
        const textContent = generateTextExport(exportData);
        return {
          content: textContent,
          filename: `chat-${chatThread.topic?.slug || 'conversation'}-${new Date().toISOString().split('T')[0]}.txt`,
          mimeType: 'text/plain'
        };
    }

  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Failed to export chat thread:', error);
    throw new HttpError(500, 'Failed to export conversation');
  }
};

/**
 * Generate markdown export format
 */
function generateMarkdownExport(data: any): string {
  let markdown = `# ${data.title}\n\n`;
  markdown += `**Topic:** ${data.topic}\n`;
  markdown += `**Created:** ${new Date(data.createdAt).toLocaleString()}\n`;
  markdown += `**Messages:** ${data.messageCount}\n\n`;
  markdown += `---\n\n`;

  for (const message of data.messages) {
    const role = message.role === 'USER' ? '👤 **You**' : '🤖 **AI Assistant**';
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    
    markdown += `## ${role} *(${timestamp})*\n\n`;
    markdown += `${message.content}\n\n`;
    
    if (message.metadata?.confidence) {
      markdown += `*Confidence: ${Math.round(message.metadata.confidence * 100)}%*\n\n`;
    }
  }

  return markdown;
}

/**
 * Generate plain text export format
 */
function generateTextExport(data: any): string {
  let text = `${data.title}\n`;
  text += `Topic: ${data.topic}\n`;
  text += `Created: ${new Date(data.createdAt).toLocaleString()}\n`;
  text += `Messages: ${data.messageCount}\n`;
  text += `${'='.repeat(50)}\n\n`;

  for (const message of data.messages) {
    const role = message.role === 'USER' ? 'You' : 'AI Assistant';
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    
    text += `[${timestamp}] ${role}:\n`;
    text += `${message.content}\n\n`;
  }

  return text;
}

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