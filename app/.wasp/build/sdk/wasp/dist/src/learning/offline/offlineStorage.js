/**
 * Offline Storage Manager for BrainLens
 * Handles IndexedDB storage for offline content, progress, and user data
 */
export class OfflineStorageManager {
    db = null;
    dbName = 'BrainLensOffline';
    dbVersion = 1;
    stores = {
        topics: 'topics',
        content: 'content',
        progress: 'progress',
        threads: 'threads',
        messages: 'messages',
        actions: 'actions',
        settings: 'settings'
    };
    /**
     * Initialize the database
     */
    async initialize() {
        if (!('indexedDB' in window)) {
            console.warn('IndexedDB not supported');
            return false;
        }
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(false);
            };
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB opened successfully');
                resolve(true);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createObjectStores(db);
            };
        });
    }
    createObjectStores(db) {
        // Topics store
        if (!db.objectStoreNames.contains(this.stores.topics)) {
            const topicsStore = db.createObjectStore(this.stores.topics, { keyPath: 'id' });
            topicsStore.createIndex('slug', 'slug', { unique: true });
            topicsStore.createIndex('createdAt', 'createdAt');
        }
        // Content store
        if (!db.objectStoreNames.contains(this.stores.content)) {
            const contentStore = db.createObjectStore(this.stores.content, { keyPath: 'id' });
            contentStore.createIndex('topicId', 'topicId');
            contentStore.createIndex('cachedAt', 'cachedAt');
            contentStore.createIndex('expiresAt', 'expiresAt');
        }
        // Progress store
        if (!db.objectStoreNames.contains(this.stores.progress)) {
            const progressStore = db.createObjectStore(this.stores.progress, { keyPath: 'id' });
            progressStore.createIndex('topicId', 'topicId');
            progressStore.createIndex('userId', 'userId');
            progressStore.createIndex('lastAccessed', 'lastAccessed');
        }
        // Chat threads store
        if (!db.objectStoreNames.contains(this.stores.threads)) {
            const threadsStore = db.createObjectStore(this.stores.threads, { keyPath: 'id' });
            threadsStore.createIndex('topicId', 'topicId');
            threadsStore.createIndex('userId', 'userId');
            threadsStore.createIndex('createdAt', 'createdAt');
        }
        // Messages store
        if (!db.objectStoreNames.contains(this.stores.messages)) {
            const messagesStore = db.createObjectStore(this.stores.messages, { keyPath: 'id' });
            messagesStore.createIndex('threadId', 'threadId');
            messagesStore.createIndex('createdAt', 'createdAt');
        }
        // Offline actions store
        if (!db.objectStoreNames.contains(this.stores.actions)) {
            const actionsStore = db.createObjectStore(this.stores.actions, { keyPath: 'id' });
            actionsStore.createIndex('type', 'type');
            actionsStore.createIndex('timestamp', 'timestamp');
            actionsStore.createIndex('synced', 'synced');
        }
        // Settings store
        if (!db.objectStoreNames.contains(this.stores.settings)) {
            const settingsStore = db.createObjectStore(this.stores.settings, { keyPath: 'key' });
            settingsStore.createIndex('updatedAt', 'updatedAt');
        }
    }
    /**
     * Store topic data
     */
    async storeTopic(topic) {
        if (!this.db)
            return false;
        try {
            const transaction = this.db.transaction([this.stores.topics], 'readwrite');
            const store = transaction.objectStore(this.stores.topics);
            await this.promisifyRequest(store.put(topic));
            return true;
        }
        catch (error) {
            console.error('Failed to store topic:', error);
            return false;
        }
    }
    /**
     * Get topic by ID
     */
    async getTopic(topicId) {
        if (!this.db)
            return null;
        try {
            const transaction = this.db.transaction([this.stores.topics], 'readonly');
            const store = transaction.objectStore(this.stores.topics);
            const result = await this.promisifyRequest(store.get(topicId));
            return result || null;
        }
        catch (error) {
            console.error('Failed to get topic:', error);
            return null;
        }
    }
    /**
     * Get all topics
     */
    async getAllTopics() {
        if (!this.db)
            return [];
        try {
            const transaction = this.db.transaction([this.stores.topics], 'readonly');
            const store = transaction.objectStore(this.stores.topics);
            const result = await this.promisifyRequest(store.getAll());
            return result || [];
        }
        catch (error) {
            console.error('Failed to get all topics:', error);
            return [];
        }
    }
    /**
     * Store content
     */
    async storeContent(topicId, content, contentType = 'markdown', expiresInHours) {
        if (!this.db)
            return false;
        try {
            const offlineContent = {
                id: `${topicId}-${contentType}-${Date.now()}`,
                topicId,
                content,
                contentType,
                cachedAt: new Date(),
                expiresAt: expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : undefined,
                size: content.length
            };
            const transaction = this.db.transaction([this.stores.content], 'readwrite');
            const store = transaction.objectStore(this.stores.content);
            await this.promisifyRequest(store.put(offlineContent));
            return true;
        }
        catch (error) {
            console.error('Failed to store content:', error);
            return false;
        }
    }
    /**
     * Get content for topic
     */
    async getContent(topicId, contentType) {
        if (!this.db)
            return null;
        try {
            const transaction = this.db.transaction([this.stores.content], 'readonly');
            const store = transaction.objectStore(this.stores.content);
            const index = store.index('topicId');
            const results = await this.promisifyRequest(index.getAll(topicId));
            if (!results || results.length === 0)
                return null;
            // Filter by content type if specified
            let filteredResults = results;
            if (contentType) {
                filteredResults = results.filter(c => c.contentType === contentType);
            }
            if (filteredResults.length === 0)
                return null;
            // Get most recent non-expired content
            const validContent = filteredResults
                .filter(c => !c.expiresAt || c.expiresAt > new Date())
                .sort((a, b) => b.cachedAt.getTime() - a.cachedAt.getTime());
            return validContent[0]?.content || null;
        }
        catch (error) {
            console.error('Failed to get content:', error);
            return null;
        }
    }
    /**
     * Store user progress
     */
    async storeProgress(progress) {
        if (!this.db)
            return false;
        try {
            const transaction = this.db.transaction([this.stores.progress], 'readwrite');
            const store = transaction.objectStore(this.stores.progress);
            await this.promisifyRequest(store.put(progress));
            return true;
        }
        catch (error) {
            console.error('Failed to store progress:', error);
            return false;
        }
    }
    /**
     * Get user progress for topic
     */
    async getProgress(topicId, userId) {
        if (!this.db)
            return null;
        try {
            const transaction = this.db.transaction([this.stores.progress], 'readonly');
            const store = transaction.objectStore(this.stores.progress);
            const index = store.index('topicId');
            const results = await this.promisifyRequest(index.getAll(topicId));
            const userProgress = results?.find(p => p.userId === userId);
            return userProgress || null;
        }
        catch (error) {
            console.error('Failed to get progress:', error);
            return null;
        }
    }
    /**
     * Store chat thread
     */
    async storeThread(thread) {
        if (!this.db)
            return false;
        try {
            const transaction = this.db.transaction([this.stores.threads], 'readwrite');
            const store = transaction.objectStore(this.stores.threads);
            await this.promisifyRequest(store.put(thread));
            return true;
        }
        catch (error) {
            console.error('Failed to store thread:', error);
            return false;
        }
    }
    /**
     * Store chat message
     */
    async storeMessage(message) {
        if (!this.db)
            return false;
        try {
            const transaction = this.db.transaction([this.stores.messages], 'readwrite');
            const store = transaction.objectStore(this.stores.messages);
            await this.promisifyRequest(store.put(message));
            return true;
        }
        catch (error) {
            console.error('Failed to store message:', error);
            return false;
        }
    }
    /**
     * Get messages for thread
     */
    async getThreadMessages(threadId) {
        if (!this.db)
            return [];
        try {
            const transaction = this.db.transaction([this.stores.messages], 'readonly');
            const store = transaction.objectStore(this.stores.messages);
            const index = store.index('threadId');
            const results = await this.promisifyRequest(index.getAll(threadId));
            return results?.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) || [];
        }
        catch (error) {
            console.error('Failed to get thread messages:', error);
            return [];
        }
    }
    /**
     * Add offline action
     */
    async addOfflineAction(type, data) {
        if (!this.db)
            return false;
        try {
            const action = {
                id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type,
                data,
                timestamp: new Date(),
                synced: false,
                retryCount: 0
            };
            const transaction = this.db.transaction([this.stores.actions], 'readwrite');
            const store = transaction.objectStore(this.stores.actions);
            await this.promisifyRequest(store.put(action));
            return true;
        }
        catch (error) {
            console.error('Failed to add offline action:', error);
            return false;
        }
    }
    /**
     * Get pending offline actions
     */
    async getPendingActions() {
        if (!this.db)
            return [];
        try {
            const transaction = this.db.transaction([this.stores.actions], 'readonly');
            const store = transaction.objectStore(this.stores.actions);
            const index = store.index('synced');
            const results = await this.promisifyRequest(index.getAll(IDBKeyRange.only(false)));
            return results?.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()) || [];
        }
        catch (error) {
            console.error('Failed to get pending actions:', error);
            return [];
        }
    }
    /**
     * Mark action as synced
     */
    async markActionSynced(actionId) {
        if (!this.db)
            return false;
        try {
            const transaction = this.db.transaction([this.stores.actions], 'readwrite');
            const store = transaction.objectStore(this.stores.actions);
            const action = await this.promisifyRequest(store.get(actionId));
            if (action) {
                action.synced = true;
                await this.promisifyRequest(store.put(action));
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Failed to mark action as synced:', error);
            return false;
        }
    }
    /**
     * Store setting
     */
    async storeSetting(key, value) {
        if (!this.db)
            return false;
        try {
            const setting = {
                key,
                value,
                updatedAt: new Date()
            };
            const transaction = this.db.transaction([this.stores.settings], 'readwrite');
            const store = transaction.objectStore(this.stores.settings);
            await this.promisifyRequest(store.put(setting));
            return true;
        }
        catch (error) {
            console.error('Failed to store setting:', error);
            return false;
        }
    }
    /**
     * Get setting
     */
    async getSetting(key) {
        if (!this.db)
            return null;
        try {
            const transaction = this.db.transaction([this.stores.settings], 'readonly');
            const store = transaction.objectStore(this.stores.settings);
            const result = await this.promisifyRequest(store.get(key));
            return result?.value || null;
        }
        catch (error) {
            console.error('Failed to get setting:', error);
            return null;
        }
    }
    /**
     * Clear expired content
     */
    async clearExpiredContent() {
        if (!this.db)
            return 0;
        try {
            const transaction = this.db.transaction([this.stores.content], 'readwrite');
            const store = transaction.objectStore(this.stores.content);
            const index = store.index('expiresAt');
            const now = new Date();
            const results = await this.promisifyRequest(index.getAll(IDBKeyRange.upperBound(now)));
            if (!results)
                return 0;
            for (const content of results) {
                await this.promisifyRequest(store.delete(content.id));
            }
            return results.length;
        }
        catch (error) {
            console.error('Failed to clear expired content:', error);
            return 0;
        }
    }
    /**
     * Get storage statistics
     */
    async getStorageStats() {
        if (!this.db) {
            return {
                topics: 0,
                content: 0,
                progress: 0,
                threads: 0,
                messages: 0,
                pendingActions: 0,
                totalSize: 0
            };
        }
        try {
            const transaction = this.db.transaction(Object.values(this.stores), 'readonly');
            const counts = await Promise.all([
                this.promisifyRequest(transaction.objectStore(this.stores.topics).count()),
                this.promisifyRequest(transaction.objectStore(this.stores.content).count()),
                this.promisifyRequest(transaction.objectStore(this.stores.progress).count()),
                this.promisifyRequest(transaction.objectStore(this.stores.threads).count()),
                this.promisifyRequest(transaction.objectStore(this.stores.messages).count())
            ]);
            // Get pending actions count
            const actionsIndex = transaction.objectStore(this.stores.actions).index('synced');
            const pendingActions = await this.promisifyRequest(actionsIndex.count(IDBKeyRange.only(false)));
            // Calculate total content size
            const contentStore = transaction.objectStore(this.stores.content);
            const allContent = await this.promisifyRequest(contentStore.getAll());
            const totalSize = allContent?.reduce((sum, content) => sum + content.size, 0) || 0;
            return {
                topics: counts[0] || 0,
                content: counts[1] || 0,
                progress: counts[2] || 0,
                threads: counts[3] || 0,
                messages: counts[4] || 0,
                pendingActions: pendingActions || 0,
                totalSize
            };
        }
        catch (error) {
            console.error('Failed to get storage stats:', error);
            return {
                topics: 0,
                content: 0,
                progress: 0,
                threads: 0,
                messages: 0,
                pendingActions: 0,
                totalSize: 0
            };
        }
    }
    /**
     * Clear all data
     */
    async clearAllData() {
        if (!this.db)
            return false;
        try {
            const transaction = this.db.transaction(Object.values(this.stores), 'readwrite');
            await Promise.all(Object.values(this.stores).map(storeName => this.promisifyRequest(transaction.objectStore(storeName).clear())));
            return true;
        }
        catch (error) {
            console.error('Failed to clear all data:', error);
            return false;
        }
    }
    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
    /**
     * Helper to promisify IDBRequest
     */
    promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}
// Export singleton instance
export const offlineStorage = new OfflineStorageManager();
// Auto-initialize
offlineStorage.initialize().catch(console.error);
export default offlineStorage;
//# sourceMappingURL=offlineStorage.js.map