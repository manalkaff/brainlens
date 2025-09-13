import type { TopicTreeItem } from '../components/ui/TopicTree';
interface ContentSection {
    id: string;
    title: string;
    content: string;
    level: number;
    isBookmarked: boolean;
    isRead: boolean;
}
interface SourceAttribution {
    id: string;
    title: string;
    url?: string;
    source: string;
    contentType: string;
    relevanceScore?: number;
}
interface UseIterativeContentGenerationOptions {
    topic: TopicTreeItem | null;
    activeTopicId?: string;
    autoStart?: boolean;
}
interface UseIterativeContentGenerationReturn {
    content: string;
    sections: ContentSection[];
    sources: SourceAttribution[];
    isGenerating: boolean;
    isResetting: boolean;
    error: Error | null;
    generateContent: () => Promise<void>;
    refreshContent: () => void;
    researchResult: any;
    isResearching: boolean;
    researchProgress: number;
}
/**
 * Enhanced content generation hook that uses the iterative research system
 * This replaces the old useContentGeneration hook
 */
export declare function useIterativeContentGeneration({ topic, activeTopicId, autoStart }: UseIterativeContentGenerationOptions): UseIterativeContentGenerationReturn;
export {};
//# sourceMappingURL=useIterativeContentGeneration.d.ts.map