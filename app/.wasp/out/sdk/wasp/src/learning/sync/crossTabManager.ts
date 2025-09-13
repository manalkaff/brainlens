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
  target?: string; // Specific tab ID or 'broadcast'
  data: any;
  timestamp: Date;
  requiresResponse?: boolean;
}

interface StateUpdateMessage extends CrossTabMessage {
  type: 'state_update';
  data: {
    key: string;
    value: any;
    userId?: string;
    topicId?: string;
  };
}

interface ActionMessage extends CrossTabMessage {
  type: 'action';
  data: {
    action: string;
    payload: any;
    userId?: string;
  };
}

interface SyncRequestMessage extends CrossTabMessage {
  type: 'sync_request';
  data: {
    keys: string[];
    userId?: string;
  };
}

type TabEventHandler = (message: CrossTabMessage) => void | Promise<void>;

export class CrossTabManager {
  private tabId: string;
  private sessionId: string;
  private isLeader: boolean = false;
  private activeTabs: Map<string, TabState> = new Map();
  private eventHandlers: Map<string, TabEventHandler[]> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private sharedState: Map<string, any> = new Map();
  private userId: string | null = null;
  
  private readonly HEARTBEAT_INTERVAL = 5000; // 5 seconds
  private readonly TAB_TIMEOUT = 15000; // 15 seconds
  private readonly STORAGE_PREFIX = 'brainlens_tab_';
  
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.tabId = this.generateTabId();
    this.sessionId = this.getSessionId();
    this.initialize();
  }

  /**
   * Initialize cross-tab communication
   */
  private initialize(): void {
    // Setup BroadcastChannel if supported
    if ('BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('brainlens-tabs');
      this.broadcastChannel.addEventListener('message', this.handleBroadcastMessage.bind(this));
    }

    // Fallback to localStorage events
    window.addEventListener('storage', this.handleStorageMessage.bind(this));
    
    // Page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Window focus/blur
    window.addEventListener('focus', () => this.updateTabState({ isActive: true }));
    window.addEventListener('blur', () => this.updateTabState({ isActive: false }));
    
    // Before unload cleanup
    window.addEventListener('beforeunload', this.cleanup.bind(this));

    // Register this tab
    this.registerTab();
    
    // Start background tasks
    this.startHeartbeat();
    this.startCleanupTask();
    
    // Determine leadership
    this.electLeader();

    console.log(`[CrossTab] Tab ${this.tabId} initialized`);
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: TabEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Send message to other tabs
   */
  async sendMessage(
    type: string, 
    data: any, 
    target: string = 'broadcast',
    requiresResponse: boolean = false
  ): Promise<CrossTabMessage | null> {
    const message: CrossTabMessage = {
      id: this.generateMessageId(),
      type,
      source: this.tabId,
      target,
      data,
      timestamp: new Date(),
      requiresResponse
    };

    // Send via BroadcastChannel first
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(message);
    }
    
    // Fallback to localStorage
    this.sendViaStorage(message);
    
    // If response required, wait for it
    if (requiresResponse) {
      return this.waitForResponse(message.id);
    }
    
    return null;
  }

  /**
   * Broadcast state update
   */
  async broadcastStateUpdate(key: string, value: any, userId?: string, topicId?: string): Promise<void> {
    // Update local state
    this.sharedState.set(key, value);
    
    // Broadcast to other tabs
    const message: StateUpdateMessage = {
      id: this.generateMessageId(),
      type: 'state_update',
      source: this.tabId,
      target: 'broadcast',
      data: { key, value, userId, topicId },
      timestamp: new Date()
    };

    await this.sendMessage('state_update', message.data);
  }

  /**
   * Get shared state
   */
  getSharedState(key: string): any {
    return this.sharedState.get(key);
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
    this.updateTabState({ userId });
  }

  /**
   * Update current topic
   */
  setCurrentTopic(topicId: string | null): void {
    this.updateTabState({ currentTopic: topicId });
    this.broadcastStateUpdate('currentTopic', topicId, this.userId || undefined);
  }

  /**
   * Update current tab
   */
  setCurrentTab(tabName: string): void {
    this.updateTabState({ currentTab: tabName });
    this.broadcastStateUpdate('currentTab', tabName, this.userId || undefined);
  }

  /**
   * Get active tabs count
   */
  getActiveTabsCount(): number {
    return Array.from(this.activeTabs.values()).filter(tab => tab.isActive).length;
  }

  /**
   * Get all active tabs
   */
  getActiveTabs(): TabState[] {
    return Array.from(this.activeTabs.values()).filter(tab => tab.isActive);
  }

  /**
   * Check if this tab is the leader
   */
  isTabLeader(): boolean {
    return this.isLeader;
  }

  /**
   * Sync specific data across tabs
   */
  async syncData(keys: string[], userId?: string): Promise<void> {
    const message: SyncRequestMessage = {
      id: this.generateMessageId(),
      type: 'sync_request',
      source: this.tabId,
      target: 'broadcast',
      data: { keys, userId },
      timestamp: new Date(),
      requiresResponse: true
    };

    await this.sendMessage('sync_request', message.data, 'broadcast', true);
  }

  /**
   * Execute action across all tabs
   */
  async executeGlobalAction(action: string, payload: any, userId?: string): Promise<void> {
    const message: ActionMessage = {
      id: this.generateMessageId(),
      type: 'action',
      source: this.tabId,
      target: 'broadcast',
      data: { action, payload, userId },
      timestamp: new Date()
    };

    await this.sendMessage('action', message.data);
  }

  /**
   * Private methods
   */
  private generateTabId(): string {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('brainlens_session_id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('brainlens_session_id', sessionId);
    }
    return sessionId;
  }

  private registerTab(): void {
    const tabState: TabState = {
      tabId: this.tabId,
      isActive: !document.hidden,
      lastActivity: new Date(),
      currentTopic: null,
      currentTab: null,
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.activeTabs.set(this.tabId, tabState);
    this.saveTabState(tabState);
    
    // Load existing tabs from localStorage
    this.loadExistingTabs();
  }

  private updateTabState(updates: Partial<TabState>): void {
    const currentState = this.activeTabs.get(this.tabId);
    if (!currentState) return;

    const updatedState = {
      ...currentState,
      ...updates,
      lastActivity: new Date()
    };

    this.activeTabs.set(this.tabId, updatedState);
    this.saveTabState(updatedState);
  }

  private saveTabState(tabState: TabState): void {
    localStorage.setItem(
      `${this.STORAGE_PREFIX}${this.tabId}`,
      JSON.stringify({
        ...tabState,
        lastActivity: tabState.lastActivity.toISOString()
      })
    );
  }

  private loadExistingTabs(): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key)!);
          const tabState: TabState = {
            ...data,
            lastActivity: new Date(data.lastActivity)
          };

          // Only add if not expired
          if (Date.now() - tabState.lastActivity.getTime() < this.TAB_TIMEOUT) {
            this.activeTabs.set(tabState.tabId, tabState);
          } else {
            localStorage.removeItem(key);
          }
        } catch (error) {
          console.error('Failed to load tab state:', error);
          localStorage.removeItem(key);
        }
      }
    }
  }

  private handleBroadcastMessage(event: MessageEvent<CrossTabMessage>): void {
    const message = event.data;
    
    // Don't handle our own messages
    if (message.source === this.tabId) return;
    
    // Check if message is targeted to us
    if (message.target && message.target !== 'broadcast' && message.target !== this.tabId) {
      return;
    }

    this.processMessage(message);
  }

  private handleStorageMessage(event: StorageEvent): void {
    if (!event.key) return;

    // Handle tab state changes
    if (event.key.startsWith(this.STORAGE_PREFIX)) {
      const tabId = event.key.replace(this.STORAGE_PREFIX, '');
      
      if (event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          const tabState: TabState = {
            ...data,
            lastActivity: new Date(data.lastActivity)
          };
          this.activeTabs.set(tabId, tabState);
        } catch (error) {
          console.error('Failed to parse tab state:', error);
        }
      } else {
        // Tab removed
        this.activeTabs.delete(tabId);
      }
      
      // Re-elect leader if needed
      this.electLeader();
      return;
    }

    // Handle cross-tab messages via localStorage
    if (event.key === 'brainlens_cross_tab_message' && event.newValue) {
      try {
        const message: CrossTabMessage = JSON.parse(event.newValue);
        
        // Don't handle our own messages
        if (message.source === this.tabId) return;
        
        this.processMessage(message);
      } catch (error) {
        console.error('Failed to parse cross-tab message:', error);
      }
    }
  }

  private sendViaStorage(message: CrossTabMessage): void {
    localStorage.setItem('brainlens_cross_tab_message', JSON.stringify(message));
    
    // Clear the message after a short delay to avoid conflicts
    setTimeout(() => {
      if (localStorage.getItem('brainlens_cross_tab_message') === JSON.stringify(message)) {
        localStorage.removeItem('brainlens_cross_tab_message');
      }
    }, 100);
  }

  private async processMessage(message: CrossTabMessage): Promise<void> {
    // Update tab activity
    if (this.activeTabs.has(message.source)) {
      const tabState = this.activeTabs.get(message.source)!;
      tabState.lastActivity = new Date();
      this.activeTabs.set(message.source, tabState);
    }

    // Process specific message types
    switch (message.type) {
      case 'state_update':
        this.handleStateUpdate(message as StateUpdateMessage);
        break;
      case 'action':
        this.handleAction(message as ActionMessage);
        break;
      case 'sync_request':
        this.handleSyncRequest(message as SyncRequestMessage);
        break;
    }

    // Notify event handlers
    const handlers = this.eventHandlers.get(message.type) || [];
    await Promise.all(handlers.map(handler => handler(message)));
  }

  private handleStateUpdate(message: StateUpdateMessage): void {
    const { key, value, userId, topicId } = message.data;
    
    // Only apply if it's for our user or global
    if (!userId || userId === this.userId) {
      this.sharedState.set(key, value);
    }
  }

  private handleAction(message: ActionMessage): void {
    const { action, payload, userId } = message.data;
    
    // Only process if it's for our user or global
    if (!userId || userId === this.userId) {
      // Emit action event
      this.emitEvent('global_action', { action, payload });
    }
  }

  private handleSyncRequest(message: SyncRequestMessage): void {
    const { keys, userId } = message.data;
    
    // Only respond if we're the leader and it's for our user
    if (this.isLeader && (!userId || userId === this.userId)) {
      const syncData: { [key: string]: any } = {};
      
      keys.forEach(key => {
        if (this.sharedState.has(key)) {
          syncData[key] = this.sharedState.get(key);
        }
      });
      
      // Send response
      this.sendMessage('sync_response', syncData, message.source);
    }
  }

  private async waitForResponse(messageId: string, timeout: number = 5000): Promise<CrossTabMessage | null> {
    return new Promise((resolve) => {
      const responseHandler = (message: CrossTabMessage) => {
        if (message.type === 'sync_response' && message.data?.originalMessageId === messageId) {
          cleanup();
          resolve(message);
        }
      };

      const cleanup = this.on('sync_response', responseHandler);
      
      setTimeout(() => {
        cleanup();
        resolve(null);
      }, timeout);
    });
  }

  private electLeader(): void {
    const activeTabs = Array.from(this.activeTabs.values())
      .filter(tab => Date.now() - tab.lastActivity.getTime() < this.TAB_TIMEOUT)
      .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime());

    const wasLeader = this.isLeader;
    this.isLeader = activeTabs.length > 0 && activeTabs[0].tabId === this.tabId;

    if (this.isLeader && !wasLeader) {
      console.log(`[CrossTab] Tab ${this.tabId} elected as leader`);
      this.emitEvent('leader_elected', { tabId: this.tabId });
    } else if (!this.isLeader && wasLeader) {
      console.log(`[CrossTab] Tab ${this.tabId} no longer leader`);
      this.emitEvent('leader_lost', { tabId: this.tabId });
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.updateTabState({ isActive: !document.hidden });
    }, this.HEARTBEAT_INTERVAL);
  }

  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveTabs();
      this.electLeader();
    }, this.TAB_TIMEOUT);
  }

  private cleanupInactiveTabs(): void {
    const now = Date.now();
    const inactiveTabs: string[] = [];

    this.activeTabs.forEach((tabState, tabId) => {
      if (now - tabState.lastActivity.getTime() > this.TAB_TIMEOUT) {
        inactiveTabs.push(tabId);
      }
    });

    inactiveTabs.forEach(tabId => {
      this.activeTabs.delete(tabId);
      localStorage.removeItem(`${this.STORAGE_PREFIX}${tabId}`);
    });

    if (inactiveTabs.length > 0) {
      console.log(`[CrossTab] Cleaned up ${inactiveTabs.length} inactive tabs`);
    }
  }

  private handleVisibilityChange(): void {
    this.updateTabState({ isActive: !document.hidden });
  }

  private emitEvent(type: string, data: any): void {
    const handlers = this.eventHandlers.get(type) || [];
    handlers.forEach(handler => {
      try {
        handler({
          id: this.generateMessageId(),
          type,
          source: this.tabId,
          data,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Event handler error:', error);
      }
    });
  }

  private cleanup(): void {
    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Remove tab state
    localStorage.removeItem(`${this.STORAGE_PREFIX}${this.tabId}`);
    
    // Close broadcast channel
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    
    console.log(`[CrossTab] Tab ${this.tabId} cleaned up`);
  }
}

// Export singleton instance
export const crossTabManager = new CrossTabManager();

export default crossTabManager;