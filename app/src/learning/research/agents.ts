import { HttpError } from 'wasp/server';
import { getOptimizedQueries, getEnhancedPrompt, getEnhancedContext } from './prompts';

// Types for research agents
export interface ResearchAgent {
  name: string;
  description: string;
  engines: string[];
  prompt: string;
  execute: (topic: string, context?: any) => Promise<ResearchResult>;
}

export interface ResearchResult {
  agent: string;
  topic: string;
  results: SearchResult[];
  summary?: string;
  subtopics?: string[];
  status: 'success' | 'error' | 'partial';
  error?: string;
  timestamp: Date;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  relevanceScore?: number;
  metadata?: Record<string, any>;
}

// Base class for all research agents
abstract class BaseResearchAgent implements ResearchAgent {
  abstract name: string;
  abstract description: string;
  abstract engines: string[];
  abstract prompt: string;

  async execute(topic: string, context?: any): Promise<ResearchResult> {
    try {
      // Get enhanced context and optimized queries
      const enhancedContext = getEnhancedContext(this.name, topic, context);
      const optimizedQueries = getOptimizedQueries(this.name, topic, enhancedContext);
      const enhancedPrompt = getEnhancedPrompt(this.name, topic, enhancedContext);

      // Perform search with optimized queries
      const results = await this.performSearch(topic, {
        ...enhancedContext,
        optimizedQueries,
        enhancedPrompt
      });
      
      const summary = await this.generateSummary(results, topic);
      const subtopics = await this.identifySubtopics(results, topic);

      return {
        agent: this.name,
        topic,
        results,
        summary,
        subtopics,
        status: 'success',
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`${this.name} agent error:`, error);
      return {
        agent: this.name,
        topic,
        results: [],
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  protected abstract performSearch(topic: string, context?: any): Promise<SearchResult[]>;
  
  protected async generateSummary(results: SearchResult[], topic: string): Promise<string> {
    // Default implementation - can be overridden by specific agents
    if (results.length === 0) {
      return `No results found for ${topic}`;
    }
    
    const topResults = results.slice(0, 5);
    const snippets = topResults.map(r => r.snippet).join(' ');
    
    return `Found ${results.length} results for ${topic}. Key information: ${snippets.substring(0, 500)}...`;
  }

  protected async identifySubtopics(results: SearchResult[], topic: string): Promise<string[]> {
    // Default implementation - extract potential subtopics from titles and snippets
    const text = results.map(r => `${r.title} ${r.snippet}`).join(' ').toLowerCase();
    
    // Simple keyword extraction - in a real implementation, this would use AI
    const keywords = text.match(/\b[a-z]{3,}\b/g) || [];
    const uniqueKeywords = [...new Set(keywords)]
      .filter(word => !word.includes(topic.toLowerCase()))
      .slice(0, 10);
    
    return uniqueKeywords;
  }
}

// General Research Agent - broad topic coverage with no engine constraints
export class GeneralResearchAgent extends BaseResearchAgent {
  name = 'General Research Agent';
  description = 'Provides comprehensive information about any topic with broad coverage';
  engines: string[] = []; // No specific engine constraints
  prompt = 'Research comprehensive information about {topic} including definitions, key concepts, applications, and current developments';

  protected async performSearch(topic: string, context?: any): Promise<SearchResult[]> {
    // Use optimized queries if available
    const queries = context?.optimizedQueries || [topic];
    const allResults: SearchResult[] = [];

    // Execute multiple optimized queries
    for (const query of queries.slice(0, 5)) { // Limit to 5 queries to avoid overwhelming
      const results = await this.mockSearch(query, 'general', context);
      allResults.push(...results);
    }

    // Remove duplicates and sort by relevance
    const uniqueResults = this.deduplicateResults(allResults);
    return uniqueResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  private async mockSearch(query: string, type: string, context?: any): Promise<SearchResult[]> {
    // Mock implementation - replace with actual SearXNG integration
    const baseRelevance = 0.8 + Math.random() * 0.2; // Random relevance between 0.8-1.0
    
    return [
      {
        title: `Understanding ${query}: A Comprehensive Guide`,
        url: `https://example.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
        snippet: `${query} is a fundamental concept that encompasses various aspects including definitions, applications, and current developments in the field.`,
        source: 'general',
        relevanceScore: baseRelevance,
        metadata: { 
          type, 
          searchEngine: 'general',
          query,
          userLevel: context?.userLevel,
          searchStrategy: context?.searchStrategy
        }
      },
      {
        title: `${query}: Key Concepts and Applications`,
        url: `https://example.com/${query.toLowerCase().replace(/\s+/g, '-')}-concepts`,
        snippet: `Explore the key concepts and real-world applications of ${query}, including its impact on various industries and future developments.`,
        source: 'general',
        relevanceScore: baseRelevance - 0.1,
        metadata: { 
          type, 
          searchEngine: 'general',
          query,
          userLevel: context?.userLevel,
          searchStrategy: context?.searchStrategy
        }
      }
    ];
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.title}-${result.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// Academic Research Agent - scholarly content using academic engines
export class AcademicResearchAgent extends BaseResearchAgent {
  name = 'Academic Research Agent';
  description = 'Finds peer-reviewed research and scholarly articles';
  engines = ['arxiv', 'google scholar', 'pubmed'];
  prompt = 'Find peer-reviewed research, academic papers, and scholarly articles about {topic} focusing on latest findings and theoretical frameworks';

  protected async performSearch(topic: string, context?: any): Promise<SearchResult[]> {
    // Use optimized academic queries
    const queries = context?.optimizedQueries || [topic];
    const allResults: SearchResult[] = [];

    for (const query of queries.slice(0, 4)) { // Limit academic queries
      const results = await this.mockAcademicSearch(query, context);
      allResults.push(...results);
    }

    return this.deduplicateResults(allResults);
  }

  private async mockAcademicSearch(query: string, context?: any): Promise<SearchResult[]> {
    const baseRelevance = 0.85 + Math.random() * 0.15;
    
    return [
      {
        title: `A Systematic Review of ${query}: Recent Advances and Future Directions`,
        url: `https://arxiv.org/abs/2024.${Math.floor(Math.random() * 10000)}`,
        snippet: `This systematic review examines recent advances in ${query} research, analyzing 150+ peer-reviewed papers published between 2020-2024.`,
        source: 'arxiv',
        relevanceScore: baseRelevance,
        metadata: { 
          type: 'academic', 
          searchEngine: 'arxiv', 
          year: 2024,
          query,
          userLevel: context?.userLevel
        }
      },
      {
        title: `Theoretical Frameworks in ${query}: A Meta-Analysis`,
        url: `https://scholar.google.com/citations?view_op=view_citation&hl=en&user=example`,
        snippet: `Meta-analysis of theoretical frameworks used in ${query} research, examining methodological approaches across 200+ studies.`,
        source: 'google scholar',
        relevanceScore: baseRelevance - 0.05,
        metadata: { 
          type: 'academic', 
          searchEngine: 'google_scholar', 
          citations: 45,
          query,
          userLevel: context?.userLevel
        }
      }
    ];
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.title}-${result.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// Computational Agent - mathematical and scientific queries using Wolfram Alpha
export class ComputationalAgent extends BaseResearchAgent {
  name = 'Computational Agent';
  description = 'Analyzes mathematical, scientific, and computational aspects';
  engines = ['wolframalpha'];
  prompt = 'Analyze mathematical, scientific, or computational aspects of {topic} including formulas, calculations, and technical specifications';

  protected async performSearch(topic: string, context?: any): Promise<SearchResult[]> {
    // Use optimized computational queries
    const queries = context?.optimizedQueries || [topic];
    const allResults: SearchResult[] = [];

    for (const query of queries.slice(0, 3)) { // Limit computational queries
      const results = await this.mockComputationalSearch(query, context);
      allResults.push(...results);
    }

    return this.deduplicateResults(allResults);
  }

  private async mockComputationalSearch(query: string, context?: any): Promise<SearchResult[]> {
    const baseRelevance = 0.80 + Math.random() * 0.15;
    
    return [
      {
        title: `Mathematical Properties of ${query}`,
        url: `https://www.wolframalpha.com/input/?i=${encodeURIComponent(query)}`,
        snippet: `Mathematical analysis and computational properties of ${query}, including formulas, calculations, and technical specifications.`,
        source: 'wolframalpha',
        relevanceScore: baseRelevance,
        metadata: { 
          type: 'computational', 
          searchEngine: 'wolframalpha', 
          hasFormulas: true,
          query,
          domain: context?.domain
        }
      },
      {
        title: `${query}: Computational Analysis and Algorithms`,
        url: `https://www.wolframalpha.com/input/?i=${encodeURIComponent(query + ' algorithms')}`,
        snippet: `Computational algorithms and mathematical models related to ${query}, with step-by-step calculations and visualizations.`,
        source: 'wolframalpha',
        relevanceScore: baseRelevance - 0.05,
        metadata: { 
          type: 'computational', 
          searchEngine: 'wolframalpha', 
          hasAlgorithms: true,
          query,
          domain: context?.domain
        }
      }
    ];
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.title}-${result.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// Video Learning Agent - educational video content using YouTube
export class VideoLearningAgent extends BaseResearchAgent {
  name = 'Video Learning Agent';
  description = 'Discovers educational videos and visual explanations';
  engines = ['youtube'];
  prompt = 'Discover educational videos, tutorials, and visual explanations about {topic} suitable for different learning levels';

  protected async performSearch(topic: string, context?: any): Promise<SearchResult[]> {
    // Use optimized video queries
    const queries = context?.optimizedQueries || [topic];
    const allResults: SearchResult[] = [];

    for (const query of queries.slice(0, 4)) { // Limit video queries
      const results = await this.mockVideoSearch(query, context);
      allResults.push(...results);
    }

    return this.deduplicateResults(allResults);
  }

  private async mockVideoSearch(query: string, context?: any): Promise<SearchResult[]> {
    const baseRelevance = 0.85 + Math.random() * 0.15;
    const userLevel = context?.userLevel || 'intermediate';
    
    return [
      {
        title: `${query} Explained: Complete Tutorial for ${userLevel === 'beginner' ? 'Beginners' : 'Advanced Learners'}`,
        url: `https://www.youtube.com/watch?v=example1`,
        snippet: `Comprehensive tutorial covering ${query} from basics to advanced concepts. Perfect for ${userLevel} level with clear explanations and examples.`,
        source: 'youtube',
        relevanceScore: baseRelevance,
        metadata: { 
          type: 'video', 
          searchEngine: 'youtube', 
          duration: userLevel === 'beginner' ? '25:30' : '45:15',
          views: '1.2M',
          level: userLevel,
          query
        }
      },
      {
        title: `${query}: Deep Dive with Examples`,
        url: `https://www.youtube.com/watch?v=example2`,
        snippet: `Advanced concepts in ${query} with real-world examples and practical applications. Suitable for ${userLevel} learners.`,
        source: 'youtube',
        relevanceScore: baseRelevance - 0.05,
        metadata: { 
          type: 'video', 
          searchEngine: 'youtube', 
          duration: '45:15',
          views: '850K',
          level: userLevel,
          query
        }
      }
    ];
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.title}-${result.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// Community Discussion Agent - real-world perspectives using Reddit
export class CommunityDiscussionAgent extends BaseResearchAgent {
  name = 'Community Discussion Agent';
  description = 'Finds real-world discussions and user experiences';
  engines = ['reddit'];
  prompt = 'Find real-world discussions, practical applications, common questions, and user experiences related to {topic}';

  protected async performSearch(topic: string, context?: any): Promise<SearchResult[]> {
    // Use optimized community queries
    const queries = context?.optimizedQueries || [topic];
    const allResults: SearchResult[] = [];

    for (const query of queries.slice(0, 4)) { // Limit community queries
      const results = await this.mockCommunitySearch(query, context);
      allResults.push(...results);
    }

    return this.deduplicateResults(allResults);
  }

  private async mockCommunitySearch(query: string, context?: any): Promise<SearchResult[]> {
    const baseRelevance = 0.80 + Math.random() * 0.15;
    const platforms = context?.platforms || ['reddit'];
    
    return [
      {
        title: `r/explainlikeimfive: What is ${query} and why should I care?`,
        url: `https://www.reddit.com/r/explainlikeimfive/comments/example1`,
        snippet: `Community discussion about ${query} with simple explanations and real-world examples. Users share practical applications and common misconceptions.`,
        source: 'reddit',
        relevanceScore: baseRelevance,
        metadata: { 
          type: 'community', 
          searchEngine: 'reddit', 
          subreddit: 'explainlikeimfive',
          upvotes: 2500,
          comments: 180,
          query,
          platforms
        }
      },
      {
        title: `Common ${query} Questions and Experiences - Discussion Thread`,
        url: `https://www.reddit.com/r/askscience/comments/example2`,
        snippet: `Users share their experiences with ${query}, common questions, troubleshooting tips, and practical advice from the community.`,
        source: 'reddit',
        relevanceScore: baseRelevance - 0.05,
        metadata: { 
          type: 'community', 
          searchEngine: 'reddit', 
          subreddit: 'askscience',
          upvotes: 1800,
          comments: 95,
          query,
          platforms
        }
      }
    ];
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.title}-${result.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// Agent factory to create and manage all research agents
export class ResearchAgentFactory {
  private static agents: Map<string, ResearchAgent> = new Map();

  static {
    // Initialize all agents
    const agentInstances = [
      new GeneralResearchAgent(),
      new AcademicResearchAgent(),
      new ComputationalAgent(),
      new VideoLearningAgent(),
      new CommunityDiscussionAgent()
    ];

    agentInstances.forEach(agent => {
      this.agents.set(agent.name, agent);
    });
  }

  static getAllAgents(): ResearchAgent[] {
    return Array.from(this.agents.values());
  }

  static getAgent(name: string): ResearchAgent | undefined {
    return this.agents.get(name);
  }

  static getAgentsByType(engines: string[]): ResearchAgent[] {
    return Array.from(this.agents.values()).filter(agent => 
      engines.some(engine => agent.engines.includes(engine))
    );
  }

  static async executeAllAgents(topic: string, context?: any): Promise<ResearchResult[]> {
    const agents = this.getAllAgents();
    const promises = agents.map(agent => agent.execute(topic, context));
    
    try {
      const results = await Promise.allSettled(promises);
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`Agent ${agents[index].name} failed:`, result.reason);
          return {
            agent: agents[index].name,
            topic,
            results: [],
            status: 'error' as const,
            error: result.reason?.message || 'Unknown error',
            timestamp: new Date()
          };
        }
      });
    } catch (error) {
      console.error('Failed to execute research agents:', error);
      throw new HttpError(500, 'Failed to execute research agents');
    }
  }
}

// All agents are already exported above, no need to re-export