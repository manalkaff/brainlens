/**
 * Service Worker Manager for BrainLens
 * Handles SW registration, updates, and offline functionality
 */
interface ServiceWorkerConfig {
    scope?: string;
    updateInterval?: number;
    enableBackgroundSync?: boolean;
    enablePushNotifications?: boolean;
    cacheStrategy?: 'aggressive' | 'selective' | 'minimal';
}
interface CacheStats {
    [cacheName: string]: number;
}
interface OfflineCapabilities {
    isSupported: boolean;
    isOnline: boolean;
    isServiceWorkerRegistered: boolean;
    backgroundSyncSupported: boolean;
    pushNotificationsSupported: boolean;
    periodicSyncSupported: boolean;
}
export declare class ServiceWorkerManager {
    private registration;
    private config;
    private updateCheckInterval;
    private offlineStatusListeners;
    private installPromptListeners;
    constructor(config?: ServiceWorkerConfig);
    /**
     * Register the service worker
     */
    register(): Promise<boolean>;
    /**
     * Unregister the service worker
     */
    unregister(): Promise<boolean>;
    /**
     * Check for service worker updates
     */
    checkForUpdates(): Promise<boolean>;
    /**
     * Skip waiting and activate new service worker
     */
    skipWaiting(): Promise<void>;
    /**
     * Get offline capabilities
     */
    getOfflineCapabilities(): OfflineCapabilities;
    /**
     * Cache specific content
     */
    cacheContent(url: string, content: string): Promise<boolean>;
    /**
     * Get cache statistics
     */
    getCacheStats(): Promise<CacheStats>;
    /**
     * Clear cache
     */
    clearCache(cacheName?: string): Promise<boolean>;
    /**
     * Enable background sync
     */
    enableBackgroundSync(tag?: string): Promise<boolean>;
    /**
     * Request notification permission and enable push notifications
     */
    enablePushNotifications(): Promise<boolean>;
    /**
     * Add offline status listener
     */
    onOfflineStatusChange(listener: (isOnline: boolean) => void): () => void;
    /**
     * Add install prompt listener
     */
    onInstallPrompt(listener: (canInstall: boolean) => void): () => void;
    /**
     * Show install prompt (PWA)
     */
    showInstallPrompt(): Promise<boolean>;
    /**
     * Get estimated storage quota
     */
    getStorageEstimate(): Promise<StorageEstimate | null>;
    /**
     * Private methods
     */
    private setupEventListeners;
    private trackInstallProgress;
    private promptForUpdate;
    private startUpdateChecks;
    private notifyOfflineStatusListeners;
    private notifyInstallPromptListeners;
}
export declare const serviceWorkerManager: ServiceWorkerManager;
export default serviceWorkerManager;
//# sourceMappingURL=serviceWorkerManager.d.ts.map