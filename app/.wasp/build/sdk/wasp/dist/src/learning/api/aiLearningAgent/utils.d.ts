import type { SearchResult } from "../../research/agents";
import { SearchResultWithEngine, SourceAttribution, ContentSection, GeneratedContent } from "./types";
/**
 * Utils Module
 * Contains helper methods and utilities used across the learning agent
 */
export declare class UtilsModule {
    /**
     * Build source attributions from research results and content sections
     */
    buildSourceAttributions(researchResults: SearchResultWithEngine[], sections: ContentSection[]): SourceAttribution[];
    /**
     * Calculate credibility score for a search result
     */
    private calculateCredibilityScore;
    /**
     * Classify content type based on URL and title patterns
     */
    private classifyContentType;
    /**
     * Find which sections reference a particular source
     */
    private findUsageInSections;
    /**
     * Calculate confidence score based on research quality and content depth
     */
    calculateConfidenceScore(researchResults: SearchResult[], content: GeneratedContent): number;
    /**
     * Generate cache key for a topic and user context
     */
    generateCacheKey(topic: string, userContext?: any): string;
    /**
     * Estimate reading time based on content length
     */
    estimateReadTime(contentLength: number): number;
    /**
     * Estimate reading time for subtopics based on complexity
     */
    estimateSubtopicReadTime(complexity: string): number;
    /**
     * Ensure an array contains only string values
     */
    ensureStringArray(arr: any): string[];
    /**
     * Format content as MDX
     */
    formatAsMDX(content: {
        title: string;
        sections: ContentSection[];
        keyTakeaways: string[];
        nextSteps: string[];
    }): string;
    /**
     * Parse content from text when structured generation fails
     */
    parseContentFallback(text: string, topic: string): any;
    /**
     * Deduplicate results based on title and URL
     */
    deduplicateResults<T extends {
        title: string;
        url: string;
    }>(results: T[]): T[];
    /**
     * Infer section complexity based on position in learning sequence
     */
    inferSectionComplexity(index: number, totalSections: number): "foundation" | "building" | "application";
}
//# sourceMappingURL=utils.d.ts.map