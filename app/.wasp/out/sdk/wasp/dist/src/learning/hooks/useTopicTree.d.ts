import type { TopicTreeItem } from '../components/ui/TopicTree';
interface UseTopicTreeOptions {
    autoRefresh?: boolean;
    refreshInterval?: number;
}
interface UseTopicTreeReturn {
    topics: TopicTreeItem[];
    isLoading: boolean;
    error: Error | null;
    selectedTopic: TopicTreeItem | null;
    searchQuery: string;
    isGenerating: boolean;
    selectTopic: (topic: TopicTreeItem) => void;
    setSearchQuery: (query: string) => void;
    generateSubtopics: (topicId: string) => Promise<void>;
    refreshTree: () => void;
}
export declare function useTopicTree(options?: UseTopicTreeOptions): UseTopicTreeReturn;
export declare function useTopicContent(topicId: string | null): {
    bookmarks: string[];
    readSections: string[];
    addBookmark: (sectionId: string) => void;
    removeBookmark: (sectionId: string) => void;
    toggleBookmark: (sectionId: string) => void;
    markAsRead: (sectionId: string) => void;
    isBookmarked: (sectionId: string) => boolean;
    isRead: (sectionId: string) => boolean;
};
export {};
//# sourceMappingURL=useTopicTree.d.ts.map