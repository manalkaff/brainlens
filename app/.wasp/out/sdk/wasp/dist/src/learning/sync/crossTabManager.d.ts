/**
 * Cross-Tab Manager for BrainLens
 * Handles communication and state synchronization between multiple tabs
 */
interface TabState {
    tabId: string;
    isActive: boolean;
    lastActivity: Date;
    currentTopic: string | null;
    currentTab: string | null;
    userId: string | null;
    sessionId: string;
}
interface CrossTabMessage {
    id: string;
    type: string;
    source: string;
    target?: string;
    data: any;
    timestamp: Date;
    requiresResponse?: boolean;
}
type TabEventHandler = (message: CrossTabMessage) => void | Promise<void>;
export declare class CrossTabManager {
    private tabId;
    private sessionId;
    private isLeader;
    private activeTabs;
    private eventHandlers;
    private broadcastChannel;
    private sharedState;
    private userId;
    private readonly HEARTBEAT_INTERVAL;
    private readonly TAB_TIMEOUT;
    private readonly STORAGE_PREFIX;
    private heartbeatInterval;
    private cleanupInterval;
    constructor();
    /**
     * Initialize cross-tab communication
     */
    private initialize;
    /**
     * Register event handler
     */
    on(eventType: string, handler: TabEventHandler): () => void;
    /**
     * Send message to other tabs
     */
    sendMessage(type: string, data: any, target?: string, requiresResponse?: boolean): Promise<CrossTabMessage | null>;
    /**
     * Broadcast state update
     */
    broadcastStateUpdate(key: string, value: any, userId?: string, topicId?: string): Promise<void>;
    /**
     * Get shared state
     */
    getSharedState(key: string): any;
    /**
     * Set user ID
     */
    setUserId(userId: string): void;
    /**
     * Update current topic
     */
    setCurrentTopic(topicId: string | null): void;
    /**
     * Update current tab
     */
    setCurrentTab(tabName: string): void;
    /**
     * Get active tabs count
     */
    getActiveTabsCount(): number;
    /**
     * Get all active tabs
     */
    getActiveTabs(): TabState[];
    /**
     * Check if this tab is the leader
     */
    isTabLeader(): boolean;
    /**
     * Sync specific data across tabs
     */
    syncData(keys: string[], userId?: string): Promise<void>;
    /**
     * Execute action across all tabs
     */
    executeGlobalAction(action: string, payload: any, userId?: string): Promise<void>;
    /**
     * Private methods
     */
    private generateTabId;
    private generateMessageId;
    private getSessionId;
    private registerTab;
    private updateTabState;
    private saveTabState;
    private loadExistingTabs;
    private handleBroadcastMessage;
    private handleStorageMessage;
    private sendViaStorage;
    private processMessage;
    private handleStateUpdate;
    private handleAction;
    private handleSyncRequest;
    private waitForResponse;
    private electLeader;
    private startHeartbeat;
    private startCleanupTask;
    private cleanupInactiveTabs;
    private handleVisibilityChange;
    private emitEvent;
    private cleanup;
}
export declare const crossTabManager: CrossTabManager;
export default crossTabManager;
//# sourceMappingURL=crossTabManager.d.ts.map