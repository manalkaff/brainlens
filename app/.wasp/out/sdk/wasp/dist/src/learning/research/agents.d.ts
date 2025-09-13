export interface ResearchAgent {
    name: string;
    description: string;
    engines: string[];
    prompt: string;
    execute: (topic: string, context?: any) => Promise<ResearchResult>;
}
export interface ResearchResult {
    agent: string;
    topic: string;
    results: SearchResult[];
    summary?: string;
    subtopics?: string[];
    status: 'success' | 'error' | 'partial';
    error?: string;
    timestamp: Date;
}
export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    source: string;
    relevanceScore?: number;
    metadata?: Record<string, any>;
}
declare abstract class BaseResearchAgent implements ResearchAgent {
    abstract name: string;
    abstract description: string;
    abstract engines: string[];
    abstract prompt: string;
    execute(topic: string, context?: any): Promise<ResearchResult>;
    protected abstract performSearch(topic: string, context?: any): Promise<SearchResult[]>;
    protected generateSummary(results: SearchResult[], topic: string): Promise<string>;
    protected identifySubtopics(results: SearchResult[], topic: string): Promise<string[]>;
}
export declare class GeneralResearchAgent extends BaseResearchAgent {
    name: string;
    description: string;
    engines: string[];
    prompt: string;
    protected performSearch(topic: string, context?: any): Promise<SearchResult[]>;
    private deduplicateResults;
}
export declare class AcademicResearchAgent extends BaseResearchAgent {
    name: string;
    description: string;
    engines: string[];
    prompt: string;
    protected performSearch(topic: string, context?: any): Promise<SearchResult[]>;
    private extractCitations;
    private extractYear;
    private extractVenue;
    private deduplicateResults;
}
export declare class ComputationalAgent extends BaseResearchAgent {
    name: string;
    description: string;
    engines: string[];
    prompt: string;
    protected performSearch(topic: string, context?: any): Promise<SearchResult[]>;
    private detectFormulas;
    private detectAlgorithms;
    private detectCalculations;
    private assessComplexity;
    private deduplicateResults;
}
export declare class VideoLearningAgent extends BaseResearchAgent {
    name: string;
    description: string;
    engines: string[];
    prompt: string;
    protected performSearch(topic: string, context?: any): Promise<SearchResult[]>;
    private estimateDuration;
    private extractViews;
    private extractAuthor;
    private assessEducationalValue;
    private assessDifficulty;
    private matchesUserLevel;
    private deduplicateResults;
}
export declare class CommunityDiscussionAgent extends BaseResearchAgent {
    name: string;
    description: string;
    engines: string[];
    prompt: string;
    protected performSearch(topic: string, context?: any): Promise<SearchResult[]>;
    private extractSubreddit;
    private extractUpvotes;
    private extractCommentCount;
    private extractAuthor;
    private classifyDiscussion;
    private analyzeSentiment;
    private assessPracticalValue;
    private calculateEngagementScore;
    private deduplicateResults;
}
export declare class ResearchAgentFactory {
    private static agents;
    static getAllAgents(): ResearchAgent[];
    static getAgent(name: string): ResearchAgent | undefined;
    static getAgentsByType(engines: string[]): ResearchAgent[];
    static executeAllAgents(topic: string, context?: any): Promise<ResearchResult[]>;
}
export {};
//# sourceMappingURL=agents.d.ts.map