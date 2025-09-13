import { HttpError } from 'wasp/server';
import { ResearchAgentFactory, type ResearchResult } from '../agents';
import { ProgressTracker } from '../progressTracker';
import { CircuitBreakerManager } from '../errors/circuitBreakers';
import { GracefulDegradation } from '../errors/gracefulDegradation';
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
  progress: number; // 0-100
  resultCount: number;
  error?: string;
}

export interface OrchestrationOptions {
  timeout: number; // milliseconds
  maxConcurrentAgents: number;
  failureTolerance: number; // 0-1 (percentage of agents that can fail)
  priority: AgentConfigName[]; // Agent execution priority
  circuitBreakerEnabled: boolean;
  gracefulDegradationEnabled: boolean;
}

const DEFAULT_OPTIONS: OrchestrationOptions = {
  timeout: 30000, // 30 seconds
  maxConcurrentAgents: 5,
  failureTolerance: 0.4, // 40% can fail
  priority: ['general', 'academic', 'video', 'computational', 'community'],
  circuitBreakerEnabled: true,
  gracefulDegradationEnabled: true
};

export class ResearchOrchestrator {
  private progressTracker: ProgressTracker;
  private circuitBreaker?: CircuitBreakerManager;
  private gracefulDegradation?: GracefulDegradation;
  private activeSessions: Map<string, ResearchSession> = new Map();

  constructor() {
    this.progressTracker = new ProgressTracker();
    this.circuitBreaker = new CircuitBreakerManager();
    this.gracefulDegradation = new GracefulDegradation();
  }

  /**
   * Orchestrate multi-agent research with parallel execution
   */
  async orchestrateResearch(
    topic: string,
    context?: any,
    options: Partial<OrchestrationOptions> = {}
  ): Promise<ResearchSession> {
    const sessionId = this.generateSessionId();
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    
    // Initialize research session
    const session: ResearchSession = {
      id: sessionId,
      topic,
      context,
      startTime: new Date(),
      status: 'running',
      agents: this.initializeAgentStatuses(mergedOptions.priority),
      results: [],
      errors: []
    };

    this.activeSessions.set(sessionId, session);

    try {
      // Broadcast research initiation
      await this.progressTracker.broadcastEvent({
        type: 'RESEARCH_INITIATED',
        sessionId,
        data: {
          topicId: context?.topicId,
          topic,
          agents: session.agents.length,
          estimatedTime: mergedOptions.timeout
        }
      });

      // Execute agents in parallel with orchestration
      const results = await this.executeAgentsInParallel(
        session,
        mergedOptions
      );

      // Process final results
      session.results = results;
      session.endTime = new Date();
      
      // Determine final status
      const successfulAgents = results.filter(r => r.status === 'success').length;
      const totalAgents = session.agents.length;
      const successRate = successfulAgents / totalAgents;

      if (successRate === 1) {
        session.status = 'completed';
      } else if (successRate >= (1 - mergedOptions.failureTolerance)) {
        session.status = 'partial';
      } else {
        session.status = 'failed';
      }

      // Broadcast completion
      await this.progressTracker.broadcastEvent({
        type: 'RESEARCH_COMPLETED',
        sessionId,
        data: {
          totalDuration: session.endTime.getTime() - session.startTime.getTime(),
          confidence: this.calculateConfidence(results),
          completeness: successRate,
          resultCount: results.reduce((sum, r) => sum + r.results.length, 0)
        }
      });

      return session;

    } catch (error) {
      session.status = 'failed';
      session.endTime = new Date();
      session.errors.push(error instanceof Error ? error.message : 'Unknown error');

      // Broadcast error
      await this.progressTracker.broadcastEvent({
        type: 'RESEARCH_FAILED',
        sessionId,
        data: {
          error: session.errors[session.errors.length - 1],
          duration: session.endTime.getTime() - session.startTime.getTime()
        }
      });

      throw error;
    } finally {
      // Cleanup session after some time
      setTimeout(() => {
        this.activeSessions.delete(sessionId);
      }, 300000); // 5 minutes
    }
  }

  /**
   * Execute research agents in parallel with proper timeout and error handling
   */
  private async executeAgentsInParallel(
    session: ResearchSession,
    options: OrchestrationOptions
  ): Promise<ResearchResult[]> {
    const agents = ResearchAgentFactory.getAllAgents();
    const agentPromises: Promise<ResearchResult>[] = [];
    const semaphore = new Semaphore(options.maxConcurrentAgents);

    // Create agent execution promises
    for (const agent of agents) {
      const agentPromise = semaphore.acquire().then(async (release) => {
        try {
          return await this.executeAgentWithMonitoring(
            agent.name,
            session,
            options
          );
        } finally {
          release();
        }
      });

      agentPromises.push(agentPromise);
    }

    // Execute all agents with global timeout
    try {
      const results = await Promise.race([
        Promise.allSettled(agentPromises),
        this.createTimeoutPromise(options.timeout)
      ]);

      // Process results from Promise.allSettled
      return (results as PromiseSettledResult<ResearchResult>[]).map((result, index) => {
        const agentName = agents[index].name;
        
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          // Handle failed agent
          this.updateAgentStatus(session, agentName, 'failed', result.reason?.message);
          
          return {
            agent: agentName,
            topic: session.topic,
            results: [],
            status: 'error' as const,
            error: result.reason?.message || 'Agent execution failed',
            timestamp: new Date()
          };
        }
      });

    } catch (error) {
      // Global timeout or catastrophic failure
      console.error('Research orchestration failed:', error);
      
      // Mark all incomplete agents as failed
      session.agents.forEach(agentStatus => {
        if (agentStatus.status === 'running' || agentStatus.status === 'pending') {
          this.updateAgentStatus(session, agentStatus.name, 'timeout');
        }
      });

      throw new HttpError(500, 'Research orchestration timeout or failure');
    }
  }

  /**
   * Execute individual agent with monitoring and circuit breaker
   */
  private async executeAgentWithMonitoring(
    agentName: string,
    session: ResearchSession,
    options: OrchestrationOptions
  ): Promise<ResearchResult> {
    // Update agent status to running
    this.updateAgentStatus(session, agentName, 'running');

    // Broadcast agent start
    await this.progressTracker.broadcastEvent({
      type: 'AGENT_STARTED',
      sessionId: session.id,
      data: {
        agent: agentName,
        query: session.topic,
        engines: this.getAgentEngines(agentName)
      }
    });

    try {
      // Check circuit breaker if enabled
      if (options.circuitBreakerEnabled && this.circuitBreaker?.isOpen(agentName)) {
        throw new Error(`Circuit breaker is open for agent: ${agentName}`);
      }

      // Get agent and execute
      const agent = ResearchAgentFactory.getAgent(agentName);
      if (!agent) {
        throw new Error(`Agent not found: ${agentName}`);
      }

      // Execute agent with individual timeout
      const result = await Promise.race([
        agent.execute(session.topic, session.context),
        this.createAgentTimeoutPromise(options.timeout * 0.8) // 80% of global timeout per agent
      ]);

      // Update progress periodically during execution
      const progressInterval = setInterval(() => {
        this.updateAgentProgress(session, agentName, Math.min(90, 
          (Date.now() - (session.agents.find(a => a.name === agentName)?.startTime?.getTime() || 0)) / 
          (options.timeout * 0.008) // Rough progress estimation
        ));
      }, 1000);

      clearInterval(progressInterval);

      // Record success in circuit breaker
      if (options.circuitBreakerEnabled) {
        this.circuitBreaker?.recordSuccess(agentName);
      }

      // Update final status
      this.updateAgentStatus(session, agentName, 'completed', undefined, result.results.length);
      this.updateAgentProgress(session, agentName, 100);

      // Broadcast agent completion
      await this.progressTracker.broadcastEvent({
        type: 'AGENT_COMPLETED',
        sessionId: session.id,
        data: {
          agent: agentName,
          results: result.results.length,
          duration: Date.now() - (session.agents.find(a => a.name === agentName)?.startTime?.getTime() || 0)
        }
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown agent error';
      
      // Record failure in circuit breaker
      if (options.circuitBreakerEnabled) {
        this.circuitBreaker?.recordFailure(agentName);
      }

      // Update agent status
      this.updateAgentStatus(session, agentName, 'failed', errorMessage);

      // Try graceful degradation if enabled
      if (options.gracefulDegradationEnabled && this.gracefulDegradation) {
        const fallbackResult = await this.gracefulDegradation.handleAgentFailure(
          agentName,
          session.topic,
          session.context,
          errorMessage
        );
        
        if (fallbackResult) {
          return fallbackResult;
        }
      }

      // Broadcast agent failure
      await this.progressTracker.broadcastEvent({
        type: 'AGENT_FAILED',
        sessionId: session.id,
        data: {
          agent: agentName,
          error: errorMessage
        }
      });

      // Return failed result instead of throwing to allow other agents to continue
      return {
        agent: agentName,
        topic: session.topic,
        results: [],
        status: 'error',
        error: errorMessage,
        timestamp: new Date()
      };
    }
  }

  // Helper methods
  private generateSessionId(): string {
    return `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeAgentStatuses(priority: AgentConfigName[]): AgentStatus[] {
    const agents = ResearchAgentFactory.getAllAgents();
    
    return priority.map(agentType => {
      const agent = agents.find(a => a.name.toLowerCase().includes(agentType));
      return {
        name: agent?.name || agentType,
        status: 'pending',
        progress: 0,
        resultCount: 0
      };
    });
  }

  private updateAgentStatus(
    session: ResearchSession,
    agentName: string,
    status: AgentStatus['status'],
    error?: string,
    resultCount?: number
  ): void {
    const agentStatus = session.agents.find(a => a.name === agentName);
    if (agentStatus) {
      agentStatus.status = status;
      if (status === 'running' && !agentStatus.startTime) {
        agentStatus.startTime = new Date();
      }
      if (status === 'completed' || status === 'failed' || status === 'timeout') {
        agentStatus.endTime = new Date();
      }
      if (error) {
        agentStatus.error = error;
      }
      if (resultCount !== undefined) {
        agentStatus.resultCount = resultCount;
      }
    }
  }

  private updateAgentProgress(session: ResearchSession, agentName: string, progress: number): void {
    const agentStatus = session.agents.find(a => a.name === agentName);
    if (agentStatus) {
      agentStatus.progress = Math.min(100, Math.max(0, progress));
    }
  }

  private getAgentEngines(agentName: string): string[] {
    const agent = ResearchAgentFactory.getAgent(agentName);
    return agent?.engines || [];
  }

  private calculateConfidence(results: ResearchResult[]): number {
    const successfulResults = results.filter(r => r.status === 'success');
    if (successfulResults.length === 0) return 0;

    const totalResults = successfulResults.reduce((sum, r) => sum + r.results.length, 0);
    const avgResultsPerAgent = totalResults / successfulResults.length;
    
    // Confidence based on successful agents and result quality
    const successRate = successfulResults.length / results.length;
    const resultQuality = Math.min(1, avgResultsPerAgent / 10); // Normalize to 0-1
    
    return Math.round((successRate * 0.7 + resultQuality * 0.3) * 100) / 100;
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Research orchestration timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  private createAgentTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Agent execution timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  // Public getters
  getActiveSession(sessionId: string): ResearchSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  getAllActiveSessions(): ResearchSession[] {
    return Array.from(this.activeSessions.values());
  }

  getSessionStats(): { active: number; total: number } {
    return {
      active: this.activeSessions.size,
      total: this.activeSessions.size // In a real implementation, this would track all-time sessions
    };
  }
}

/**
 * Simple semaphore implementation for controlling concurrent agent execution
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<() => void> {
    return new Promise<() => void>((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve(() => this.release());
      } else {
        this.waitQueue.push(() => {
          this.permits--;
          resolve(() => this.release());
        });
      }
    });
  }

  private release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      if (next) next();
    }
  }
}

// Singleton instance for application-wide use
export const researchOrchestrator = new ResearchOrchestrator();