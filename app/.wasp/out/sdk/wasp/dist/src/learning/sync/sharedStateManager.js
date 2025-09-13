/**
 * Shared State Manager for BrainLens
 * Manages synchronized state across multiple browser tabs
 */
import { crossTabManager } from './crossTabManager';
export class SharedStateManager {
    state = new Map();
    subscriptions = new Map();
    subscriptionCounter = 0;
    SYNC_KEYS = [
        'currentTopic',
        'currentTab',
        'selectedTopicId',
        'sidebarCollapsed',
        'userPreferences',
        'bookmarks',
        'progress',
        'recentTopics',
        'chatThreads',
        'searchHistory'
    ];
    constructor() {
        this.initialize();
    }
    initialize() {
        // Listen for cross-tab state updates
        crossTabManager.on('state_update', this.handleCrossTabUpdate.bind(this));
        // Listen for sync requests
        crossTabManager.on('sync_request', this.handleSyncRequest.bind(this));
        // Listen for global actions
        crossTabManager.on('global_action', this.handleGlobalAction.bind(this));
        // Initial sync when tab becomes leader
        crossTabManager.on('leader_elected', this.handleLeaderElected.bind(this));
        console.log('[SharedState] Manager initialized');
    }
    /**
     * Set state value with automatic synchronization
     */
    setState(key, value, options) {
        const previousValue = this.state.get(key)?.value;
        const { userId, topicId, broadcast = true, local = false } = options || {};
        // Update local state
        const metadata = {
            lastUpdated: new Date(),
            updatedBy: crossTabManager['tabId'], // Access private property
            version: (this.state.get(key)?.metadata.version || 0) + 1,
            userId,
            topicId
        };
        this.state.set(key, { value, metadata });
        // Notify local subscribers
        this.notifySubscribers(key, value, previousValue);
        // Broadcast to other tabs if not local-only
        if (!local && broadcast && this.SYNC_KEYS.includes(key)) {
            crossTabManager.broadcastStateUpdate(key, value, userId, topicId);
        }
    }
    /**
     * Get state value
     */
    getState(key) {
        return this.state.get(key)?.value;
    }
    /**
     * Get state with metadata
     */
    getStateWithMetadata(key) {
        const entry = this.state.get(key);
        return entry ? { value: entry.value, metadata: entry.metadata } : undefined;
    }
    /**
     * Subscribe to state changes
     */
    subscribe(key, callback) {
        const subscriptionId = `sub_${++this.subscriptionCounter}`;
        const subscription = {
            id: subscriptionId,
            key,
            callback
        };
        if (!this.subscriptions.has(key)) {
            this.subscriptions.set(key, []);
        }
        this.subscriptions.get(key).push(subscription);
        // Return unsubscribe function
        return () => {
            const subscriptions = this.subscriptions.get(key);
            if (subscriptions) {
                const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
                if (index > -1) {
                    subscriptions.splice(index, 1);
                }
            }
        };
    }
    /**
     * Subscribe to multiple keys
     */
    subscribeToKeys(keys, callback) {
        const unsubscribeFunctions = keys.map(key => this.subscribe(key, (value, previousValue) => {
            callback({ [key]: value });
        }));
        return () => {
            unsubscribeFunctions.forEach(unsub => unsub());
        };
    }
    /**
     * Batch update multiple state values
     */
    batchUpdate(updates, options) {
        const { userId, topicId, broadcast = true } = options || {};
        Object.entries(updates).forEach(([key, value]) => {
            this.setState(key, value, { userId, topicId, broadcast: false });
        });
        // Single broadcast for all updates
        if (broadcast) {
            Object.entries(updates).forEach(([key, value]) => {
                if (this.SYNC_KEYS.includes(key)) {
                    crossTabManager.broadcastStateUpdate(key, value, userId, topicId);
                }
            });
        }
    }
    /**
     * Clear state
     */
    clearState(key) {
        const previousValue = this.state.get(key)?.value;
        this.state.delete(key);
        this.notifySubscribers(key, undefined, previousValue);
        if (this.SYNC_KEYS.includes(key)) {
            crossTabManager.broadcastStateUpdate(key, undefined);
        }
    }
    /**
     * Clear all state
     */
    clearAllState(userId) {
        const keysToDelete = Array.from(this.state.keys()).filter(key => {
            if (!userId)
                return true;
            return this.state.get(key)?.metadata.userId === userId;
        });
        keysToDelete.forEach(key => {
            const previousValue = this.state.get(key)?.value;
            this.state.delete(key);
            this.notifySubscribers(key, undefined, previousValue);
        });
        // Broadcast clear action
        crossTabManager.executeGlobalAction('clear_state', { userId });
    }
    /**
     * Sync state from other tabs
     */
    async syncFromOtherTabs(keys) {
        const keysToSync = keys || this.SYNC_KEYS;
        await crossTabManager.syncData(keysToSync);
    }
    /**
     * Get all state as plain object
     */
    getAllState() {
        const result = {};
        this.state.forEach((entry, key) => {
            result[key] = entry.value;
        });
        return result;
    }
    /**
     * Get state filtered by user
     */
    getUserState(userId) {
        const result = {};
        this.state.forEach((entry, key) => {
            if (!entry.metadata.userId || entry.metadata.userId === userId) {
                result[key] = entry.value;
            }
        });
        return result;
    }
    /**
     * Get state filtered by topic
     */
    getTopicState(topicId) {
        const result = {};
        this.state.forEach((entry, key) => {
            if (entry.metadata.topicId === topicId) {
                result[key] = entry.value;
            }
        });
        return result;
    }
    /**
     * Check if state exists
     */
    hasState(key) {
        return this.state.has(key);
    }
    /**
     * Get state size (number of entries)
     */
    getStateSize() {
        return this.state.size;
    }
    /**
     * Get memory usage estimate
     */
    getMemoryUsage() {
        let totalSize = 0;
        this.state.forEach((entry) => {
            try {
                totalSize += JSON.stringify(entry).length * 2; // Rough estimate
            }
            catch (error) {
                // Skip circular references
            }
        });
        return totalSize;
    }
    /**
     * Create a reactive state hook-like interface
     */
    createReactiveState(key, initialValue) {
        return {
            get: () => this.getState(key) ?? initialValue,
            set: (value, options) => this.setState(key, value, options),
            subscribe: (callback) => this.subscribe(key, callback),
            clear: () => this.clearState(key)
        };
    }
    /**
     * Event handlers
     */
    handleCrossTabUpdate(message) {
        const { data } = message;
        const { key, value, userId, topicId } = data;
        // Check if we should apply this update
        if (userId && userId !== this.getCurrentUserId()) {
            return;
        }
        const previousValue = this.state.get(key)?.value;
        // Update local state without broadcasting
        const metadata = {
            lastUpdated: new Date(),
            updatedBy: message.source,
            version: (this.state.get(key)?.metadata.version || 0) + 1,
            userId,
            topicId
        };
        this.state.set(key, { value, metadata });
        // Notify local subscribers
        this.notifySubscribers(key, value, previousValue);
    }
    handleSyncRequest(message) {
        const { data } = message;
        const { keys, userId } = data;
        // Only respond if we're the leader
        if (!crossTabManager.isTabLeader()) {
            return;
        }
        const syncData = {};
        keys.forEach((key) => {
            const entry = this.state.get(key);
            if (entry && (!userId || !entry.metadata.userId || entry.metadata.userId === userId)) {
                syncData[key] = {
                    value: entry.value,
                    metadata: entry.metadata
                };
            }
        });
        // Send sync response
        crossTabManager.sendMessage('sync_response', {
            originalMessageId: message.id,
            syncData
        }, message.source);
    }
    handleGlobalAction(message) {
        const { data } = message;
        const { action, payload } = data;
        switch (action) {
            case 'clear_state':
                if (payload.userId) {
                    this.clearAllState(payload.userId);
                }
                break;
            case 'refresh_state':
                this.syncFromOtherTabs();
                break;
            case 'reset_state':
                this.state.clear();
                // Notify all subscribers
                this.subscriptions.forEach((subscriptions, key) => {
                    subscriptions.forEach(sub => {
                        try {
                            sub.callback(undefined, undefined);
                        }
                        catch (error) {
                            console.error('Subscription callback error:', error);
                        }
                    });
                });
                break;
        }
    }
    handleLeaderElected() {
        // As the new leader, we might want to broadcast our state
        // or perform leader-specific initialization
        console.log('[SharedState] Became tab leader');
    }
    notifySubscribers(key, value, previousValue) {
        const subscriptions = this.subscriptions.get(key);
        if (!subscriptions)
            return;
        subscriptions.forEach(subscription => {
            try {
                subscription.callback(value, previousValue);
            }
            catch (error) {
                console.error('State subscription callback error:', error);
            }
        });
    }
    getCurrentUserId() {
        // This would be implemented based on your auth system
        // For now, return null to accept all updates
        return null;
    }
    /**
     * Utility methods for common state patterns
     */
    /**
     * Toggle boolean state
     */
    toggle(key, options) {
        const currentValue = this.getState(key) ?? false;
        const newValue = !currentValue;
        this.setState(key, newValue, options);
        return newValue;
    }
    /**
     * Increment numeric state
     */
    increment(key, amount = 1, options) {
        const currentValue = this.getState(key) ?? 0;
        const newValue = currentValue + amount;
        this.setState(key, newValue, options);
        return newValue;
    }
    /**
     * Add item to array state
     */
    addToArray(key, item, options) {
        const { unique = false, maxLength, ...stateOptions } = options || {};
        const currentArray = this.getState(key) ?? [];
        let newArray = [...currentArray];
        if (unique && newArray.some(existing => JSON.stringify(existing) === JSON.stringify(item))) {
            return newArray; // Item already exists
        }
        newArray.push(item);
        if (maxLength && newArray.length > maxLength) {
            newArray = newArray.slice(-maxLength);
        }
        this.setState(key, newArray, stateOptions);
        return newArray;
    }
    /**
     * Remove item from array state
     */
    removeFromArray(key, predicate, options) {
        const currentArray = this.getState(key) ?? [];
        const newArray = currentArray.filter(item => !predicate(item));
        this.setState(key, newArray, options);
        return newArray;
    }
    /**
     * Update object state
     */
    updateObject(key, updates, options) {
        const currentObject = this.getState(key) ?? {};
        const newObject = { ...currentObject, ...updates };
        this.setState(key, newObject, options);
        return newObject;
    }
}
// Export singleton instance
export const sharedState = new SharedStateManager();
export default sharedState;
//# sourceMappingURL=sharedStateManager.js.map