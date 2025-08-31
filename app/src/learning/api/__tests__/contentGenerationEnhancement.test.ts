import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AILearningAgent } from '../aiLearningAgent';
import type { TopicResearchRequest, TopicUnderstanding } from '../aiLearningAgent';

// Mock the SearxngUtils to control search results
vi.mock('../../research/searxng', () => ({
  SearxngUtils: {
    searchWithAgent: vi.fn()
  }
}));

// Mock the AI SDK to control AI responses
vi.mock('ai', () => ({
  generateObject: vi.fn(),
  generateText: vi.fn()
}));

describe('Enhanced Content Generation System Integration Tests', () => {
  let agent: AILearningAgent;
  let mockGenerateObject: any;
  let mockGenerateText: any;
  let mockSearxngUtils: any;

  beforeEach(async () => {
    const { generateObject, generateText } = await import('ai');
    const { SearxngUtils } = await import('../../research/searxng');
    
    mockGenerateObject = generateObject as any;
    mockGenerateText = generateText as any;
    mockSearxngUtils = SearxngUtils as any;
    
    agent = new AILearningAgent();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Task 8.1: Test enhanced system with sample topics for improved readability', () => {
    it('should generate accessible content for technical topics', async () => {
      // Mock topic understanding
      const mockUnderstanding: TopicUnderstanding = {
        definition: "Machine learning is a method of data analysis that automates analytical model building",
        category: "technical",
        complexity: "intermediate",
        relevantDomains: ["computer science", "statistics", "data science"],
        engineRecommendations: {
          academic: true,
          video: true,
          community: true,
          computational: false
        },
        researchApproach: "broad-overview"
      };

      // Mock research plan generation with mandatory 5 general queries
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          researchQueries: [
            { query: "machine learning basics overview", engine: "general", reasoning: "Basic understanding" },
            { query: "machine learning examples everyday life", engine: "general", reasoning: "Practical examples" },
            { query: "machine learning simple explanation", engine: "general", reasoning: "Accessible explanation" },
            { query: "machine learning beginner guide", engine: "general", reasoning: "Entry-level content" },
            { query: "machine learning applications practical", engine: "general", reasoning: "Real-world uses" },
            { query: "machine learning research papers", engine: "academic", reasoning: "Academic depth" },
            { query: "machine learning tutorial videos", engine: "video", reasoning: "Visual learning" }
          ],
          researchStrategy: "Balanced approach combining accessible explanations with credible sources",
          expectedOutcomes: ["Clear understanding", "Practical examples", "Next steps"],
          engineDistribution: {
            general: 5,
            academic: 1,
            video: 1,
            community: 0,
            computational: 0
          }
        }
      });

      // Mock search results with diverse sources - provide multiple results per query
      mockSearxngUtils.searchWithAgent.mockResolvedValue({
        results: [
          {
            title: "Machine Learning Explained Simply",
            url: "https://example.com/ml-simple",
            content: "Machine learning helps computers learn patterns from data without being explicitly programmed",
            engine: "general",
            score: 0.9
          },
          {
            title: "Real-World ML Applications", 
            url: "https://example.com/ml-apps",
            content: "Examples include recommendation systems, email spam detection, and voice assistants",
            engine: "general",
            score: 0.8
          }
        ]
      });

      // Mock synthesis generation
      mockGenerateText.mockResolvedValueOnce({
        text: JSON.stringify({
          keyInsights: [
            "Machine learning enables computers to learn from data without explicit programming",
            "Common applications include recommendation systems and spam detection",
            "Understanding starts with recognizing patterns in data"
          ],
          contentThemes: [
            "Basic concepts and definitions",
            "Practical applications in daily life",
            "Getting started with learning ML"
          ],
          practicalFocus: "high",
          sourceBalance: "balanced"
        })
      });

      // Mock content generation with accessibility focus
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          title: "Understanding Machine Learning: A Beginner's Guide",
          sections: [
            {
              title: "What is Machine Learning - Basic Introduction",
              content: "Machine learning is like teaching a computer to recognize patterns, similar to how you learn to recognize faces. Instead of giving the computer specific instructions for every situation, we show it examples and let it figure out the patterns on its own.",
              sources: ["https://example.com/ml-simple"],
              complexity: "foundation",
              learningObjective: "Understand what machine learning is in simple terms"
            },
            {
              title: "How Machine Learning Works in Everyday Life",
              content: "You interact with machine learning every day without realizing it. When Netflix recommends movies you might like, or when your email automatically sorts spam, that's machine learning at work. These systems learn from millions of examples to make predictions about what you might want or need.",
              sources: ["https://example.com/ml-apps", "https://example.com/ml-practical"],
              complexity: "building",
              learningObjective: "Recognize machine learning in daily applications"
            },
            {
              title: "Getting Started: Your First Steps with Machine Learning",
              content: "To begin learning about machine learning, start by understanding data - the fuel that powers these systems. Think of data as examples that teach the computer. Just like learning to cook by following recipes, machine learning algorithms learn by studying many examples of input and desired output.",
              sources: ["https://example.com/ml-beginners", "https://example.com/ml-start"],
              complexity: "application",
              learningObjective: "Know how to begin learning machine learning concepts"
            }
          ],
          keyTakeaways: [
            "Machine learning teaches computers to find patterns in data",
            "It powers many everyday applications like recommendations and spam detection",
            "Learning ML starts with understanding data and patterns"
          ],
          nextSteps: [
            "Try a simple online ML tutorial with visual examples",
            "Explore how recommendation systems work on your favorite platforms"
          ]
        }
      });

      const request: TopicResearchRequest = {
        topic: "machine learning",
        depth: 1,
        maxDepth: 2,
        understanding: mockUnderstanding
      };

      const result = await agent.researchAndGenerate(request);

      // Verify accessibility requirements (Requirement 1.1, 1.2, 1.4)
      expect(result.content.title).toContain("Beginner's Guide");
      expect(result.content.sections[0].content).toContain("similar to how you learn");
      expect(result.content.sections[1].content).toContain("without realizing it");
      
      // Verify progressive learning structure (Requirement 1.5, 3.2, 3.3)
      expect(result.content.sections[0].complexity).toBe("foundation");
      expect(result.content.sections[1].complexity).toBe("building");
      expect(result.content.sections[2].complexity).toBe("application");
      
      // Verify practical examples (Requirement 1.4)
      expect(result.content.sections[1].content).toContain("Netflix recommends");
      expect(result.content.sections[1].content).toContain("email automatically sorts spam");
    });

    it('should generate accessible content for complex academic topics', async () => {
      const mockUnderstanding: TopicUnderstanding = {
        definition: "Quantum computing uses quantum mechanical phenomena to process information",
        category: "scientific",
        complexity: "advanced",
        relevantDomains: ["physics", "computer science", "mathematics"],
        engineRecommendations: {
          academic: true,
          video: true,
          community: false,
          computational: true
        },
        researchApproach: "broad-overview"
      };

      // Mock research plan with mandatory general queries for complex topic
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          researchQueries: [
            { query: "quantum computing simple explanation", engine: "general", reasoning: "Accessible introduction" },
            { query: "quantum computing everyday language", engine: "general", reasoning: "Non-technical explanation" },
            { query: "quantum computing basics beginners", engine: "general", reasoning: "Entry-level content" },
            { query: "quantum computing practical applications", engine: "general", reasoning: "Real-world uses" },
            { query: "quantum computing vs regular computing", engine: "general", reasoning: "Comparison for understanding" },
            { query: "quantum computing research papers", engine: "academic", reasoning: "Scientific accuracy" }
          ],
          researchStrategy: "Simplify complex concepts while maintaining accuracy",
          expectedOutcomes: ["Basic understanding", "Practical context", "Clear comparisons"],
          engineDistribution: {
            general: 5,
            academic: 1,
            video: 0,
            community: 0,
            computational: 0
          }
        }
      });

      // Mock search results emphasizing accessible explanations - provide multiple results
      mockSearxngUtils.searchWithAgent.mockResolvedValue({
        results: [
          {
            title: "Quantum Computing Explained Like You're 5",
            url: "https://example.com/quantum-simple",
            content: "Quantum computers are like super-powered calculators that can try many solutions at once",
            engine: "general",
            score: 0.8
          },
          {
            title: "Quantum vs Classical Computing",
            url: "https://example.com/quantum-vs-classical",
            content: "Regular computers use bits (0 or 1), quantum computers use qubits that can be both",
            engine: "general",
            score: 0.75
          }
        ]
      });

      // Mock accessible synthesis
      mockGenerateText.mockResolvedValueOnce({
        text: JSON.stringify({
          keyInsights: [
            "Quantum computers work differently from regular computers by using quantum properties",
            "They can solve certain problems much faster than traditional computers",
            "Current applications are limited but growing in specific fields"
          ],
          contentThemes: [
            "Basic concepts with analogies",
            "Comparison with regular computers",
            "Current and future applications"
          ],
          practicalFocus: "medium",
          sourceBalance: "general-focused"
        })
      });

      // Mock content with accessibility focus for complex topic
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          title: "Quantum Computing: Understanding the Basics",
          sections: [
            {
              title: "What is Quantum Computing - A Simple Introduction",
              content: "Think of a regular computer like a light switch - it's either on (1) or off (0). A quantum computer is like a dimmer switch that can be partially on and off at the same time. This special property allows quantum computers to explore many possible solutions simultaneously, like having multiple people work on different parts of a puzzle at once.",
              sources: ["https://example.com/quantum-simple"],
              complexity: "foundation",
              learningObjective: "Understand quantum computing using everyday analogies"
            }
          ],
          keyTakeaways: [
            "Quantum computers use special properties to process information differently",
            "They can explore multiple solutions simultaneously",
            "Current applications are specialized but promising"
          ],
          nextSteps: [
            "Learn about specific quantum computing applications",
            "Explore interactive quantum computing simulators"
          ]
        }
      });

      const request: TopicResearchRequest = {
        topic: "quantum computing",
        depth: 1,
        maxDepth: 2,
        understanding: mockUnderstanding
      };

      const result = await agent.researchAndGenerate(request);

      // Verify complex topic is made accessible (Requirement 1.1, 1.2)
      expect(result.content.sections[0].content).toContain("Think of a regular computer like");
      expect(result.content.sections[0].content).toContain("dimmer switch");
      expect(result.content.sections[0].content).toContain("like having multiple people");
      
      // Verify technical terms are explained (Requirement 1.2)
      expect(result.content.sections[0].learningObjective).toContain("everyday analogies");
    });
  });

  describe('Task 8.2: Validate that general engine queries are consistently included', () => {
    it('should always include at least 5 general engine queries', async () => {
      const mockUnderstanding: TopicUnderstanding = {
        definition: "Test topic",
        category: "technical",
        complexity: "beginner",
        relevantDomains: ["test"],
        engineRecommendations: {
          academic: true,
          video: false,
          community: false,
          computational: false
        },
        researchApproach: "broad-overview"
      };

      // Mock research plan generation
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          researchQueries: [
            { query: "test topic overview", engine: "general", reasoning: "Basic overview" },
            { query: "test topic basics", engine: "general", reasoning: "Fundamentals" },
            { query: "test topic examples", engine: "general", reasoning: "Examples" },
            { query: "test topic guide", engine: "general", reasoning: "Guide" },
            { query: "test topic introduction", engine: "general", reasoning: "Introduction" },
            { query: "test topic research", engine: "academic", reasoning: "Academic depth" }
          ],
          researchStrategy: "Balanced approach",
          expectedOutcomes: ["Understanding"],
          engineDistribution: {
            general: 5,
            academic: 1,
            video: 0,
            community: 0,
            computational: 0
          }
        }
      });

      // Mock successful search results - provide multiple results
      mockSearxngUtils.searchWithAgent.mockResolvedValue({
        results: [
          {
            title: "Test Result 1",
            url: "https://example.com/test1",
            content: "Test content 1",
            engine: "general",
            score: 0.8
          },
          {
            title: "Test Result 2",
            url: "https://example.com/test2", 
            content: "Test content 2",
            engine: "general",
            score: 0.75
          }
        ]
      });

      // Mock synthesis and content generation
      mockGenerateText.mockResolvedValueOnce({
        text: JSON.stringify({
          keyInsights: ["Test insight"],
          contentThemes: ["Test theme"],
          practicalFocus: "high",
          sourceBalance: "balanced"
        })
      });

      mockGenerateObject.mockResolvedValueOnce({
        object: {
          title: "Test Content",
          sections: [
            {
              title: "Basic Introduction",
              content: "Test content",
              sources: ["https://example.com/test"],
              complexity: "foundation"
            },
            {
              title: "Building Knowledge",
              content: "Test content",
              sources: ["https://example.com/test"],
              complexity: "building"
            },
            {
              title: "Practical Applications",
              content: "Test content",
              sources: ["https://example.com/test"],
              complexity: "application"
            }
          ],
          keyTakeaways: ["Test takeaway 1", "Test takeaway 2", "Test takeaway 3"],
          nextSteps: ["Test step 1", "Test step 2"]
        }
      });

      const request: TopicResearchRequest = {
        topic: "test topic",
        depth: 1,
        maxDepth: 2,
        understanding: mockUnderstanding
      };

      const result = await agent.researchAndGenerate(request);

      // Verify the research plan was called and would include 5+ general queries
      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          schema: expect.any(Object),
          prompt: expect.stringContaining("MUST include at least 5 queries using the \"general\" engine")
        })
      );

      // Verify successful execution
      expect(result).toBeDefined();
      expect(result.content.sections).toHaveLength(3);
    });

    it('should handle engine recommendation variations while maintaining general queries', async () => {
      const testCases = [
        {
          name: "Academic-heavy topic",
          understanding: {
            definition: "Academic research topic",
            category: "academic" as const,
            complexity: "advanced" as const,
            relevantDomains: ["research"],
            engineRecommendations: {
              academic: true,
              video: false,
              community: false,
              computational: true
            },
            researchApproach: "focused-deep-dive" as const
          }
        },
        {
          name: "Practical topic",
          understanding: {
            definition: "Practical skill topic",
            category: "practical" as const,
            complexity: "beginner" as const,
            relevantDomains: ["skills"],
            engineRecommendations: {
              academic: false,
              video: true,
              community: true,
              computational: false
            },
            researchApproach: "broad-overview" as const
          }
        }
      ];

      for (const testCase of testCases) {
        // Reset mocks for each test case
        vi.clearAllMocks();

        // Mock research plan with different engine recommendations but always 5+ general
        mockGenerateObject.mockResolvedValueOnce({
          object: {
            researchQueries: [
              { query: "topic overview", engine: "general", reasoning: "Overview" },
              { query: "topic basics", engine: "general", reasoning: "Basics" },
              { query: "topic examples", engine: "general", reasoning: "Examples" },
              { query: "topic guide", engine: "general", reasoning: "Guide" },
              { query: "topic intro", engine: "general", reasoning: "Intro" },
              ...(testCase.understanding.engineRecommendations.academic ? 
                [{ query: "topic research", engine: "academic", reasoning: "Research" }] : []),
              ...(testCase.understanding.engineRecommendations.video ? 
                [{ query: "topic videos", engine: "video", reasoning: "Videos" }] : [])
            ],
            researchStrategy: "Balanced approach",
            expectedOutcomes: ["Understanding"],
            engineDistribution: {
              general: 5,
              academic: testCase.understanding.engineRecommendations.academic ? 1 : 0,
              video: testCase.understanding.engineRecommendations.video ? 1 : 0,
              community: 0,
              computational: 0
            }
          }
        });

        mockSearxngUtils.searchWithAgent.mockResolvedValue({
          results: [
            {
              title: "Test Result 1",
              url: "https://example.com/test1",
              content: "Test content 1",
              engine: "general",
              score: 0.8
            },
            {
              title: "Test Result 2",
              url: "https://example.com/test2",
              content: "Test content 2", 
              engine: "general",
              score: 0.75
            }
          ]
        });

        mockGenerateText.mockResolvedValueOnce({
          text: JSON.stringify({
            keyInsights: ["Test insight"],
            contentThemes: ["Test theme"],
            practicalFocus: "high",
            sourceBalance: "balanced"
          })
        });

        mockGenerateObject.mockResolvedValueOnce({
          object: {
            title: "Test Content",
            sections: [
              {
                title: "Basic Introduction",
                content: "Test content",
                sources: ["https://example.com/test"],
                complexity: "foundation"
              },
              {
                title: "Building Knowledge",
                content: "Test content",
                sources: ["https://example.com/test"],
                complexity: "building"
              },
              {
                title: "Practical Applications",
                content: "Test content",
                sources: ["https://example.com/test"],
                complexity: "application"
              }
            ],
            keyTakeaways: ["Test takeaway 1", "Test takeaway 2", "Test takeaway 3"],
            nextSteps: ["Test step 1", "Test step 2"]
          }
        });

        const request: TopicResearchRequest = {
          topic: `test ${testCase.name}`,
          depth: 1,
          maxDepth: 2,
          understanding: testCase.understanding
        };

        const result = await agent.researchAndGenerate(request);

        // Verify general queries requirement is enforced regardless of topic type
        expect(mockGenerateObject).toHaveBeenCalledWith(
          expect.objectContaining({
            prompt: expect.stringContaining("MUST include at least 5 queries using the \"general\" engine")
          })
        );

        expect(result).toBeDefined();
      }
    });
  });

  describe('Task 8.3: Ensure content quality improvements while maintaining comprehensiveness', () => {
    it('should balance accessibility with comprehensive coverage', async () => {
      const mockUnderstanding: TopicUnderstanding = {
        definition: "Artificial intelligence encompasses machine learning, natural language processing, and computer vision",
        category: "technical",
        complexity: "intermediate",
        relevantDomains: ["computer science", "cognitive science", "robotics"],
        engineRecommendations: {
          academic: true,
          video: true,
          community: true,
          computational: false
        },
        researchApproach: "broad-overview"
      };

      // Mock comprehensive research plan
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          researchQueries: [
            { query: "artificial intelligence simple explanation", engine: "general", reasoning: "Accessible intro" },
            { query: "AI applications everyday life", engine: "general", reasoning: "Practical examples" },
            { query: "AI vs machine learning difference", engine: "general", reasoning: "Clear distinctions" },
            { query: "AI benefits and limitations", engine: "general", reasoning: "Balanced perspective" },
            { query: "getting started with AI", engine: "general", reasoning: "Practical guidance" },
            { query: "artificial intelligence research trends", engine: "academic", reasoning: "Current developments" },
            { query: "AI tutorial videos", engine: "video", reasoning: "Visual learning" },
            { query: "AI community discussions", engine: "community", reasoning: "Real experiences" }
          ],
          researchStrategy: "Comprehensive coverage with accessibility focus",
          expectedOutcomes: ["Clear understanding", "Practical knowledge", "Next steps"],
          engineDistribution: {
            general: 5,
            academic: 1,
            video: 1,
            community: 1,
            computational: 0
          }
        }
      });

      // Mock diverse, high-quality search results
      const mockResults = [
        {
          title: "AI Explained: What Everyone Should Know",
          url: "https://example.com/ai-explained",
          content: "Artificial intelligence helps computers perform tasks that typically require human intelligence",
          engine: "general",
          score: 0.9
        },
        {
          title: "How AI Powers Your Daily Life",
          url: "https://example.com/ai-daily",
          content: "From smartphone assistants to recommendation algorithms, AI is everywhere",
          engine: "general",
          score: 0.85
        },
        {
          title: "AI vs ML: Understanding the Difference",
          url: "https://example.com/ai-vs-ml",
          content: "AI is the broader concept, while machine learning is a specific approach to achieving AI",
          engine: "general",
          score: 0.8
        },
        {
          title: "The Promise and Perils of AI",
          url: "https://example.com/ai-balanced",
          content: "AI offers tremendous benefits but also raises important ethical and practical concerns",
          engine: "general",
          score: 0.8
        },
        {
          title: "Your First Steps into AI",
          url: "https://example.com/ai-start",
          content: "Begin with understanding data, then explore simple AI tools and concepts",
          engine: "general",
          score: 0.75
        },
        {
          title: "Recent Advances in Artificial Intelligence",
          url: "https://arxiv.org/ai-advances",
          content: "Survey of recent breakthroughs in deep learning, natural language processing, and computer vision",
          engine: "academic",
          score: 0.95
        },
        {
          title: "AI Fundamentals Video Course",
          url: "https://youtube.com/ai-course",
          content: "Comprehensive video series covering AI concepts with visual examples",
          engine: "video",
          score: 0.8
        },
        {
          title: "AI Practitioners Share Experiences",
          url: "https://reddit.com/r/MachineLearning",
          content: "Real-world experiences and challenges from AI professionals",
          engine: "community",
          score: 0.7
        }
      ];

      mockSearxngUtils.searchWithAgent.mockResolvedValue({
        results: mockResults
      });

      // Mock comprehensive synthesis
      mockGenerateText.mockResolvedValueOnce({
        text: JSON.stringify({
          keyInsights: [
            "AI encompasses various technologies that enable computers to perform human-like tasks",
            "Machine learning is a subset of AI focused on learning from data",
            "AI applications are widespread in daily life, from assistants to recommendations",
            "Current AI has both significant capabilities and important limitations",
            "Getting started requires understanding data and exploring practical tools"
          ],
          contentThemes: [
            "Foundational concepts and definitions",
            "Relationship between AI and related fields",
            "Practical applications and real-world impact",
            "Current capabilities and limitations",
            "Getting started and next steps"
          ],
          practicalFocus: "high",
          sourceBalance: "excellent",
          comprehensiveness: "high",
          accessibilityScore: 0.9
        })
      });

      // Mock comprehensive, accessible content
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          title: "Artificial Intelligence: A Complete Beginner's Guide",
          sections: [
            {
              title: "What is Artificial Intelligence - Understanding the Basics",
              content: "Artificial Intelligence (AI) is like giving computers the ability to think and make decisions similar to humans. Imagine teaching a computer to recognize your voice, understand what you're saying, and respond appropriately - that's AI in action. It's not about creating robots that look human, but about making computers smart enough to handle tasks that usually require human intelligence, like understanding language, recognizing images, or making predictions.",
              sources: ["https://example.com/ai-explained", "https://example.com/ai-vs-ml"],
              complexity: "foundation",
              learningObjective: "Understand what AI is and how it differs from regular computer programs"
            },
            {
              title: "AI in Your Daily Life - Real-World Applications",
              content: "You interact with AI more often than you might think. When you ask Siri or Google Assistant a question, that's AI understanding and processing your speech. When Netflix suggests movies you might like, that's AI analyzing your viewing patterns. When your email automatically filters spam, that's AI learning to recognize unwanted messages. These systems learn from millions of examples to get better at their tasks, just like how you get better at recognizing faces by seeing many different people.",
              sources: ["https://example.com/ai-daily", "https://youtube.com/ai-course"],
              complexity: "building",
              learningObjective: "Recognize AI applications in everyday technology and understand how they work"
            },
            {
              title: "AI's Capabilities and Current Limitations",
              content: "Today's AI is incredibly powerful in specific areas but has important limitations. AI can beat humans at chess, translate languages instantly, and identify objects in photos with remarkable accuracy. However, AI systems are narrow - they excel at specific tasks but can't transfer knowledge between different domains like humans do. An AI that's excellent at playing chess can't use that knowledge to drive a car or write poetry. Understanding these strengths and limitations helps set realistic expectations about what AI can and cannot do.",
              sources: ["https://example.com/ai-balanced", "https://arxiv.org/ai-advances"],
              complexity: "building",
              learningObjective: "Understand both the impressive capabilities and important limitations of current AI"
            },
            {
              title: "Getting Started with AI - Your Next Steps",
              content: "Ready to explore AI further? Start by experimenting with AI tools you can use today. Try ChatGPT for writing assistance, use AI photo editors, or explore AI-powered learning platforms. To understand how AI works, learn about data - the fuel that powers AI systems. Consider taking an online course that explains AI concepts with hands-on examples. Remember, you don't need to be a programmer to understand and benefit from AI; start with the applications and gradually build your understanding of the underlying concepts.",
              sources: ["https://example.com/ai-start", "https://reddit.com/r/MachineLearning"],
              complexity: "application",
              learningObjective: "Know how to begin exploring and learning about AI through practical steps"
            }
          ],
          keyTakeaways: [
            "AI enables computers to perform tasks that typically require human intelligence",
            "AI applications are already integrated into many everyday technologies",
            "Current AI excels in specific areas but has important limitations",
            "Getting started with AI involves both using AI tools and understanding basic concepts",
            "AI learning is accessible to everyone, not just programmers"
          ],
          nextSteps: [
            "Experiment with popular AI tools like ChatGPT or AI photo editors",
            "Take an introductory online course on AI fundamentals",
            "Explore how AI is used in your field of interest or work",
            "Learn about data and how it powers AI systems"
          ]
        }
      });

      const request: TopicResearchRequest = {
        topic: "artificial intelligence",
        depth: 1,
        maxDepth: 2,
        understanding: mockUnderstanding
      };

      const result = await agent.researchAndGenerate(request);

      // Verify comprehensive coverage (Requirement 4.4)
      expect(result.content.sections).toHaveLength(4);
      expect(result.content.keyTakeaways).toHaveLength(5);
      expect(result.content.nextSteps).toHaveLength(4);

      // Verify accessibility maintained (Requirement 1.1, 1.2)
      expect(result.content.sections[0].content).toContain("like giving computers the ability");
      expect(result.content.sections[0].content).toContain("Imagine teaching a computer");
      expect(result.content.sections[1].content).toContain("You interact with AI more often than you might think");

      // Verify progressive structure (Requirement 3.2, 3.3)
      expect(result.content.sections[0].complexity).toBe("foundation");
      expect(result.content.sections[1].complexity).toBe("building");
      expect(result.content.sections[3].complexity).toBe("application");

      // Verify practical focus (Requirement 4.1, 4.2)
      expect(result.content.sections[1].content).toContain("Netflix suggests movies");
      expect(result.content.sections[3].content).toContain("Try ChatGPT");
      expect(result.content.sections[3].content).toContain("use AI photo editors");

      // Verify balanced perspective (Requirement 4.3)
      expect(result.content.sections[2].content).toContain("incredibly powerful");
      expect(result.content.sections[2].content).toContain("important limitations");
    });

    it('should maintain source diversity while prioritizing accessibility', async () => {
      const mockUnderstanding: TopicUnderstanding = {
        definition: "Climate change refers to long-term shifts in global temperatures and weather patterns",
        category: "scientific",
        complexity: "intermediate",
        relevantDomains: ["environmental science", "meteorology", "policy"],
        engineRecommendations: {
          academic: true,
          video: true,
          community: true,
          computational: false
        },
        researchApproach: "broad-overview"
      };

      // Mock research plan with diverse sources
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          researchQueries: [
            { query: "climate change simple explanation", engine: "general", reasoning: "Accessible overview" },
            { query: "climate change causes effects", engine: "general", reasoning: "Basic understanding" },
            { query: "climate change examples evidence", engine: "general", reasoning: "Concrete examples" },
            { query: "climate change solutions actions", engine: "general", reasoning: "Practical steps" },
            { query: "climate change facts vs myths", engine: "general", reasoning: "Clear information" },
            { query: "climate science research papers", engine: "academic", reasoning: "Scientific credibility" },
            { query: "climate change documentary videos", engine: "video", reasoning: "Visual learning" },
            { query: "climate action community discussions", engine: "community", reasoning: "Real experiences" }
          ],
          researchStrategy: "Diverse sources with accessibility priority",
          expectedOutcomes: ["Clear understanding", "Evidence-based knowledge", "Action steps"],
          engineDistribution: {
            general: 5,
            academic: 1,
            video: 1,
            community: 1,
            computational: 0
          }
        }
      });

      // Mock diverse search results - provide multiple results
      mockSearxngUtils.searchWithAgent.mockResolvedValue({
        results: [
          { title: "General Climate Info", url: "https://example.com/climate", content: "Climate change basics", engine: "general", score: 0.8 },
          { title: "Climate Science Explained", url: "https://example.com/climate-science", content: "Understanding climate science", engine: "general", score: 0.75 },
          { title: "Climate Action Guide", url: "https://example.com/climate-action", content: "What you can do about climate change", engine: "general", score: 0.7 }
        ]
      });

      // Mock synthesis emphasizing source balance
      mockGenerateText.mockResolvedValueOnce({
        text: JSON.stringify({
          keyInsights: ["Climate insights from diverse sources"],
          contentThemes: ["Accessible climate science"],
          practicalFocus: "high",
          sourceBalance: "excellent",
          sourceDiversity: {
            general: 5,
            academic: 1,
            video: 1,
            community: 1
          },
          credibilityScore: 0.9,
          accessibilityScore: 0.85
        })
      });

      mockGenerateObject.mockResolvedValueOnce({
        object: {
          title: "Understanding Climate Change: Science Made Simple",
          sections: [
            {
              title: "What is Climate Change - The Basics",
              content: "Climate change is like Earth having a fever that won't go away. Just as your body temperature rising by a few degrees makes you feel sick, Earth's average temperature rising by even small amounts causes big changes in weather patterns, ice caps, and sea levels.",
              sources: ["https://example.com/climate"],
              complexity: "foundation"
            },
            {
              title: "Evidence and Examples We Can See Today",
              content: "The evidence for climate change surrounds us. Glaciers that existed for thousands of years are melting, sea levels are rising, and weather patterns are becoming more extreme. These aren't predictions - they're changes happening right now that scientists can measure and document.",
              sources: ["https://example.com/climate", "https://arxiv.org/climate-research"],
              complexity: "building"
            },
            {
              title: "What You Can Do - Practical Climate Action",
              content: "Fighting climate change starts with individual actions that add up to collective impact. Simple changes like using energy-efficient appliances, choosing sustainable transportation, and supporting renewable energy make a difference. Every action counts, and when millions of people make these choices, the impact becomes significant.",
              sources: ["https://example.com/climate", "https://reddit.com/r/climate"],
              complexity: "application"
            }
          ],
          keyTakeaways: [
            "Climate change is measurable global temperature and weather pattern shifts",
            "Evidence is visible in melting ice, rising seas, and extreme weather",
            "Individual actions contribute to collective climate solutions"
          ],
          nextSteps: [
            "Calculate your carbon footprint using online tools",
            "Choose one sustainable practice to implement this week"
          ]
        }
      });

      const request: TopicResearchRequest = {
        topic: "climate change",
        depth: 1,
        maxDepth: 2,
        understanding: mockUnderstanding
      };

      const result = await agent.researchAndGenerate(request);

      // Verify source diversity is maintained
      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining("general")
        })
      );

      // Verify accessibility is prioritized
      expect(result.content.sections[0].content).toContain("like Earth having a fever");
      expect(result.content.sections[0].content).toContain("Just as your body temperature");

      // Verify comprehensive coverage
      expect(result.content.sections).toHaveLength(3);
      expect(result.content.keyTakeaways).toHaveLength(3);
      expect(result.content.nextSteps).toHaveLength(2);
    });
  });
});