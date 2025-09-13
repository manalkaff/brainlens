import { type ResearchResult, type SearchResult } from '../agents';
/**
 * Standardized communication protocol for research agents
 * Defines message formats, health monitoring, and inter-agent coordination
 */
export type AgentMessageType = 'HEALTH_CHECK' | 'SEARCH_REQUEST' | 'SEARCH_PROGRESS' | 'SEARCH_RESULT' | 'SEARCH_ERROR' | 'RESOURCE_SHARING' | 'COORDINATION_SYNC';
export interface AgentMessage {
    id: string;
    type: AgentMessageType;
    agentName: string;
    sessionId: string;
    timestamp: Date;
    payload: any;
}
export interface HealthCheckPayload {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastExecutionTime?: Date;
    averageResponseTime: number;
    successRate: number;
    errorCount: number;
    resourceUsage: {
        memory: number;
        cpu: number;
    };
    capabilities: string[];
}
export interface SearchRequestPayload {
    topic: string;
    context?: any;
    priority: 'low' | 'medium' | 'high';
    timeout: number;
    expectedResults: number;
}
export interface SearchProgressPayload {
    progress: number;
    currentEngine?: string;
    resultsFound: number;
    estimatedCompletion: number;
}
export interface SearchResultPayload {
    results: SearchResult[];
    summary?: string;
    subtopics?: string[];
    confidence: number;
    processingTime: number;
}
export interface SearchErrorPayload {
    error: string;
    errorCode: string;
    recoverable: boolean;
    retryAfter?: number;
    fallbackSuggestions?: string[];
}
export interface ResourceSharingPayload {
    resourceType: 'cache' | 'computation' | 'knowledge';
    data: any;
    expiry?: Date;
    shareWith: string[];
}
export interface CoordinationSyncPayload {
    phase: 'start' | 'progress' | 'complete' | 'abort';
    globalProgress: number;
    agentStatuses: Record<string, AgentHealthStatus>;
}
export interface AgentHealthStatus {
    agentName: string;
    status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
    lastHeartbeat: Date;
    metrics: {
        responseTime: number;
        successRate: number;
        errorRate: number;
        throughput: number;
    };
    capabilities: {
        engines: string[];
        features: string[];
        supportedFormats: string[];
    };
    resourceUsage: {
        memory: number;
        cpu: number;
        networkBandwidth: number;
    };
    errors: RecentError[];
}
export interface RecentError {
    timestamp: Date;
    error: string;
    errorCode: string;
    context?: any;
}
/**
 * Agent Communication Manager
 * Handles message routing, health monitoring, and coordination
 */
export declare class AgentCommunicationManager {
    private messageHandlers;
    private agentHealth;
    private messageHistory;
    private heartbeatInterval;
    constructor();
    /**
     * Send message to specific agent or broadcast to all
     */
    sendMessage(type: AgentMessageType, payload: any, targetAgent?: string, sessionId?: string): Promise<void>;
    /**
     * Register message handler for specific message type
     */
    onMessage(type: AgentMessageType, handler: (message: AgentMessage) => void): void;
    /**
     * Update agent health status
     */
    updateAgentHealth(agentName: string, health: Partial<AgentHealthStatus>): void;
    /**
     * Get health status for specific agent
     */
    getAgentHealth(agentName: string): AgentHealthStatus | undefined;
    /**
     * Get health status for all agents
     */
    getAllAgentHealth(): Record<string, AgentHealthStatus>;
    /**
     * Check if agent is healthy and available
     */
    isAgentHealthy(agentName: string): boolean;
    /**
     * Get system-wide health summary
     */
    getSystemHealth(): {
        overallStatus: 'healthy' | 'degraded' | 'unhealthy';
        agentCount: number;
        healthyAgents: number;
        degradedAgents: number;
        unhealthyAgents: number;
        averageResponseTime: number;
        systemLoad: number;
    };
    /**
     * Record agent execution metrics
     */
    recordAgentExecution(agentName: string, success: boolean, responseTime: number, resultCount: number, error?: string): void;
    /**
     * Get message history for debugging and analysis
     */
    getMessageHistory(sessionId?: string, agentName?: string, messageType?: AgentMessageType): AgentMessage[];
    /**
     * Create standardized agent response for orchestrator
     */
    createAgentResponse(agentName: string, sessionId: string, result: ResearchResult): AgentMessage;
    /**
     * Shutdown communication manager and cleanup resources
     */
    shutdown(): void;
    private initializeHealthMonitoring;
    private performHealthChecks;
    private createDefaultHealthStatus;
    private generateMessageId;
    private calculateResultConfidence;
}
export declare const agentCommunicationManager: AgentCommunicationManager;
//# sourceMappingURL=protocol.d.ts.map