import { GeneratedContent, SynthesisResult } from "./types";
/**
 * Fallback Module
 * Handles fallback mechanisms and error recovery for content generation
 */
export declare class FallbackModule {
    /**
     * Implement fallback mechanisms for content generation failures
     * Requirements 3.5, 4.4, 4.5: Fallback mechanisms for generation failures
     */
    createFallbackContent(topic: string, synthesis: SynthesisResult, error: Error, formatAsMDX: (content: any) => string, estimateReadTime: (contentLength: number) => number): GeneratedContent;
    /**
     * Helper methods for fallback content creation
     */
    private createFoundationContent;
    private createBuildingContent;
    private createApplicationContent;
    private createFallbackTakeaways;
    private createFallbackNextSteps;
}
//# sourceMappingURL=fallback.d.ts.map