import { z } from "zod";
import type { SearchResult } from "../../research/agents";

// Schemas for structured responses
export const SubtopicsSchema = z.object({
  subtopics: z.array(
    z.object({
      title: z.string().describe("The subtopic title"),
      description: z
        .string()
        .describe("Brief description of what this subtopic covers"),
      priority: z
        .number()
        .min(1)
        .max(5)
        .describe("Priority level (1=highest, 5=lowest) - MUST be an integer between 1 and 5"),
      complexity: z
        .enum(["beginner", "intermediate", "advanced"])
        .describe("Complexity level - MUST be exactly one of: beginner, intermediate, or advanced (no combinations or hyphens)"),
    }),
  ),
});

export const ResearchPlanSchema = z.object({
  researchQueries: z.array(
    z.object({
      query: z.string().describe("The search query to execute"),
      engine: z
        .enum(["general", "academic", "video", "community", "computational"])
        .describe("Which SearXNG engine to use - MUST be exactly one of: general, academic, video, community, computational"),
      reasoning: z
        .string()
        .describe("Why this query and engine combination will be valuable"),
    }),
  ),
  researchStrategy: z
    .string()
    .describe("Overall strategy for researching this topic"),
  expectedOutcomes: z
    .array(z.string())
    .describe("What we expect to learn from this research"),
  engineDistribution: z.object({
    general: z.number().min(5).describe("Number of general engine queries - MUST be at least 5"),
    academic: z.number().min(0).describe("Number of academic engine queries"),
    video: z.number().min(5).describe("Number of video engine queries - MUST be at least 5"),
    community: z.number().min(5).describe("Number of community engine queries - MUST be at least 5"),
    computational: z.number().min(0).describe("Number of computational engine queries"),
  }).describe("Distribution of queries across engines - general, video, and community must be at least 5 each"),
}).refine((data) => {
  // Validate that we have at least 5 queries for general, video, and community engines
  const generalQueries = data.researchQueries.filter(q => q.engine === "general");
  const videoQueries = data.researchQueries.filter(q => q.engine === "video");
  const communityQueries = data.researchQueries.filter(q => q.engine === "community");
  return generalQueries.length >= 5 && videoQueries.length >= 5 && communityQueries.length >= 5;
}, {
  message: "Research plan must include at least 5 queries each for general, video, and community engines",
  path: ["researchQueries"]
}).refine((data) => {
  // Validate that engine distribution matches actual query counts
  const actualDistribution = data.researchQueries.reduce((acc, query) => {
    acc[query.engine] = (acc[query.engine] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return (
    actualDistribution.general === data.engineDistribution.general &&
    (actualDistribution.academic || 0) === data.engineDistribution.academic &&
    (actualDistribution.video || 0) === data.engineDistribution.video &&
    (actualDistribution.community || 0) === data.engineDistribution.community &&
    (actualDistribution.computational || 0) === data.engineDistribution.computational
  );
}, {
  message: "Engine distribution must match actual query counts",
  path: ["engineDistribution"]
});

export const TopicUnderstandingSchema = z.object({
  definition: z
    .string()
    .describe("Clear, concise definition of what this topic is about"),
  category: z
    .enum([
      "academic",
      "technical", 
      "cultural",
      "historical",
      "scientific",
      "artistic",
      "business",
      "social",
      "philosophical",
      "practical"
    ])
    .describe("Primary category this topic belongs to"),
  complexity: z
    .enum(["beginner", "intermediate", "advanced"])
    .describe("Complexity level based on research findings - MUST be exactly one of: beginner, intermediate, or advanced"),
  relevantDomains: z
    .array(z.string())
    .describe("Related fields/areas this topic touches"),
  engineRecommendations: z.object({
    academic: z.boolean().describe("Whether academic engine would be valuable"),
    video: z.boolean().describe("Whether video content would be helpful"),
    community: z.boolean().describe("Whether community discussions are relevant"),
    computational: z.boolean().describe("Whether computational analysis applies"),
  }),
  researchApproach: z
    .enum(["broad-overview", "focused-deep-dive", "comparative", "historical"])
    .describe("Recommended research approach based on topic nature"),
});

export const ContentStructureSchema = z.object({
  title: z.string().describe("Main title for the content"),
  sections: z
    .array(
      z.object({
        title: z.string().describe("Section title that clearly indicates the learning progression"),
        content: z.string().describe("Detailed content for this section, structured to build upon previous knowledge and prepare for next concepts"),
        sources: z
          .array(z.string())
          .describe(
            "Source references used in this section - must be strings only",
          ),
        complexity: z
          .enum(["foundation", "building", "application"])
          .optional()
          .describe("Learning complexity level - foundation (basic concepts), building (intermediate), application (practical use)"),
        learningObjective: z
          .string()
          .optional()
          .describe("What the learner should understand after this section"),
      }),
    )
    .min(3)
    .max(6)
    .describe("Array of content sections organized in logical learning sequence (3-6 sections for optimal progression)"),
  keyTakeaways: z
    .array(z.string())
    .min(3)
    .max(7)
    .describe(
      "Main learning points that summarize the progressive understanding built through the content - must be an array of strings only, not objects",
    ),
  nextSteps: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe(
      "Practical, actionable next learning steps that build on the knowledge gained - must be an array of strings only, not objects",
    ),
}).refine((data) => {
  // Validate that sections follow a logical progression
  const sectionTitles = data.sections.map(s => s.title.toLowerCase());
  
  // Check for foundational concepts in early sections
  const hasFoundation = sectionTitles.slice(0, 2).some(title => 
    title.includes('basic') || 
    title.includes('foundation') || 
    title.includes('introduction') || 
    title.includes('what is') ||
    title.includes('overview')
  );
  
  // Check for practical applications in later sections
  const hasApplication = sectionTitles.slice(-2).some(title =>
    title.includes('application') ||
    title.includes('practical') ||
    title.includes('example') ||
    title.includes('use') ||
    title.includes('getting started')
  );
  
  return hasFoundation && hasApplication;
}, {
  message: "Content sections must follow progressive learning structure: foundation concepts first, practical applications last",
  path: ["sections"]
});

// Types for the learning engine
export interface TopicUnderstanding {
  definition: string;
  category: 
    | "academic"
    | "technical" 
    | "cultural"
    | "historical"
    | "scientific"
    | "artistic"
    | "business"
    | "social"
    | "philosophical"
    | "practical";
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
  content: string; // MDX format
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
  contentType:
    | "article"
    | "video"
    | "academic"
    | "discussion"
    | "documentation";
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

// Extended search result type with engine information
export type SearchResultWithEngine = SearchResult & { 
  engine: string; 
  reasoning: string;
  practicalWeight?: number;
};

// Validation result types
export interface ContentValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}

// Research plan types
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

// Community content types for enhanced user perspectives
export interface CommunityContent {
  userOpinions: CommunityInsight[];
  practicalTechniques: CommunityInsight[];
  communityTips: CommunityInsight[];
  realExamples: CommunityInsight[];
  discussions: CommunityInsight[];
}

// Synthesis result types
export interface SynthesisResult {
  keyInsights: string[];
  contentThemes: string[];
  sourceQuality: "high" | "medium" | "low";
  comprehensivenesss: number;
  practicalFocus: "high" | "medium" | "low";
}