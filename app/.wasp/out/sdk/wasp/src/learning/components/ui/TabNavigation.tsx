import React from 'react';
import { TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import { useTopicContext } from '../../context/TopicContext';
import { useSharedTopicState } from '../../hooks/useSharedTopicState';
import type { TabId } from '../../hooks/useTabNavigation';
import { Search, GraduationCap, MessageSquare, Brain, HelpCircle, BookOpen } from 'lucide-react';

interface TabConfig {
  id: TabId;
  label: string;
  color: string;
  icon?: React.ReactNode;
  description: string;
}

const tabConfigs: TabConfig[] = [
  {
    id: 'explore',
    label: 'Explore',
    color: 'bg-primary',
    icon: <Search className="w-4 h-4" />,
    description: 'AI-powered deep topic exploration'
  },
  {
    id: 'learn',
    label: 'Learn',
    color: 'bg-success',
    icon: <GraduationCap className="w-4 h-4" />,
    description: 'Guided learning experience'
  },
  {
    id: 'ask',
    label: 'Ask',
    color: 'bg-blue-500',
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'Chat with AI assistant'
  },
  {
    id: 'mindmap',
    label: 'MindMap',
    color: 'bg-amber-500',
    icon: <Brain className="w-4 h-4" />,
    description: 'Visual knowledge map'
  },
  {
    id: 'quiz',
    label: 'Quiz',
    color: 'bg-destructive',
    icon: <HelpCircle className="w-4 h-4" />,
    description: 'Test your knowledge'
  },
  {
    id: 'sources',
    label: 'Sources',
    color: 'bg-blue-600',
    icon: <BookOpen className="w-4 h-4" />,
    description: 'View all research sources'
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
      {tabConfigs.filter(tab => tab.id !== 'learn').map((tab) => {
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
            {/* Tab icon */}
            <div className={`transition-all duration-200 ${
              isActive ? 'text-foreground' : wasVisited ? 'text-foreground opacity-80' : 'text-muted-foreground'
            }`}>
              {tab.icon}
            </div>
            
            {/* Tab label */}
            <span className={`transition-all duration-200 ${
              isActive ? 'font-medium' : wasVisited ? 'font-normal' : 'opacity-75'
            }`}>
              {tab.label}
            </span>
            
            
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
  return null;
}