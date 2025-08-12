import { test, expect, describe, beforeEach, vi } from 'vitest';

// Mock integration manager for testing
class MockResearchIntegrationManager {
  private activeResearch: Map<string, any> = new Map();
  private researchQueue: string[] = [];
  private maxConcurrentResearch = 3;

  async startTopicResearch(topicId: string, context: any, userContext?: any): Promise<void> {
    // Check if research is already active
    if (this.activeResearch.has(topicId)) {
      throw new Error('Research already in progress for this topic');
    }

    // Check concurrent research limit
    if (this.activeResearch.size >= this.maxConcurrentResearch) {
      this.researchQueue.push(topicId);
      throw new Error('Maximum concurrent research limit reached. Added to queue.');
    }

    // Simulate starting research
    this.activeResearch.set(topicId, {
      startTime: new Date(),
      context,
      userContext
    });
  }

  async cancelResearch(topicId: string, context: any): Promise<void> {
    // Remove from active research
    this.activeResearch.delete(topicId);
    
    // Remove from queue
    const queueIndex = this.researchQueue.indexOf(topicId);
    if (queueIndex > -1) {
      this.researchQueue.splice(queueIndex, 1);
    }
  }

  getResearchStatus(topicId: string): 'active' | 'queued' | 'inactive' {
    if (this.activeResearch.has(topicId)) {
      return 'active';
    }
    if (this.researchQueue.includes(topicId)) {
      return 'queued';
    }
    return 'inactive';
  }

  getActiveResearchCount(): number {
    return this.activeResearch.size;
  }

  getQueueLength(): number {
    return this.researchQueue.length;
  }

  // Simulate processing queue
  async processQueue(context: any): Promise<void> {
    if (this.researchQueue.length > 0 && this.activeResearch.size < this.maxConcurrentResearch) {
      const nextTopicId = this.researchQueue.shift();
      if (nextTopicId) {
        await this.startTopicResearch(nextTopicId, context);
      }
    }
  }
}

// Mock context for testing
const createMockContext = (overrides = {}) => ({
  user: { id: 'test-user-id' },
  entities: {
    Topic: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    VectorDocument: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    UserTopicProgress: {
      create: vi.fn(),
    },
  },
  ...overrides,
});

describe('Research Integration', () => {
  describe('ResearchIntegrationManager', () => {
    let manager: MockResearchIntegrationManager;
    let mockContext: any;

    beforeEach(() => {
      manager = new MockResearchIntegrationManager();
      mockContext = createMockContext();
    });

    test('should start topic research successfully', async () => {
      await manager.startTopicResearch('topic-1', mockContext);
      expect(manager.getResearchStatus('topic-1')).toBe('active');
      expect(manager.getActiveResearchCount()).toBe(1);
    });

    test('should reject duplicate research requests', async () => {
      await manager.startTopicResearch('topic-1', mockContext);
      
      await expect(manager.startTopicResearch('topic-1', mockContext))
        .rejects.toThrow('Research already in progress for this topic');
    });

    test('should queue research when at concurrent limit', async () => {
      // Fill up to the limit
      await manager.startTopicResearch('topic-1', mockContext);
      await manager.startTopicResearch('topic-2', mockContext);
      await manager.startTopicResearch('topic-3', mockContext);
      
      expect(manager.getActiveResearchCount()).toBe(3);

      // Next request should be queued
      await expect(manager.startTopicResearch('topic-4', mockContext))
        .rejects.toThrow('Maximum concurrent research limit reached');
      
      expect(manager.getQueueLength()).toBe(1);
      expect(manager.getResearchStatus('topic-4')).toBe('queued');
    });

    test('should cancel research successfully', async () => {
      await manager.startTopicResearch('topic-1', mockContext);
      expect(manager.getResearchStatus('topic-1')).toBe('active');

      await manager.cancelResearch('topic-1', mockContext);
      expect(manager.getResearchStatus('topic-1')).toBe('inactive');
      expect(manager.getActiveResearchCount()).toBe(0);
    });

    test('should cancel queued research', async () => {
      // Fill up active research
      await manager.startTopicResearch('topic-1', mockContext);
      await manager.startTopicResearch('topic-2', mockContext);
      await manager.startTopicResearch('topic-3', mockContext);
      
      // Queue a research request
      await expect(manager.startTopicResearch('topic-4', mockContext))
        .rejects.toThrow('Maximum concurrent research limit reached');
      
      expect(manager.getQueueLength()).toBe(1);

      // Cancel the queued research
      await manager.cancelResearch('topic-4', mockContext);
      expect(manager.getQueueLength()).toBe(0);
      expect(manager.getResearchStatus('topic-4')).toBe('inactive');
    });

    test('should get correct research status', () => {
      expect(manager.getResearchStatus('inactive-topic')).toBe('inactive');
    });

    test('should handle user context', async () => {
      const userContext = {
        userLevel: 'advanced' as const,
        learningStyle: 'visual' as const,
        preferences: { depth: 'detailed' }
      };

      await manager.startTopicResearch('topic-1', mockContext, userContext);
      expect(manager.getResearchStatus('topic-1')).toBe('active');
    });

    test('should process queue when research completes', async () => {
      // Fill up active research
      await manager.startTopicResearch('topic-1', mockContext);
      await manager.startTopicResearch('topic-2', mockContext);
      await manager.startTopicResearch('topic-3', mockContext);
      
      // Queue a research request
      await expect(manager.startTopicResearch('topic-4', mockContext))
        .rejects.toThrow('Maximum concurrent research limit reached');
      
      expect(manager.getQueueLength()).toBe(1);

      // Cancel one active research to free up space
      await manager.cancelResearch('topic-1', mockContext);
      expect(manager.getActiveResearchCount()).toBe(2);

      // Process queue should start the queued research
      await manager.processQueue(mockContext);
      expect(manager.getActiveResearchCount()).toBe(3);
      expect(manager.getQueueLength()).toBe(0);
      expect(manager.getResearchStatus('topic-4')).toBe('active');
    });
  });

  describe('Status Management', () => {
    let manager: MockResearchIntegrationManager;
    let mockContext: any;

    beforeEach(() => {
      manager = new MockResearchIntegrationManager();
      mockContext = createMockContext();
    });

    test('should track active research count', async () => {
      expect(manager.getActiveResearchCount()).toBe(0);

      await manager.startTopicResearch('topic-1', mockContext);
      expect(manager.getActiveResearchCount()).toBe(1);

      await manager.startTopicResearch('topic-2', mockContext);
      expect(manager.getActiveResearchCount()).toBe(2);

      await manager.cancelResearch('topic-1', mockContext);
      expect(manager.getActiveResearchCount()).toBe(1);
    });

    test('should track queue length', async () => {
      expect(manager.getQueueLength()).toBe(0);

      // Fill up active research
      await manager.startTopicResearch('topic-1', mockContext);
      await manager.startTopicResearch('topic-2', mockContext);
      await manager.startTopicResearch('topic-3', mockContext);

      // Queue requests
      await expect(manager.startTopicResearch('topic-4', mockContext))
        .rejects.toThrow('Maximum concurrent research limit reached');
      expect(manager.getQueueLength()).toBe(1);

      await expect(manager.startTopicResearch('topic-5', mockContext))
        .rejects.toThrow('Maximum concurrent research limit reached');
      expect(manager.getQueueLength()).toBe(2);
    });

    test('should return correct status for different states', async () => {
      // Inactive topic
      expect(manager.getResearchStatus('topic-1')).toBe('inactive');

      // Active topic
      await manager.startTopicResearch('topic-1', mockContext);
      expect(manager.getResearchStatus('topic-1')).toBe('active');

      // Fill up to create queue
      await manager.startTopicResearch('topic-2', mockContext);
      await manager.startTopicResearch('topic-3', mockContext);

      // Queued topic
      await expect(manager.startTopicResearch('topic-4', mockContext))
        .rejects.toThrow('Maximum concurrent research limit reached');
      expect(manager.getResearchStatus('topic-4')).toBe('queued');
    });
  });

  describe('Error Handling', () => {
    let manager: MockResearchIntegrationManager;
    let mockContext: any;

    beforeEach(() => {
      manager = new MockResearchIntegrationManager();
      mockContext = createMockContext();
    });

    test('should handle context errors gracefully', async () => {
      const invalidContext = null;

      // Should not throw for invalid context in this mock
      await manager.startTopicResearch('topic-1', invalidContext);
      expect(manager.getResearchStatus('topic-1')).toBe('active');
    });

    test('should handle cancellation of non-existent research', async () => {
      // Should not throw when cancelling non-existent research
      await expect(manager.cancelResearch('non-existent', mockContext))
        .resolves.toBeUndefined();
    });

    test('should handle queue processing errors', async () => {
      // Fill up active research
      await manager.startTopicResearch('topic-1', mockContext);
      await manager.startTopicResearch('topic-2', mockContext);
      await manager.startTopicResearch('topic-3', mockContext);

      // Queue a request
      await expect(manager.startTopicResearch('topic-4', mockContext))
        .rejects.toThrow('Maximum concurrent research limit reached');

      // Process queue should work even with errors
      await expect(manager.processQueue(mockContext))
        .resolves.toBeUndefined();
    });
  });

  describe('Configuration', () => {
    test('should respect concurrent research limits', async () => {
      const manager = new MockResearchIntegrationManager();
      const mockContext = createMockContext();

      // Should be able to start up to the limit
      await manager.startTopicResearch('topic-1', mockContext);
      await manager.startTopicResearch('topic-2', mockContext);
      await manager.startTopicResearch('topic-3', mockContext);

      expect(manager.getActiveResearchCount()).toBe(3);

      // Next request should be queued
      await expect(manager.startTopicResearch('topic-4', mockContext))
        .rejects.toThrow('Maximum concurrent research limit reached');
    });

    test('should handle user context preferences', async () => {
      const manager = new MockResearchIntegrationManager();
      const mockContext = createMockContext();

      const userContext = {
        userLevel: 'beginner' as const,
        learningStyle: 'auditory' as const,
        preferences: {
          depth: 'overview',
          includeExamples: true
        }
      };

      await manager.startTopicResearch('topic-1', mockContext, userContext);
      expect(manager.getResearchStatus('topic-1')).toBe('active');
    });
  });
});