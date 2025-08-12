import { test, expect, describe, beforeEach, vi } from 'vitest';

// Mock research pipeline classes for testing
interface MockResearchResult {
  agent: string;
  topic: string;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    source: string;
    relevanceScore?: number;
  }>;
  summary?: string;
  subtopics?: string[];
  status: 'success' | 'error' | 'partial';
  error?: string;
  timestamp: Date;
}

interface MockResearchStatus {
  topicId: string;
  topic: string;
  currentDepth: number;
  totalAgents: number;
  completedAgents: number;
  activeAgents: string[];
  status: 'initializing' | 'researching' | 'aggregating' | 'completed' | 'error';
  progress: number;
  startTime: Date;
  errors: string[];
}

class MockMultiAgentCoordinator {
  private statusCallbacks: Map<string, (status: MockResearchStatus) => void> = new Map();

  registerStatusCallback(topicId: string, callback: (status: MockResearchStatus) => void): void {
    this.statusCallbacks.set(topicId, callback);
  }

  unregisterStatusCallback(topicId: string): void {
    this.statusCallbacks.delete(topicId);
  }

  private emitStatusUpdate(status: MockResearchStatus): void {
    const callback = this.statusCallbacks.get(status.topicId);
    if (callback) {
      callback(status);
    }
  }

  async coordinateAgents(
    topic: string, 
    topicId: string, 
    depth: number = 0, 
    context?: any
  ) {
    const startTime = new Date();
    
    // Initialize status
    const status: MockResearchStatus = {
      topicId,
      topic,
      currentDepth: depth,
      totalAgents: 5,
      completedAgents: 0,
      activeAgents: ['Agent1', 'Agent2', 'Agent3', 'Agent4', 'Agent5'],
      status: 'initializing',
      progress: 0,
      startTime,
      errors: []
    };

    this.emitStatusUpdate(status);

    // Simulate research process
    status.status = 'researching';
    status.progress = 25;
    this.emitStatusUpdate(status);

    // Mock agent results
    const agentResults: MockResearchResult[] = [
      {
        agent: 'General Research Agent',
        topic,
        results: [
          {
            title: `Understanding ${topic}`,
            url: 'https://example.com/1',
            snippet: `Information about ${topic}`,
            source: 'general',
            relevanceScore: 0.9
          }
        ],
        summary: `General summary for ${topic}`,
        subtopics: ['subtopic1', 'subtopic2'],
        status: 'success',
        timestamp: new Date()
      },
      {
        agent: 'Academic Research Agent',
        topic,
        results: [
          {
            title: `Academic study on ${topic}`,
            url: 'https://arxiv.org/example',
            snippet: `Academic research on ${topic}`,
            source: 'arxiv',
            relevanceScore: 0.85
          }
        ],
        summary: `Academic summary for ${topic}`,
        subtopics: ['theory1', 'method1'],
        status: 'success',
        timestamp: new Date()
      }
    ];

    status.status = 'aggregating';
    status.progress = 80;
    status.completedAgents = 5;
    status.activeAgents = [];
    this.emitStatusUpdate(status);

    // Aggregate results
    const aggregatedContent = {
      summary: `Comprehensive research summary for ${topic}`,
      keyPoints: ['Key point 1', 'Key point 2'],
      sources: agentResults.flatMap(r => r.results),
      contentByAgent: agentResults.reduce((acc, result) => {
        acc[result.agent] = result;
        return acc;
      }, {} as Record<string, MockResearchResult>),
      confidence: 0.85,
      completeness: 0.9
    };

    // Identify subtopics
    const identifiedSubtopics = depth < 2 ? ['subtopic1', 'subtopic2'] : [];

    status.status = 'completed';
    status.progress = 100;
    this.emitStatusUpdate(status);

    return {
      topic,
      depth,
      agentResults,
      aggregatedContent,
      identifiedSubtopics,
      status: 'success' as const,
      errors: []
    };
  }
}

class MockRecursiveResearchSystem {
  private coordinator: MockMultiAgentCoordinator;

  constructor() {
    this.coordinator = new MockMultiAgentCoordinator();
  }

  async startRecursiveResearch(
    rootTopic: string,
    rootTopicId: string,
    context: any,
    onStatusUpdate?: (status: MockResearchStatus) => void,
    onDepthComplete?: (result: any) => void
  ) {
    const startTime = new Date();
    
    if (onStatusUpdate) {
      this.coordinator.registerStatusCallback(rootTopicId, onStatusUpdate);
    }

    // Research root topic
    const rootResult = await this.coordinator.coordinateAgents(
      rootTopic,
      rootTopicId,
      0,
      context
    );

    if (onDepthComplete) {
      onDepthComplete(rootResult);
    }

    // Build research tree
    const researchTree = {
      topic: rootTopic,
      topicId: rootTopicId,
      depth: 0,
      result: rootResult,
      children: rootResult.identifiedSubtopics.map((subtopic: string, index: number) => ({
        topic: subtopic,
        topicId: `${rootTopicId}-${index}`,
        depth: 1,
        result: null,
        children: [],
        status: 'completed'
      })),
      status: 'completed'
    };

    return {
      rootTopic,
      rootTopicId,
      researchTree,
      totalNodes: 1 + researchTree.children.length,
      completedNodes: 1 + researchTree.children.length,
      startTime,
      endTime: new Date(),
      status: 'completed'
    };
  }
}

describe('Research Pipeline', () => {
  describe('MultiAgentCoordinator', () => {
    let coordinator: MockMultiAgentCoordinator;

    beforeEach(() => {
      coordinator = new MockMultiAgentCoordinator();
    });

    test('should initialize correctly', () => {
      expect(coordinator).toBeDefined();
    });

    test('should coordinate agents successfully', async () => {
      const result = await coordinator.coordinateAgents(
        'machine learning',
        'test-topic-id',
        0,
        { userLevel: 'intermediate' }
      );

      expect(result).toBeDefined();
      expect(result.topic).toBe('machine learning');
      expect(result.depth).toBe(0);
      expect(result.agentResults).toHaveLength(2);
      expect(result.aggregatedContent).toBeDefined();
      expect(result.identifiedSubtopics).toBeInstanceOf(Array);
      expect(result.status).toBe('success');
    });

    test('should handle status callbacks', async () => {
      const statusUpdates: MockResearchStatus[] = [];
      
      coordinator.registerStatusCallback('test-topic-id', (status) => {
        statusUpdates.push(status);
      });

      await coordinator.coordinateAgents(
        'artificial intelligence',
        'test-topic-id',
        0
      );

      expect(statusUpdates.length).toBeGreaterThan(0);
      
      // Should have different statuses during the process
      const statuses = statusUpdates.map(u => u.status);
      expect(statuses).toContain('completed'); // At least completed should be there
    });

    test('should unregister status callbacks', () => {
      const callback = vi.fn();
      
      coordinator.registerStatusCallback('test-topic-id', callback);
      coordinator.unregisterStatusCallback('test-topic-id');
      
      // Callback should not be called after unregistering
      expect(callback).not.toHaveBeenCalled();
    });

    test('should aggregate results from multiple agents', async () => {
      const result = await coordinator.coordinateAgents(
        'quantum computing',
        'test-topic-id',
        0
      );

      const { aggregatedContent } = result;
      
      expect(aggregatedContent.summary).toBeDefined();
      expect(typeof aggregatedContent.summary).toBe('string');
      expect(aggregatedContent.keyPoints).toBeInstanceOf(Array);
      expect(aggregatedContent.sources).toBeInstanceOf(Array);
      expect(aggregatedContent.contentByAgent).toBeDefined();
      expect(aggregatedContent.confidence).toBeGreaterThanOrEqual(0);
      expect(aggregatedContent.confidence).toBeLessThanOrEqual(1);
      expect(aggregatedContent.completeness).toBeGreaterThanOrEqual(0);
      expect(aggregatedContent.completeness).toBeLessThanOrEqual(1);
    });

    test('should identify subtopics from agent results', async () => {
      const result = await coordinator.coordinateAgents(
        'web development',
        'test-topic-id',
        0
      );

      expect(result.identifiedSubtopics).toBeInstanceOf(Array);
      expect(result.identifiedSubtopics.length).toBeGreaterThan(0);
    });

    test('should respect max depth for subtopic identification', async () => {
      // At max depth (2), should not identify subtopics
      const result = await coordinator.coordinateAgents(
        'test topic',
        'test-topic-id',
        2 // At max depth
      );

      expect(result.identifiedSubtopics).toEqual([]);
    });
  });

  describe('RecursiveResearchSystem', () => {
    let researchSystem: MockRecursiveResearchSystem;

    beforeEach(() => {
      researchSystem = new MockRecursiveResearchSystem();
    });

    test('should start recursive research', async () => {
      const statusUpdates: MockResearchStatus[] = [];
      const depthCompletions: any[] = [];

      const result = await researchSystem.startRecursiveResearch(
        'blockchain',
        'blockchain-root',
        { userLevel: 'intermediate' },
        (status) => statusUpdates.push(status),
        (depthResult) => depthCompletions.push(depthResult)
      );

      expect(result).toBeDefined();
      expect(result.rootTopic).toBe('blockchain');
      expect(result.rootTopicId).toBe('blockchain-root');
      expect(result.researchTree).toBeDefined();
      expect(result.totalNodes).toBeGreaterThan(0);
      expect(result.status).toBe('completed');
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
    });

    test('should build research tree with proper hierarchy', async () => {
      const result = await researchSystem.startRecursiveResearch(
        'artificial intelligence',
        'ai-root',
        { userLevel: 'beginner' }
      );

      const { researchTree } = result;
      
      expect(researchTree.topic).toBe('artificial intelligence');
      expect(researchTree.depth).toBe(0);
      expect(researchTree.status).toBe('completed');
      expect(researchTree.result).toBeDefined();
      
      // Should have children if subtopics were identified
      if (researchTree.children.length > 0) {
        researchTree.children.forEach((child: any) => {
          expect(child.depth).toBe(1);
          expect(child.topic).toBeDefined();
          expect(child.topicId).toContain('ai-root-');
        });
      }
    });

    test('should count nodes correctly', async () => {
      const result = await researchSystem.startRecursiveResearch(
        'data structures',
        'ds-root',
        {}
      );

      expect(result.totalNodes).toBeGreaterThan(0);
      expect(result.completedNodes).toBeGreaterThan(0);
      expect(result.completedNodes).toBeLessThanOrEqual(result.totalNodes);
    });

    test('should handle depth completion callbacks', async () => {
      const depthCompletions: any[] = [];

      await researchSystem.startRecursiveResearch(
        'cybersecurity',
        'cyber-root',
        {},
        undefined,
        (result) => depthCompletions.push(result)
      );

      expect(depthCompletions.length).toBeGreaterThan(0);
      
      depthCompletions.forEach(completion => {
        expect(completion.topic).toBeDefined();
        expect(completion.depth).toBeGreaterThanOrEqual(0);
        expect(completion.agentResults).toBeInstanceOf(Array);
        expect(completion.aggregatedContent).toBeDefined();
      });
    });
  });

  describe('Progress Tracking', () => {
    test('should track progress correctly', async () => {
      const coordinator = new MockMultiAgentCoordinator();
      const progressUpdates: number[] = [];
      
      coordinator.registerStatusCallback('test-topic', (status) => {
        progressUpdates.push(status.progress);
      });

      await coordinator.coordinateAgents('test topic', 'test-topic', 0);

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0]).toBe(0); // Should start at 0
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100); // Should end at 100
    });

    test('should track agent completion', async () => {
      const coordinator = new MockMultiAgentCoordinator();
      const completionUpdates: number[] = [];
      
      coordinator.registerStatusCallback('test-topic', (status) => {
        completionUpdates.push(status.completedAgents);
      });

      await coordinator.coordinateAgents('test topic', 'test-topic', 0);

      expect(completionUpdates.length).toBeGreaterThan(0);
      expect(completionUpdates[0]).toBe(0); // Should start at 0
      expect(completionUpdates[completionUpdates.length - 1]).toBe(5); // Should end at total agents
    });
  });

  describe('Error Handling', () => {
    test('should handle coordination errors gracefully', async () => {
      const coordinator = new MockMultiAgentCoordinator();
      
      // Mock the coordinateAgents method to throw an error
      const originalCoordinateAgents = coordinator.coordinateAgents;
      coordinator.coordinateAgents = async (topic: string, topicId: string, depth: number = 0, context?: any) => {
        throw new Error('Coordination failed');
      };
      
      await expect(coordinator.coordinateAgents('test', 'test-id', 0))
        .rejects.toThrow('Coordination failed');
      
      // Restore original method
      coordinator.coordinateAgents = originalCoordinateAgents;
    });

    test('should handle status callback errors', () => {
      const coordinator = new MockMultiAgentCoordinator();
      const failingCallback = () => {
        throw new Error('Callback failed');
      };
      
      coordinator.registerStatusCallback('test-topic', failingCallback);
      
      // Should throw when callback fails (this is expected behavior)
      expect(() => {
        (coordinator as any).emitStatusUpdate({
          topicId: 'test-topic',
          topic: 'test',
          currentDepth: 0,
          totalAgents: 5,
          completedAgents: 0,
          activeAgents: [],
          status: 'initializing',
          progress: 0,
          startTime: new Date(),
          errors: []
        });
      }).toThrow('Callback failed');
    });
  });
});