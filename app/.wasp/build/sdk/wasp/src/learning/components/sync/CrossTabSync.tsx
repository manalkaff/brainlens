import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { 
  Users, 
  RotateCcw, 
  Crown,
  RefreshCw,
  Monitor,
  Eye,
  EyeOff,
  Activity,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useSharedState, useCrossTabSync, useGlobalAction } from '../../hooks/useSharedState';
import { crossTabManager } from '../../sync/crossTabManager';

interface CrossTabSyncProps {
  className?: string;
  showControls?: boolean;
}

interface TabInfo {
  tabId: string;
  isActive: boolean;
  lastActivity: Date;
  currentTopic: string | null;
  currentTab: string | null;
  userId: string | null;
  sessionId: string;
}

export function CrossTabSync({ 
  className = '',
  showControls = false 
}: CrossTabSyncProps) {
  const [activeTabs, setActiveTabs] = useState<TabInfo[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const { syncState, getTabsCount, isTabLeader } = useCrossTabSync();
  const { executeAction } = useGlobalAction();
  
  const [currentTopic] = useSharedState<string>('currentTopic');
  const [currentTab] = useSharedState<string>('currentTab');
  const [isLeader, setIsLeader] = useState(isTabLeader());

  useEffect(() => {
    // Update active tabs list
    const updateTabs = () => {
      const tabs = crossTabManager.getActiveTabs();
      setActiveTabs(tabs);
      setIsLeader(isTabLeader());
    };

    // Listen for tab changes
    const unsubscribeTabUpdate = crossTabManager.on('state_update', updateTabs);
    const unsubscribeLeaderElected = crossTabManager.on('leader_elected', updateTabs);
    const unsubscribeLeaderLost = crossTabManager.on('leader_lost', updateTabs);

    // Initial update
    updateTabs();

    // Periodic updates
    const interval = setInterval(updateTabs, 5000);

    return () => {
      unsubscribeTabUpdate();
      unsubscribeLeaderElected();
      unsubscribeLeaderLost();
      clearInterval(interval);
    };
  }, []);

  const handleSync = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      await syncState();
      setLastSyncTime(new Date());
      setSyncStatus('synced');
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  }, [syncState]);

  const handleBroadcastAction = useCallback(async (action: string, payload: any) => {
    try {
      await executeAction(action, payload);
    } catch (error) {
      console.error('Broadcast action failed:', error);
    }
  }, [executeAction]);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getTabStatusIcon = (tab: TabInfo) => {
    if (tab.tabId === crossTabManager['tabId']) {
      return <Crown className="w-3 h-3 text-yellow-600" />;
    }
    return tab.isActive ? (
      <Eye className="w-3 h-3 text-green-600" />
    ) : (
      <EyeOff className="w-3 h-3 text-gray-400" />
    );
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'synced': return 'text-green-600';
      case 'syncing': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'synced': return <CheckCircle className="w-4 h-4" />;
      case 'syncing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <RotateCcw className="w-4 h-4" />;
    }
  };

  // Compact view for status bar
  if (!showControls) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {activeTabs.length} tab{activeTabs.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {isLeader && (
          <Badge variant="outline" className="text-xs">
            Leader
          </Badge>
        )}
        
        <div className={`flex items-center gap-1 ${getSyncStatusColor()}`}>
          {getSyncStatusIcon()}
          <span className="text-xs">
            {syncStatus === 'synced' && lastSyncTime && (
              formatTimeAgo(lastSyncTime)
            )}
            {syncStatus === 'syncing' && 'Syncing...'}
            {syncStatus === 'error' && 'Error'}
          </span>
        </div>
      </div>
    );
  }

  // Full control panel
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <div>
              <CardTitle className="text-sm">Cross-Tab Sync</CardTitle>
              <CardDescription className="text-xs">
                {activeTabs.length} active tab{activeTabs.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isLeader && (
              <Badge variant="default" className="text-xs">
                <Crown className="w-3 h-3 mr-1" />
                Leader
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={syncStatus === 'syncing'}
            >
              <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={getSyncStatusColor()}>
              {getSyncStatusIcon()}
            </div>
            <span className="text-sm">
              {syncStatus === 'synced' && 'Synchronized'}
              {syncStatus === 'syncing' && 'Synchronizing...'}
              {syncStatus === 'error' && 'Sync Error'}
            </span>
          </div>
          
          {lastSyncTime && (
            <span className="text-xs text-muted-foreground">
              Last sync: {formatTimeAgo(lastSyncTime)}
            </span>
          )}
        </div>

        <Separator />

        {/* Active Tabs */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Active Tabs</h4>
          
          {activeTabs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other tabs detected</p>
          ) : (
            <div className="space-y-2">
              {activeTabs.map((tab) => (
                <div
                  key={tab.tabId}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    {getTabStatusIcon(tab)}
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">
                        {tab.tabId === crossTabManager['tabId'] ? 'This Tab' : `Tab ${tab.tabId.slice(-4)}`}
                      </div>
                      {(tab.currentTopic || tab.currentTab) && (
                        <div className="text-xs text-muted-foreground truncate">
                          {tab.currentTab && `${tab.currentTab}`}
                          {tab.currentTopic && ` • Topic: ${tab.currentTopic.slice(0, 20)}...`}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(tab.lastActivity)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current State */}
        {(currentTopic || currentTab) && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Shared State</h4>
              <div className="space-y-1 text-xs">
                {currentTab && (
                  <div className="flex items-center gap-2">
                    <Monitor className="w-3 h-3" />
                    <span>Current Tab: {currentTab}</span>
                  </div>
                )}
                {currentTopic && (
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    <span>Current Topic: {currentTopic}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        {isLeader && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Leader Actions</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBroadcastAction('refresh_state', {})}
                  className="flex-1"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Refresh All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBroadcastAction('force_sync', {})}
                  className="flex-1"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Force Sync
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Multi-Tab Support</p>
              <p>
                Your learning progress, bookmarks, and navigation state are automatically 
                synchronized across all open tabs. Changes in one tab appear instantly in others.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CrossTabSync;