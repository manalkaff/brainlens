export interface StartIterativeResearchArgs {
    topicSlug: string;
    options?: {
        maxDepth?: number;
        forceRefresh?: boolean;
        userContext?: {
            level?: "beginner" | "intermediate" | "advanced";
            interests?: string[];
        };
    };
}
export interface ExpandTopicDepthArgs {
    topicId: string;
    targetDepth: number;
    userContext?: {
        level?: "beginner" | "intermediate" | "advanced";
        interests?: string[];
    };
    forceRefresh?: boolean;
}
export interface GenerateSubtopicsArgs {
    topicId: string;
    userContext?: any;
    forceRefresh?: boolean;
}
export declare const startIterativeResearch: (args: StartIterativeResearchArgs, context?: any) => Promise<any>;
export declare const expandTopicDepth: (args: ExpandTopicDepthArgs, context?: any) => Promise<any>;
export declare const generateSubtopics: (args: GenerateSubtopicsArgs, context?: any) => Promise<any>;
export declare const getTopicHierarchy: (args: {
    topicId: string;
    maxDepth?: number;
}, context?: any) => Promise<any>;
export declare const checkResearchFreshness: (args: {
    topicId: string;
    cacheTtlDays?: number;
}, context?: any) => Promise<any>;
export declare const getResearchStats: (args: {
    topicId: string;
}, context?: any) => Promise<any>;
export declare const getCacheStatistics: (args: any, context?: any) => Promise<any>;
export declare const cleanupCache: (args: any, context?: any) => Promise<any>;
//# sourceMappingURL=iterativeResearchClient.d.ts.map