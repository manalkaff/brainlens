export interface SourceFilters {
    agent?: string;
    sourceType?: string;
    minRelevance?: number;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}
export interface SourceData {
    id: string;
    title: string;
    url?: string;
    snippet: string;
    agent: 'General' | 'Academic' | 'Computational' | 'Video' | 'Social';
    sourceType: 'article' | 'video' | 'academic' | 'discussion' | 'documentation';
    relevanceScore: number;
    createdAt: string;
    topicId: string;
    topicTitle: string;
    metadata?: {
        confidence?: number;
        completeness?: number;
        publishedDate?: string;
        author?: string;
        domain?: string;
    };
}
export interface UseTopicSourcesOptions {
    initialFilters?: SourceFilters;
    autoRefresh?: boolean;
}
export interface UseTopicSourcesReturn {
    sources: SourceData[];
    totalCount: number;
    isLoading: boolean;
    error: Error | null;
    filters: SourceFilters;
    setFilters: (filters: SourceFilters) => void;
    refreshSources: () => void;
    exportSources: (format: 'json' | 'csv') => Promise<void>;
}
export declare function useTopicSources(options?: UseTopicSourcesOptions): UseTopicSourcesReturn;
export declare function useSourceDetails(sourceId: string | null): {
    sourceDetails: any;
    isLoading: boolean;
    error: Error | null;
    refreshDetails: () => Promise<void>;
};
export declare function useSourcesByAgent(agentType?: string): {
    sourcesByAgent: any[];
    isLoading: boolean;
    error: Error | null;
    refreshSourcesByAgent: () => Promise<void>;
};
//# sourceMappingURL=useTopicSources.d.ts.map