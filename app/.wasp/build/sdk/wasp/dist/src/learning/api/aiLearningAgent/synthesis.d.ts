import { SearchResultWithEngine, SynthesisResult } from "./types";
/**
 * Synthesis Module
 * Handles research synthesis and analysis with practical focus
 */
export declare class SynthesisModule {
    private model;
    /**
     * Synthesize research results using AI with enhanced weighting for practical understanding
     *
     * ENHANCED FOR PRACTICAL UNDERSTANDING (Task 5):
     * - Weights general sources appropriately for balanced perspective (Requirement 2.4)
     * - Focuses on practical applications over academic theory (Requirement 4.1, 4.2)
     * - Balances academic credibility with accessibility (Requirement 4.3)
     */
    synthesizeResearch(topic: string, researchResults: SearchResultWithEngine[]): Promise<SynthesisResult>;
    /**
     * Weight sources to prioritize practical understanding while maintaining academic credibility
     * Requirement 2.4: prioritize practical understanding over theoretical complexity
     * Requirement 4.3: balance academic credibility with accessibility
     */
    private weightSourcesForPracticalUnderstanding;
    private extractPracticalInsights;
    private extractPracticalThemes;
    /**
     * Assess source quality with balance between academic credibility and practical accessibility
     * Requirement 4.3: balance academic credibility with accessibility
     */
    private assessBalancedSourceQuality;
    /**
     * Calculate comprehensiveness with emphasis on practical understanding
     * Requirement 2.4: weight general sources appropriately
     */
    private calculatePracticalComprehensiveness;
    /**
     * Assess how well the research focuses on practical understanding
     * New metric to track practical understanding emphasis
     */
    private assessPracticalFocus;
}
//# sourceMappingURL=synthesis.d.ts.map