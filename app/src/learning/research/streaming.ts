import { ResearchStatus, AgentCoordinationResult } from './pipeline';

// Types for streaming research updates
export interface StreamingResearchUpdate {
  type: 'status' | 'progress' | 'content' | 'error' | 'complete';
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
    progress: number; // 0-100
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

// Server-Sent Events manager for research streaming
export class ResearchStreamingManager {
  private static instance: ResearchStreamingManager;
  private connections: Map<string, Response> = new Map();
  private topicStreams: Map<string, Set<string>> = new Map();

  static getInstance(): ResearchStreamingManager {
    if (!ResearchStreamingManager.instance) {
      ResearchStreamingManager.instance = new ResearchStreamingManager();
    }
    return ResearchStreamingManager.instance;
  }

  // Add a new SSE connection for a topic
  addConnection(topicId: string, connectionId: string, response: Response): void {
    this.connections.set(connectionId, response);
    
    if (!this.topicStreams.has(topicId)) {
      this.topicStreams.set(topicId, new Set());
    }
    this.topicStreams.get(topicId)!.add(connectionId);

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
  removeConnection(connectionId: string): void {
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
  broadcastToTopic(topicId: string, update: StreamingResearchUpdate): void {
    const connections = this.topicStreams.get(topicId);
    if (!connections) return;

    for (const connectionId of connections) {
      this.sendToConnection(connectionId, update);
    }
  }

  // Send update to a specific connection
  private sendToConnection(connectionId: string, update: StreamingResearchUpdate): void {
    const response = this.connections.get(connectionId);
    if (!response) return;

    try {
      const data = `data: ${JSON.stringify(update)}\n\n`;
      // Note: In a real implementation, you'd write to the response stream
      // This is a simplified version for the structure
      console.log(`Sending to ${connectionId}:`, data);
    } catch (error) {
      console.error(`Failed to send update to connection ${connectionId}:`, error);
      this.removeConnection(connectionId);
    }
  }

  // Broadcast research status update
  broadcastStatusUpdate(status: ResearchStatus): void {
    const update: ResearchStatusUpdate = {
      type: 'status',
      topicId: status.topicId,
      timestamp: new Date(),
      data: status
    };
    this.broadcastToTopic(status.topicId, update);
  }

  // Broadcast research progress update
  broadcastProgressUpdate(topicId: string, progress: ResearchProgressUpdate['data']): void {
    const update: ResearchProgressUpdate = {
      type: 'progress',
      topicId,
      timestamp: new Date(),
      data: progress
    };
    this.broadcastToTopic(topicId, update);
  }

  // Broadcast partial content update
  broadcastContentUpdate(topicId: string, content: ResearchContentUpdate['data']): void {
    const update: ResearchContentUpdate = {
      type: 'content',
      topicId,
      timestamp: new Date(),
      data: content
    };
    this.broadcastToTopic(topicId, update);
  }

  // Broadcast error update
  broadcastErrorUpdate(topicId: string, error: ResearchErrorUpdate['data']): void {
    const update: ResearchErrorUpdate = {
      type: 'error',
      topicId,
      timestamp: new Date(),
      data: error
    };
    this.broadcastToTopic(topicId, update);
  }

  // Broadcast completion update
  broadcastCompleteUpdate(topicId: string, result: ResearchCompleteUpdate['data']): void {
    const update: ResearchCompleteUpdate = {
      type: 'complete',
      topicId,
      timestamp: new Date(),
      data: result
    };
    this.broadcastToTopic(topicId, update);
  }

  // Get active connections count for a topic
  getConnectionCount(topicId: string): number {
    return this.topicStreams.get(topicId)?.size || 0;
  }

  // Get all active topics
  getActiveTopics(): string[] {
    return Array.from(this.topicStreams.keys());
  }

  // Clean up inactive connections
  cleanup(): void {
    const activeConnections = new Set<string>();
    
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

// Client-side streaming research hook
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

// Client-side research streaming state
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

// Utility functions for streaming
export const StreamingUtils = {
  // Generate unique connection ID
  generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Format streaming message for display
  formatStreamingMessage(update: StreamingResearchUpdate): string {
    switch (update.type) {
      case 'status':
        const status = update.data as ResearchStatus;
        return `${status.status.toUpperCase()}: ${status.topic} (${status.progress}%)`;
      
      case 'progress':
        const progress = update.data as ResearchProgressUpdate['data'];
        return `Progress: ${progress.currentAgent} - ${progress.progress}% complete`;
      
      case 'content':
        const content = update.data as ResearchContentUpdate['data'];
        return `Content from ${content.agent}: ${content.partialContent.substring(0, 100)}...`;
      
      case 'error':
        const error = update.data as ResearchErrorUpdate['data'];
        return `Error: ${error.error}`;
      
      case 'complete':
        return 'Research completed successfully!';
      
      default:
        return 'Unknown update type';
    }
  },

  // Calculate estimated completion time
  calculateEstimatedCompletion(
    startTime: Date,
    progress: number,
    currentTime: Date = new Date()
  ): Date | null {
    if (progress <= 0 || progress >= 100) return null;
    
    const elapsed = currentTime.getTime() - startTime.getTime();
    const estimatedTotal = (elapsed / progress) * 100;
    const remaining = estimatedTotal - elapsed;
    
    return new Date(currentTime.getTime() + remaining);
  },

  // Format duration for display
  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  },

  // Validate streaming update
  isValidUpdate(update: any): update is StreamingResearchUpdate {
    return (
      update &&
      typeof update === 'object' &&
      typeof update.type === 'string' &&
      typeof update.topicId === 'string' &&
      update.timestamp &&
      update.data !== undefined
    );
  }
};

// Export singleton instance
export const streamingManager = ResearchStreamingManager.getInstance();