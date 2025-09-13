import { TopicUnderstanding } from "./types";
/**
 * Topic Understanding Module
 * Handles initial topic research and understanding from scratch
 */
export declare class TopicUnderstandingModule {
    private fastModel;
    /**
     * Understand a topic from scratch using basic research
     * This function performs initial research to understand what a topic is about
     * without relying on AI's pre-trained knowledge
     */
    understandTopic(topic: string): Promise<TopicUnderstanding>;
    /**
     * Create fallback understanding when research fails
     */
    private createFallbackUnderstanding;
}
//# sourceMappingURL=topicUnderstanding.d.ts.map