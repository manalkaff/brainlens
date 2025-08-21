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
      // Validate inputs
      if (!threadId || !topicId || !topicTitle || !userId) {
        throw new HttpError(400, 'Missing required parameters for conversation session');
      }

      // Check if session already exists and is valid
      const existingSession = this.activeSessions.get(threadId);
      if (existingSession && existingSession.isActive) {
        // Verify session belongs to the same user and topic
        if (existingSession.userId === userId && existingSession.topicId === topicId) {
          existingSession.lastActivity = new Date();
          
          // Update preferences if provided
          if (userPreferences) {
            if (userPreferences.knowledgeLevel) {
              existingSession.context.userKnowledgeLevel = userPreferences.knowledgeLevel;
            }
            if (userPreferences.learningStyle) {
              existingSession.context.learningStyle = userPreferences.learningStyle;
            }
          }
          
          console.log(`Resumed conversation session: ${threadId}`);
          return existingSession;
        } else {
          // Session exists but for different user/topic - end it and create new one
          this.endConversation(threadId);
        }
      }

      // Create new conversation context with enhanced initialization
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
      
      console.log(`Started new conversation session: ${threadId} for topic: ${topicTitle}`);
      return session;

    } catch (error) {
      console.error('Failed to start conversation:', error);
      if (error instanceof HttpError) {
        throw error;
      }
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
      // Validate inputs
      if (!threadId || !userMessage?.trim()) {
        throw new HttpError(400, 'Thread ID and message content are required');
      }

      const session = this.activeSessions.get(threadId);
      if (!session || !session.isActive) {
        throw new HttpError(404, 'Conversation session not found or inactive. Please start a new conversation.');
      }

      // Update session activity
      session.lastActivity = new Date();

      // Load recent conversation history from database if context is empty
      if (session.context.conversationHistory.length === 0) {
        await this.loadConversationHistory(session, dbContext);
      }

      // Validate message length
      const trimmedMessage = userMessage.trim();
      if (trimmedMessage.length > 4000) {
        throw new HttpError(400, 'Message is too long. Please keep messages under 4000 characters.');
      }

      // Create user message
      const userMessageData: ConversationMessage = {
        role: 'user',
        content: trimmedMessage,
        timestamp: new Date()
      };

      // Add to context with conversation history management
      session.context.conversationHistory.push(userMessageData);

      // Optimize conversation history before processing if needed
      if (session.context.conversationHistory.length > 20) {
        try {
          session.context.conversationHistory = await ragSystem.optimizeConversationHistory(
            session.context.conversationHistory,
            15
          );
        } catch (optimizationError) {
          console.warn('Failed to optimize conversation history:', optimizationError);
          // Fallback: keep only recent messages
          session.context.conversationHistory = session.context.conversationHistory.slice(-15);
        }
      }

      // Generate RAG response with enhanced error handling
      let ragResponse: RAGResponse;
      try {
        ragResponse = await ragSystem.generateResponse(
          trimmedMessage,
          session.context
        );
      } catch (ragError) {
        console.error('RAG system failed:', ragError);
        
        // Fallback response when RAG fails
        ragResponse = {
          content: "I apologize, but I'm having trouble accessing the relevant information right now. Could you please rephrase your question or try again in a moment?",
          sources: [],
          confidence: 0.1,
          suggestedQuestions: [
            "Can you rephrase your question?",
            "What specific aspect would you like to know more about?",
            "Would you like me to explain the basics of this topic?"
          ],
          metadata: {
            contextTokens: 0,
            responseTokens: 50,
            retrievedDocuments: 0,
            processingTime: 0
          }
        };
      }

      // Create assistant message with enhanced metadata
      const assistantMessageData: ConversationMessage = {
        role: 'assistant',
        content: ragResponse.content,
        timestamp: new Date(),
        metadata: {
          sources: ragResponse.sources,
          confidence: ragResponse.confidence,
          relevantContent: ragResponse.sources.map(s => s.content.substring(0, 200)),
          processingTime: ragResponse.metadata.processingTime,
          contextTokens: ragResponse.metadata.contextTokens,
          retrievedDocuments: ragResponse.metadata.retrievedDocuments
        }
      };

      // Add to context
      session.context.conversationHistory.push(assistantMessageData);

      // Save messages to database with error handling
      let savedUserMessage: MessageWithMetadata;
      let savedAssistantMessage: MessageWithMetadata;

      try {
        savedUserMessage = await this.saveMessage(
          threadId,
          userMessageData,
          dbContext
        );

        savedAssistantMessage = await this.saveMessage(
          threadId,
          assistantMessageData,
          dbContext,
          {
            sources: ragResponse.sources,
            confidence: ragResponse.confidence,
            suggestedQuestions: ragResponse.suggestedQuestions,
            processingTime: ragResponse.metadata.processingTime,
            contextTokens: ragResponse.metadata.contextTokens,
            retrievedDocuments: ragResponse.metadata.retrievedDocuments
          }
        );
      } catch (saveError) {
        console.error('Failed to save messages to database:', saveError);
        
        // Create fallback message objects if database save fails
        savedUserMessage = {
          id: `temp-user-${Date.now()}`,
          threadId,
          role: 'USER' as any,
          content: userMessageData.content,
          createdAt: userMessageData.timestamp,
          updatedAt: userMessageData.timestamp,
          metadata: null
        };

        savedAssistantMessage = {
          id: `temp-assistant-${Date.now()}`,
          threadId,
          role: 'ASSISTANT' as any,
          content: assistantMessageData.content,
          createdAt: assistantMessageData.timestamp,
          updatedAt: assistantMessageData.timestamp,
          metadata: assistantMessageData.metadata,
          sources: ragResponse.sources,
          confidence: ragResponse.confidence,
          suggestedQuestions: ragResponse.suggestedQuestions,
          processingTime: ragResponse.metadata.processingTime
        };
      }

      console.log(`Processed message in thread ${threadId}: ${ragResponse.sources.length} sources, confidence: ${ragResponse.confidence}`);

      return {
        userMessage: savedUserMessage,
        assistantMessage: savedAssistantMessage,
        suggestedQuestions: ragResponse.suggestedQuestions
      };

    } catch (error) {
      console.error('Failed to process message:', error);
      
      if (error instanceof HttpError) {
        throw error;
      }
      
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