import type { TopicTreeItem } from '../components/ui/TopicTree';
interface ContentSection {
    id: string;
    title: string;
    content: string;
    level: number;
    isBookmarked: boolean;
    isRead: boolean;
}
interface UseContentGenerationOptions {
    topic: TopicTreeItem | null;
    autoGenerate?: boolean;
    activeTopicId?: string;
}
interface SourceAttribution {
    id: string;
    title: string;
    url?: string;
    source: string;
    contentType: string;
    relevanceScore?: number;
}
interface UseContentGenerationReturn {
    content: string;
    sections: ContentSection[];
    sources: SourceAttribution[];
    isGenerating: boolean;
    isResetting: boolean;
    error: Error | null;
    generateContent: () => Promise<void>;
    refreshContent: () => void;
}
export declare function useContentGeneration({ topic, autoGenerate, activeTopicId }: UseContentGenerationOptions): UseContentGenerationReturn;
export declare function useContentBookmarks(topicId: string | null): {
    bookmarks: string[];
    readSections: string[];
    isLoading: boolean;
    toggleBookmark: (sectionId: string) => Promise<void>;
    markAsRead: (sectionId: string) => Promise<void>;
    markAsUnread: (sectionId: string) => Promise<void>;
    isBookmarked: (sectionId: string) => boolean;
    isRead: (sectionId: string) => boolean;
};
export {};
//# sourceMappingURL=useContentGeneration.d.ts.map