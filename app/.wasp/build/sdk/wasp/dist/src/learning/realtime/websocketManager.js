/**
 * WebSocket manager for efficient real-time communication
 * Optimized for concurrent users and message broadcasting
 */
class WebSocketManager {
    connections = new Map();
    userConnections = new Map();
    topicConnections = new Map();
    messageQueue = {
        messages: [],
        processing: false,
        lastProcessed: Date.now()
    };
    heartbeatInterval = null;
    queueProcessInterval = null;
    connectionCleanupInterval = null;
    // Configuration
    HEARTBEAT_INTERVAL = 30000; // 30 seconds
    QUEUE_PROCESS_INTERVAL = 100; // 100ms
    CONNECTION_TIMEOUT = 60000; // 60 seconds
    MAX_QUEUE_SIZE = 1000;
    BATCH_SIZE = 50;
    constructor() {
        this.startHeartbeat();
        this.startQueueProcessor();
        this.startConnectionCleanup();
    }
    /**
     * Add a new WebSocket connection
     */
    addConnection(connectionId, userId, socket, topicId) {
        const connection = {
            id: connectionId,
            userId,
            topicId,
            socket,
            lastActivity: Date.now(),
            subscriptions: new Set()
        };
        // Store connection
        this.connections.set(connectionId, connection);
        // Index by user
        if (!this.userConnections.has(userId)) {
            this.userConnections.set(userId, new Set());
        }
        this.userConnections.get(userId).add(connectionId);
        // Index by topic if provided
        if (topicId) {
            if (!this.topicConnections.has(topicId)) {
                this.topicConnections.set(topicId, new Set());
            }
            this.topicConnections.get(topicId).add(connectionId);
        }
        // Set up socket event handlers
        this.setupSocketHandlers(connection);
        console.log(`WebSocket connection added: ${connectionId} for user ${userId}`);
    }
    /**
     * Remove a WebSocket connection
     */
    removeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection)
            return;
        // Remove from user index
        const userConnections = this.userConnections.get(connection.userId);
        if (userConnections) {
            userConnections.delete(connectionId);
            if (userConnections.size === 0) {
                this.userConnections.delete(connection.userId);
            }
        }
        // Remove from topic index
        if (connection.topicId) {
            const topicConnections = this.topicConnections.get(connection.topicId);
            if (topicConnections) {
                topicConnections.delete(connectionId);
                if (topicConnections.size === 0) {
                    this.topicConnections.delete(connection.topicId);
                }
            }
        }
        // Remove main connection
        this.connections.delete(connectionId);
        console.log(`WebSocket connection removed: ${connectionId}`);
    }
    /**
     * Subscribe connection to a topic
     */
    subscribeToTopic(connectionId, topicId) {
        const connection = this.connections.get(connectionId);
        if (!connection)
            return;
        connection.subscriptions.add(topicId);
        // Add to topic index
        if (!this.topicConnections.has(topicId)) {
            this.topicConnections.set(topicId, new Set());
        }
        this.topicConnections.get(topicId).add(connectionId);
        console.log(`Connection ${connectionId} subscribed to topic ${topicId}`);
    }
    /**
     * Unsubscribe connection from a topic
     */
    unsubscribeFromTopic(connectionId, topicId) {
        const connection = this.connections.get(connectionId);
        if (!connection)
            return;
        connection.subscriptions.delete(topicId);
        // Remove from topic index
        const topicConnections = this.topicConnections.get(topicId);
        if (topicConnections) {
            topicConnections.delete(connectionId);
            if (topicConnections.size === 0) {
                this.topicConnections.delete(topicId);
            }
        }
        console.log(`Connection ${connectionId} unsubscribed from topic ${topicId}`);
    }
    /**
     * Broadcast message to specific users
     */
    broadcastToUsers(userIds, message) {
        this.queueMessage({
            type: 'user_broadcast',
            payload: message,
            targetUsers: userIds
        });
    }
    /**
     * Broadcast message to all users in a topic
     */
    broadcastToTopic(topicId, message, excludeUsers) {
        this.queueMessage({
            type: 'topic_broadcast',
            payload: message,
            targetTopics: [topicId],
            excludeUsers
        });
    }
    /**
     * Broadcast message to all connections
     */
    broadcastToAll(message, excludeUsers) {
        this.queueMessage({
            type: 'global_broadcast',
            payload: message,
            excludeUsers
        });
    }
    /**
     * Send message to specific connection
     */
    sendToConnection(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
            return false;
        }
        try {
            connection.socket.send(JSON.stringify(message));
            connection.lastActivity = Date.now();
            return true;
        }
        catch (error) {
            console.error(`Failed to send message to connection ${connectionId}:`, error);
            this.removeConnection(connectionId);
            return false;
        }
    }
    /**
     * Get connection statistics
     */
    getStats() {
        const connectionsByTopic = {};
        for (const [topicId, connections] of this.topicConnections) {
            connectionsByTopic[topicId] = connections.size;
        }
        return {
            totalConnections: this.connections.size,
            activeUsers: this.userConnections.size,
            topicsWithConnections: this.topicConnections.size,
            queueSize: this.messageQueue.messages.length,
            averageConnectionsPerUser: this.userConnections.size > 0
                ? this.connections.size / this.userConnections.size
                : 0,
            connectionsByTopic
        };
    }
    /**
     * Clean up inactive connections
     */
    cleanupInactiveConnections() {
        const now = Date.now();
        const inactiveConnections = [];
        for (const [connectionId, connection] of this.connections) {
            if (now - connection.lastActivity > this.CONNECTION_TIMEOUT ||
                connection.socket.readyState !== WebSocket.OPEN) {
                inactiveConnections.push(connectionId);
            }
        }
        inactiveConnections.forEach(connectionId => {
            this.removeConnection(connectionId);
        });
        if (inactiveConnections.length > 0) {
            console.log(`Cleaned up ${inactiveConnections.length} inactive connections`);
        }
        return inactiveConnections.length;
    }
    /**
     * Shutdown the WebSocket manager
     */
    shutdown() {
        // Clear intervals
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.queueProcessInterval) {
            clearInterval(this.queueProcessInterval);
        }
        if (this.connectionCleanupInterval) {
            clearInterval(this.connectionCleanupInterval);
        }
        // Close all connections
        for (const connection of this.connections.values()) {
            if (connection.socket.readyState === WebSocket.OPEN) {
                connection.socket.close();
            }
        }
        // Clear data structures
        this.connections.clear();
        this.userConnections.clear();
        this.topicConnections.clear();
        this.messageQueue.messages = [];
        console.log('WebSocket manager shut down');
    }
    // Private methods
    setupSocketHandlers(connection) {
        connection.socket.onmessage = (event) => {
            connection.lastActivity = Date.now();
            this.handleMessage(connection, event.data);
        };
        connection.socket.onclose = () => {
            this.removeConnection(connection.id);
        };
        connection.socket.onerror = (error) => {
            console.error(`WebSocket error for connection ${connection.id}:`, error);
            this.removeConnection(connection.id);
        };
        // Note: WebSocket API doesn't have 'pong' event, this would be handled differently
        // if implementing ping/pong manually
    }
    handleMessage(connection, data) {
        try {
            const message = JSON.parse(data.toString());
            switch (message.type) {
                case 'subscribe':
                    if (message.topicId) {
                        this.subscribeToTopic(connection.id, message.topicId);
                    }
                    break;
                case 'unsubscribe':
                    if (message.topicId) {
                        this.unsubscribeFromTopic(connection.id, message.topicId);
                    }
                    break;
                case 'ping':
                    this.sendToConnection(connection.id, { type: 'pong' });
                    break;
                default:
                    console.warn(`Unknown message type: ${message.type}`);
            }
        }
        catch (error) {
            console.error(`Failed to handle message from connection ${connection.id}:`, error);
        }
    }
    queueMessage(message) {
        if (this.messageQueue.messages.length >= this.MAX_QUEUE_SIZE) {
            console.warn('Message queue is full, dropping oldest messages');
            this.messageQueue.messages.splice(0, this.BATCH_SIZE);
        }
        this.messageQueue.messages.push(message);
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            for (const connection of this.connections.values()) {
                if (connection.socket.readyState === WebSocket.OPEN) {
                    try {
                        // Send a ping message instead of using ping() method
                        connection.socket.send(JSON.stringify({ type: 'ping' }));
                    }
                    catch (error) {
                        console.error(`Failed to ping connection ${connection.id}:`, error);
                        this.removeConnection(connection.id);
                    }
                }
            }
        }, this.HEARTBEAT_INTERVAL);
    }
    startQueueProcessor() {
        this.queueProcessInterval = setInterval(() => {
            this.processMessageQueue();
        }, this.QUEUE_PROCESS_INTERVAL);
    }
    startConnectionCleanup() {
        this.connectionCleanupInterval = setInterval(() => {
            this.cleanupInactiveConnections();
        }, this.CONNECTION_TIMEOUT);
    }
    processMessageQueue() {
        if (this.messageQueue.processing || this.messageQueue.messages.length === 0) {
            return;
        }
        this.messageQueue.processing = true;
        try {
            const batch = this.messageQueue.messages.splice(0, this.BATCH_SIZE);
            for (const message of batch) {
                this.processBroadcastMessage(message);
            }
            this.messageQueue.lastProcessed = Date.now();
        }
        catch (error) {
            console.error('Error processing message queue:', error);
        }
        finally {
            this.messageQueue.processing = false;
        }
    }
    processBroadcastMessage(message) {
        const targetConnections = new Set();
        // Determine target connections based on message type
        if (message.targetUsers) {
            for (const userId of message.targetUsers) {
                const userConnections = this.userConnections.get(userId);
                if (userConnections) {
                    userConnections.forEach(connId => targetConnections.add(connId));
                }
            }
        }
        if (message.targetTopics) {
            for (const topicId of message.targetTopics) {
                const topicConnections = this.topicConnections.get(topicId);
                if (topicConnections) {
                    topicConnections.forEach(connId => targetConnections.add(connId));
                }
            }
        }
        if (message.type === 'global_broadcast') {
            this.connections.forEach((_, connId) => targetConnections.add(connId));
        }
        // Remove excluded users
        if (message.excludeUsers) {
            for (const userId of message.excludeUsers) {
                const userConnections = this.userConnections.get(userId);
                if (userConnections) {
                    userConnections.forEach(connId => targetConnections.delete(connId));
                }
            }
        }
        // Send message to target connections
        let successCount = 0;
        let failureCount = 0;
        for (const connectionId of targetConnections) {
            if (this.sendToConnection(connectionId, message.payload)) {
                successCount++;
            }
            else {
                failureCount++;
            }
        }
        if (failureCount > 0) {
            console.warn(`Broadcast partially failed: ${successCount} success, ${failureCount} failures`);
        }
    }
}
// Singleton instance
export const webSocketManager = new WebSocketManager();
// Graceful shutdown
process.on('SIGINT', () => {
    webSocketManager.shutdown();
});
process.on('SIGTERM', () => {
    webSocketManager.shutdown();
});
//# sourceMappingURL=websocketManager.js.map