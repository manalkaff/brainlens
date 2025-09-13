/**
 * Shared State Manager for BrainLens
 * Manages synchronized state across multiple browser tabs
 */
interface StateMetadata {
    lastUpdated: Date;
    updatedBy: string;
    version: number;
    userId?: string;
    topicId?: string;
}
export declare class SharedStateManager {
    private state;
    private subscriptions;
    private subscriptionCounter;
    private readonly SYNC_KEYS;
    constructor();
    private initialize;
    /**
     * Set state value with automatic synchronization
     */
    setState<T>(key: string, value: T, options?: {
        userId?: string;
        topicId?: string;
        broadcast?: boolean;
        local?: boolean;
    }): void;
    /**
     * Get state value
     */
    getState<T>(key: string): T | undefined;
    /**
     * Get state with metadata
     */
    getStateWithMetadata<T>(key: string): {
        value: T;
        metadata: StateMetadata;
    } | undefined;
    /**
     * Subscribe to state changes
     */
    subscribe<T>(key: string, callback: (value: T, previousValue: T) => void): () => void;
    /**
     * Subscribe to multiple keys
     */
    subscribeToKeys<T>(keys: string[], callback: (updates: {
        [key: string]: T;
    }) => void): () => void;
    /**
     * Batch update multiple state values
     */
    batchUpdate(updates: {
        [key: string]: any;
    }, options?: {
        userId?: string;
        topicId?: string;
        broadcast?: boolean;
    }): void;
    /**
     * Clear state
     */
    clearState(key: string): void;
    /**
     * Clear all state
     */
    clearAllState(userId?: string): void;
    /**
     * Sync state from other tabs
     */
    syncFromOtherTabs(keys?: string[]): Promise<void>;
    /**
     * Get all state as plain object
     */
    getAllState(): {
        [key: string]: any;
    };
    /**
     * Get state filtered by user
     */
    getUserState(userId: string): {
        [key: string]: any;
    };
    /**
     * Get state filtered by topic
     */
    getTopicState(topicId: string): {
        [key: string]: any;
    };
    /**
     * Check if state exists
     */
    hasState(key: string): boolean;
    /**
     * Get state size (number of entries)
     */
    getStateSize(): number;
    /**
     * Get memory usage estimate
     */
    getMemoryUsage(): number;
    /**
     * Create a reactive state hook-like interface
     */
    createReactiveState<T>(key: string, initialValue?: T): {
        get: () => T | undefined;
        set: (value: T, options?: {
            userId?: string;
            topicId?: string;
        }) => void;
        subscribe: (callback: (value: T, previousValue: T) => void) => () => void;
        clear: () => void;
    };
    /**
     * Event handlers
     */
    private handleCrossTabUpdate;
    private handleSyncRequest;
    private handleGlobalAction;
    private handleLeaderElected;
    private notifySubscribers;
    private getCurrentUserId;
    /**
     * Utility methods for common state patterns
     */
    /**
     * Toggle boolean state
     */
    toggle(key: string, options?: {
        userId?: string;
        topicId?: string;
    }): boolean;
    /**
     * Increment numeric state
     */
    increment(key: string, amount?: number, options?: {
        userId?: string;
        topicId?: string;
    }): number;
    /**
     * Add item to array state
     */
    addToArray<T>(key: string, item: T, options?: {
        userId?: string;
        topicId?: string;
        unique?: boolean;
        maxLength?: number;
    }): T[];
    /**
     * Remove item from array state
     */
    removeFromArray<T>(key: string, predicate: (item: T) => boolean, options?: {
        userId?: string;
        topicId?: string;
    }): T[];
    /**
     * Update object state
     */
    updateObject<T extends Record<string, any>>(key: string, updates: Partial<T>, options?: {
        userId?: string;
        topicId?: string;
    }): T;
}
export declare const sharedState: SharedStateManager;
export default sharedState;
//# sourceMappingURL=sharedStateManager.d.ts.map