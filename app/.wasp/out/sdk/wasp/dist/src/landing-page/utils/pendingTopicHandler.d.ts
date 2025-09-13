export declare const PENDING_TOPIC_KEY = "pendingTopic";
/**
 * Stores a topic title for creation after user authentication
 */
export declare function storePendingTopic(topicTitle: string): void;
/**
 * Retrieves and clears the pending topic from storage
 */
export declare function getPendingTopic(): string | null;
/**
 * Creates a topic from the pending topic if one exists
 * Returns the created topic or null if no pending topic
 */
export declare function createPendingTopic(): Promise<{
    id: string;
    slug: string;
} | null>;
/**
 * Checks if there's a pending topic and redirects to it after creation
 */
export declare function handlePendingTopicRedirect(): Promise<boolean>;
//# sourceMappingURL=pendingTopicHandler.d.ts.map