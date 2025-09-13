import { ResearchResult, SearchResult } from './agents';
export interface ResearchPipelineConfig {
    maxDepth: number;
    maxSubtopicsPerLevel: number;
    enableRealTimeUpdates: boolean;
    agentTimeout: number;
    retryAttempts: number;
}
export interface ResearchStatus {
    topicId: string;
    topic: string;
    currentDepth: number;
    totalAgents: number;
    completedAgents: number;
    activeAgents: string[];
    status: 'initializing' | 'researching' | 'aggregating' | 'completed' | 'error';
    progress: number;
    startTime: Date;
    estimatedCompletion?: Date;
    errors: string[];
}
export interface AgentCoordinationResult {
    topic: string;
    topicId: string;
    depth: number;
    agentResults: ResearchResult[];
    aggregatedContent: AggregatedContent;
    identifiedSubtopics: string[];
    status: 'success' | 'partial' | 'error';
    errors: string[];
}
export interface AggregatedContent {
    summary: string;
    keyPoints: string[];
    sources: SearchResult[];
    contentByAgent: Record<string, ResearchResult>;
    confidence: number;
    completeness: number;
}
declare const DEFAULT_CONFIG: ResearchPipelineConfig;
export declare class MultiAgentCoordinator {
    private config;
    private statusCallbacks;
    constructor(config?: Partial<ResearchPipelineConfig>);
    registerStatusCallback(topicId: string, callback: (status: ResearchStatus) => void): void;
    unregisterStatusCallback(topicId: string): void;
    private emitStatusUpdate;
    coordinateAgents(topic: string, topicId: string, depth?: number, context?: any): Promise<AgentCoordinationResult>;
    private executeAgentsWithRetry;
    private createTimeoutPromise;
    private aggregateResults;
    private deduplicateSources;
    private generateAggregatedSummary;
    private extractKeyPoints;
    private calculateConfidence;
    private calculateCompleteness;
    private storeResultsInVectorDB;
    private identifySubtopics;
}
export declare class RecursiveResearchSystem {
    private coordinator;
    private researchHistory;
    constructor(config?: Partial<ResearchPipelineConfig>);
    startRecursiveResearch(rootTopic: string, rootTopicId: string, context: any, onStatusUpdate?: (status: ResearchStatus) => void, onDepthComplete?: (result: AgentCoordinationResult) => void): Promise<RecursiveResearchResult>;
    private researchNodeRecursively;
    private countNodes;
    private countCompletedNodes;
    getResearchHistory(): Map<string, AgentCoordinationResult>;
    clearHistory(): void;
}
export interface ResearchNode {
    topic: string;
    topicId: string;
    depth: number;
    result: AgentCoordinationResult | null;
    children: ResearchNode[];
    status: 'pending' | 'researching' | 'completed' | 'error';
    error?: string;
}
export interface RecursiveResearchResult {
    rootTopic: string;
    rootTopicId: string;
    researchTree: ResearchNode;
    totalNodes: number;
    completedNodes: number;
    startTime: Date;
    endTime: Date;
    status: 'completed' | 'error';
    error?: string;
}
export { DEFAULT_CONFIG as DEFAULT_RESEARCH_CONFIG };
//# sourceMappingURL=pipeline.d.ts.map