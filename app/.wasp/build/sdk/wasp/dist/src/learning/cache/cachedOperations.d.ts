import type { GetTopic, GetTopicTree, UpdateTopicProgress, CreateTopic } from 'wasp/server/operations';
import type { Topic, UserTopicProgress } from 'wasp/entities';
/**
 * Cached database operations for improved performance
 */
/**
 * Get topic with caching and optimized database queries
 */
export declare const getTopicCached: GetTopic<{
    slug: string;
}, Topic | null>;
/**
 * Get topic tree with caching and optimized recursive queries
 */
export declare const getTopicTreeCached: GetTopicTree<{
    rootSlug: string;
}, Topic[]>;
/**
 * Update topic progress with caching
 */
export declare const updateTopicProgressCached: UpdateTopicProgress<{
    topicId: string;
    completed?: boolean;
    timeSpent?: number;
    preferences?: any;
    bookmarks?: string[];
}, UserTopicProgress>;
/**
 * Create topic with caching
 */
export declare const createTopicCached: CreateTopic<{
    title: string;
    slug: string;
    summary?: string;
    description?: string;
    parentId?: string;
    depth?: number;
    metadata?: any;
}, Topic>;
/**
 * Get user's recent topics with caching
 */
export declare function getUserRecentTopicsCached(userId: string, context: any, limit?: number): Promise<UserTopicProgress[]>;
/**
 * Get topic statistics with caching
 */
export declare function getTopicStatsCached(topicId: string, context: any): Promise<{
    totalUsers: number;
    completedUsers: number;
    averageTimeSpent: number;
    totalChatThreads: number;
    totalQuizzes: number;
    totalVectorDocuments: number;
}>;
/**
 * Batch invalidate caches for topic operations
 */
export declare function invalidateTopicCaches(topicId: string, userId?: string): Promise<void>;
/**
 * Warm frequently accessed caches
 */
export declare function warmTopicCaches(userId: string, topicIds: string[], context: any): Promise<void>;
//# sourceMappingURL=cachedOperations.d.ts.map