import { ResearchStatus, AgentCoordinationResult } from './pipeline';
export type { ResearchStatus } from './pipeline';
export interface StreamingResearchUpdate {
    type: 'status' | 'progress' | 'content' | 'error' | 'complete' | 'heartbeat';
    topicId: string;
    timestamp: Date;
    data: any;
}
export interface ResearchProgressUpdate extends StreamingResearchUpdate {
    type: 'progress';
    data: {
        currentAgent: string;
        completedAgents: number;
        totalAgents: number;
        currentDepth: number;
        maxDepth: number;
        progress: number;
        estimatedTimeRemaining?: number;
    };
}
export interface ResearchStatusUpdate extends StreamingResearchUpdate {
    type: 'status';
    data: ResearchStatus;
}
export interface ResearchContentUpdate extends StreamingResearchUpdate {
    type: 'content';
    data: {
        agent: string;
        topic: string;
        depth: number;
        partialContent: string;
        isComplete: boolean;
    };
}
export interface ResearchErrorUpdate extends StreamingResearchUpdate {
    type: 'error';
    data: {
        error: string;
        agent?: string;
        recoverable: boolean;
    };
}
export interface ResearchCompleteUpdate extends StreamingResearchUpdate {
    type: 'complete';
    data: {
        result: AgentCoordinationResult;
        totalDuration: number;
        nodesGenerated: number;
    };
}
export declare class ResearchStreamingManager {
    private static instance;
    private connections;
    private topicStreams;
    static getInstance(): ResearchStreamingManager;
    addConnection(topicId: string, connectionId: string, response: Response): void;
    removeConnection(connectionId: string): void;
    broadcastToTopic(topicId: string, update: StreamingResearchUpdate): void;
    private sendToConnection;
    broadcastStatusUpdate(status: ResearchStatus): void;
    broadcastProgressUpdate(topicId: string, progress: ResearchProgressUpdate['data']): void;
    broadcastContentUpdate(topicId: string, content: ResearchContentUpdate['data']): void;
    broadcastErrorUpdate(topicId: string, error: ResearchErrorUpdate['data']): void;
    broadcastCompleteUpdate(topicId: string, result: ResearchCompleteUpdate['data']): void;
    getConnectionCount(topicId: string): number;
    getActiveTopics(): string[];
    getGlobalStatistics(): {
        totalConnections: number;
        activeTopics: number;
        topics: string[];
        uptime: number;
    };
    cleanup(): void;
}
export interface UseResearchStreamingOptions {
    topicId: string;
    onStatusUpdate?: (status: ResearchStatus) => void;
    onProgressUpdate?: (progress: ResearchProgressUpdate['data']) => void;
    onContentUpdate?: (content: ResearchContentUpdate['data']) => void;
    onError?: (error: ResearchErrorUpdate['data']) => void;
    onComplete?: (result: ResearchCompleteUpdate['data']) => void;
    autoReconnect?: boolean;
    reconnectDelay?: number;
}
export interface ResearchStreamingState {
    isConnected: boolean;
    isReconnecting: boolean;
    lastUpdate: Date | null;
    connectionError: string | null;
    currentStatus: ResearchStatus | null;
    progress: ResearchProgressUpdate['data'] | null;
    latestContent: ResearchContentUpdate['data'][] | null;
    errors: ResearchErrorUpdate['data'][];
}
export declare const StreamingUtils: {
    generateConnectionId(): string;
    formatStreamingMessage(update: StreamingResearchUpdate): string;
    calculateEstimatedCompletion(startTime: Date, progress: number, currentTime?: Date): Date | null;
    formatDuration(milliseconds: number): string;
    isValidUpdate(update: any): update is StreamingResearchUpdate;
};
export interface StreamingConnection {
    id: string;
    topicId: string;
    isActive: boolean;
    lastUpdate: Date;
}
export declare const StreamingManager: typeof ResearchStreamingManager;
export declare const streamingManager: ResearchStreamingManager;
//# sourceMappingURL=streaming.d.ts.map