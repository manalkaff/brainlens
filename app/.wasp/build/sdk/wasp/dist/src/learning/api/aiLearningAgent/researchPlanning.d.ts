import { TopicUnderstanding, ResearchPlan } from "./types";
/**
 * Research Planning Module
 * Handles research strategy planning and query generation
 */
export declare class ResearchPlanningModule {
    private model;
    /**
     * Plan the research strategy using research-based understanding (NOT AI knowledge)
     * Always includes 5 mandatory general engine queries for balanced perspective
     */
    planResearch(topic: string, understanding: TopicUnderstanding, userContext?: any): Promise<ResearchPlan>;
    /**
     * Ensures the research plan has minimum required queries for all mandatory engines
     * Enhanced to require 5 general, 5 community, and 5 video queries
     */
    private ensureGeneralQueries;
    /**
     * Validates query diversity to ensure both specialized and accessible search terms
     * Requirement 5.3: research queries SHALL include both specialized and accessible search terms
     */
    private validateQueryDiversity;
    /**
     * Generates additional general queries when needed
     * Enhanced for requirement 5.3 - ensures accessible search terms for diverse understanding
     */
    private generateAdditionalGeneralQueries;
    /**
     * Generates additional community queries focusing on user opinions, techniques, and experiences
     */
    private generateAdditionalCommunityQueries;
    /**
     * Generates additional video queries focusing on visual learning and demonstrations
     */
    private generateAdditionalVideoQueries;
    /**
     * Calculates engine distribution from research queries
     */
    private calculateEngineDistribution;
    /**
     * Creates a fallback research plan with mandatory 5 general queries
     * Enhanced for requirements 5.3 and 5.4 - ensures diverse source types and query terms
     */
    private createFallbackPlan;
}
//# sourceMappingURL=researchPlanning.d.ts.map