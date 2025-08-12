import { HttpError } from 'wasp/server';
import { ragSystem, ConversationContext, ConversationMessage, RAGResponse } from './ragSystem';
import type { ChatThread, Message } from 'wasp/entities';
import { MessageRole } from '@prisma/client';

export interface ConversationSession {
  threadId: string;
  topicId: string;
  topicTitle: string;
  userId: string;
  context: ConversationContext;
  isActive: boolean;
  lastActivity: Date;
}

export interface MessageWithMetadata extends Message {
  sources?: any[];
  confidence?: number;
  suggestedQuestions?: string[];
  processingTime?: number;
}

export class ConversationManager {
  private activeSessions: Map<string, ConversationSession> = new Map();
  private sessionTimeout: number = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Clean up inactive sessions periodically
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Start or resume a conversation session
   */
  async startConversation(
    threadId: string,
    topicId: string,
    topicTitle: string,
    userId: string,
    userPreferences?: {
      knowledgeLevel?: 'beginner' | 'intermediate' | 'advanced';
      learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    }
  ): Promise<ConversationSession> {
    try {
      // Check if session already exists
      const existingSession = this.activeSessions.get(threadId);
      if (existingSession && existingSession.isActive) {
        existingSession.lastActivity = new Date();
        return existingSession;
      }

      // Create new conversation context
      const context: ConversationContext = {
        topicId,
        topicTitle,
        userKnowledgeLevel: userPreferences?.knowledgeLevel || 'intermediate',
        learningStyle: userPreferences?.learningStyle || 'reading',
        conversationHistory: [],
        maxContextTokens: 4000
      };

      const session: ConversationSession = {
        threadId,
        topicId,
        topicTitle,
        userId,
        context,
        isActive: true,
        lastActivity: new Date()
      };

      this.activeSessions.set(threadId, session);
      return session;

    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw new HttpError(500, 'Failed to start conversation session');
    }
  }

  /**
   * Process a user message and generate AI response
   */
  async processMessage(
    threadId: string,
    userMessage: string,
    dbContext: any // Wasp database context
  ): Promise<{
    userMessage: MessageWithMetadata;
    assistantMessage: MessageWithMetadata;
    suggestedQuestions: string[];
  }> {
    try {
      const session = this.activeSessions.get(threadId);
      if (!session || !session.isActive) {
        throw new HttpError(404, 'Conversation session not found or inactive');
      }

      // Update session activity
      session.lastActivity = new Date();

      // Load recent conversation history from database if context is empty
      if (session.context.conversationHistory.length === 0) {
        await this.loadConversationHistory(session, dbContext);
      }

      // Create user message
      const userMessageData: ConversationMessage = {
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      };

      // Add to context
      session.context.conversationHistory.push(userMessageData);

      // Generate RAG response
      const ragResponse = await ragSystem.generateResponse(
        userMessage,
        session.context
      );

      // Create assistant message
      const assistantMessageData: ConversationMessage = {
        role: 'assistant',
        content: ragResponse.content,
        timestamp: new Date(),
        metadata: {
          sources: ragResponse.sources,
          confidence: ragResponse.confidence,
          relevantContent: ragResponse.sources.map(s => s.content.substring(0, 200))
        }
      };

      // Add to context
      session.context.conversationHistory.push(assistantMessageData);

      // Optimize conversation history if it's getting too long
      if (session.context.conversationHistory.length > 20) {
        session.context.conversationHistory = await ragSystem.optimizeConversationHistory(
          session.context.conversationHistory,
          15
        );
      }

      // Save messages to database
      const savedUserMessage = await this.saveMessage(
        threadId,
        userMessageData,
        dbContext
      );

      const savedAssistantMessage = await this.saveMessage(
        threadId,
        assistantMessageData,
        dbContext,
        {
          sources: ragResponse.sources,
          confidence: ragResponse.confidence,
          suggestedQuestions: ragResponse.suggestedQuestions,
          processingTime: ragResponse.metadata.processingTime
        }
      );

      return {
        userMessage: savedUserMessage,
        assistantMessage: savedAssistantMessage,
        suggestedQuestions: ragResponse.suggestedQuestions
      };

    } catch (error) {
      console.error('Failed to process message:', error);
      throw new HttpError(500, `Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load conversation history from database
   */
  private async loadConversationHistory(
    session: ConversationSession,
    dbContext: any
  ): Promise<void> {
    try {
      const messages = await dbContext.entities.Message.findMany({
        where: { threadId: session.threadId },
        orderBy: { createdAt: 'asc' },
        take: 20 // Load last 20 messages
      });

      session.context.conversationHistory = messages.map((msg: Message) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: msg.createdAt,
        metadata: msg.metadata ? JSON.parse(JSON.stringify(msg.metadata)) : undefined
      }));

    } catch (error) {
      console.error('Failed to load conversation history:', error);
      // Continue with empty history
    }
  }

  /**
   * Save message to database
   */
  private async saveMessage(
    threadId: string,
    message: ConversationMessage,
    dbContext: any,
    additionalMetadata?: any
  ): Promise<MessageWithMetadata> {
    try {
      const messageRole = message.role.toUpperCase() as MessageRole;
      
      const metadata = {
        ...message.metadata,
        ...additionalMetadata
      };

      const savedMessage = await dbContext.entities.Message.create({
        data: {
          threadId,
          role: messageRole,
          content: message.content,
          metadata: Object.keys(metadata).length > 0 ? metadata : null
        }
      });

      return {
        ...savedMessage,
        sources: metadata.sources,
        confidence: metadata.confidence,
        suggestedQuestions: metadata.suggestedQuestions,
        processingTime: metadata.processingTime
      };

    } catch (error) {
      console.error('Failed to save message:', error);
      throw new HttpError(500, 'Failed to save message to database');
    }
  }

  /**
   * Get conversation session
   */
  getSession(threadId: string): ConversationSession | undefined {
    return this.activeSessions.get(threadId);
  }

  /**
   * Update user preferences for a session
   */
  updateUserPreferences(
    threadId: string,
    preferences: {
      knowledgeLevel?: 'beginner' | 'intermediate' | 'advanced';
      learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    }
  ): void {
    const session = this.activeSessions.get(threadId);
    if (session) {
      if (preferences.knowledgeLevel) {
        session.context.userKnowledgeLevel = preferences.knowledgeLevel;
      }
      if (preferences.learningStyle) {
        session.context.learningStyle = preferences.learningStyle;
      }
      session.lastActivity = new Date();
    }
  }

  /**
   * End a conversation session
   */
  endConversation(threadId: string): void {
    const session = this.activeSessions.get(threadId);
    if (session) {
      session.isActive = false;
      // Remove from active sessions after a delay to allow for cleanup
      setTimeout(() => {
        this.activeSessions.delete(threadId);
      }, 60000); // 1 minute delay
    }
  }

  /**
   * Clean up inactive sessions
   */
  private cleanupInactiveSessions(): void {
    const now = new Date();
    const sessionsToRemove: string[] = [];

    for (const [threadId, session] of this.activeSessions.entries()) {
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
      
      if (timeSinceLastActivity > this.sessionTimeout || !session.isActive) {
        sessionsToRemove.push(threadId);
      }
    }

    for (const threadId of sessionsToRemove) {
      this.activeSessions.delete(threadId);
      console.log(`Cleaned up inactive conversation session: ${threadId}`);
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    activeSessions: number;
    totalSessions: number;
    averageSessionDuration: number;
  } {
    const activeSessions = Array.from(this.activeSessions.values()).filter(s => s.isActive);
    const now = new Date();
    
    const totalDuration = activeSessions.reduce((sum, session) => {
      return sum + (now.getTime() - session.lastActivity.getTime());
    }, 0);

    const averageSessionDuration = activeSessions.length > 0 
      ? totalDuration / activeSessions.length 
      : 0;

    return {
      activeSessions: activeSessions.length,
      totalSessions: this.activeSessions.size,
      averageSessionDuration: Math.round(averageSessionDuration / 1000) // Convert to seconds
    };
  }

  /**
   * Generate conversation summary for a thread
   */
  async generateConversationSummary(
    threadId: string,
    dbContext: any
  ): Promise<{
    summary: string;
    keyTopics: string[];
    messageCount: number;
    duration: number;
  }> {
    try {
      const messages = await dbContext.entities.Message.findMany({
        where: { threadId },
        orderBy: { createdAt: 'asc' }
      });

      if (messages.length === 0) {
        return {
          summary: 'No messages in this conversation.',
          keyTopics: [],
          messageCount: 0,
          duration: 0
        };
      }

      const conversationText = messages
        .map((msg: Message) => `${msg.role}: ${msg.content}`)
        .join('\n');

      const firstMessage = messages[0];
      const lastMessage = messages[messages.length - 1];
      const duration = lastMessage.createdAt.getTime() - firstMessage.createdAt.getTime();

      // Use RAG system to generate summary (simplified approach)
      const session = this.activeSessions.get(threadId);
      if (session) {
        const summaryResponse = await ragSystem.generateResponse(
          `Please provide a brief summary of this conversation and identify 3-5 key topics discussed: ${conversationText.substring(0, 2000)}`,
          {
            ...session.context,
            conversationHistory: [] // Don't include history for summary generation
          }
        );

        // Extract key topics from the response (simplified)
        const keyTopics = this.extractKeyTopics(summaryResponse.content);

        return {
          summary: summaryResponse.content,
          keyTopics,
          messageCount: messages.length,
          duration: Math.round(duration / 1000) // Convert to seconds
        };
      }

      return {
        summary: 'Conversation summary not available.',
        keyTopics: [],
        messageCount: messages.length,
        duration: Math.round(duration / 1000)
      };

    } catch (error) {
      console.error('Failed to generate conversation summary:', error);
      throw new HttpError(500, 'Failed to generate conversation summary');
    }
  }

  /**
   * Extract key topics from summary text (simplified implementation)
   */
  private extractKeyTopics(summaryText: string): string[] {
    // This is a simplified implementation
    // In a production system, you might use NLP libraries or AI to extract topics
    const commonTopicWords = [
      'concept', 'principle', 'theory', 'method', 'approach', 'technique',
      'algorithm', 'process', 'system', 'model', 'framework', 'pattern'
    ];

    const words = summaryText.toLowerCase().split(/\W+/);
    const topics = words.filter(word => 
      word.length > 4 && 
      !commonTopicWords.includes(word) &&
      /^[a-z]+$/.test(word)
    );

    // Return unique topics, limited to 5
    return [...new Set(topics)].slice(0, 5);
  }
}

// Export singleton instance
export const conversationManager = new ConversationManager();