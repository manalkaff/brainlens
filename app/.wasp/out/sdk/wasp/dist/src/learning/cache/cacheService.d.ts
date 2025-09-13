import type { Topic, UserTopicProgress, ChatThread, Quiz } from 'wasp/entities';
import type { SearchResult } from '../research/vectorStore';
export declare class CacheService {
    getTopic(topicId: string): Promise<Topic | null>;
    setTopic(topic: Topic): Promise<void>;
    getTopicBySlug(slug: string): Promise<Topic | null>;
    invalidateTopic(topicId: string, topicSlug?: string): Promise<void>;
    getTopicTree(rootTopicId: string): Promise<Topic[] | null>;
    setTopicTree(rootTopicId: string, tree: Topic[]): Promise<void>;
    invalidateTopicTree(topicId: string): Promise<void>;
    getUserProgress(userId: string, topicId: string): Promise<UserTopicProgress | null>;
    setUserProgress(progress: UserTopicProgress): Promise<void>;
    invalidateUserProgress(userId: string, topicId?: string): Promise<void>;
    invalidateUserProgressForTopic(topicId: string): Promise<void>;
    getVectorEmbedding(content: string): Promise<number[] | null>;
    setVectorEmbedding(content: string, embedding: number[]): Promise<void>;
    getSearchResults(query: string, topicId: string, options: any): Promise<SearchResult[] | null>;
    setSearchResults(query: string, topicId: string, options: any, results: SearchResult[]): Promise<void>;
    invalidateSearchResults(topicId?: string): Promise<void>;
    getChatThread(threadId: string): Promise<ChatThread | null>;
    setChatThread(thread: ChatThread): Promise<void>;
    invalidateChatThread(threadId: string): Promise<void>;
    getQuiz(quizId: string): Promise<Quiz | null>;
    setQuiz(quiz: Quiz): Promise<void>;
    invalidateQuiz(quizId: string): Promise<void>;
    getGeneratedContent(prompt: string, model: string): Promise<string | null>;
    setGeneratedContent(prompt: string, model: string, content: string): Promise<void>;
    getResearchStatus(topicId: string): Promise<any | null>;
    setResearchStatus(topicId: string, status: any): Promise<void>;
    invalidateResearchStatus(topicId: string): Promise<void>;
    checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
    }>;
    invalidateUserCache(userId: string): Promise<void>;
    invalidateTopicCache(topicId: string): Promise<void>;
    private hashString;
    healthCheck(): Promise<{
        redis: boolean;
        cacheStats: {
            totalKeys: number;
            keysByPrefix: Record<string, number>;
        };
    }>;
    warmCache(userId: string, topicIds: string[]): Promise<void>;
    cleanup(): Promise<{
        deletedKeys: number;
        errors: string[];
    }>;
}
export declare const cacheService: CacheService;
//# sourceMappingURL=cacheService.d.ts.map