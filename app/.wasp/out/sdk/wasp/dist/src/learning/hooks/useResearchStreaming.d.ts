import { ResearchStatus, UseResearchStreamingOptions, ResearchStreamingState } from '../research/streaming';
export type { UseResearchStreamingOptions, ResearchStreamingState };
export declare function useResearchStreaming(options: UseResearchStreamingOptions): {
    isConnected: boolean;
    isReconnecting: boolean;
    connectionError: string | null;
    lastUpdate: Date | null;
    currentStatus: ResearchStatus | null;
    progress: {
        currentAgent: string;
        completedAgents: number;
        totalAgents: number;
        currentDepth: number;
        maxDepth: number;
        progress: number;
        estimatedTimeRemaining?: number;
    } | null;
    latestContent: {
        agent: string;
        topic: string;
        depth: number;
        partialContent: string;
        isComplete: boolean;
    }[] | null;
    errors: {
        error: string;
        agent?: string;
        recoverable: boolean;
    }[];
    statusMessage: string;
    estimatedCompletion: Date | null;
    hasErrors: boolean;
    isResearching: boolean;
    isComplete: boolean;
    connect: () => void;
    disconnect: () => void;
    reconnect: () => void;
    clearErrors: () => void;
    clearContent: () => void;
};
export declare function useMultipleResearchStreams(topicIds: string[]): {
    streams: Map<string, {
        isConnected: boolean;
        isReconnecting: boolean;
        connectionError: string | null;
        lastUpdate: Date | null;
        currentStatus: ResearchStatus | null;
        progress: {
            currentAgent: string;
            completedAgents: number;
            totalAgents: number;
            currentDepth: number;
            maxDepth: number;
            progress: number;
            estimatedTimeRemaining?: number;
        } | null;
        latestContent: {
            agent: string;
            topic: string;
            depth: number;
            partialContent: string;
            isComplete: boolean;
        }[] | null;
        errors: {
            error: string;
            agent?: string;
            recoverable: boolean;
        }[];
        statusMessage: string;
        estimatedCompletion: Date | null;
        hasErrors: boolean;
        isResearching: boolean;
        isComplete: boolean;
        connect: () => void;
        disconnect: () => void;
        reconnect: () => void;
        clearErrors: () => void;
        clearContent: () => void;
    }>;
    addStream: (topicId: string, options: Omit<UseResearchStreamingOptions, "topicId">) => void;
    removeStream: (topicId: string) => void;
    getStreamStatus: (topicId: string) => {
        isConnected: boolean;
        isReconnecting: boolean;
        connectionError: string | null;
        lastUpdate: Date | null;
        currentStatus: ResearchStatus | null;
        progress: {
            currentAgent: string;
            completedAgents: number;
            totalAgents: number;
            currentDepth: number;
            maxDepth: number;
            progress: number;
            estimatedTimeRemaining?: number;
        } | null;
        latestContent: {
            agent: string;
            topic: string;
            depth: number;
            partialContent: string;
            isComplete: boolean;
        }[] | null;
        errors: {
            error: string;
            agent?: string;
            recoverable: boolean;
        }[];
        statusMessage: string;
        estimatedCompletion: Date | null;
        hasErrors: boolean;
        isResearching: boolean;
        isComplete: boolean;
        connect: () => void;
        disconnect: () => void;
        reconnect: () => void;
        clearErrors: () => void;
        clearContent: () => void;
    } | undefined;
    activeStreamCount: number;
};
//# sourceMappingURL=useResearchStreaming.d.ts.map