import { GeneratedContent, ContentSection, SynthesisResult } from "./types";
/**
 * Content Generation Module
 * Handles comprehensive content generation with progressive learning structure
 */
export declare class ContentGenerationModule {
    private model;
    /**
     * Generate comprehensive content using AI with progressive learning structure
     *
     * ENHANCED FOR PROGRESSIVE LEARNING (Task 4):
     * - Organizes information in logical learning sequence (Requirement 3.2)
     * - Breaks down complex topics into digestible components (Requirement 3.3)
     * - Ensures each section builds upon previous knowledge clearly (Requirement 3.4)
     * - Focuses on practical understanding over academic theory (Requirement 1.5)
     *
     * Content structure follows: Foundation → Building Blocks → Applications
     * Each section includes learning objectives and complexity indicators
     */
    generateContent(topic: string, synthesis: SynthesisResult): Promise<GeneratedContent>;
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
     * Format community insight for MDX display
     */
    private formatCommunityInsight;
    /**
     * Estimate reading time based on content length
     */
    private estimateReadTime;
    /**
     * Infer section complexity based on position in learning sequence
     * Requirements 3.2, 3.3: Organize information in logical learning sequence and break down complex topics
     */
    private inferSectionComplexity;
    /**
     * Validate that content follows progressive learning structure
     * Requirements 3.2, 3.3, 3.4: Logical sequence, digestible components, clear knowledge building
     */
    private validateProgressiveLearningStructure;
    /**
     * Validate that complexity progresses logically through sections
     * Requirement 3.4: Each section builds upon previous knowledge clearly
     */
    private validateComplexityProgression;
    private ensureStringArray;
    private parseContentFallback;
    /**
     * Create basic fallback content for serious generation failures
     */
    private createBasicFallbackContent;
    private createFoundationContent;
    private createBuildingContent;
    private createApplicationContent;
    private createCommunitySection;
    private createSampleCommunityInsights;
}
//# sourceMappingURL=contentGeneration.d.ts.map