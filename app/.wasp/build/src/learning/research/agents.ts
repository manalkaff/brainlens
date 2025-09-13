import { HttpError } from 'wasp/server';
import { getOptimizedQueries, getEnhancedPrompt, getEnhancedContext } from './prompts';
import { 
  SearxngUtils, 
  AgentConfigManager,
  type AgentConfigName,
  isSearxngError,
  getSearxngErrorMessage 
} from './searxng';

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
    try {
      // Use SearXNG with general research configuration
      const response = await SearxngUtils.searchWithAgent('general', topic, context);
      
      // Convert SearXNG results to our SearchResult format
      const searchResults: SearchResult[] = response.results.map(result => ({
        title: result.title || 'Untitled',
        url: result.url || '#',
        snippet: result.content || result.snippet || 'No description available',
        source: result.engine || 'general',
        relevanceScore: result.score || 0.5,
        metadata: {
          type: 'general',
          searchEngine: result.engine || 'searxng',
          query: topic,
          userLevel: context?.userLevel,
          searchStrategy: context?.searchStrategy,
          category: result.category,
          publishedDate: result.publishedDate
        }
      }));

      // If we have additional optimized queries from context, search with those too
      if (context?.optimizedQueries && context.optimizedQueries.length > 1) {
        const additionalResults: SearchResult[] = [];
        
        // Search with up to 3 additional optimized queries
        for (const query of context.optimizedQueries.slice(1, 4)) {
          try {
            const additionalResponse = await SearxngUtils.searchWithAgent('general', query, context);
            const additionalSearchResults = additionalResponse.results.map(result => ({
              title: result.title || 'Untitled',
              url: result.url || '#',
              snippet: result.content || result.snippet || 'No description available',
              source: result.engine || 'general',
              relevanceScore: (result.score || 0.5) * 0.9, // Slightly lower relevance for additional queries
              metadata: {
                type: 'general',
                searchEngine: result.engine || 'searxng',
                query,
                userLevel: context?.userLevel,
                searchStrategy: context?.searchStrategy,
                category: result.category,
                publishedDate: result.publishedDate
              }
            }));
            additionalResults.push(...additionalSearchResults);
          } catch (error) {
            console.warn(`Failed to search with optimized query "${query}":`, error);
          }
        }
        
        searchResults.push(...additionalResults);
      }

      // Remove duplicates and sort by relevance
      const uniqueResults = this.deduplicateResults(searchResults);
      return uniqueResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      
    } catch (error) {
      console.error('General research agent search failed:', error);
      
      // If it's a SearXNG error, provide more context
      if (isSearxngError(error)) {
        console.error('SearXNG error details:', getSearxngErrorMessage(error));
      }
      
      // Return empty results instead of throwing to allow other agents to continue
      return [];
    }
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
    try {
      // Use SearXNG with academic research configuration
      const response = await SearxngUtils.searchWithAgent('academic', topic, context);
      
      // Convert SearXNG results to our SearchResult format
      const searchResults: SearchResult[] = response.results.map(result => ({
        title: result.title || 'Untitled Academic Paper',
        url: result.url || '#',
        snippet: result.content || result.snippet || 'No abstract available',
        source: result.engine || 'academic',
        relevanceScore: result.score || 0.7,
        metadata: {
          type: 'academic',
          searchEngine: result.engine || 'searxng',
          query: topic,
          userLevel: context?.userLevel,
          category: result.category,
          publishedDate: result.publishedDate,
          author: result.author,
          // Academic-specific metadata
          citations: this.extractCitations(result),
          year: this.extractYear(result.publishedDate),
          venue: this.extractVenue(result)
        }
      }));

      // If we have additional optimized academic queries, search with those too
      if (context?.optimizedQueries && context.optimizedQueries.length > 1) {
        const additionalResults: SearchResult[] = [];
        
        // Search with up to 2 additional optimized queries for academic content
        for (const query of context.optimizedQueries.slice(1, 3)) {
          try {
            const additionalResponse = await SearxngUtils.searchWithAgent('academic', query, context);
            const additionalSearchResults = additionalResponse.results.map(result => ({
              title: result.title || 'Untitled Academic Paper',
              url: result.url || '#',
              snippet: result.content || result.snippet || 'No abstract available',
              source: result.engine || 'academic',
              relevanceScore: (result.score || 0.7) * 0.9,
              metadata: {
                type: 'academic',
                searchEngine: result.engine || 'searxng',
                query,
                userLevel: context?.userLevel,
                category: result.category,
                publishedDate: result.publishedDate,
                author: result.author,
                citations: this.extractCitations(result),
                year: this.extractYear(result.publishedDate),
                venue: this.extractVenue(result)
              }
            }));
            additionalResults.push(...additionalSearchResults);
          } catch (error) {
            console.warn(`Failed to search academic content with query "${query}":`, error);
          }
        }
        
        searchResults.push(...additionalResults);
      }

      // Remove duplicates and sort by relevance (academic papers should prioritize recent and highly cited)
      const uniqueResults = this.deduplicateResults(searchResults);
      return uniqueResults.sort((a, b) => {
        // Prioritize by relevance score first
        const scoreDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
        if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
        
        // Then by year (more recent first)
        const yearA = a.metadata?.year || 0;
        const yearB = b.metadata?.year || 0;
        return yearB - yearA;
      });
      
    } catch (error) {
      console.error('Academic research agent search failed:', error);
      
      if (isSearxngError(error)) {
        console.error('SearXNG error details:', getSearxngErrorMessage(error));
      }
      
      return [];
    }
  }

  private extractCitations(result: any): number | undefined {
    // Try to extract citation count from various fields
    if (result.citations) return parseInt(result.citations);
    if (result.metadata?.citations) return parseInt(result.metadata.citations);
    
    // Look for citation patterns in content
    const content = result.content || result.snippet || '';
    const citationMatch = content.match(/cited by (\d+)/i) || content.match(/(\d+) citations/i);
    return citationMatch ? parseInt(citationMatch[1]) : undefined;
  }

  private extractYear(publishedDate?: string): number | undefined {
    if (!publishedDate) return undefined;
    
    const yearMatch = publishedDate.match(/(\d{4})/);
    return yearMatch ? parseInt(yearMatch[1]) : undefined;
  }

  private extractVenue(result: any): string | undefined {
    // Try to extract publication venue
    if (result.venue) return result.venue;
    if (result.metadata?.venue) return result.metadata.venue;
    
    // Extract from URL patterns
    const url = result.url || '';
    if (url.includes('arxiv.org')) return 'arXiv';
    if (url.includes('pubmed')) return 'PubMed';
    if (url.includes('scholar.google')) return 'Google Scholar';
    
    return undefined;
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      // For academic papers, also check for similar titles (to catch different versions)
      const normalizedTitle = result.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
      const key = `${normalizedTitle}-${result.url}`;
      
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
    try {
      // Use SearXNG with computational research configuration
      const response = await SearxngUtils.searchWithAgent('computational', topic, context);
      
      // Convert SearXNG results to our SearchResult format
      const searchResults: SearchResult[] = response.results.map(result => ({
        title: result.title || 'Computational Analysis',
        url: result.url || '#',
        snippet: result.content || result.snippet || 'No computational data available',
        source: result.engine || 'computational',
        relevanceScore: result.score || 0.6,
        metadata: {
          type: 'computational',
          searchEngine: result.engine || 'searxng',
          query: topic,
          domain: context?.domain,
          category: result.category,
          // Computational-specific metadata
          hasFormulas: this.detectFormulas(result),
          hasAlgorithms: this.detectAlgorithms(result),
          hasCalculations: this.detectCalculations(result),
          complexity: this.assessComplexity(result, context?.userLevel)
        }
      }));

      // For computational queries, also try mathematical variations
      if (context?.optimizedQueries && context.optimizedQueries.length > 1) {
        const additionalResults: SearchResult[] = [];
        
        // Search with mathematical and algorithmic variations
        for (const query of context.optimizedQueries.slice(1, 3)) {
          try {
            const additionalResponse = await SearxngUtils.searchWithAgent('computational', query, context);
            const additionalSearchResults = additionalResponse.results.map(result => ({
              title: result.title || 'Computational Analysis',
              url: result.url || '#',
              snippet: result.content || result.snippet || 'No computational data available',
              source: result.engine || 'computational',
              relevanceScore: (result.score || 0.6) * 0.9,
              metadata: {
                type: 'computational',
                searchEngine: result.engine || 'searxng',
                query,
                domain: context?.domain,
                category: result.category,
                hasFormulas: this.detectFormulas(result),
                hasAlgorithms: this.detectAlgorithms(result),
                hasCalculations: this.detectCalculations(result),
                complexity: this.assessComplexity(result, context?.userLevel)
              }
            }));
            additionalResults.push(...additionalSearchResults);
          } catch (error) {
            console.warn(`Failed to search computational content with query "${query}":`, error);
          }
        }
        
        searchResults.push(...additionalResults);
      }

      // Remove duplicates and sort by relevance and computational value
      const uniqueResults = this.deduplicateResults(searchResults);
      return uniqueResults.sort((a, b) => {
        // Prioritize results with formulas and calculations
        const aHasComputation = (a.metadata?.hasFormulas || a.metadata?.hasCalculations) ? 0.1 : 0;
        const bHasComputation = (b.metadata?.hasFormulas || b.metadata?.hasCalculations) ? 0.1 : 0;
        
        const adjustedScoreA = (a.relevanceScore || 0) + aHasComputation;
        const adjustedScoreB = (b.relevanceScore || 0) + bHasComputation;
        
        return adjustedScoreB - adjustedScoreA;
      });
      
    } catch (error) {
      console.error('Computational agent search failed:', error);
      
      if (isSearxngError(error)) {
        console.error('SearXNG error details:', getSearxngErrorMessage(error));
      }
      
      return [];
    }
  }

  private detectFormulas(result: any): boolean {
    const content = (result.content || result.snippet || '').toLowerCase();
    const formulaPatterns = [
      /\b(formula|equation|theorem|proof)\b/,
      /[=+\-*/^()]/,
      /\b(sin|cos|tan|log|ln|sqrt|integral|derivative)\b/,
      /\b(x|y|z|n|i|j|k)\s*[=+\-*/^]/
    ];
    
    return formulaPatterns.some(pattern => pattern.test(content));
  }

  private detectAlgorithms(result: any): boolean {
    const content = (result.content || result.snippet || '').toLowerCase();
    const algorithmPatterns = [
      /\b(algorithm|procedure|method|process|step)\b/,
      /\b(sort|search|optimize|compute|calculate)\b/,
      /\b(complexity|runtime|efficiency|performance)\b/,
      /\b(o\(|big o|time complexity|space complexity)\b/
    ];
    
    return algorithmPatterns.some(pattern => pattern.test(content));
  }

  private detectCalculations(result: any): boolean {
    const content = (result.content || result.snippet || '').toLowerCase();
    const calculationPatterns = [
      /\b(calculate|computation|result|answer|solution)\b/,
      /\b\d+(\.\d+)?\s*[=+\-*/^]\s*\d+/,
      /\b(sum|product|difference|quotient|remainder)\b/
    ];
    
    return calculationPatterns.some(pattern => pattern.test(content));
  }

  private assessComplexity(result: any, userLevel?: string): 'basic' | 'intermediate' | 'advanced' {
    const content = (result.content || result.snippet || '').toLowerCase();
    
    // Advanced indicators
    if (content.includes('theorem') || content.includes('proof') || 
        content.includes('differential') || content.includes('integral') ||
        content.includes('matrix') || content.includes('vector')) {
      return 'advanced';
    }
    
    // Intermediate indicators
    if (content.includes('formula') || content.includes('equation') ||
        content.includes('algorithm') || content.includes('function')) {
      return 'intermediate';
    }
    
    // Default to basic
    return 'basic';
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
    try {
      // Use SearXNG with video learning configuration
      const response = await SearxngUtils.searchWithAgent('video', topic, context);
      
      // Convert SearXNG results to our SearchResult format
      const searchResults: SearchResult[] = response.results.map(result => ({
        title: result.title || 'Educational Video',
        url: result.url || '#',
        snippet: result.content || result.snippet || 'No description available',
        source: result.engine || 'video',
        relevanceScore: result.score || 0.7,
        metadata: {
          type: 'video',
          searchEngine: result.engine || 'searxng',
          query: topic,
          level: context?.userLevel || 'intermediate',
          category: result.category,
          // Video-specific metadata
          duration: result.length || this.estimateDuration(result),
          views: result.views || this.extractViews(result),
          thumbnail: result.thumbnail || result.thumbnail_src || result.img_src,
          author: result.author || this.extractAuthor(result),
          publishedDate: result.publishedDate,
          isEducational: this.assessEducationalValue(result),
          difficulty: this.assessDifficulty(result, context?.userLevel)
        }
      }));

      // For video content, also search with tutorial-specific variations
      if (context?.optimizedQueries && context.optimizedQueries.length > 1) {
        const additionalResults: SearchResult[] = [];
        
        // Search with tutorial and educational variations
        for (const query of context.optimizedQueries.slice(1, 3)) {
          try {
            const additionalResponse = await SearxngUtils.searchWithAgent('video', query, context);
            const additionalSearchResults = additionalResponse.results.map(result => ({
              title: result.title || 'Educational Video',
              url: result.url || '#',
              snippet: result.content || result.snippet || 'No description available',
              source: result.engine || 'video',
              relevanceScore: (result.score || 0.7) * 0.9,
              metadata: {
                type: 'video',
                searchEngine: result.engine || 'searxng',
                query,
                level: context?.userLevel || 'intermediate',
                category: result.category,
                duration: result.length || this.estimateDuration(result),
                views: result.views || this.extractViews(result),
                thumbnail: result.thumbnail || result.thumbnail_src || result.img_src,
                author: result.author || this.extractAuthor(result),
                publishedDate: result.publishedDate,
                isEducational: this.assessEducationalValue(result),
                difficulty: this.assessDifficulty(result, context?.userLevel)
              }
            }));
            additionalResults.push(...additionalSearchResults);
          } catch (error) {
            console.warn(`Failed to search video content with query "${query}":`, error);
          }
        }
        
        searchResults.push(...additionalResults);
      }

      // Remove duplicates and sort by educational value and relevance
      const uniqueResults = this.deduplicateResults(searchResults);
      return uniqueResults.sort((a, b) => {
        // Prioritize educational content
        const aEducational = a.metadata?.isEducational ? 0.1 : 0;
        const bEducational = b.metadata?.isEducational ? 0.1 : 0;
        
        // Prioritize appropriate difficulty level
        const aLevelMatch = this.matchesUserLevel(a.metadata?.difficulty, context?.userLevel) ? 0.05 : 0;
        const bLevelMatch = this.matchesUserLevel(b.metadata?.difficulty, context?.userLevel) ? 0.05 : 0;
        
        const adjustedScoreA = (a.relevanceScore || 0) + aEducational + aLevelMatch;
        const adjustedScoreB = (b.relevanceScore || 0) + bEducational + bLevelMatch;
        
        return adjustedScoreB - adjustedScoreA;
      });
      
    } catch (error) {
      console.error('Video learning agent search failed:', error);
      
      if (isSearxngError(error)) {
        console.error('SearXNG error details:', getSearxngErrorMessage(error));
      }
      
      return [];
    }
  }

  private estimateDuration(result: any): string | undefined {
    // Try to extract duration from various fields
    if (result.length) return result.length;
    if (result.duration) return result.duration;
    
    // Look for duration patterns in content
    const content = result.content || result.snippet || '';
    const durationMatch = content.match(/(\d+):(\d+)/);
    return durationMatch ? durationMatch[0] : undefined;
  }

  private extractViews(result: any): string | undefined {
    // Try to extract view count from various fields
    if (result.views) return result.views;
    
    // Look for view patterns in content
    const content = result.content || result.snippet || '';
    const viewMatch = content.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s*views?/i);
    return viewMatch ? viewMatch[1] : undefined;
  }

  private extractAuthor(result: any): string | undefined {
    // Try to extract author/channel from various fields
    if (result.author) return result.author;
    
    // Extract from URL patterns
    const url = result.url || '';
    const channelMatch = url.match(/youtube\.com\/(?:channel|user|c)\/([^/?]+)/);
    return channelMatch ? channelMatch[1] : undefined;
  }

  private assessEducationalValue(result: any): boolean {
    const content = (result.title + ' ' + (result.content || result.snippet || '')).toLowerCase();
    const educationalKeywords = [
      'tutorial', 'learn', 'course', 'lesson', 'explained', 'guide', 'how to',
      'introduction', 'basics', 'fundamentals', 'education', 'teaching', 'lecture'
    ];
    
    return educationalKeywords.some(keyword => content.includes(keyword));
  }

  private assessDifficulty(result: any, userLevel?: string): 'beginner' | 'intermediate' | 'advanced' {
    const content = (result.title + ' ' + (result.content || result.snippet || '')).toLowerCase();
    
    // Advanced indicators
    if (content.includes('advanced') || content.includes('expert') || 
        content.includes('deep dive') || content.includes('masterclass')) {
      return 'advanced';
    }
    
    // Beginner indicators
    if (content.includes('beginner') || content.includes('basics') || 
        content.includes('introduction') || content.includes('101') ||
        content.includes('getting started')) {
      return 'beginner';
    }
    
    // Default to intermediate
    return 'intermediate';
  }

  private matchesUserLevel(videoDifficulty?: string, userLevel?: string): boolean {
    if (!videoDifficulty || !userLevel) return true;
    
    // Exact match
    if (videoDifficulty === userLevel) return true;
    
    // Allow some flexibility
    if (userLevel === 'intermediate') return true; // Intermediate can handle any level
    if (userLevel === 'advanced' && videoDifficulty !== 'beginner') return true;
    if (userLevel === 'beginner' && videoDifficulty === 'beginner') return true;
    
    return false;
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      // For videos, also check for similar titles to catch re-uploads
      const normalizedTitle = result.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
      const key = `${normalizedTitle}-${result.url}`;
      
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
    try {
      // Use SearXNG with community discussion configuration
      const response = await SearxngUtils.searchWithAgent('community', topic, context);
      
      // Convert SearXNG results to our SearchResult format
      const searchResults: SearchResult[] = response.results.map(result => ({
        title: result.title || 'Community Discussion',
        url: result.url || '#',
        snippet: result.content || result.snippet || 'No discussion content available',
        source: result.engine || 'community',
        relevanceScore: result.score || 0.6,
        metadata: {
          type: 'community',
          searchEngine: result.engine || 'searxng',
          query: topic,
          platforms: context?.platforms || ['reddit'],
          category: result.category,
          publishedDate: result.publishedDate,
          // Community-specific metadata
          subreddit: this.extractSubreddit(result),
          upvotes: this.extractUpvotes(result),
          comments: this.extractCommentCount(result),
          author: result.author || this.extractAuthor(result),
          discussionType: this.classifyDiscussion(result),
          sentiment: this.analyzeSentiment(result),
          practicalValue: this.assessPracticalValue(result)
        }
      }));

      // For community content, also search with experience and question variations
      if (context?.optimizedQueries && context.optimizedQueries.length > 1) {
        const additionalResults: SearchResult[] = [];
        
        // Search with community-focused variations
        for (const query of context.optimizedQueries.slice(1, 3)) {
          try {
            const additionalResponse = await SearxngUtils.searchWithAgent('community', query, context);
            const additionalSearchResults = additionalResponse.results.map(result => ({
              title: result.title || 'Community Discussion',
              url: result.url || '#',
              snippet: result.content || result.snippet || 'No discussion content available',
              source: result.engine || 'community',
              relevanceScore: (result.score || 0.6) * 0.9,
              metadata: {
                type: 'community',
                searchEngine: result.engine || 'searxng',
                query,
                platforms: context?.platforms || ['reddit'],
                category: result.category,
                publishedDate: result.publishedDate,
                subreddit: this.extractSubreddit(result),
                upvotes: this.extractUpvotes(result),
                comments: this.extractCommentCount(result),
                author: result.author || this.extractAuthor(result),
                discussionType: this.classifyDiscussion(result),
                sentiment: this.analyzeSentiment(result),
                practicalValue: this.assessPracticalValue(result)
              }
            }));
            additionalResults.push(...additionalSearchResults);
          } catch (error) {
            console.warn(`Failed to search community content with query "${query}":`, error);
          }
        }
        
        searchResults.push(...additionalResults);
      }

      // Remove duplicates and sort by community engagement and practical value
      const uniqueResults = this.deduplicateResults(searchResults);
      return uniqueResults.sort((a, b) => {
        // Prioritize high engagement (upvotes and comments)
        const aEngagement = this.calculateEngagementScore(a.metadata);
        const bEngagement = this.calculateEngagementScore(b.metadata);
        
        // Prioritize practical value
        const aPractical = a.metadata?.practicalValue === 'high' ? 0.1 : 0;
        const bPractical = b.metadata?.practicalValue === 'high' ? 0.1 : 0;
        
        const adjustedScoreA = (a.relevanceScore || 0) + aEngagement + aPractical;
        const adjustedScoreB = (b.relevanceScore || 0) + bEngagement + bPractical;
        
        return adjustedScoreB - adjustedScoreA;
      });
      
    } catch (error) {
      console.error('Community discussion agent search failed:', error);
      
      if (isSearxngError(error)) {
        console.error('SearXNG error details:', getSearxngErrorMessage(error));
      }
      
      return [];
    }
  }

  private extractSubreddit(result: any): string | undefined {
    // Try to extract subreddit from URL
    const url = result.url || '';
    const subredditMatch = url.match(/reddit\.com\/r\/([^/?]+)/);
    if (subredditMatch) return subredditMatch[1];
    
    // Try to extract from title
    const title = result.title || '';
    const titleMatch = title.match(/r\/([^:\s]+)/);
    return titleMatch ? titleMatch[1] : undefined;
  }

  private extractUpvotes(result: any): number | undefined {
    // Try to extract upvote count from various fields
    if (result.upvotes) return parseInt(result.upvotes);
    if (result.score) return parseInt(result.score);
    
    // Look for upvote patterns in content
    const content = result.content || result.snippet || '';
    const upvoteMatch = content.match(/(\d+)\s*upvotes?/i) || content.match(/(\d+)\s*points?/i);
    return upvoteMatch ? parseInt(upvoteMatch[1]) : undefined;
  }

  private extractCommentCount(result: any): number | undefined {
    // Try to extract comment count from various fields
    if (result.comments) return parseInt(result.comments);
    
    // Look for comment patterns in content
    const content = result.content || result.snippet || '';
    const commentMatch = content.match(/(\d+)\s*comments?/i);
    return commentMatch ? parseInt(commentMatch[1]) : undefined;
  }

  private extractAuthor(result: any): string | undefined {
    // Try to extract author from URL or content
    const url = result.url || '';
    const content = result.content || result.snippet || '';
    
    // Look for author patterns
    const authorMatch = content.match(/by\s+u\/([^\s]+)/i) || content.match(/posted by\s+([^\s]+)/i);
    return authorMatch ? authorMatch[1] : undefined;
  }

  private classifyDiscussion(result: any): 'question' | 'experience' | 'advice' | 'explanation' | 'general' {
    const title = (result.title || '').toLowerCase();
    const content = (result.content || result.snippet || '').toLowerCase();
    const text = title + ' ' + content;
    
    if (text.includes('?') || text.includes('how') || text.includes('what') || text.includes('why')) {
      return 'question';
    }
    
    if (text.includes('experience') || text.includes('tried') || text.includes('used')) {
      return 'experience';
    }
    
    if (text.includes('advice') || text.includes('tip') || text.includes('recommend')) {
      return 'advice';
    }
    
    if (text.includes('explain') || text.includes('eli5') || text.includes('understand')) {
      return 'explanation';
    }
    
    return 'general';
  }

  private analyzeSentiment(result: any): 'positive' | 'negative' | 'neutral' {
    const content = (result.title + ' ' + (result.content || result.snippet || '')).toLowerCase();
    
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'helpful', 'useful', 'love', 'recommend'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'problem', 'issue', 'difficult', 'confusing'];
    
    const positiveCount = positiveWords.filter(word => content.includes(word)).length;
    const negativeCount = negativeWords.filter(word => content.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private assessPracticalValue(result: any): 'high' | 'medium' | 'low' {
    const content = (result.title + ' ' + (result.content || result.snippet || '')).toLowerCase();
    
    const highValueIndicators = [
      'tutorial', 'guide', 'how to', 'step by step', 'example', 'code', 'solution',
      'practical', 'real world', 'experience', 'tips', 'tricks'
    ];
    
    const highValueCount = highValueIndicators.filter(indicator => content.includes(indicator)).length;
    
    if (highValueCount >= 3) return 'high';
    if (highValueCount >= 1) return 'medium';
    return 'low';
  }

  private calculateEngagementScore(metadata: any): number {
    const upvotes = metadata?.upvotes || 0;
    const comments = metadata?.comments || 0;
    
    // Normalize engagement score (0-0.2 range)
    const upvoteScore = Math.min(upvotes / 1000, 0.1); // Max 0.1 for upvotes
    const commentScore = Math.min(comments / 100, 0.1); // Max 0.1 for comments
    
    return upvoteScore + commentScore;
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      // For community posts, check both URL and normalized title
      const normalizedTitle = result.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
      const key = `${normalizedTitle}-${result.url}`;
      
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