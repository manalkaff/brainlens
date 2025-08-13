/**
 * WebSocket manager for efficient real-time communication
 * Optimized for concurrent users and message broadcasting
 */

interface WebSocketConnection {
  id: string;
  userId: string;
  topicId?: string;
  socket: WebSocket;
  lastActivity: number;
  subscriptions: Set<string>;
}

interface BroadcastMessage {
  type: string;
  payload: any;
  targetUsers?: string[];
  targetTopics?: string[];
  excludeUsers?: string[];
}

interface MessageQueue {
  messages: BroadcastMessage[];
  processing: boolean;
  lastProcessed: number;
}

class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private topicConnections: Map<string, Set<string>> = new Map();
  private messageQueue: MessageQueue = {
    messages: [],
    processing: false,
    lastProcessed: Date.now()
  };
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private queueProcessInterval: NodeJS.Timeout | null = null;
  private connectionCleanupInterval: NodeJS.Timeout | null = null;

  // Configuration
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly QUEUE_PROCESS_INTERVAL = 100; // 100ms
  private readonly CONNECTION_TIMEOUT = 60000; // 60 seconds
  private readonly MAX_QUEUE_SIZE = 1000;
  private readonly BATCH_SIZE = 50;

  constructor() {
    this.startHeartbeat();
    this.startQueueProcessor();
    this.startConnectionCleanup();
  }

  /**
   * Add a new WebSocket connection
   */
  addConnection(
    connectionId: string,
    userId: string,
    socket: WebSocket,
    topicId?: string
  ): void {
    const connection: WebSocketConnection = {
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
    this.userConnections.get(userId)!.add(connectionId);

    // Index by topic if provided
    if (topicId) {
      if (!this.topicConnections.has(topicId)) {
        this.topicConnections.set(topicId, new Set());
      }
      this.topicConnections.get(topicId)!.add(connectionId);
    }

    // Set up socket event handlers
    this.setupSocketHandlers(connection);

    console.log(`WebSocket connection added: ${connectionId} for user ${userId}`);
  }

  /**
   * Remove a WebSocket connection
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

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
  subscribeToTopic(connectionId: string, topicId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.subscriptions.add(topicId);

    // Add to topic index
    if (!this.topicConnections.has(topicId)) {
      this.topicConnections.set(topicId, new Set());
    }
    this.topicConnections.get(topicId)!.add(connectionId);

    console.log(`Connection ${connectionId} subscribed to topic ${topicId}`);
  }

  /**
   * Unsubscribe connection from a topic
   */
  unsubscribeFromTopic(connectionId: string, topicId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

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
  broadcastToUsers(userIds: string[], message: any): void {
    this.queueMessage({
      type: 'user_broadcast',
      payload: message,
      targetUsers: userIds
    });
  }

  /**
   * Broadcast message to all users in a topic
   */
  broadcastToTopic(topicId: string, message: any, excludeUsers?: string[]): void {
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
  broadcastToAll(message: any, excludeUsers?: string[]): void {
    this.queueMessage({
      type: 'global_broadcast',
      payload: message,
      excludeUsers
    });
  }

  /**
   * Send message to specific connection
   */
  sendToConnection(connectionId: string, message: any): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connection.socket.send(JSON.stringify(message));
      connection.lastActivity = Date.now();
      return true;
    } catch (error) {
      console.error(`Failed to send message to connection ${connectionId}:`, error);
      this.removeConnection(connectionId);
      return false;
    }
  }

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
  } {
    const connectionsByTopic: Record<string, number> = {};
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
  cleanupInactiveConnections(): number {
    const now = Date.now();
    const inactiveConnections: string[] = [];

    for (const [connectionId, connection] of this.connections) {
      if (
        now - connection.lastActivity > this.CONNECTION_TIMEOUT ||
        connection.socket.readyState !== WebSocket.OPEN
      ) {
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
  shutdown(): void {
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

  private setupSocketHandlers(connection: WebSocketConnection): void {
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

  private handleMessage(connection: WebSocketConnection, data: any): void {
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
    } catch (error) {
      console.error(`Failed to handle message from connection ${connection.id}:`, error);
    }
  }

  private queueMessage(message: BroadcastMessage): void {
    if (this.messageQueue.messages.length >= this.MAX_QUEUE_SIZE) {
      console.warn('Message queue is full, dropping oldest messages');
      this.messageQueue.messages.splice(0, this.BATCH_SIZE);
    }

    this.messageQueue.messages.push(message);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const connection of this.connections.values()) {
        if (connection.socket.readyState === WebSocket.OPEN) {
          try {
            // Send a ping message instead of using ping() method
            connection.socket.send(JSON.stringify({ type: 'ping' }));
          } catch (error) {
            console.error(`Failed to ping connection ${connection.id}:`, error);
            this.removeConnection(connection.id);
          }
        }
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private startQueueProcessor(): void {
    this.queueProcessInterval = setInterval(() => {
      this.processMessageQueue();
    }, this.QUEUE_PROCESS_INTERVAL);
  }

  private startConnectionCleanup(): void {
    this.connectionCleanupInterval = setInterval(() => {
      this.cleanupInactiveConnections();
    }, this.CONNECTION_TIMEOUT);
  }

  private processMessageQueue(): void {
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
    } catch (error) {
      console.error('Error processing message queue:', error);
    } finally {
      this.messageQueue.processing = false;
    }
  }

  private processBroadcastMessage(message: BroadcastMessage): void {
    const targetConnections = new Set<string>();

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
      } else {
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