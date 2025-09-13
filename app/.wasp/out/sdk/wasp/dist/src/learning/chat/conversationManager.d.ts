import { ConversationContext } from './ragSystem';
import type { Message } from 'wasp/entities';
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
export declare class ConversationManager {
    private activeSessions;
    private sessionTimeout;
    constructor();
    /**
     * Start or resume a conversation session
     */
    startConversation(threadId: string, topicId: string, topicTitle: string, userId: string, userPreferences?: {
        knowledgeLevel?: 'beginner' | 'intermediate' | 'advanced';
        learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    }): Promise<ConversationSession>;
    /**
     * Process a user message and generate AI response
     */
    processMessage(threadId: string, userMessage: string, dbContext: any): Promise<{
        userMessage: MessageWithMetadata;
        assistantMessage: MessageWithMetadata;
        suggestedQuestions: string[];
    }>;
    /**
     * Load conversation history from database
     */
    private loadConversationHistory;
    /**
     * Save message to database
     */
    private saveMessage;
    /**
     * Get conversation session
     */
    getSession(threadId: string): ConversationSession | undefined;
    /**
     * Update user preferences for a session
     */
    updateUserPreferences(threadId: string, preferences: {
        knowledgeLevel?: 'beginner' | 'intermediate' | 'advanced';
        learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    }): void;
    /**
     * End a conversation session
     */
    endConversation(threadId: string): void;
    /**
     * Clean up inactive sessions
     */
    private cleanupInactiveSessions;
    /**
     * Get session statistics
     */
    getSessionStats(): {
        activeSessions: number;
        totalSessions: number;
        averageSessionDuration: number;
    };
    /**
     * Generate conversation summary for a thread
     */
    generateConversationSummary(threadId: string, dbContext: any): Promise<{
        summary: string;
        keyTopics: string[];
        messageCount: number;
        duration: number;
    }>;
    /**
     * Extract key topics from summary text (simplified implementation)
     */
    private extractKeyTopics;
}
export declare const conversationManager: ConversationManager;
//# sourceMappingURL=conversationManager.d.ts.map