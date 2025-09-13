import { type SearchResult, type ResearchResult } from '../agents';
import { levenshteinDistance, jaccardSimilarity } from '../utils/similarity';
export interface DeduplicationConfig {
    titleSimilarityThreshold: number;
    contentSimilarityThreshold: number;
    urlNormalizationEnabled: boolean;
    preserveBestQuality: boolean;
    crossAgentDeduplication: boolean;
    agentSourceWeighting: Record<string, number>;
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
export declare class ResultsDeduplicationEngine {
    private config;
    constructor(config?: Partial<DeduplicationConfig>);
    /**
     * Deduplicate results from multiple research agents
     */
    deduplicateResults(researchResults: ResearchResult[], topic: string): Promise<DeduplicationResult>;
    /**
     * Apply deduplication to research results and return updated results
     */
    applyDeduplication(researchResults: ResearchResult[], topic: string): Promise<ResearchResult[]>;
    private extractAllResults;
    private normalizeUrls;
    private normalizeUrl;
    private findDuplicateGroups;
    private calculateSimilarity;
    private calculateTextSimilarity;
    private calculateUrlSimilarity;
    private calculateTopicRelevance;
    private normalizeText;
    private areDuplicates;
    private selectBestResult;
    private calculateQualityScore;
    private determineConsolidationStrategy;
    private consolidateDuplicates;
    private mergeResults;
    private extractAgentFromMetadata;
    updateConfig(config: Partial<DeduplicationConfig>): void;
    getConfig(): DeduplicationConfig;
}
export { levenshteinDistance, jaccardSimilarity };
//# sourceMappingURL=deduplication.d.ts.map