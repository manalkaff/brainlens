import { SubtopicInfo, SynthesisResult } from "./types";
/**
 * Subtopic Identification Module
 * Handles identification of subtopics for further exploration
 */
export declare class SubtopicIdentificationModule {
    private fastModel;
    /**
     * Identify subtopics for further exploration
     */
    identifySubtopics(topic: string, synthesis: SynthesisResult, nextDepth: number): Promise<SubtopicInfo[]>;
    /**
     * Estimate reading time for subtopics based on complexity
     */
    private estimateSubtopicReadTime;
    /**
     * Create fallback subtopics when structured generation fails
     */
    private createFallbackSubtopics;
}
//# sourceMappingURL=subtopicIdentification.d.ts.map