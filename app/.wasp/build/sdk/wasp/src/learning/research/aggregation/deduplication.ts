import { type SearchResult, type ResearchResult } from '../agents';
import { levenshteinDistance, jaccardSimilarity } from '../utils/similarity';

export interface DeduplicationConfig {
  titleSimilarityThreshold: number; // 0-1, higher = more strict
  contentSimilarityThreshold: number; // 0-1
  urlNormalizationEnabled: boolean;
  preserveBestQuality: boolean;
  crossAgentDeduplication: boolean;
  agentSourceWeighting: Record<string, number>; // Weight different agent sources
}

export interface DeduplicationResult {
  originalCount: number;
  deduplicatedCount: number;
  duplicatesRemoved: number;
  duplicateGroups: DuplicateGroup[];
  processingTime: number;
}

export interface DuplicateGroup {
  primaryResult: SearchResult;
  duplicates: SearchResult[];
  similarityScore: number;
  consolidationStrategy: 'merge' | 'keep_best' | 'keep_first';
}

const DEFAULT_CONFIG: DeduplicationConfig = {
  titleSimilarityThreshold: 0.85,
  contentSimilarityThreshold: 0.75,
  urlNormalizationEnabled: true,
  preserveBestQuality: true,
  crossAgentDeduplication: true,
  agentSourceWeighting: {
    'General Research Agent': 1.0,
    'Academic Research Agent': 1.2,
    'Computational Agent': 1.1,
    'Video Learning Agent': 0.9,
    'Community Discussion Agent': 0.8
  }
};

export class ResultsDeduplicationEngine {
  private config: DeduplicationConfig;

  constructor(config: Partial<DeduplicationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Deduplicate results from multiple research agents
   */
  async deduplicateResults(
    researchResults: ResearchResult[],
    topic: string
  ): Promise<DeduplicationResult> {
    const startTime = Date.now();
    
    // Extract all search results from all agents
    const allResults = this.extractAllResults(researchResults);
    const originalCount = allResults.length;

    // Normalize URLs if enabled
    if (this.config.urlNormalizationEnabled) {
      this.normalizeUrls(allResults);
    }

    // Group similar results
    const duplicateGroups = await this.findDuplicateGroups(allResults, topic);
    
    // Consolidate duplicates
    const deduplicatedResults = this.consolidateDuplicates(duplicateGroups);
    
    const processingTime = Date.now() - startTime;

    return {
      originalCount,
      deduplicatedCount: deduplicatedResults.length,
      duplicatesRemoved: originalCount - deduplicatedResults.length,
      duplicateGroups,
      processingTime
    };
  }

  /**
   * Apply deduplication to research results and return updated results
   */
  async applyDeduplication(
    researchResults: ResearchResult[],
    topic: string
  ): Promise<ResearchResult[]> {
    const deduplicationResult = await this.deduplicateResults(researchResults, topic);
    
    // Create a map of deduplicated results by original agent
    const deduplicatedByAgent = new Map<string, SearchResult[]>();
    
    deduplicationResult.duplicateGroups.forEach(group => {
      const primaryResult = group.primaryResult;
      const agentName = this.extractAgentFromMetadata(primaryResult);
      
      if (!deduplicatedByAgent.has(agentName)) {
        deduplicatedByAgent.set(agentName, []);
      }
      
      deduplicatedByAgent.get(agentName)!.push(primaryResult);
    });

    // Update research results with deduplicated content
    return researchResults.map(result => ({
      ...result,
      results: deduplicatedByAgent.get(result.agent) || []
    }));
  }

  // Private methods for deduplication logic

  private extractAllResults(researchResults: ResearchResult[]): SearchResult[] {
    const allResults: SearchResult[] = [];
    
    researchResults.forEach(agentResult => {
      agentResult.results.forEach(result => {
        // Add agent source information to metadata
        const enrichedResult = {
          ...result,
          metadata: {
            ...result.metadata,
            sourceAgent: agentResult.agent,
            agentWeight: this.config.agentSourceWeighting[agentResult.agent] || 1.0
          }
        };
        allResults.push(enrichedResult);
      });
    });

    return allResults;
  }

  private normalizeUrls(results: SearchResult[]): void {
    results.forEach(result => {
      if (result.url) {
        result.url = this.normalizeUrl(result.url);
      }
    });
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Remove common tracking parameters
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
        'fbclid', 'gclid', 'msclkid', 'ref', 'source', 'campaign'
      ];
      
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      // Remove trailing slash
      let pathname = urlObj.pathname;
      if (pathname.endsWith('/') && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }
      urlObj.pathname = pathname;
      
      // Convert to lowercase
      return urlObj.toString().toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  private async findDuplicateGroups(
    results: SearchResult[],
    topic: string
  ): Promise<DuplicateGroup[]> {
    const duplicateGroups: DuplicateGroup[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < results.length; i++) {
      if (processed.has(i)) continue;

      const currentResult = results[i];
      const similarResults: { result: SearchResult; similarity: number; index: number }[] = [];

      // Find similar results
      for (let j = i + 1; j < results.length; j++) {
        if (processed.has(j)) continue;

        const otherResult = results[j];
        const similarity = await this.calculateSimilarity(currentResult, otherResult, topic);

        if (this.areDuplicates(similarity)) {
          similarResults.push({ result: otherResult, similarity: similarity.overallSimilarity, index: j });
        }
      }

      if (similarResults.length > 0) {
        // Select the best result as primary
        const allCandidates = [
          { result: currentResult, similarity: 1.0, index: i },
          ...similarResults
        ];

        const primaryCandidate = this.selectBestResult(allCandidates);
        const duplicates = allCandidates
          .filter(c => c.index !== primaryCandidate.index)
          .map(c => c.result);

        duplicateGroups.push({
          primaryResult: primaryCandidate.result,
          duplicates,
          similarityScore: Math.max(...similarResults.map(r => r.similarity)),
          consolidationStrategy: this.determineConsolidationStrategy(allCandidates)
        });

        // Mark all results as processed
        processed.add(i);
        similarResults.forEach(sr => processed.add(sr.index));
      } else {
        // No duplicates found - add as single result group
        duplicateGroups.push({
          primaryResult: currentResult,
          duplicates: [],
          similarityScore: 1.0,
          consolidationStrategy: 'keep_best'
        });
        processed.add(i);
      }
    }

    return duplicateGroups;
  }

  private async calculateSimilarity(
    result1: SearchResult,
    result2: SearchResult,
    topic: string
  ): Promise<{
    titleSimilarity: number;
    contentSimilarity: number;
    urlSimilarity: number;
    overallSimilarity: number;
  }> {
    // Calculate title similarity
    const titleSimilarity = this.calculateTextSimilarity(
      result1.title || '',
      result2.title || ''
    );

    // Calculate content similarity
    const contentSimilarity = this.calculateTextSimilarity(
      result1.snippet || '',
      result2.snippet || ''
    );

    // Calculate URL similarity
    const urlSimilarity = this.calculateUrlSimilarity(
      result1.url || '',
      result2.url || ''
    );

    // Calculate relevance to topic
    const topicRelevance1 = this.calculateTopicRelevance(result1, topic);
    const topicRelevance2 = this.calculateTopicRelevance(result2, topic);

    // Weighted overall similarity
    const weights = {
      title: 0.4,
      content: 0.3,
      url: 0.2,
      relevance: 0.1
    };

    const overallSimilarity = 
      titleSimilarity * weights.title +
      contentSimilarity * weights.content +
      urlSimilarity * weights.url +
      Math.abs(topicRelevance1 - topicRelevance2) * weights.relevance;

    return {
      titleSimilarity,
      contentSimilarity,
      urlSimilarity,
      overallSimilarity
    };
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    // Normalize texts
    const normalized1 = this.normalizeText(text1);
    const normalized2 = this.normalizeText(text2);
    
    // Use Jaccard similarity for efficiency
    const similarity = jaccardSimilarity(normalized1, normalized2);
    
    // For very similar lengths, also use Levenshtein distance
    const lengthDiff = Math.abs(normalized1.length - normalized2.length);
    if (lengthDiff < Math.min(normalized1.length, normalized2.length) * 0.2) {
      const levDistance = levenshteinDistance(normalized1, normalized2);
      const maxLength = Math.max(normalized1.length, normalized2.length);
      const levSimilarity = 1 - (levDistance / maxLength);
      
      return (similarity + levSimilarity) / 2;
    }
    
    return similarity;
  }

  private calculateUrlSimilarity(url1: string, url2: string): number {
    if (!url1 || !url2) return 0;
    if (url1 === url2) return 1.0;
    
    try {
      const parsedUrl1 = new URL(url1);
      const parsedUrl2 = new URL(url2);
      
      // Same domain and path = high similarity
      if (parsedUrl1.hostname === parsedUrl2.hostname && 
          parsedUrl1.pathname === parsedUrl2.pathname) {
        return 0.9;
      }
      
      // Same domain = medium similarity
      if (parsedUrl1.hostname === parsedUrl2.hostname) {
        return 0.6;
      }
      
      // Different domains
      return 0.0;
    } catch {
      return url1.toLowerCase() === url2.toLowerCase() ? 1.0 : 0.0;
    }
  }

  private calculateTopicRelevance(result: SearchResult, topic: string): number {
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    const topicWords = topic.toLowerCase().split(/\s+/);
    
    let relevanceScore = 0;
    let totalWords = topicWords.length;
    
    topicWords.forEach(word => {
      if (text.includes(word)) {
        relevanceScore += 1;
      }
    });
    
    return totalWords > 0 ? relevanceScore / totalWords : 0;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private areDuplicates(similarity: { overallSimilarity: number; titleSimilarity: number; contentSimilarity: number }): boolean {
    return similarity.titleSimilarity >= this.config.titleSimilarityThreshold ||
           similarity.contentSimilarity >= this.config.contentSimilarityThreshold ||
           similarity.overallSimilarity >= Math.max(this.config.titleSimilarityThreshold, this.config.contentSimilarityThreshold) * 0.8;
  }

  private selectBestResult(
    candidates: { result: SearchResult; similarity: number; index: number }[]
  ): { result: SearchResult; similarity: number; index: number } {
    if (!this.config.preserveBestQuality) {
      return candidates[0]; // Keep first result
    }

    // Score each candidate based on quality factors
    let bestCandidate = candidates[0];
    let bestScore = this.calculateQualityScore(bestCandidate.result);

    candidates.slice(1).forEach(candidate => {
      const score = this.calculateQualityScore(candidate.result);
      if (score > bestScore) {
        bestCandidate = candidate;
        bestScore = score;
      }
    });

    return bestCandidate;
  }

  private calculateQualityScore(result: SearchResult): number {
    let score = 0;

    // Content length (more content = higher quality, up to a point)
    const contentLength = (result.snippet || '').length;
    score += Math.min(contentLength / 500, 1.0) * 0.3;

    // Title quality (longer, more descriptive titles are better)
    const titleLength = (result.title || '').length;
    score += Math.min(titleLength / 100, 1.0) * 0.2;

    // Relevance score from metadata
    if (result.relevanceScore) {
      score += result.relevanceScore * 0.3;
    }

    // Agent weighting
    const agentWeight = result.metadata?.agentWeight || 1.0;
    score += (agentWeight - 1.0) * 0.2;

    return score;
  }

  private determineConsolidationStrategy(
    candidates: { result: SearchResult; similarity: number; index: number }[]
  ): DuplicateGroup['consolidationStrategy'] {
    // If all candidates have very similar quality, merge them
    const qualityScores = candidates.map(c => this.calculateQualityScore(c.result));
    const minQuality = Math.min(...qualityScores);
    const maxQuality = Math.max(...qualityScores);
    
    if (maxQuality - minQuality < 0.2) {
      return 'merge';
    }
    
    // If there's a clear quality winner, keep the best
    if (this.config.preserveBestQuality) {
      return 'keep_best';
    }
    
    // Default to keeping first
    return 'keep_first';
  }

  private consolidateDuplicates(duplicateGroups: DuplicateGroup[]): SearchResult[] {
    return duplicateGroups.map(group => {
      if (group.consolidationStrategy === 'merge') {
        return this.mergeResults(group.primaryResult, group.duplicates);
      }
      
      // For 'keep_best' and 'keep_first', return the primary result
      return group.primaryResult;
    });
  }

  private mergeResults(primary: SearchResult, duplicates: SearchResult[]): SearchResult {
    const allResults = [primary, ...duplicates];
    
    // Merge snippets (take the longest or most informative)
    const snippets = allResults.map(r => r.snippet || '').filter(s => s.length > 0);
    const longestSnippet = snippets.reduce((longest, current) => 
      current.length > longest.length ? current : longest, '');

    // Combine metadata
    const combinedMetadata = {
      ...primary.metadata,
      mergedFrom: duplicates.map(d => ({
        agent: d.metadata?.sourceAgent,
        url: d.url,
        relevanceScore: d.relevanceScore
      })),
      sourceCount: allResults.length
    };

    // Calculate merged relevance score (average of all)
    const relevanceScores = allResults
      .map(r => r.relevanceScore)
      .filter(score => score !== undefined) as number[];
    
    const averageRelevance = relevanceScores.length > 0 
      ? relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length
      : primary.relevanceScore;

    return {
      ...primary,
      snippet: longestSnippet,
      relevanceScore: averageRelevance,
      metadata: combinedMetadata
    };
  }

  private extractAgentFromMetadata(result: SearchResult): string {
    return result.metadata?.sourceAgent || 'Unknown';
  }

  // Public configuration methods
  updateConfig(config: Partial<DeduplicationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): DeduplicationConfig {
    return { ...this.config };
  }
}

// Export utility functions for external use
export { levenshteinDistance, jaccardSimilarity };