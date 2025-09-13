/**
 * Progress tracking for research sessions
 * Handles real-time progress broadcasting and monitoring
 */
export interface ProgressEvent {
    type: string;
    sessionId: string;
    timestamp: Date;
    data: any;
}
export interface ProgressSubscriber {
    id: string;
    sessionId: string;
    callback: (event: ProgressEvent) => void;
    active: boolean;
}
export declare class ProgressTracker {
    private subscribers;
    private eventHistory;
    /**
     * Broadcast an event to all subscribers
     */
    broadcastEvent(event: Omit<ProgressEvent, 'timestamp'>): Promise<void>;
    /**
     * Subscribe to progress events for a session
     */
    subscribe(sessionId: string, callback: (event: ProgressEvent) => void): string;
    /**
     * Unsubscribe from progress events
     */
    unsubscribe(subscriberId: string): void;
    /**
     * Get event history for a session
     */
    getEventHistory(sessionId: string): ProgressEvent[];
    /**
     * Clean up old events and inactive subscribers
     */
    cleanup(): void;
}
export declare const progressTracker: ProgressTracker;
//# sourceMappingURL=progressTracker.d.ts.map