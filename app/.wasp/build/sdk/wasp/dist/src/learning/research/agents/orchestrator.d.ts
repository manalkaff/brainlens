import { type ResearchResult } from '../agents';
import { type AgentConfigName } from '../searxng';
export interface ResearchSession {
    id: string;
    topic: string;
    context?: any;
    startTime: Date;
    endTime?: Date;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'partial';
    agents: AgentStatus[];
    results: ResearchResult[];
    errors: string[];
}
export interface AgentStatus {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
    startTime?: Date;
    endTime?: Date;
    progress: number;
    resultCount: number;
    error?: string;
}
export interface OrchestrationOptions {
    timeout: number;
    maxConcurrentAgents: number;
    failureTolerance: number;
    priority: AgentConfigName[];
    circuitBreakerEnabled: boolean;
    gracefulDegradationEnabled: boolean;
}
export declare class ResearchOrchestrator {
    private progressTracker;
    private circuitBreaker?;
    private gracefulDegradation?;
    private activeSessions;
    constructor();
    /**
     * Orchestrate multi-agent research with parallel execution
     */
    orchestrateResearch(topic: string, context?: any, options?: Partial<OrchestrationOptions>): Promise<ResearchSession>;
    /**
     * Execute research agents in parallel with proper timeout and error handling
     */
    private executeAgentsInParallel;
    /**
     * Execute individual agent with monitoring and circuit breaker
     */
    private executeAgentWithMonitoring;
    private generateSessionId;
    private initializeAgentStatuses;
    private updateAgentStatus;
    private updateAgentProgress;
    private getAgentEngines;
    private calculateConfidence;
    private createTimeoutPromise;
    private createAgentTimeoutPromise;
    getActiveSession(sessionId: string): ResearchSession | undefined;
    getAllActiveSessions(): ResearchSession[];
    getSessionStats(): {
        active: number;
        total: number;
    };
}
export declare const researchOrchestrator: ResearchOrchestrator;
//# sourceMappingURL=orchestrator.d.ts.map