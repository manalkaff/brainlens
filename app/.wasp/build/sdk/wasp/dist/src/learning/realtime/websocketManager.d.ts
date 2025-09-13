/**
 * WebSocket manager for efficient real-time communication
 * Optimized for concurrent users and message broadcasting
 */
declare class WebSocketManager {
    private connections;
    private userConnections;
    private topicConnections;
    private messageQueue;
    private heartbeatInterval;
    private queueProcessInterval;
    private connectionCleanupInterval;
    private readonly HEARTBEAT_INTERVAL;
    private readonly QUEUE_PROCESS_INTERVAL;
    private readonly CONNECTION_TIMEOUT;
    private readonly MAX_QUEUE_SIZE;
    private readonly BATCH_SIZE;
    constructor();
    /**
     * Add a new WebSocket connection
     */
    addConnection(connectionId: string, userId: string, socket: WebSocket, topicId?: string): void;
    /**
     * Remove a WebSocket connection
     */
    removeConnection(connectionId: string): void;
    /**
     * Subscribe connection to a topic
     */
    subscribeToTopic(connectionId: string, topicId: string): void;
    /**
     * Unsubscribe connection from a topic
     */
    unsubscribeFromTopic(connectionId: string, topicId: string): void;
    /**
     * Broadcast message to specific users
     */
    broadcastToUsers(userIds: string[], message: any): void;
    /**
     * Broadcast message to all users in a topic
     */
    broadcastToTopic(topicId: string, message: any, excludeUsers?: string[]): void;
    /**
     * Broadcast message to all connections
     */
    broadcastToAll(message: any, excludeUsers?: string[]): void;
    /**
     * Send message to specific connection
     */
    sendToConnection(connectionId: string, message: any): boolean;
    /**
     * Get connection statistics
     */
    getStats(): {
        totalConnections: number;
        activeUsers: number;
        topicsWithConnections: number;
        queueSize: number;
        averageConnectionsPerUser: number;
        connectionsByTopic: Record<string, number>;
    };
    /**
     * Clean up inactive connections
     */
    cleanupInactiveConnections(): number;
    /**
     * Shutdown the WebSocket manager
     */
    shutdown(): void;
    private setupSocketHandlers;
    private handleMessage;
    private queueMessage;
    private startHeartbeat;
    private startQueueProcessor;
    private startConnectionCleanup;
    private processMessageQueue;
    private processBroadcastMessage;
}
export declare const webSocketManager: WebSocketManager;
export {};
//# sourceMappingURL=websocketManager.d.ts.map