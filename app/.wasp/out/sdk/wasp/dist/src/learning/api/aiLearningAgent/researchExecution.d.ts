import { SearchResultWithEngine, ResearchPlan } from "./types";
/**
 * Research Execution Module
 * Handles execution of research queries with robust error handling
 */
export declare class ResearchExecutionModule {
    /**
     * Execute research using planned queries and engines
     * Enhanced for requirement 5.5: proper handling of general and specialized engine queries
     * with robust error handling for engine availability issues
     */
    executeResearch(researchPlan: ResearchPlan): Promise<SearchResultWithEngine[]>;
    /**
     * Handle general engine failure with fallback strategies
     * General engine queries are critical for balanced perspective (requirement 5.5)
     */
    private handleGeneralEngineFailure;
    /**
     * Handle specialized engine failure with graceful degradation
     * Specialized engines enhance depth but are not critical for basic understanding
     */
    private handleSpecializedEngineFailure;
    /**
     * Validate research execution success and ensure minimum requirements are met
     * Requirement 5.5: validate that general engine queries are executed successfully
     */
    private validateResearchExecutionSuccess;
    /**
     * Deduplicate results based on title and URL
     */
    private deduplicateResults;
}
//# sourceMappingURL=researchExecution.d.ts.map