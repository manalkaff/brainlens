import { z } from "zod";
import type { SearchResult } from "../../research/agents";
export declare const SubtopicsSchema: z.ZodObject<{
    subtopics: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        priority: z.ZodNumber;
        complexity: z.ZodEnum<["beginner", "intermediate", "advanced"]>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        title: string;
        priority: number;
        complexity: "intermediate" | "advanced" | "beginner";
    }, {
        description: string;
        title: string;
        priority: number;
        complexity: "intermediate" | "advanced" | "beginner";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    subtopics: {
        description: string;
        title: string;
        priority: number;
        complexity: "intermediate" | "advanced" | "beginner";
    }[];
}, {
    subtopics: {
        description: string;
        title: string;
        priority: number;
        complexity: "intermediate" | "advanced" | "beginner";
    }[];
}>;
export declare const ResearchPlanSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    researchQueries: z.ZodArray<z.ZodObject<{
        query: z.ZodString;
        engine: z.ZodEnum<["general", "academic", "video", "community", "computational"]>;
        reasoning: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        query: string;
        engine: "video" | "academic" | "computational" | "general" | "community";
        reasoning: string;
    }, {
        query: string;
        engine: "video" | "academic" | "computational" | "general" | "community";
        reasoning: string;
    }>, "many">;
    researchStrategy: z.ZodString;
    expectedOutcomes: z.ZodArray<z.ZodString, "many">;
    engineDistribution: z.ZodObject<{
        general: z.ZodNumber;
        academic: z.ZodNumber;
        video: z.ZodNumber;
        community: z.ZodNumber;
        computational: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        video: number;
        academic: number;
        computational: number;
        general: number;
        community: number;
    }, {
        video: number;
        academic: number;
        computational: number;
        general: number;
        community: number;
    }>;
}, "strip", z.ZodTypeAny, {
    researchQueries: {
        query: string;
        engine: "video" | "academic" | "computational" | "general" | "community";
        reasoning: string;
    }[];
    researchStrategy: string;
    expectedOutcomes: string[];
    engineDistribution: {
        video: number;
        academic: number;
        computational: number;
        general: number;
        community: number;
    };
}, {
    researchQueries: {
        query: string;
        engine: "video" | "academic" | "computational" | "general" | "community";
        reasoning: string;
    }[];
    researchStrategy: string;
    expectedOutcomes: string[];
    engineDistribution: {
        video: number;
        academic: number;
        computational: number;
        general: number;
        community: number;
    };
}>, {
    researchQueries: {
        query: string;
        engine: "video" | "academic" | "computational" | "general" | "community";
        reasoning: string;
    }[];
    researchStrategy: string;
    expectedOutcomes: string[];
    engineDistribution: {
        video: number;
        academic: number;
        computational: number;
        general: number;
        community: number;
    };
}, {
    researchQueries: {
        query: string;
        engine: "video" | "academic" | "computational" | "general" | "community";
        reasoning: string;
    }[];
    researchStrategy: string;
    expectedOutcomes: string[];
    engineDistribution: {
        video: number;
        academic: number;
        computational: number;
        general: number;
        community: number;
    };
}>, {
    researchQueries: {
        query: string;
        engine: "video" | "academic" | "computational" | "general" | "community";
        reasoning: string;
    }[];
    researchStrategy: string;
    expectedOutcomes: string[];
    engineDistribution: {
        video: number;
        academic: number;
        computational: number;
        general: number;
        community: number;
    };
}, {
    researchQueries: {
        query: string;
        engine: "video" | "academic" | "computational" | "general" | "community";
        reasoning: string;
    }[];
    researchStrategy: string;
    expectedOutcomes: string[];
    engineDistribution: {
        video: number;
        academic: number;
        computational: number;
        general: number;
        community: number;
    };
}>;
export declare const TopicUnderstandingSchema: z.ZodObject<{
    definition: z.ZodString;
    category: z.ZodEnum<["academic", "technical", "cultural", "historical", "scientific", "artistic", "business", "social", "philosophical", "practical"]>;
    complexity: z.ZodEnum<["beginner", "intermediate", "advanced"]>;
    relevantDomains: z.ZodArray<z.ZodString, "many">;
    engineRecommendations: z.ZodObject<{
        academic: z.ZodBoolean;
        video: z.ZodBoolean;
        community: z.ZodBoolean;
        computational: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        video: boolean;
        academic: boolean;
        computational: boolean;
        community: boolean;
    }, {
        video: boolean;
        academic: boolean;
        computational: boolean;
        community: boolean;
    }>;
    researchApproach: z.ZodEnum<["broad-overview", "focused-deep-dive", "comparative", "historical"]>;
}, "strip", z.ZodTypeAny, {
    definition: string;
    category: "academic" | "social" | "practical" | "technical" | "cultural" | "historical" | "scientific" | "artistic" | "business" | "philosophical";
    complexity: "intermediate" | "advanced" | "beginner";
    relevantDomains: string[];
    engineRecommendations: {
        video: boolean;
        academic: boolean;
        computational: boolean;
        community: boolean;
    };
    researchApproach: "historical" | "broad-overview" | "focused-deep-dive" | "comparative";
}, {
    definition: string;
    category: "academic" | "social" | "practical" | "technical" | "cultural" | "historical" | "scientific" | "artistic" | "business" | "philosophical";
    complexity: "intermediate" | "advanced" | "beginner";
    relevantDomains: string[];
    engineRecommendations: {
        video: boolean;
        academic: boolean;
        computational: boolean;
        community: boolean;
    };
    researchApproach: "historical" | "broad-overview" | "focused-deep-dive" | "comparative";
}>;
export declare const ContentStructureSchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodString;
    sections: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        content: z.ZodString;
        sources: z.ZodArray<z.ZodString, "many">;
        complexity: z.ZodOptional<z.ZodEnum<["foundation", "building", "application"]>>;
        learningObjective: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        title: string;
        sources: string[];
        complexity?: "foundation" | "building" | "application" | undefined;
        learningObjective?: string | undefined;
    }, {
        content: string;
        title: string;
        sources: string[];
        complexity?: "foundation" | "building" | "application" | undefined;
        learningObjective?: string | undefined;
    }>, "many">;
    keyTakeaways: z.ZodArray<z.ZodString, "many">;
    nextSteps: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    title: string;
    sections: {
        content: string;
        title: string;
        sources: string[];
        complexity?: "foundation" | "building" | "application" | undefined;
        learningObjective?: string | undefined;
    }[];
    keyTakeaways: string[];
    nextSteps: string[];
}, {
    title: string;
    sections: {
        content: string;
        title: string;
        sources: string[];
        complexity?: "foundation" | "building" | "application" | undefined;
        learningObjective?: string | undefined;
    }[];
    keyTakeaways: string[];
    nextSteps: string[];
}>, {
    title: string;
    sections: {
        content: string;
        title: string;
        sources: string[];
        complexity?: "foundation" | "building" | "application" | undefined;
        learningObjective?: string | undefined;
    }[];
    keyTakeaways: string[];
    nextSteps: string[];
}, {
    title: string;
    sections: {
        content: string;
        title: string;
        sources: string[];
        complexity?: "foundation" | "building" | "application" | undefined;
        learningObjective?: string | undefined;
    }[];
    keyTakeaways: string[];
    nextSteps: string[];
}>;
export interface TopicUnderstanding {
    definition: string;
    category: "academic" | "technical" | "cultural" | "historical" | "scientific" | "artistic" | "business" | "social" | "philosophical" | "practical";
    complexity: "beginner" | "intermediate" | "advanced";
    relevantDomains: string[];
    engineRecommendations: {
        academic: boolean;
        video: boolean;
        community: boolean;
        computational: boolean;
    };
    researchApproach: "broad-overview" | "focused-deep-dive" | "comparative" | "historical";
}
export interface TopicResearchRequest {
    topic: string;
    depth: number;
    maxDepth: number;
    parentTopic?: string;
    userContext?: {
        level?: "beginner" | "intermediate" | "advanced";
        interests?: string[];
        previousKnowledge?: string[];
    };
    understanding?: TopicUnderstanding;
}
export interface TopicResearchResult {
    topic: string;
    depth: number;
    content: GeneratedContent;
    subtopics: SubtopicInfo[];
    sources: SourceAttribution[];
    metadata: ResearchMetadata;
    cacheKey: string;
    timestamp: Date;
    [key: string]: any;
}
export interface SubtopicInfo {
    title: string;
    description: string;
    priority: number;
    complexity: "beginner" | "intermediate" | "advanced";
    estimatedReadTime?: number;
    [key: string]: any;
}
export interface GeneratedContent {
    title: string;
    content: string;
    sections: ContentSection[];
    keyTakeaways: string[];
    nextSteps: string[];
    estimatedReadTime: number;
    [key: string]: any;
}
export interface ContentSection {
    title: string;
    content: string;
    sources: string[];
    complexity?: "foundation" | "building" | "application";
    learningObjective?: string;
    communityContent?: CommunityInsight[];
    [key: string]: any;
}
export interface CommunityInsight {
    type: "opinion" | "technique" | "tip" | "example" | "discussion";
    content: string;
    source?: string;
    author?: string;
    context?: string;
}
export interface SourceAttribution {
    id: string;
    title: string;
    url: string;
    source: string;
    engine: string;
    relevanceScore: number;
    credibilityScore: number;
    contentType: "article" | "video" | "academic" | "discussion" | "documentation";
    usedInSections: string[];
    [key: string]: any;
}
export interface ResearchMetadata {
    totalSources: number;
    researchDuration: number;
    enginesUsed: string[];
    researchStrategy: string;
    confidenceScore: number;
    lastUpdated: Date;
    [key: string]: any;
}
export type SearchResultWithEngine = SearchResult & {
    engine: string;
    reasoning: string;
    practicalWeight?: number;
};
export interface ContentValidationResult {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
}
export interface ResearchPlan {
    researchQueries: Array<{
        query: string;
        engine: string;
        reasoning: string;
    }>;
    researchStrategy: string;
    expectedOutcomes: string[];
    engineDistribution: {
        general: number;
        academic: number;
        video: number;
        community: number;
        computational: number;
    };
}
export interface CommunityContent {
    userOpinions: CommunityInsight[];
    practicalTechniques: CommunityInsight[];
    communityTips: CommunityInsight[];
    realExamples: CommunityInsight[];
    discussions: CommunityInsight[];
}
export interface SynthesisResult {
    keyInsights: string[];
    contentThemes: string[];
    sourceQuality: "high" | "medium" | "low";
    comprehensivenesss: number;
    practicalFocus: "high" | "medium" | "low";
}
//# sourceMappingURL=types.d.ts.map