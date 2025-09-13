import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { WifiOff, Wifi, HardDrive, RefreshCw, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { serviceWorkerManager } from '../../offline/serviceWorkerManager';
export function OfflineIndicator({ className = '', showDetails = false, onToggleDetails }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [capabilities, setCapabilities] = useState(serviceWorkerManager.getOfflineCapabilities());
    const [cacheStats, setCacheStats] = useState({});
    const [storageEstimate, setStorageEstimate] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    useEffect(() => {
        // Subscribe to offline status changes
        const unsubscribe = serviceWorkerManager.onOfflineStatusChange(setIsOnline);
        // Update capabilities periodically
        const updateCapabilities = () => {
            setCapabilities(serviceWorkerManager.getOfflineCapabilities());
        };
        const interval = setInterval(updateCapabilities, 5000);
        updateCapabilities();
        // Load initial data
        loadCacheStats();
        loadStorageEstimate();
        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);
    const loadCacheStats = async () => {
        try {
            const stats = await serviceWorkerManager.getCacheStats();
            setCacheStats(stats);
        }
        catch (error) {
            console.error('Failed to load cache stats:', error);
        }
    };
    const loadStorageEstimate = async () => {
        try {
            const estimate = await serviceWorkerManager.getStorageEstimate();
            setStorageEstimate(estimate);
        }
        catch (error) {
            console.error('Failed to load storage estimate:', error);
        }
    };
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await serviceWorkerManager.checkForUpdates();
            await loadCacheStats();
            await loadStorageEstimate();
        }
        catch (error) {
            console.error('Refresh failed:', error);
        }
        finally {
            setIsRefreshing(false);
        }
    };
    const handleClearCache = async () => {
        try {
            await serviceWorkerManager.clearCache();
            await loadCacheStats();
            await loadStorageEstimate();
        }
        catch (error) {
            console.error('Clear cache failed:', error);
        }
    };
    const getTotalCachedItems = () => {
        return Object.values(cacheStats).reduce((sum, count) => sum + count, 0);
    };
    const getUsedStoragePercentage = () => {
        if (!storageEstimate?.quota || !storageEstimate?.usage)
            return 0;
        return (storageEstimate.usage / storageEstimate.quota) * 100;
    };
    const formatBytes = (bytes) => {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    // Compact indicator (always visible)
    const CompactIndicator = () => (<div className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${isOnline
            ? 'bg-green-50 text-green-700 hover:bg-green-100'
            : 'bg-red-50 text-red-700 hover:bg-red-100'} ${className}`} onClick={onToggleDetails}>
      {isOnline ? (<Wifi className="w-4 h-4"/>) : (<WifiOff className="w-4 h-4"/>)}
      
      <span className="text-sm font-medium">
        {isOnline ? 'Online' : 'Offline'}
      </span>
      
      {capabilities.isServiceWorkerRegistered && (<Badge variant="secondary" className="text-xs">
          SW
        </Badge>)}
      
      {getTotalCachedItems() > 0 && (<Badge variant="outline" className="text-xs">
          {getTotalCachedItems()}
        </Badge>)}
    </div>);
    // Detailed view
    const DetailedView = () => (<Card className={`w-80 ${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (<Wifi className="w-5 h-5 text-green-600"/>) : (<WifiOff className="w-5 h-5 text-red-600"/>)}
            <h3 className="font-semibold">
              {isOnline ? 'Online' : 'Offline Mode'}
            </h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggleDetails}>
            <X className="w-4 h-4"/>
          </Button>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Network</span>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Service Worker</span>
            <Badge variant={capabilities.isServiceWorkerRegistered ? 'default' : 'secondary'}>
              {capabilities.isServiceWorkerRegistered ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {!isOnline && (<div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-600"/>
                <span className="text-sm font-medium text-yellow-800">
                  Limited Functionality
                </span>
              </div>
              <p className="text-xs text-yellow-700">
                Some features require an internet connection. Cached content is still available.
              </p>
            </div>)}
        </div>

        {/* Cache Statistics */}
        {capabilities.isServiceWorkerRegistered && (<div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <HardDrive className="w-4 h-4"/>
                Cached Content
              </h4>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}/>
              </Button>
            </div>
            
            {Object.entries(cacheStats).map(([cacheName, count]) => (<div key={cacheName} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">
                  {cacheName.replace('brainlens-', '').replace('-v1.0.0', '')}
                </span>
                <Badge variant="outline" className="text-xs">
                  {count} items
                </Badge>
              </div>))}

            {getTotalCachedItems() === 0 && (<p className="text-sm text-muted-foreground text-center py-2">
                No cached content
              </p>)}
          </div>)}

        {/* Storage Usage */}
        {storageEstimate && (<div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Storage Used</span>
              <span>
                {formatBytes(storageEstimate.usage || 0)} / {formatBytes(storageEstimate.quota || 0)}
              </span>
            </div>
            <Progress value={getUsedStoragePercentage()} className="h-2"/>
            <p className="text-xs text-muted-foreground">
              {getUsedStoragePercentage().toFixed(1)}% of available storage
            </p>
          </div>)}

        {/* Capabilities */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Offline Capabilities</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              {capabilities.backgroundSyncSupported ? (<CheckCircle className="w-3 h-3 text-green-600"/>) : (<X className="w-3 h-3 text-red-600"/>)}
              <span>Background Sync</span>
            </div>
            
            <div className="flex items-center gap-1">
              {capabilities.pushNotificationsSupported ? (<CheckCircle className="w-3 h-3 text-green-600"/>) : (<X className="w-3 h-3 text-red-600"/>)}
              <span>Push Notifications</span>
            </div>
            
            <div className="flex items-center gap-1">
              {capabilities.periodicSyncSupported ? (<CheckCircle className="w-3 h-3 text-green-600"/>) : (<X className="w-3 h-3 text-red-600"/>)}
              <span>Periodic Sync</span>
            </div>
            
            <div className="flex items-center gap-1">
              {storageEstimate ? (<CheckCircle className="w-3 h-3 text-green-600"/>) : (<X className="w-3 h-3 text-red-600"/>)}
              <span>Storage API</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={handleClearCache} disabled={getTotalCachedItems() === 0} className="flex-1">
            Clear Cache
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="flex-1">
            Refresh
          </Button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5"/>
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Offline Mode</p>
              <p>
                When offline, you can still access cached topics and content. 
                Changes will sync when connection is restored.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>);
    return showDetails ? <DetailedView /> : <CompactIndicator />;
}
export default OfflineIndicator;
//# sourceMappingURL=OfflineIndicator.jsx.map