import React from 'react';
import { type TabId } from '../hooks/useTabNavigation';
import type { Topic, UserTopicProgress } from 'wasp/entities';
export interface TopicData extends Topic {
    userProgress?: UserTopicProgress;
    children: Topic[];
    parent?: Topic | null;
}
export interface TopicProgressSummary {
    topic: Topic;
    userProgress?: UserTopicProgress;
    childrenProgress: {
        total: number;
        completed: number;
        inProgress: number;
        notStarted: number;
        completionPercentage: number;
    };
    hierarchyProgress: {
        totalTimeSpent: number;
        totalBookmarks: number;
        deepestCompletedLevel: number;
    };
}
export interface RealTimeProgressStep {
    number: number;
    name: string;
    description: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    progress: number;
    estimatedDuration?: number;
    result?: any;
}
export interface RealTimeProgressData {
    isActive: boolean;
    phase: 'main_topic' | 'subtopics' | 'completed';
    currentStep?: RealTimeProgressStep;
    completedSteps: RealTimeProgressStep[];
    overallProgress: number;
    mainTopicCompleted: boolean;
    subtopicsProgress?: Array<{
        title: string;
        status: 'pending' | 'in_progress' | 'completed' | 'error';
        progress: number;
    }>;
    estimatedTimeRemaining?: number;
    totalStepsCount?: number;
}
export interface EnhancedResearchStats {
    totalTopics: number;
    researchedTopics: number;
    pendingTopics: number;
    averageDepth: number;
    lastResearchDate?: Date;
    isActive?: boolean;
    realTimeProgress?: RealTimeProgressData;
    topicId: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ERROR';
    lastResearched?: string;
    cacheStatus?: string;
}
export interface ResearchStats {
    totalTopics: number;
    researchedTopics: number;
    pendingTopics: number;
    averageDepth: number;
    lastResearchDate?: Date;
    isActive?: boolean;
}
interface TopicContextState {
    topic: TopicData | null;
    progressSummary: TopicProgressSummary | null;
    userProgress: UserTopicProgress | null;
    isLoading: boolean;
    error: string | null;
    researchStatus: ResearchStats | null;
    enhancedResearchStats: EnhancedResearchStats | null;
    isResearchLoading: boolean;
    isResearching: boolean;
    activeTab: TabId;
    setActiveTab: (tab: TabId) => void;
    isTabLoaded: (tab: TabId) => boolean;
    loadTab: (tab: TabId) => void;
    loadedTabs: Set<TabId>;
    selectedTopicId: string | null;
    setSelectedTopicId: (topicId: string | null) => void;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    userPreferences: any;
    updateUserPreferences: (preferences: any) => void;
    refreshTopic: () => void;
}
interface TopicProviderProps {
    children: React.ReactNode;
}
export declare function TopicProvider({ children }: TopicProviderProps): React.JSX.Element;
export declare function useTopicContext(): TopicContextState;
export {};
//# sourceMappingURL=TopicContext.d.ts.map