import React from 'react';
import { TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { useTopicContext } from '../../context/TopicContext';
import { useSharedTopicState } from '../../hooks/useSharedTopicState';
import type { TabId } from '../../hooks/useTabNavigation';

interface TabConfig {
  id: TabId;
  label: string;
  color: string;
  icon?: React.ReactNode;
  description: string;
}

const tabConfigs: TabConfig[] = [
  {
    id: 'learn',
    label: 'Learn',
    color: 'bg-blue-500',
    description: 'Guided learning experience'
  },
  {
    id: 'explore',
    label: 'Explore',
    color: 'bg-green-500',
    description: 'Browse topic structure'
  },
  {
    id: 'ask',
    label: 'Ask',
    color: 'bg-purple-500',
    description: 'Chat with AI assistant'
  },
  {
    id: 'mindmap',
    label: 'MindMap',
    color: 'bg-orange-500',
    description: 'Visual knowledge map'
  },
  {
    id: 'quiz',
    label: 'Quiz',
    color: 'bg-red-500',
    description: 'Test your knowledge'
  }
];

interface TabNavigationProps {
  className?: string;
}

export function TabNavigation({ className }: TabNavigationProps) {
  const { activeTab, isTabLoaded, loadedTabs } = useTopicContext();
  const { sharedState } = useSharedTopicState();

  return (
    <TabsList className={`grid w-full grid-cols-5 lg:w-auto lg:inline-flex ${className}`}>
      {tabConfigs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isLoaded = isTabLoaded(tab.id);
        const wasVisited = loadedTabs.has(tab.id);
        
        return (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex items-center space-x-2 relative group"
            title={tab.description}
          >
            {/* Tab indicator dot */}
            <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
              isActive 
                ? tab.color 
                : wasVisited 
                  ? `${tab.color} opacity-60` 
                  : 'bg-muted'
            }`} />
            
            {/* Tab label */}
            <span className={`transition-all duration-200 ${
              isActive ? 'font-medium' : wasVisited ? 'font-normal' : 'opacity-75'
            }`}>
              {tab.label}
            </span>
            
            {/* Loading indicator */}
            {isActive && !isLoaded && (
              <div className="absolute -top-1 -right-1 w-2 h-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
            )}
            
            {/* Visited indicator */}
            {wasVisited && !isActive && (
              <div className="absolute -top-1 -right-1 w-1.5 h-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${tab.color} opacity-40`} />
              </div>
            )}
            
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              {tab.description}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover" />
            </div>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}

// Tab status indicator component
export function TabStatusIndicator() {
  const { activeTab, loadedTabs } = useTopicContext();
  const { sessionDuration, hasBookmarks } = useSharedTopicState();

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span>Active: {activeTab}</span>
      </div>
      
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span>Loaded: {loadedTabs.size}/5 tabs</span>
      </div>
      
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <span>Session: {formatDuration(sessionDuration)}</span>
      </div>
      
      {hasBookmarks && (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Bookmarks saved</span>
        </div>
      )}
    </div>
  );
}