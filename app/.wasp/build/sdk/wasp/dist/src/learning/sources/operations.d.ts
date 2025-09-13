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
        sourceAgent?: string;
        sourceUrl?: string;
        sourceTitle?: string;
        [key: string]: any;
    };
    [key: string]: any;
}
export interface SourceFilters {
    agent?: string;
    sourceType?: string;
    minRelevance?: number;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    [key: string]: any;
}
export interface SourcesByAgent {
    agent: string;
    sources: SourceData[];
    totalCount: number;
    avgRelevance: number;
    [key: string]: any;
}
/**
 * Get all sources for a topic and its subtopics with optional filtering
 */
export declare const getTopicSources: ({ topicId, filters }: {
    topicId: string;
    filters?: SourceFilters;
}, context: any) => Promise<{
    sources: {
        metadata: {
            [key: string]: any;
            confidence?: number;
            completeness?: number;
            publishedDate?: string;
            author?: string;
            domain?: string;
            sourceAgent?: string;
            sourceUrl?: string;
            sourceTitle?: string;
        };
        id: string;
        title: string;
        url?: string;
        snippet: string;
        agent: "General" | "Academic" | "Computational" | "Video" | "Social";
        sourceType: "article" | "video" | "academic" | "discussion" | "documentation";
        relevanceScore: number;
        createdAt: string;
        topicId: string;
        topicTitle: string;
    }[];
    totalCount: number;
    topicTitle: any;
    filters: SourceFilters;
}>;
/**
 * Get detailed information about a specific source
 */
export declare const getSourceDetails: ({ sourceId }: {
    sourceId: string;
}, context: any) => Promise<{
    source: {
        metadata: {
            [key: string]: any;
            confidence?: number;
            completeness?: number;
            publishedDate?: string;
            author?: string;
            domain?: string;
            sourceAgent?: string;
            sourceUrl?: string;
            sourceTitle?: string;
        };
        id: string;
        title: string;
        url?: string;
        snippet: string;
        agent: "General" | "Academic" | "Computational" | "Video" | "Social";
        sourceType: "article" | "video" | "academic" | "discussion" | "documentation";
        relevanceScore: number;
        createdAt: string;
        topicId: string;
        topicTitle: string;
    };
    fullContent: any;
    embedding: null;
    rawMetadata: any;
}>;
/**
 * Get sources grouped by research agent
 */
export declare const getSourcesByAgent: ({ topicId, agentType }: {
    topicId: string;
    agentType?: string;
}, context: any) => Promise<{
    sourcesByAgent: {
        sources: {
            metadata: {
                [key: string]: any;
                confidence?: number;
                completeness?: number;
                publishedDate?: string;
                author?: string;
                domain?: string;
                sourceAgent?: string;
                sourceUrl?: string;
                sourceTitle?: string;
            };
            id: string;
            title: string;
            url?: string;
            snippet: string;
            agent: "General" | "Academic" | "Computational" | "Video" | "Social";
            sourceType: "article" | "video" | "academic" | "discussion" | "documentation";
            relevanceScore: number;
            createdAt: string;
            topicId: string;
            topicTitle: string;
        }[];
        agent: string;
        totalCount: number;
        avgRelevance: number;
    }[];
    totalSources: number;
    topicTitle: any;
}>;
/**
 * Fix topics that have content but no sources by triggering research first
 */
export declare const fixTopicSources: ({ topicId }: {
    topicId: string;
}, context: any) => Promise<{
    success: boolean;
    message: string;
    action: string;
}>;
/**
 * Debug topic data to understand source storage
 */
export declare const debugTopicData: ({ topicId }: {
    topicId: string;
}, context: any) => Promise<{
    topic: {
        id: any;
        title: any;
        status: any;
    };
    vectorDocuments: {
        count: any;
        samples: any;
    };
    generatedContent: {
        count: any;
        items: any;
    };
    children: {
        count: any;
        summary: any;
    };
}>;
/**
 * Export topic sources in various formats
 */
export declare const exportTopicSources: ({ topicId, format, filters }: {
    topicId: string;
    format?: "json" | "csv";
    filters?: SourceFilters;
}, context: any) => Promise<{
    data: string;
    format: string;
    filename: string;
}>;
//# sourceMappingURL=operations.d.ts.map