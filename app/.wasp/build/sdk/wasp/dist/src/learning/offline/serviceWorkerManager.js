/**
 * Service Worker Manager for BrainLens
 * Handles SW registration, updates, and offline functionality
 */
export class ServiceWorkerManager {
    registration = null;
    config;
    updateCheckInterval = null;
    offlineStatusListeners = [];
    installPromptListeners = [];
    constructor(config = {}) {
        this.config = {
            scope: '/',
            updateInterval: 60000, // 1 minute
            enableBackgroundSync: true,
            enablePushNotifications: false,
            cacheStrategy: 'selective',
            ...config
        };
        this.setupEventListeners();
    }
    /**
     * Register the service worker
     */
    async register() {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Worker not supported');
            return false;
        }
        try {
            this.registration = await navigator.serviceWorker.register('/sw.js', {
                scope: this.config.scope
            });
            console.log('Service Worker registered:', this.registration);
            // Handle different states
            if (this.registration.installing) {
                console.log('Service Worker installing...');
                this.trackInstallProgress(this.registration.installing);
            }
            else if (this.registration.waiting) {
                console.log('Service Worker waiting...');
                this.promptForUpdate();
            }
            else if (this.registration.active) {
                console.log('Service Worker active');
                this.startUpdateChecks();
            }
            // Listen for updates
            this.registration.addEventListener('updatefound', () => {
                console.log('Service Worker update found');
                if (this.registration?.installing) {
                    this.trackInstallProgress(this.registration.installing);
                }
            });
            return true;
        }
        catch (error) {
            console.error('Service Worker registration failed:', error);
            return false;
        }
    }
    /**
     * Unregister the service worker
     */
    async unregister() {
        if (!this.registration)
            return false;
        try {
            const result = await this.registration.unregister();
            if (this.updateCheckInterval) {
                clearInterval(this.updateCheckInterval);
            }
            this.registration = null;
            console.log('Service Worker unregistered');
            return result;
        }
        catch (error) {
            console.error('Service Worker unregistration failed:', error);
            return false;
        }
    }
    /**
     * Check for service worker updates
     */
    async checkForUpdates() {
        if (!this.registration)
            return false;
        try {
            await this.registration.update();
            return true;
        }
        catch (error) {
            console.error('Service Worker update check failed:', error);
            return false;
        }
    }
    /**
     * Skip waiting and activate new service worker
     */
    async skipWaiting() {
        if (!this.registration?.waiting)
            return;
        // Send skip waiting message
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        // Reload page after activation
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        }, { once: true });
    }
    /**
     * Get offline capabilities
     */
    getOfflineCapabilities() {
        return {
            isSupported: 'serviceWorker' in navigator,
            isOnline: navigator.onLine,
            isServiceWorkerRegistered: !!this.registration,
            backgroundSyncSupported: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
            pushNotificationsSupported: 'serviceWorker' in navigator && 'PushManager' in window,
            periodicSyncSupported: 'serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype
        };
    }
    /**
     * Cache specific content
     */
    async cacheContent(url, content) {
        if (!this.registration?.active)
            return false;
        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.success);
            };
            this.registration.active.postMessage({
                type: 'CACHE_CONTENT',
                data: { url, content }
            }, [messageChannel.port2]);
        });
    }
    /**
     * Get cache statistics
     */
    async getCacheStats() {
        if (!this.registration?.active)
            return {};
        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data);
            };
            this.registration.active.postMessage({
                type: 'GET_CACHE_STATS'
            }, [messageChannel.port2]);
        });
    }
    /**
     * Clear cache
     */
    async clearCache(cacheName) {
        if (!this.registration?.active)
            return false;
        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.success);
            };
            this.registration.active.postMessage({
                type: 'CLEAR_CACHE',
                data: { cacheName }
            }, [messageChannel.port2]);
        });
    }
    /**
     * Enable background sync
     */
    async enableBackgroundSync(tag = 'offline-actions') {
        if (!this.registration)
            return false;
        try {
            // @ts-ignore - Background sync is experimental
            await this.registration.sync.register(tag);
            return true;
        }
        catch (error) {
            console.error('Background sync registration failed:', error);
            return false;
        }
    }
    /**
     * Request notification permission and enable push notifications
     */
    async enablePushNotifications() {
        if (!('Notification' in window) || !this.registration)
            return false;
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('Notification permission denied');
                return false;
            }
            // Subscribe to push notifications (would need VAPID keys)
            // const subscription = await this.registration.pushManager.subscribe({
            //   userVisibleOnly: true,
            //   applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
            // });
            console.log('Push notifications enabled');
            return true;
        }
        catch (error) {
            console.error('Push notification setup failed:', error);
            return false;
        }
    }
    /**
     * Add offline status listener
     */
    onOfflineStatusChange(listener) {
        this.offlineStatusListeners.push(listener);
        // Return unsubscribe function
        return () => {
            const index = this.offlineStatusListeners.indexOf(listener);
            if (index > -1) {
                this.offlineStatusListeners.splice(index, 1);
            }
        };
    }
    /**
     * Add install prompt listener
     */
    onInstallPrompt(listener) {
        this.installPromptListeners.push(listener);
        return () => {
            const index = this.installPromptListeners.indexOf(listener);
            if (index > -1) {
                this.installPromptListeners.splice(index, 1);
            }
        };
    }
    /**
     * Show install prompt (PWA)
     */
    async showInstallPrompt() {
        // @ts-ignore - beforeinstallprompt is not in types yet
        const installPrompt = window.deferredPrompt;
        if (!installPrompt)
            return false;
        try {
            installPrompt.prompt();
            const result = await installPrompt.userChoice;
            // @ts-ignore
            window.deferredPrompt = null;
            return result.outcome === 'accepted';
        }
        catch (error) {
            console.error('Install prompt failed:', error);
            return false;
        }
    }
    /**
     * Get estimated storage quota
     */
    async getStorageEstimate() {
        if (!('storage' in navigator && 'estimate' in navigator.storage)) {
            return null;
        }
        try {
            return await navigator.storage.estimate();
        }
        catch (error) {
            console.error('Storage estimate failed:', error);
            return null;
        }
    }
    /**
     * Private methods
     */
    setupEventListeners() {
        // Online/offline events
        window.addEventListener('online', () => {
            console.log('App came online');
            this.notifyOfflineStatusListeners(true);
        });
        window.addEventListener('offline', () => {
            console.log('App went offline');
            this.notifyOfflineStatusListeners(false);
        });
        // PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            // @ts-ignore
            window.deferredPrompt = e;
            this.notifyInstallPromptListeners(true);
        });
        // PWA installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed');
            // @ts-ignore
            window.deferredPrompt = null;
            this.notifyInstallPromptListeners(false);
        });
    }
    trackInstallProgress(worker) {
        worker.addEventListener('statechange', () => {
            console.log('Service Worker state changed:', worker.state);
            if (worker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                    // New service worker installed, show update prompt
                    this.promptForUpdate();
                }
                else {
                    // First installation
                    console.log('Service Worker installed for first time');
                    this.startUpdateChecks();
                }
            }
            else if (worker.state === 'activated') {
                console.log('Service Worker activated');
            }
        });
    }
    promptForUpdate() {
        // This could show a toast or modal to the user
        console.log('New version available, reload to update');
        // For now, we'll auto-update after a short delay
        setTimeout(() => {
            this.skipWaiting();
        }, 3000);
    }
    startUpdateChecks() {
        if (this.updateCheckInterval)
            return;
        this.updateCheckInterval = setInterval(() => {
            this.checkForUpdates();
        }, this.config.updateInterval);
    }
    notifyOfflineStatusListeners(isOnline) {
        this.offlineStatusListeners.forEach(listener => {
            try {
                listener(isOnline);
            }
            catch (error) {
                console.error('Offline status listener error:', error);
            }
        });
    }
    notifyInstallPromptListeners(canInstall) {
        this.installPromptListeners.forEach(listener => {
            try {
                listener(canInstall);
            }
            catch (error) {
                console.error('Install prompt listener error:', error);
            }
        });
    }
}
// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();
// Auto-register when module is imported (in production)
if (process.env.NODE_ENV === 'production') {
    serviceWorkerManager.register().catch(console.error);
}
export default serviceWorkerManager;
//# sourceMappingURL=serviceWorkerManager.js.map