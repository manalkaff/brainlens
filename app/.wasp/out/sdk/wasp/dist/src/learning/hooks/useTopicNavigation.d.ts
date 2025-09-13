import type { TopicTreeItem } from '../components/ui/TopicTree';
interface SourceAttribution {
    id: string;
    title: string;
    url?: string;
    source: string;
    contentType: string;
    relevanceScore?: number;
}
interface NavigationHistoryItem {
    topic: TopicTreeItem;
    timestamp: Date;
    path: string[];
    source: 'sidebar' | 'cards' | 'url' | 'breadcrumb';
}
interface ContentCacheEntry {
    content: string;
    sources: SourceAttribution[];
    generatedAt: Date;
    accessCount: number;
    lastAccessed: Date;
}
interface UseTopicNavigationReturn {
    selectedTopic: TopicTreeItem | null;
    selectedSubtopic: TopicTreeItem | null;
    contentPath: string[];
    isGeneratingContent: boolean;
    navigationHistory: NavigationHistoryItem[];
    hasError: (topicId?: string) => boolean;
    getError: (topicId?: string) => any;
    clearError: (topicId?: string) => void;
    retryLastOperation: (topicId: string) => Promise<void>;
    selectTopic: (topic: TopicTreeItem, source?: 'sidebar' | 'cards' | 'url' | 'breadcrumb') => void;
    selectSubtopic: (subtopic: TopicTreeItem, source?: 'sidebar' | 'cards' | 'url' | 'breadcrumb') => void;
    navigateToPath: (path: string[]) => void;
    generateContentForTopic: (topic: TopicTreeItem) => Promise<void>;
    getTopicContent: (topicId: string) => ContentCacheEntry | null;
    setTopicContent: (topicId: string, content: string, sources: SourceAttribution[]) => void;
    clearContentCache: () => void;
    getTopicByPath: (path: string[]) => TopicTreeItem | null;
    isTopicSelected: (topicId: string) => boolean;
    getNavigationBreadcrumbs: () => {
        title: string;
        path: string[];
        topic: TopicTreeItem;
    }[];
    getRequiredExpandedNodes: () => string[];
    canNavigateBack: boolean;
    canNavigateForward: boolean;
    navigateBack: () => void;
    navigateForward: () => void;
    parseCurrentURL: () => URLState;
    validateDeepLink: (subtopicPath: string[]) => DeepLinkResult;
    generateShareableURL: (topic?: TopicTreeItem) => string;
    handleDeepLink: (subtopicPath: string[]) => boolean;
}
interface URLState {
    topicSlug: string;
    subtopicPath?: string[];
    tab?: string;
}
interface DeepLinkResult {
    isValid: boolean;
    mainTopic: TopicTreeItem | null;
    targetTopic: TopicTreeItem | null;
    expandedNodes: string[];
    error?: string;
}
export declare function useTopicNavigation(topics: TopicTreeItem[], initialPath?: string[]): UseTopicNavigationReturn;
export {};
//# sourceMappingURL=useTopicNavigation.d.ts.map