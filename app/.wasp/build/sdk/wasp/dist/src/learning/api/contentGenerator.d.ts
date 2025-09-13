import type { Topic } from "wasp/entities";
export interface ContentGenerationOptions {
    userLevel: "beginner" | "intermediate" | "advanced";
    learningStyle: "visual" | "textual" | "interactive" | "video" | "conversational";
    contentType: "assessment" | "learning" | "exploration" | "quiz";
    maxTokens?: number;
    temperature?: number;
}
export interface SourceAttribution {
    id: string;
    title: string;
    url?: string;
    source: string;
    contentType: "article" | "video" | "academic" | "discussion" | "documentation";
    relevanceScore?: number;
}
export interface GeneratedContent {
    content: string;
    metadata: {
        contentType: string;
        userLevel: string;
        learningStyle: string;
        tokensUsed: number;
        generatedAt: Date;
        sections?: string[];
        sources?: SourceAttribution[];
    };
}
export interface LearningPath {
    startingPoint: string;
    recommendedPath: string[];
    estimatedDuration: number;
    content: GeneratedContent;
}
export interface AssessmentResult {
    userLevel: "beginner" | "intermediate" | "advanced";
    learningStyle: "visual" | "textual" | "interactive" | "video" | "conversational";
    interests: string[];
    priorKnowledge: string[];
    goals: string[];
}
export interface ResearchResult {
    title: string;
    content: string;
    url?: string;
    source: string;
    relevanceScore: number;
    contentType: "article" | "video" | "academic" | "discussion" | "documentation";
}
export interface MDXContent {
    content: string;
    frontmatter: {
        title: string;
        description?: string;
        tags?: string[];
        difficulty: string;
        estimatedReadTime: number;
    };
    sections: {
        id: string;
        title: string;
        content: string;
        subsections?: Array<{
            id: string;
            title: string;
            content: string;
        }>;
    }[];
}
/**
 * AI Content Generator Service
 * Handles all content generation using OpenAI with proper prompt engineering
 */
export declare class AIContentGenerator {
    private model;
    private defaultMaxTokens;
    private defaultTemperature;
    /**
     * Generate learning content based on topic and research results
     */
    generateLearningContent(topic: Topic, researchResults: ResearchResult[], options: ContentGenerationOptions): Promise<GeneratedContent>;
    /**
     * Generate personalized learning path based on assessment results
     */
    generateAssessmentContent(topic: Topic, userPreferences: AssessmentResult): Promise<LearningPath>;
    /**
     * Generate exploration content with MDX formatting using multi-agent approach
     */
    generateExplorationContent(topic: Topic, subtopics: string[], researchResults?: ResearchResult[], context?: any): Promise<MDXContent>;
    /**
     * Convert MultiAgentContent to legacy MDXContent format
     */
    private convertMultiAgentToMDX;
    /**
     * Legacy fallback for exploration content generation
     */
    private generateExplorationContentFallback;
    /**
     * Generate quiz questions based on content
     */
    generateQuizContent(topic: Topic, content: string, options: ContentGenerationOptions): Promise<GeneratedContent>;
    /**
     * Stream content generation for real-time display
     */
    streamContentGeneration(topic: Topic, researchResults: ResearchResult[], options: ContentGenerationOptions): AsyncGenerator<string, void, unknown>;
    /**
     * Build prompt for learning content generation
     */
    private buildLearningContentPrompt;
    /**
     * Build prompt for assessment-based content generation
     */
    private buildAssessmentContentPrompt;
    /**
     * Build prompt for exploration content with MDX structure
     */
    private buildExplorationContentPrompt;
    /**
     * Build prompt for quiz content generation
     */
    private buildQuizContentPrompt;
    /**
     * Extract sections from generated content
     */
    private extractSections;
    /**
     * Parse assessment response into structured format
     */
    private parseAssessmentResponse;
    /**
     * Parse MDX content into structured format
     */
    private parseMDXContent;
    /**
     * Extract sections with their content
     */
    private extractSectionsWithContent;
    /**
     * Generate URL-friendly ID from title
     */
    private generateId;
}
export declare const aiContentGenerator: AIContentGenerator;
//# sourceMappingURL=contentGenerator.d.ts.map