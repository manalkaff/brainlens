import { test, expect, describe, beforeEach } from 'vitest';

// Mock research agent classes for testing
class MockGeneralResearchAgent {
  name = 'General Research Agent';
  description = 'Provides comprehensive information about any topic with broad coverage';
  engines: string[] = [];
  prompt = 'Research comprehensive information about {topic} including definitions, key concepts, applications, and current developments';

  async execute(topic: string, context?: any) {
    return {
      agent: this.name,
      topic,
      results: [
        {
          title: `Understanding ${topic}: A Comprehensive Guide`,
          url: `https://example.com/${topic.toLowerCase().replace(/\s+/g, '-')}`,
          snippet: `${topic} is a fundamental concept that encompasses various aspects including definitions, applications, and current developments in the field.`,
          source: 'general',
          relevanceScore: 0.9,
          metadata: { type: 'general', userLevel: context?.userLevel }
        }
      ],
      summary: `Research summary for ${topic}`,
      subtopics: ['concept1', 'concept2'],
      status: 'success' as const,
      timestamp: new Date()
    };
  }
}

class MockAcademicResearchAgent {
  name = 'Academic Research Agent';
  description = 'Finds peer-reviewed research and scholarly articles';
  engines = ['arxiv', 'google scholar', 'pubmed'];
  prompt = 'Find peer-reviewed research, academic papers, and scholarly articles about {topic} focusing on latest findings and theoretical frameworks';

  async execute(topic: string, context?: any) {
    return {
      agent: this.name,
      topic,
      results: [
        {
          title: `A Systematic Review of ${topic}: Recent Advances`,
          url: `https://arxiv.org/abs/2024.12345`,
          snippet: `This systematic review examines recent advances in ${topic} research.`,
          source: 'arxiv',
          relevanceScore: 0.85,
          metadata: { type: 'academic', searchEngine: 'arxiv' }
        }
      ],
      summary: `Academic research summary for ${topic}`,
      subtopics: ['theory1', 'method1'],
      status: 'success' as const,
      timestamp: new Date()
    };
  }
}

describe('Research Agents', () => {
  describe('GeneralResearchAgent', () => {
    let agent: MockGeneralResearchAgent;

    beforeEach(() => {
      agent = new MockGeneralResearchAgent();
    });

    test('should have correct properties', () => {
      expect(agent.name).toBe('General Research Agent');
      expect(agent.description).toBe('Provides comprehensive information about any topic with broad coverage');
      expect(agent.engines).toEqual([]);
      expect(agent.prompt).toContain('Research comprehensive information');
    });

    test('should execute research successfully', async () => {
      const result = await agent.execute('machine learning');
      
      expect(result).toBeDefined();
      expect(result.agent).toBe('General Research Agent');
      expect(result.topic).toBe('machine learning');
      expect(result.status).toBe('success');
      expect(result.results).toBeInstanceOf(Array);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    test('should handle context parameters', async () => {
      const context = {
        userLevel: 'beginner',
        searchStrategy: 'comprehensive'
      };
      
      const result = await agent.execute('artificial intelligence', context);
      
      expect(result.status).toBe('success');
      expect(result.results[0].metadata?.userLevel).toBe('beginner');
    });

    test('should generate summary and subtopics', async () => {
      const result = await agent.execute('quantum computing');
      
      expect(result.summary).toBeDefined();
      expect(typeof result.summary).toBe('string');
      expect(result.subtopics).toBeDefined();
      expect(result.subtopics).toBeInstanceOf(Array);
    });
  });

  describe('AcademicResearchAgent', () => {
    let agent: MockAcademicResearchAgent;

    beforeEach(() => {
      agent = new MockAcademicResearchAgent();
    });

    test('should have correct academic properties', () => {
      expect(agent.name).toBe('Academic Research Agent');
      expect(agent.engines).toEqual(['arxiv', 'google scholar', 'pubmed']);
      expect(agent.prompt).toContain('peer-reviewed research');
    });

    test('should return academic-focused results', async () => {
      const result = await agent.execute('neural networks');
      
      expect(result.status).toBe('success');
      expect(result.results.length).toBeGreaterThan(0);
      
      // Check that results have academic characteristics
      const firstResult = result.results[0];
      expect(firstResult.source).toBe('arxiv');
      expect(firstResult.metadata?.type).toBe('academic');
    });
  });

  describe('Agent Factory Pattern', () => {
    test('should manage multiple agent types', () => {
      const agents = [
        new MockGeneralResearchAgent(),
        new MockAcademicResearchAgent()
      ];
      
      expect(agents).toHaveLength(2);
      expect(agents.map(a => a.name)).toEqual([
        'General Research Agent',
        'Academic Research Agent'
      ]);
    });

    test('should execute multiple agents', async () => {
      const agents = [
        new MockGeneralResearchAgent(),
        new MockAcademicResearchAgent()
      ];
      
      const promises = agents.map(agent => agent.execute('blockchain technology'));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(2);
      
      results.forEach(result => {
        expect(result.status).toBe('success');
        expect(result.topic).toBe('blockchain technology');
        expect(result.timestamp).toBeInstanceOf(Date);
      });
    });

    test('should handle agent execution errors gracefully', async () => {
      const agent = new MockGeneralResearchAgent();
      
      // Mock the execute method to throw an error
      const originalExecute = agent.execute;
      agent.execute = async (topic: string, context?: any) => {
        throw new Error('Mock agent error');
      };
      
      try {
        await agent.execute('test topic');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Mock agent error');
      }
      
      // Restore original method
      agent.execute = originalExecute;
    });
  });

  describe('Agent Context Handling', () => {
    test('should handle missing context gracefully', async () => {
      const agent = new MockGeneralResearchAgent();
      
      const result = await agent.execute('test topic');
      
      expect(result.status).toBe('success');
      expect(result.results.length).toBeGreaterThan(0);
    });

    test('should use context when provided', async () => {
      const agent = new MockGeneralResearchAgent();
      const context = {
        userLevel: 'advanced',
        searchStrategy: 'focused'
      };
      
      const result = await agent.execute('test topic', context);
      
      expect(result.status).toBe('success');
      expect(result.results[0].metadata?.userLevel).toBe('advanced');
    });
  });

  describe('Result Structure Validation', () => {
    test('should return properly structured results', async () => {
      const agent = new MockGeneralResearchAgent();
      const result = await agent.execute('test topic');
      
      // Validate result structure
      expect(result).toHaveProperty('agent');
      expect(result).toHaveProperty('topic');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('subtopics');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      
      // Validate results array structure
      result.results.forEach(searchResult => {
        expect(searchResult).toHaveProperty('title');
        expect(searchResult).toHaveProperty('url');
        expect(searchResult).toHaveProperty('snippet');
        expect(searchResult).toHaveProperty('source');
        expect(searchResult).toHaveProperty('relevanceScore');
        expect(searchResult).toHaveProperty('metadata');
      });
    });

    test('should have valid relevance scores', async () => {
      const agent = new MockGeneralResearchAgent();
      const result = await agent.execute('test topic');
      
      result.results.forEach(searchResult => {
        expect(searchResult.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(searchResult.relevanceScore).toBeLessThanOrEqual(1);
      });
    });
  });
});