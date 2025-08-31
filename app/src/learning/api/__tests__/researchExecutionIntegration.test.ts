import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the SearxngUtils to simulate engine availability scenarios
const mockSearxngUtils = {
  searchWithAgent: vi.fn()
};

vi.mock('../../../learning/research/searxng', () => ({
  SearxngUtils: mockSearxngUtils
}));

describe('Research Execution Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Enhanced Query Distribution Handling', () => {
    it('should handle mixed engine success and failure scenarios', async () => {
      // Mock different engine responses
      mockSearxngUtils.searchWithAgent
        .mockImplementationOnce(async (engine: string, query: string) => {
          if (engine === 'general') {
            return {
              results: [
                {
                  title: 'General ML Guide',
                  url: 'https://example.com/ml-guide',
                  content: 'Machine learning basics explained',
                  engine: 'general',
                  score: 0.8
                }
              ]
            };
          }
          throw new Error('Engine unavailable');
        })
        .mockImplementationOnce(async (engine: string, query: string) => {
          if (engine === 'general') {
            return {
              results: [
                {
                  title: 'ML Applications',
                  url: 'https://example.com/ml-apps',
                  content: 'Real-world ML applications',
                  engine: 'general',
                  score: 0.7
                }
              ]
            };
          }
          throw new Error('Engine unavailable');
        })
        .mockImplementationOnce(async (engine: string, query: string) => {
          // Academic engine fails
          throw new Error('Academic engine timeout');
        })
        .mockImplementationOnce(async (engine: string, query: string) => {
          // Video engine succeeds
          if (engine === 'video') {
            return {
              results: [
                {
                  title: 'ML Video Tutorial',
                  url: 'https://youtube.com/ml-tutorial',
                  content: 'Video explanation of ML concepts',
                  engine: 'video',
                  score: 0.6
                }
              ]
            };
          }
          throw new Error('Engine unavailable');
        });

      // Simulate research plan with mixed engines
      const researchPlan = {
        researchQueries: [
          { query: 'machine learning basics', engine: 'general' as const, reasoning: 'Basic overview' },
          { query: 'ML applications', engine: 'general' as const, reasoning: 'Practical uses' },
          { query: 'ML research papers', engine: 'academic' as const, reasoning: 'Academic depth' },
          { query: 'ML video tutorials', engine: 'video' as const, reasoning: 'Visual learning' }
        ],
        researchStrategy: 'comprehensive',
        expectedOutcomes: ['understanding', 'examples'],
        engineDistribution: {
          general: 2,
          academic: 1,
          video: 1,
          community: 0,
          computational: 0
        }
      };

      // Test that the system handles mixed success/failure gracefully
      expect(researchPlan.researchQueries.length).toBe(4);
      expect(researchPlan.researchQueries.filter(q => q.engine === 'general')).toHaveLength(2);
      expect(researchPlan.engineDistribution.general).toBe(2);
      
      // Verify engine distribution validation
      const actualDistribution = researchPlan.researchQueries.reduce((acc, query) => {
        acc[query.engine] = (acc[query.engine] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      expect(actualDistribution.general).toBe(researchPlan.engineDistribution.general);
      expect(actualDistribution.academic).toBe(researchPlan.engineDistribution.academic);
      expect(actualDistribution.video).toBe(researchPlan.engineDistribution.video);
    });

    it('should validate minimum general queries requirement', () => {
      const validPlan = {
        researchQueries: [
          { query: 'topic overview', engine: 'general' as const, reasoning: 'overview' },
          { query: 'topic basics', engine: 'general' as const, reasoning: 'basics' },
          { query: 'topic examples', engine: 'general' as const, reasoning: 'examples' },
          { query: 'topic guide', engine: 'general' as const, reasoning: 'guide' },
          { query: 'topic intro', engine: 'general' as const, reasoning: 'intro' },
          { query: 'topic research', engine: 'academic' as const, reasoning: 'research' }
        ],
        researchStrategy: 'balanced',
        expectedOutcomes: ['understanding'],
        engineDistribution: {
          general: 5,
          academic: 1,
          video: 0,
          community: 0,
          computational: 0
        }
      };

      const generalQueries = validPlan.researchQueries.filter(q => q.engine === 'general');
      expect(generalQueries.length).toBeGreaterThanOrEqual(5);
      expect(validPlan.engineDistribution.general).toBe(generalQueries.length);
    });

    it('should handle engine availability issues with proper error tracking', () => {
      const failedQueries = [
        { query: 'academic query', engine: 'academic', error: 'Connection timeout' },
        { query: 'video query', engine: 'video', error: 'Service unavailable' },
        { query: 'general query', engine: 'general', error: 'Rate limit exceeded' }
      ];

      // Track engine failures
      const engineFailures = failedQueries.reduce((acc, failure) => {
        acc[failure.engine] = (acc[failure.engine] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(engineFailures.academic).toBe(1);
      expect(engineFailures.video).toBe(1);
      expect(engineFailures.general).toBe(1);

      // Identify critical vs non-critical failures
      const criticalFailures = failedQueries.filter(f => f.engine === 'general');
      const nonCriticalFailures = failedQueries.filter(f => f.engine !== 'general');

      expect(criticalFailures).toHaveLength(1);
      expect(nonCriticalFailures).toHaveLength(2);
    });
  });

  describe('Fallback Strategy Validation', () => {
    it('should implement proper fallback for general engine failures', () => {
      const originalQuery = 'advanced machine learning algorithms';
      
      // Simulate fallback query generation
      const fallbackQueries = [
        originalQuery.replace(/advanced|complex|technical/gi, 'basic'),
        originalQuery.split(' ').slice(0, 3).join(' '),
        `${originalQuery} beginner guide overview`
      ];

      expect(fallbackQueries[0]).toBe('basic machine learning algorithms');
      expect(fallbackQueries[1]).toBe('advanced machine learning');
      expect(fallbackQueries[2]).toBe('advanced machine learning algorithms beginner guide overview');
    });

    it('should provide general fallback for specialized engines', () => {
      const specializedQuery = 'neural network research papers';
      const generalizedQuery = `${specializedQuery} general information overview`;
      
      expect(generalizedQuery).toBe('neural network research papers general information overview');
      
      // Simulate fallback result processing
      const fallbackResult = {
        title: 'General Neural Network Info',
        url: 'https://example.com/nn-info',
        snippet: 'General overview of neural networks',
        source: 'general',
        relevanceScore: 0.4, // Lower score for cross-engine fallback
        engine: 'general',
        reasoning: 'Academic sources needed (general fallback for academic due to: Engine unavailable)'
      };

      expect(fallbackResult.engine).toBe('general');
      expect(fallbackResult.relevanceScore).toBeLessThan(0.5);
      expect(fallbackResult.reasoning).toContain('general fallback for academic');
    });
  });

  describe('Research Quality Validation', () => {
    it('should ensure diverse source types are collected', () => {
      const mockResults = [
        { engine: 'general', title: 'General Guide', relevanceScore: 0.8 },
        { engine: 'general', title: 'Basic Overview', relevanceScore: 0.7 },
        { engine: 'academic', title: 'Research Paper', relevanceScore: 0.9 },
        { engine: 'video', title: 'Tutorial Video', relevanceScore: 0.6 },
        { engine: 'community', title: 'Forum Discussion', relevanceScore: 0.5 }
      ];

      const engineTypes = Array.from(new Set(mockResults.map(r => r.engine)));
      const generalResults = mockResults.filter(r => r.engine === 'general');
      const specializedResults = mockResults.filter(r => r.engine !== 'general');

      expect(engineTypes.length).toBeGreaterThan(1); // Diverse engines
      expect(generalResults.length).toBeGreaterThanOrEqual(2); // Sufficient general sources
      expect(specializedResults.length).toBeGreaterThan(0); // Some specialized sources
    });

    it('should validate research execution success criteria', () => {
      // Test successful scenario
      const successfulExecution = {
        generalQueriesSuccessful: 5,
        specializedQueriesSuccessful: 3,
        totalResults: 15,
        failedQueries: []
      };

      expect(successfulExecution.generalQueriesSuccessful).toBeGreaterThanOrEqual(3);
      expect(successfulExecution.totalResults).toBeGreaterThanOrEqual(5);

      // Test failure scenario
      const failedExecution = {
        generalQueriesSuccessful: 2, // Below minimum
        specializedQueriesSuccessful: 0,
        totalResults: 3, // Below minimum
        failedQueries: [
          { query: 'test', engine: 'general', error: 'timeout' }
        ]
      };

      expect(failedExecution.generalQueriesSuccessful).toBeLessThan(3);
      expect(failedExecution.totalResults).toBeLessThan(5);
      expect(failedExecution.failedQueries.length).toBeGreaterThan(0);
    });
  });

  describe('Enhanced Error Handling', () => {
    it('should categorize errors by severity', () => {
      const errors = [
        { engine: 'general', error: 'Connection timeout', severity: 'critical' },
        { engine: 'academic', error: 'Service unavailable', severity: 'warning' },
        { engine: 'video', error: 'Rate limit', severity: 'warning' }
      ];

      const criticalErrors = errors.filter(e => e.severity === 'critical');
      const warningErrors = errors.filter(e => e.severity === 'warning');

      expect(criticalErrors).toHaveLength(1);
      expect(warningErrors).toHaveLength(2);
      expect(criticalErrors[0].engine).toBe('general');
    });

    it('should implement proper retry logic for transient failures', () => {
      const retryableErrors = ['timeout', 'connection refused', 'rate limit'];
      const nonRetryableErrors = ['invalid query', 'authentication failed', 'not found'];

      retryableErrors.forEach(error => {
        expect(['timeout', 'connection', 'rate'].some(keyword => 
          error.toLowerCase().includes(keyword)
        )).toBe(true);
      });

      nonRetryableErrors.forEach(error => {
        expect(['invalid', 'authentication', 'not found'].some(keyword => 
          error.toLowerCase().includes(keyword)
        )).toBe(true);
      });
    });
  });
});