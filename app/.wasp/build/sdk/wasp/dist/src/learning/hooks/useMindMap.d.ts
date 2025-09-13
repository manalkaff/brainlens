import { TopicTreeItem } from '../components/ui/TopicTree';
export type LayoutType = 'hierarchical' | 'radial' | 'force';
interface UseMindMapOptions {
    topics: TopicTreeItem[];
    selectedTopicId?: string;
    onTopicSelect?: (topic: TopicTreeItem) => void;
    defaultLayout?: LayoutType;
}
interface MindMapFilters {
    showCompleted: boolean;
    showInProgress: boolean;
    showNotStarted: boolean;
    minDepth: number;
    maxDepth: number;
}
export declare function useMindMap({ topics, selectedTopicId, onTopicSelect, defaultLayout }: UseMindMapOptions): {
    layout: LayoutType;
    searchQuery: string;
    filters: MindMapFilters;
    isFullscreen: boolean;
    filteredTopics: TopicTreeItem[];
    statistics: {
        all: {
            total: number;
            completed: number;
            inProgress: number;
            notStarted: number;
            completionPercentage: number;
            totalTimeSpent: number;
            totalBookmarks: number;
            maxDepth: number;
            averageTimePerTopic: number;
        };
        filtered: {
            total: number;
            completed: number;
            inProgress: number;
            notStarted: number;
            completionPercentage: number;
            totalTimeSpent: number;
            totalBookmarks: number;
            maxDepth: number;
            averageTimePerTopic: number;
        };
    };
    handleLayoutChange: (newLayout: LayoutType) => void;
    handleSearchChange: (query: string) => void;
    handleTopicSelect: (topic: TopicTreeItem) => void;
    updateFilters: (newFilters: Partial<MindMapFilters>) => void;
    resetFilters: () => void;
    exportMindMap: (format: "png" | "svg") => Promise<void>;
    toggleFullscreen: () => void;
    findTopicById: (id: string) => TopicTreeItem | null;
    getTopicPath: (topicId: string) => TopicTreeItem[];
};
export {};
//# sourceMappingURL=useMindMap.d.ts.map