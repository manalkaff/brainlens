import { GeneratedContent, ContentValidationResult } from "./types";
/**
 * Validation Module
 * Handles content validation, accessibility checks, and structure validation
 */
export declare class ValidationModule {
    /**
     * Enhanced content validation for accessibility and structure
     * Requirements 3.5, 4.4, 4.5: Validate accessibility, structure, logical flow, and clear takeaways
     */
    validateContentAccessibility(content: GeneratedContent): ContentValidationResult;
    /**
     * Validate language accessibility
     * Requirement 3.5: Content maintains accessibility
     */
    private validateLanguageAccessibility;
    /**
     * Validate content structure for progressive learning
     * Requirement 4.4: Content maintains logical structure
     */
    private validateContentStructure;
    /**
     * Validate logical flow between sections
     * Requirement 4.5: Content maintains logical flow
     */
    private validateLogicalFlow;
    /**
     * Validate clear takeaways and actionable content
     * Requirement 4.5: Content provides clear takeaways
     */
    private validateClearTakeaways;
    /**
     * Validate that complexity progresses logically through sections
     * Requirement 3.4: Each section builds upon previous knowledge clearly
     */
    private validateComplexityProgression;
    /**
     * Apply basic fixes to content based on validation suggestions
     */
    applyBasicContentFixes(content: GeneratedContent, suggestions: string[]): void;
    /**
     * Helper methods for content validation
     */
    private identifyTechnicalTerms;
    private hasExplanation;
    private hasSpecificDetails;
    private extractKeyConceptWords;
}
//# sourceMappingURL=validation.d.ts.map