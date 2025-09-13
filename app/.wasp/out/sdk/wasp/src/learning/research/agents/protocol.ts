import { type ResearchResult, type SearchResult } from '../agents';

/**
 * Standardized communication protocol for research agents
 * Defines message formats, health monitoring, and inter-agent coordination
 */

// Agent Message Types
export type AgentMessageType = 
  | 'HEALTH_CHECK'
  | 'SEARCH_REQUEST' 
  | 'SEARCH_PROGRESS'
  | 'SEARCH_RESULT'
  | 'SEARCH_ERROR'
  | 'RESOURCE_SHARING'
  | 'COORDINATION_SYNC';

// Base message interface
export interface AgentMessage {
  id: string;
  type: AgentMessageType;
  agentName: string;
  sessionId: string;
  timestamp: Date;
  payload: any;
}

// Specific message payloads
export interface HealthCheckPayload {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastExecutionTime?: Date;
  averageResponseTime: number; // milliseconds
  successRate: number; // 0-1
  errorCount: number;
  resourceUsage: {
    memory: number; // MB
    cpu: number; // percentage
  };
  capabilities: string[]; // Available engines/features
}

export interface SearchRequestPayload {
  topic: string;
  context?: any;
  priority: 'low' | 'medium' | 'high';
  timeout: number;
  expectedResults: number;
}

export interface SearchProgressPayload {
  progress: number; // 0-100
  currentEngine?: string;
  resultsFound: number;
  estimatedCompletion: number; // milliseconds
}

export interface SearchResultPayload {
  results: SearchResult[];
  summary?: string;
  subtopics?: string[];
  confidence: number; // 0-1
  processingTime: number; // milliseconds
}

export interface SearchErrorPayload {
  error: string;
  errorCode: string;
  recoverable: boolean;
  retryAfter?: number; // milliseconds
  fallbackSuggestions?: string[];
}

export interface ResourceSharingPayload {
  resourceType: 'cache' | 'computation' | 'knowledge';
  data: any;
  expiry?: Date;
  shareWith: string[]; // Agent names
}

export interface CoordinationSyncPayload {
  phase: 'start' | 'progress' | 'complete' | 'abort';
  globalProgress: number;
  agentStatuses: Record<string, AgentHealthStatus>;
}

// Agent Health Status
export interface AgentHealthStatus {
  agentName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  lastHeartbeat: Date;
  metrics: {
    responseTime: number;
    successRate: number;
    errorRate: number;
    throughput: number; // results per minute
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
export class AgentCommunicationManager {
  private messageHandlers: Map<AgentMessageType, Array<(message: AgentMessage) => void>> = new Map();
  private agentHealth: Map<string, AgentHealthStatus> = new Map();
  private messageHistory: AgentMessage[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeHealthMonitoring();
  }

  /**
   * Send message to specific agent or broadcast to all
   */
  async sendMessage(
    type: AgentMessageType,
    payload: any,
    targetAgent?: string,
    sessionId?: string
  ): Promise<void> {
    const message: AgentMessage = {
      id: this.generateMessageId(),
      type,
      agentName: targetAgent || 'orchestrator',
      sessionId: sessionId || 'global',
      timestamp: new Date(),
      payload
    };

    // Store message in history
    this.messageHistory.push(message);
    
    // Keep only recent messages (last 1000)
    if (this.messageHistory.length > 1000) {
      this.messageHistory = this.messageHistory.slice(-1000);
    }

    // Route message to handlers
    const handlers = this.messageHandlers.get(type) || [];
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error(`Message handler error for ${type}:`, error);
      }
    });
  }

  /**
   * Register message handler for specific message type
   */
  onMessage(type: AgentMessageType, handler: (message: AgentMessage) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  /**
   * Update agent health status
   */
  updateAgentHealth(agentName: string, health: Partial<AgentHealthStatus>): void {
    const existing = this.agentHealth.get(agentName) || this.createDefaultHealthStatus(agentName);
    const updated = { ...existing, ...health, lastHeartbeat: new Date() };
    this.agentHealth.set(agentName, updated);

    // Broadcast health update
    this.sendMessage('HEALTH_CHECK', updated, agentName);
  }

  /**
   * Get health status for specific agent
   */
  getAgentHealth(agentName: string): AgentHealthStatus | undefined {
    return this.agentHealth.get(agentName);
  }

  /**
   * Get health status for all agents
   */
  getAllAgentHealth(): Record<string, AgentHealthStatus> {
    const health: Record<string, AgentHealthStatus> = {};
    this.agentHealth.forEach((status, agentName) => {
      health[agentName] = status;
    });
    return health;
  }

  /**
   * Check if agent is healthy and available
   */
  isAgentHealthy(agentName: string): boolean {
    const health = this.agentHealth.get(agentName);
    if (!health) return false;

    const now = Date.now();
    const lastHeartbeat = health.lastHeartbeat.getTime();
    const heartbeatAge = now - lastHeartbeat;

    // Consider agent unhealthy if no heartbeat in 60 seconds
    if (heartbeatAge > 60000) {
      this.updateAgentHealth(agentName, { status: 'offline' });
      return false;
    }

    return health.status === 'healthy' || health.status === 'degraded';
  }

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
  } {
    const agents = Array.from(this.agentHealth.values());
    const healthyAgents = agents.filter(a => a.status === 'healthy').length;
    const degradedAgents = agents.filter(a => a.status === 'degraded').length;
    const unhealthyAgents = agents.filter(a => a.status === 'unhealthy' || a.status === 'offline').length;
    
    const averageResponseTime = agents.length > 0 
      ? agents.reduce((sum, a) => sum + a.metrics.responseTime, 0) / agents.length
      : 0;

    const systemLoad = agents.length > 0
      ? agents.reduce((sum, a) => sum + a.resourceUsage.cpu, 0) / agents.length
      : 0;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    const healthyRatio = healthyAgents / Math.max(1, agents.length);
    
    if (healthyRatio >= 0.8) {
      overallStatus = 'healthy';
    } else if (healthyRatio >= 0.5) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    return {
      overallStatus,
      agentCount: agents.length,
      healthyAgents,
      degradedAgents,
      unhealthyAgents,
      averageResponseTime,
      systemLoad
    };
  }

  /**
   * Record agent execution metrics
   */
  recordAgentExecution(
    agentName: string,
    success: boolean,
    responseTime: number,
    resultCount: number,
    error?: string
  ): void {
    const health = this.agentHealth.get(agentName) || this.createDefaultHealthStatus(agentName);
    
    // Update metrics
    const metrics = health.metrics;
    
    // Update response time (exponential moving average)
    metrics.responseTime = metrics.responseTime * 0.8 + responseTime * 0.2;
    
    // Update success rate (exponential moving average)
    const newSuccessRate = success ? 1 : 0;
    metrics.successRate = metrics.successRate * 0.9 + newSuccessRate * 0.1;
    metrics.errorRate = 1 - metrics.successRate;
    
    // Update throughput (results per minute)
    const resultsPerSecond = resultCount / (responseTime / 1000);
    metrics.throughput = metrics.throughput * 0.8 + (resultsPerSecond * 60) * 0.2;

    // Add error if execution failed
    if (!success && error) {
      health.errors.push({
        timestamp: new Date(),
        error,
        errorCode: 'EXECUTION_FAILED'
      });
      
      // Keep only recent errors (last 10)
      if (health.errors.length > 10) {
        health.errors = health.errors.slice(-10);
      }
    }

    // Determine health status based on metrics
    let status: AgentHealthStatus['status'] = 'healthy';
    if (metrics.errorRate > 0.5) {
      status = 'unhealthy';
    } else if (metrics.errorRate > 0.2 || metrics.responseTime > 30000) {
      status = 'degraded';
    }

    this.updateAgentHealth(agentName, { ...health, status });
  }

  /**
   * Get message history for debugging and analysis
   */
  getMessageHistory(
    sessionId?: string,
    agentName?: string,
    messageType?: AgentMessageType
  ): AgentMessage[] {
    let filtered = this.messageHistory;

    if (sessionId) {
      filtered = filtered.filter(msg => msg.sessionId === sessionId);
    }

    if (agentName) {
      filtered = filtered.filter(msg => msg.agentName === agentName);
    }

    if (messageType) {
      filtered = filtered.filter(msg => msg.type === messageType);
    }

    return filtered;
  }

  /**
   * Create standardized agent response for orchestrator
   */
  createAgentResponse(
    agentName: string,
    sessionId: string,
    result: ResearchResult
  ): AgentMessage {
    const payload: SearchResultPayload = {
      results: result.results,
      summary: result.summary,
      subtopics: result.subtopics,
      confidence: this.calculateResultConfidence(result),
      processingTime: 0 // This would be calculated by the calling agent
    };

    return {
      id: this.generateMessageId(),
      type: 'SEARCH_RESULT',
      agentName,
      sessionId,
      timestamp: new Date(),
      payload
    };
  }

  /**
   * Shutdown communication manager and cleanup resources
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.messageHandlers.clear();
    this.agentHealth.clear();
    this.messageHistory = [];
  }

  // Private helper methods
  private initializeHealthMonitoring(): void {
    // Start heartbeat monitoring
    this.heartbeatInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds
  }

  private performHealthChecks(): void {
    const now = Date.now();
    
    this.agentHealth.forEach((health, agentName) => {
      const heartbeatAge = now - health.lastHeartbeat.getTime();
      
      // Mark agents as offline if no heartbeat for 60 seconds
      if (heartbeatAge > 60000 && health.status !== 'offline') {
        this.updateAgentHealth(agentName, { status: 'offline' });
      }
    });

    // Broadcast system health
    const systemHealth = this.getSystemHealth();
    this.sendMessage('COORDINATION_SYNC', {
      phase: 'progress',
      globalProgress: 0, // This would be calculated based on active sessions
      agentStatuses: this.getAllAgentHealth()
    });
  }

  private createDefaultHealthStatus(agentName: string): AgentHealthStatus {
    return {
      agentName,
      status: 'healthy',
      lastHeartbeat: new Date(),
      metrics: {
        responseTime: 5000, // Default 5 seconds
        successRate: 1.0,
        errorRate: 0.0,
        throughput: 10 // Default 10 results per minute
      },
      capabilities: {
        engines: [],
        features: [],
        supportedFormats: ['text', 'json']
      },
      resourceUsage: {
        memory: 0,
        cpu: 0,
        networkBandwidth: 0
      },
      errors: []
    };
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateResultConfidence(result: ResearchResult): number {
    if (result.status !== 'success') return 0;
    
    const resultCount = result.results.length;
    const hasContent = result.results.some(r => r.snippet && r.snippet.length > 50);
    const hasSummary = result.summary && result.summary.length > 100;
    
    let confidence = 0.5; // Base confidence
    
    if (resultCount > 5) confidence += 0.2;
    if (resultCount > 10) confidence += 0.1;
    if (hasContent) confidence += 0.1;
    if (hasSummary) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }
}

// Singleton instance for application-wide use
export const agentCommunicationManager = new AgentCommunicationManager();