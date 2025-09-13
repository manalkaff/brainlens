import type { SearchResult } from "../research/vectorStore";
export interface ConversationContext {
    topicId: string;
    topicTitle: string;
    userKnowledgeLevel?: "beginner" | "intermediate" | "advanced";
    learningStyle?: "visual" | "auditory" | "kinesthetic" | "reading";
    conversationHistory: ConversationMessage[];
    maxContextTokens?: number;
}
export interface ConversationMessage {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
    metadata?: {
        sources?: SearchResult[];
        confidence?: number;
        relevantContent?: string[];
    };
}
export interface RAGResponse {
    content: string;
    sources: SearchResult[];
    confidence: number;
    suggestedQuestions: string[];
    metadata: {
        contextTokens: number;
        responseTokens: number;
        retrievedDocuments: number;
        processingTime: number;
        queryExpansion?: string[];
        intentClassification?: string;
        fallbackUsed?: boolean;
    };
}
export interface PromptTemplate {
    systemPrompt: string;
    userPrompt: string;
    contextPrompt: string;
}
export declare class RAGSystem {
    private maxTokens;
    private temperature;
    private defaultMaxTokens;
    private defaultTemperature;
    private maxResponseTokens;
    constructor(maxTokens?: number, temperature?: number);
    /**
     * Generate a contextual response using RAG with advanced features
     */
    generateResponse(query: string, context: ConversationContext): Promise<RAGResponse>;
    /**
     * Build enhanced conversation history context with intelligent summarization
     */
    private buildEnhancedConversationContext;
    /**
     * Create adaptive prompt template based on context, preferences, and intent
     */
    private createAdaptivePromptTemplate;
    /**
     * Get learning style specific instructions
     */
    private getLearningStyleInstructions;
    /**
     * Generate AI response using OpenAI
     */
    private generateAIResponse;
    /**
     * Generate intelligent follow-up questions based on context and intent
     */
    private generateIntelligentFollowUpQuestions;
    /**
     * Calculate enhanced confidence score with multiple factors
     */
    private calculateEnhancedConfidence;
    /**
     * Search for relevant content with query expansion
     */
    searchRelevantContent(query: string, topicId: string, options?: {
        limit?: number;
        includeRelated?: boolean;
        contentTypes?: Array<"summary" | "subtopic" | "research" | "generated">;
    }): Promise<SearchResult[]>;
    /**
     * Expand query with related terms for better retrieval
     */
    private expandQuery;
    /**
     * Preprocess query with intent classification and expansion
     */
    private preprocessQuery;
    /**
     * Classify user intent for adaptive responses
     */
    private classifyIntent;
    /**
     * Perform enhanced retrieval with multiple strategies
     */
    private performEnhancedRetrieval;
    /**
     * Generate enhanced AI response with intent-specific handling
     */
    private generateEnhancedAIResponse;
    /**
     * Generate fallback response when main RAG fails
     */
    private generateFallbackResponse;
    /**
     * Score message relevance to current query
     */
    private scoreMessageRelevance;
    /**
     * Get intent-specific instructions
     */
    private getIntentSpecificInstructions;
    /**
     * Assess source quality
     */
    private assessSourceQuality;
    /**
     * Get quality-specific instructions
     */
    private getQualitySpecificInstructions;
    /**
     * Optimize conversation context by summarizing older messages
     */
    optimizeConversationHistory(history: ConversationMessage[], maxMessages?: number): Promise<ConversationMessage[]>;
}
export declare const ragSystem: RAGSystem;
export interface QueryAnalysis {
    expandedQuery: string;
    intent: string;
    queryTerms: string[];
}
export interface EnhancedConversationContext {
    context: string;
    tokens: number;
    relevance: number;
}
export interface ConversationSummary {
    summary: string;
    keyTopics: string[];
    messageCount: number;
    duration: number;
}
//# sourceMappingURL=ragSystem.d.ts.map