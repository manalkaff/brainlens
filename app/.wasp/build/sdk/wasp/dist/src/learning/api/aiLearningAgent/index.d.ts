import { TopicResearchRequest, TopicResearchResult, TopicUnderstanding, GeneratedContent } from './types';
/**
 * AI Learning Agent - Core of the iterative research system
 * Uses Vercel AI SDK to create an intelligent agent that uses SearXNG as tools
 *
 * This is the main orchestrator class that composes all the specialized modules
 * to provide the complete learning agent functionality while maintaining the
 * original public API.
 */
export declare class AILearningAgent {
    private topicUnderstanding;
    private researchPlanning;
    private researchExecution;
    private synthesis;
    private contentGeneration;
    private subtopicIdentification;
    private validation;
    private fallback;
    private utils;
    /**
     * Understand a topic from scratch using basic research
     * This function performs initial research to understand what a topic is about
     * without relying on AI's pre-trained knowledge
     */
    understandTopic(topic: string): Promise<TopicUnderstanding>;
    /**
     * Main research and generation function with comprehensive progress tracking
     * This is the core function that recursively explores topics
     */
    researchAndGenerate(request: TopicResearchRequest): Promise<TopicResearchResult>;
    /**
     * Generate comprehensive content using AI with progressive learning structure
     *
     * Enhanced with validation and fallback mechanisms
     */
    private generateContent;
    formatAsMDX: (content: {
        title: string;
        sections: import("./types").ContentSection[];
        keyTakeaways: string[];
        nextSteps: string[];
    }) => string;
    estimateReadTime: (contentLength: number) => number;
    generateCacheKey: (topic: string, userContext?: any) => string;
    calculateConfidenceScore: (researchResults: import("../../research/agents").SearchResult[], content: GeneratedContent) => number;
}
export declare const aiLearningAgent: AILearningAgent;
export * from './types';
//# sourceMappingURL=index.d.ts.map