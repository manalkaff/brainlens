/**
 * Offline Storage Manager for BrainLens
 * Handles IndexedDB storage for offline content, progress, and user data
 */
import type { Topic, UserTopicProgress, ChatThread, Message } from 'wasp/entities';
interface OfflineAction {
    id: string;
    type: 'bookmark' | 'progress' | 'chat_message' | 'content_generation';
    data: any;
    timestamp: Date;
    synced: boolean;
    retryCount: number;
}
export declare class OfflineStorageManager {
    private db;
    private readonly dbName;
    private readonly dbVersion;
    private readonly stores;
    /**
     * Initialize the database
     */
    initialize(): Promise<boolean>;
    private createObjectStores;
    /**
     * Store topic data
     */
    storeTopic(topic: Topic): Promise<boolean>;
    /**
     * Get topic by ID
     */
    getTopic(topicId: string): Promise<Topic | null>;
    /**
     * Get all topics
     */
    getAllTopics(): Promise<Topic[]>;
    /**
     * Store content
     */
    storeContent(topicId: string, content: string, contentType?: 'markdown' | 'html' | 'json', expiresInHours?: number): Promise<boolean>;
    /**
     * Get content for topic
     */
    getContent(topicId: string, contentType?: 'markdown' | 'html' | 'json'): Promise<string | null>;
    /**
     * Store user progress
     */
    storeProgress(progress: UserTopicProgress): Promise<boolean>;
    /**
     * Get user progress for topic
     */
    getProgress(topicId: string, userId: string): Promise<UserTopicProgress | null>;
    /**
     * Store chat thread
     */
    storeThread(thread: ChatThread): Promise<boolean>;
    /**
     * Store chat message
     */
    storeMessage(message: Message): Promise<boolean>;
    /**
     * Get messages for thread
     */
    getThreadMessages(threadId: string): Promise<Message[]>;
    /**
     * Add offline action
     */
    addOfflineAction(type: 'bookmark' | 'progress' | 'chat_message' | 'content_generation', data: any): Promise<boolean>;
    /**
     * Get pending offline actions
     */
    getPendingActions(): Promise<OfflineAction[]>;
    /**
     * Mark action as synced
     */
    markActionSynced(actionId: string): Promise<boolean>;
    /**
     * Store setting
     */
    storeSetting(key: string, value: any): Promise<boolean>;
    /**
     * Get setting
     */
    getSetting(key: string): Promise<any>;
    /**
     * Clear expired content
     */
    clearExpiredContent(): Promise<number>;
    /**
     * Get storage statistics
     */
    getStorageStats(): Promise<{
        topics: number;
        content: number;
        progress: number;
        threads: number;
        messages: number;
        pendingActions: number;
        totalSize: number;
    }>;
    /**
     * Clear all data
     */
    clearAllData(): Promise<boolean>;
    /**
     * Close database connection
     */
    close(): void;
    /**
     * Helper to promisify IDBRequest
     */
    private promisifyRequest;
}
export declare const offlineStorage: OfflineStorageManager;
export default offlineStorage;
//# sourceMappingURL=offlineStorage.d.ts.map