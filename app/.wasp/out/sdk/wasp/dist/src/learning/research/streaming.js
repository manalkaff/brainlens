// Server-Sent Events manager for research streaming
export class ResearchStreamingManager {
    static instance;
    connections = new Map();
    topicStreams = new Map();
    static getInstance() {
        if (!ResearchStreamingManager.instance) {
            ResearchStreamingManager.instance = new ResearchStreamingManager();
        }
        return ResearchStreamingManager.instance;
    }
    // Add a new SSE connection for a topic
    addConnection(topicId, connectionId, response) {
        this.connections.set(connectionId, response);
        if (!this.topicStreams.has(topicId)) {
            this.topicStreams.set(topicId, new Set());
        }
        this.topicStreams.get(topicId).add(connectionId);
        // Send initial connection confirmation
        this.sendToConnection(connectionId, {
            type: 'status',
            topicId,
            timestamp: new Date(),
            data: {
                message: 'Connected to research stream',
                status: 'connected'
            }
        });
    }
    // Remove a connection
    removeConnection(connectionId) {
        this.connections.delete(connectionId);
        // Remove from topic streams
        for (const [topicId, connections] of this.topicStreams.entries()) {
            connections.delete(connectionId);
            if (connections.size === 0) {
                this.topicStreams.delete(topicId);
            }
        }
    }
    // Send update to all connections for a specific topic
    broadcastToTopic(topicId, update) {
        const connections = this.topicStreams.get(topicId);
        if (!connections)
            return;
        for (const connectionId of connections) {
            this.sendToConnection(connectionId, update);
        }
    }
    // Send update to a specific connection
    sendToConnection(connectionId, update) {
        const response = this.connections.get(connectionId);
        if (!response)
            return;
        try {
            const data = `data: ${JSON.stringify(update)}\n\n`;
            // Note: In a real implementation, you'd write to the response stream
            // This is a simplified version for the structure
            console.log(`Sending to ${connectionId}:`, data);
        }
        catch (error) {
            console.error(`Failed to send update to connection ${connectionId}:`, error);
            this.removeConnection(connectionId);
        }
    }
    // Broadcast research status update
    broadcastStatusUpdate(status) {
        const update = {
            type: 'status',
            topicId: status.topicId,
            timestamp: new Date(),
            data: status
        };
        this.broadcastToTopic(status.topicId, update);
    }
    // Broadcast research progress update
    broadcastProgressUpdate(topicId, progress) {
        const update = {
            type: 'progress',
            topicId,
            timestamp: new Date(),
            data: progress
        };
        this.broadcastToTopic(topicId, update);
    }
    // Broadcast partial content update
    broadcastContentUpdate(topicId, content) {
        const update = {
            type: 'content',
            topicId,
            timestamp: new Date(),
            data: content
        };
        this.broadcastToTopic(topicId, update);
    }
    // Broadcast error update
    broadcastErrorUpdate(topicId, error) {
        const update = {
            type: 'error',
            topicId,
            timestamp: new Date(),
            data: error
        };
        this.broadcastToTopic(topicId, update);
    }
    // Broadcast completion update
    broadcastCompleteUpdate(topicId, result) {
        const update = {
            type: 'complete',
            topicId,
            timestamp: new Date(),
            data: result
        };
        this.broadcastToTopic(topicId, update);
    }
    // Get active connections count for a topic
    getConnectionCount(topicId) {
        return this.topicStreams.get(topicId)?.size || 0;
    }
    // Get all active topics
    getActiveTopics() {
        return Array.from(this.topicStreams.keys());
    }
    // Get global statistics for the streaming service
    getGlobalStatistics() {
        return {
            totalConnections: this.connections.size,
            activeTopics: this.topicStreams.size,
            topics: Array.from(this.topicStreams.keys()),
            uptime: Date.now() - this.startTime || 0
        };
    }
    // Clean up inactive connections
    cleanup() {
        const activeConnections = new Set();
        for (const connections of this.topicStreams.values()) {
            for (const connectionId of connections) {
                activeConnections.add(connectionId);
            }
        }
        // Remove connections that are no longer in any topic stream
        for (const connectionId of this.connections.keys()) {
            if (!activeConnections.has(connectionId)) {
                this.removeConnection(connectionId);
            }
        }
    }
}
// Utility functions for streaming
export const StreamingUtils = {
    // Generate unique connection ID
    generateConnectionId() {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    // Format streaming message for display
    formatStreamingMessage(update) {
        switch (update.type) {
            case 'status':
                const status = update.data;
                return `${status.status.toUpperCase()}: ${status.topic} (${status.progress}%)`;
            case 'progress':
                const progress = update.data;
                return `Progress: ${progress.currentAgent} - ${progress.progress}% complete`;
            case 'content':
                const content = update.data;
                return `Content from ${content.agent}: ${content.partialContent.substring(0, 100)}...`;
            case 'error':
                const error = update.data;
                return `Error: ${error.error}`;
            case 'complete':
                return 'Research completed successfully!';
            default:
                return 'Unknown update type';
        }
    },
    // Calculate estimated completion time
    calculateEstimatedCompletion(startTime, progress, currentTime = new Date()) {
        if (progress <= 0 || progress >= 100)
            return null;
        const elapsed = currentTime.getTime() - startTime.getTime();
        const estimatedTotal = (elapsed / progress) * 100;
        const remaining = estimatedTotal - elapsed;
        return new Date(currentTime.getTime() + remaining);
    },
    // Format duration for display
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        else {
            return `${seconds}s`;
        }
    },
    // Validate streaming update
    isValidUpdate(update) {
        return (update &&
            typeof update === 'object' &&
            typeof update.type === 'string' &&
            typeof update.topicId === 'string' &&
            update.timestamp &&
            update.data !== undefined);
    }
};
// Export class aliases for compatibility
export const StreamingManager = ResearchStreamingManager;
// Export singleton instance
export const streamingManager = ResearchStreamingManager.getInstance();
//# sourceMappingURL=streaming.js.map