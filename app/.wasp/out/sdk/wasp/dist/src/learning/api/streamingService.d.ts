import type { Request, Response } from "express";
import type { Topic } from "wasp/entities";
import { type ContentGenerationOptions, type ResearchResult } from "./contentGenerator";
export interface StreamingStatus {
    phase: "initializing" | "researching" | "generating" | "streaming" | "completed" | "error";
    progress: number;
    message: string;
    currentSection?: string;
    estimatedCompletion?: Date;
    error?: string;
}
export interface ContentStreamingOptions extends ContentGenerationOptions {
    includeProgress?: boolean;
    chunkSize?: number;
    delayBetweenChunks?: number;
}
/**
 * Streaming Content Service
 * Handles real-time content delivery with progress tracking
 */
export declare class StreamingContentService {
    private connectionManager;
    private model;
    /**
     * Create a new streaming connection
     */
    createStream(req: Request, res: Response): string;
    /**
     * Stream learning content generation with progress updates
     */
    streamLearningContent(streamId: string, topic: Topic, researchResults: ResearchResult[], options: ContentStreamingOptions): Promise<void>;
    /**
     * Stream research progress updates
     */
    streamResearchProgress(streamId: string, topicId: string, agentNames: string[]): Promise<void>;
    /**
     * Stream assessment content generation
     */
    streamAssessmentContent(streamId: string, topic: Topic, userPreferences: any, options: ContentStreamingOptions): Promise<void>;
    /**
     * Get current stream status
     */
    getStreamStatus(streamId: string): StreamingStatus | undefined;
    /**
     * Close a stream connection
     */
    closeStream(streamId: string): void;
    /**
     * Check if stream is active
     */
    isStreamActive(streamId: string): boolean;
    private generateStreamId;
    private buildStreamingPrompt;
    private extractCurrentSection;
    private chunkContent;
    private delay;
}
export declare const streamingContentService: StreamingContentService;
export declare function createStreamHandler(req: Request, res: Response, context: any): Promise<void>;
export declare function streamContentHandler(req: Request, res: Response, context: any): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=streamingService.d.ts.map