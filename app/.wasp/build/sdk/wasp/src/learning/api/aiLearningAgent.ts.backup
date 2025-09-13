import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { SearxngUtils, type AgentConfigName } from "../research/searxng";
import type { SearchResult } from "../research/agents";

// Schemas for structured responses
const SubtopicsSchema = z.object({
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

const ResearchPlanSchema = z.object({
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
    video: z.number().min(0).describe("Number of video engine queries"),
    community: z.number().min(0).describe("Number of community engine queries"),
    computational: z.number().min(0).describe("Number of computational engine queries"),
  }).describe("Distribution of queries across engines - general must be at least 5"),
}).refine((data) => {
  // Validate that we have at least 5 general engine queries
  const generalQueries = data.researchQueries.filter(q => q.engine === "general");
  return generalQueries.length >= 5;
}, {
  message: "Research plan must include at least 5 general engine queries for balanced perspective",
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

const TopicUnderstandingSchema = z.object({
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

const ContentStructureSchema = z.object({
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
  [key: string]: any;
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

/**
 * AI Learning Agent - Core of the iterative research system
 * Uses Vercel AI SDK to create an intelligent agent that uses SearXNG as tools
 */
export class AILearningAgent {
  private model = openai("gpt-5-mini");
  private fastModel = openai("gpt-5-nano");

  /**
   * Understand a topic from scratch using basic research
   * This function performs initial research to understand what a topic is about
   * without relying on AI's pre-trained knowledge
   */
  async understandTopic(topic: string): Promise<TopicUnderstanding> {
    console.log(`🔍 Understanding topic from scratch: "${topic}"`);
    
    try {
      // Step 1: Basic definitional search
      const basicQuery = `What is "${topic}" definition meaning explanation`;
      
      console.log(`🔎 Basic research query: "${basicQuery}"`);
      const searchResponse = await SearxngUtils.searchWithAgent("general", basicQuery);
      
      if (!searchResponse.results || searchResponse.results.length === 0) {
        throw new Error(`No search results found for topic: ${topic}`);
      }
      
      // Take top 5 results for understanding
      const topResults = searchResponse.results.slice(0, 5);
      
      // Step 2: Build research context from sources
      const researchContext = topResults
        .map((result, index) => 
          `[Source ${index + 1}] ${result.title}\n${result.content || result.snippet}\nURL: ${result.url}\n`
        )
        .join("\n");
      
      // Step 3: AI analyzes research to understand the topic
      const analysisPrompt = `You are a research analyst tasked with understanding a topic based ONLY on the research provided below. You have NO prior knowledge about this topic.

RESEARCH FINDINGS:
${researchContext}

Based ONLY on what you learned from these research sources, analyze the topic "${topic}" and provide:

1. DEFINITION: What is this topic according to the research?

2. CATEGORY: What primary field/domain does this belong to based on the sources?
   Must be ONE of: academic, technical, cultural, historical, scientific, artistic, business, social, philosophical, practical

3. COMPLEXITY: How complex does this topic appear based on the language and concepts in the sources?
   Must be EXACTLY one of: beginner, intermediate, advanced
   - "beginner": Simple language, basic concepts, introductory level
   - "intermediate": Some technical terms, moderate complexity  
   - "advanced": Complex terminology, expert-level concepts

4. RELEVANT_DOMAINS: What related fields/areas are mentioned in the research?

5. ENGINE_RECOMMENDATIONS: Based on the nature of this topic from research, which search engines would be most valuable?
   - Academic: Would scholarly papers/research be valuable? (true/false)
   - Video: Would visual/video content help explain this? (true/false)
   - Community: Would discussions/forums provide useful insights? (true/false)  
   - Computational: Would quantitative/data analysis be relevant? (true/false)

6. RESEARCH_APPROACH: What approach would work best for deeper research?
   Must be ONE of: broad-overview, focused-deep-dive, comparative, historical

IMPORTANT: Use ONLY the exact enum values specified above. Be analytical and logical. Base your recommendations ONLY on what the research sources reveal about this topic.`;

      const result = await (generateObject as any)({
        model: this.fastModel,
        prompt: analysisPrompt,
        schema: TopicUnderstandingSchema,
        temperature: 0.3, // Low temperature for analytical consistency
      });

      // Validate the result structure
      if (!result.object || typeof result.object !== 'object') {
        throw new Error('Invalid topic understanding structure generated');
      }
      
      const understanding = result.object;
      
      console.log(`✅ Topic understanding complete:`);
      console.log(`   Definition: ${understanding.definition.substring(0, 100)}...`);
      console.log(`   Category: ${understanding.category}`);
      console.log(`   Complexity: ${understanding.complexity}`);
      console.log(`   Recommended engines: ${Object.entries(understanding.engineRecommendations).filter(([_, value]) => value).map(([key]) => key).join(', ')}`);
      
      return understanding;
      
    } catch (error) {
      console.error(`❌ Failed to understand topic "${topic}":`, error);
      
      // Fallback understanding if research fails
      return {
        definition: `A topic requiring research to understand: ${topic}`,
        category: "academic",
        complexity: "beginner",
        relevantDomains: [topic],
        engineRecommendations: {
          academic: true,
          video: false,
          community: false,
          computational: false,
        },
        researchApproach: "broad-overview",
      };
    }
  }

  /**
   * Main research and generation function
   * This is the core function that recursively explores topics
   */
  async researchAndGenerate(
    request: TopicResearchRequest,
  ): Promise<TopicResearchResult> {
    console.log(
      `🔬 Starting iterative research for: "${request.topic}" at depth ${request.depth}`,
    );

    const startTime = Date.now();
    request.maxDepth = 1;

    try {
      // Step 0: Understand the topic from scratch (NEW - only for root topics)
      let understanding: TopicUnderstanding;
      if (request.understanding) {
        // Use provided understanding (for subtopics)
        understanding = request.understanding;
        console.log(`📖 Using provided topic understanding for: "${request.topic}"`);
      } else {
        // Generate understanding for root topics
        console.log("🔍 Step 0: Understanding topic from research...");
        understanding = await this.understandTopic(request.topic);
      }

      // Step 1: Plan the research strategy (MODIFIED - now uses understanding)
      console.log("📋 Step 1: Planning research strategy...");
      const researchPlan = await this.planResearch(
        request.topic,
        understanding,
        request.userContext,
      );

      // Step 2: Execute research using planned queries and engines
      console.log("🔍 Step 2: Executing research plan...");
      const researchResults = await this.executeResearch(researchPlan);

      // Step 3: Analyze and synthesize the research
      console.log("🧠 Step 3: Analyzing research results...");
      const synthesis = await this.synthesizeResearch(
        request.topic,
        researchResults,
      );

      // Step 4: Generate comprehensive content
      console.log("📝 Step 4: Generating comprehensive content...");
      const content = await this.generateContent(
        request.topic,
        synthesis,
      );

      // Step 5: Extract subtopics for further exploration
      console.log("🌳 Step 5: Identifying subtopics...");
      let subtopics: SubtopicInfo[] = [];
      if (request.depth < request.maxDepth) {
        subtopics = await this.identifySubtopics(
          request.topic,
          synthesis,
          request.depth + 1,
        );
      }

      // Step 6: Build source attributions
      const sources = this.buildSourceAttributions(
        researchResults,
        content.sections,
      );

      const researchDuration = Date.now() - startTime;

      const result: TopicResearchResult = {
        topic: request.topic,
        depth: request.depth,
        content,
        subtopics,
        sources,
        metadata: {
          totalSources: researchResults.length,
          researchDuration,
          enginesUsed: Array.from(new Set(researchResults.map((r) => r.engine))),
          researchStrategy: researchPlan.researchStrategy,
          confidenceScore: this.calculateConfidenceScore(
            researchResults,
            content,
          ),
          lastUpdated: new Date(),
        },
        cacheKey: this.generateCacheKey(request.topic, request.userContext),
        timestamp: new Date(),
      };

      console.log(
        `✅ Research completed in ${researchDuration}ms with ${sources.length} sources`,
      );
      return result;
    } catch (error) {
      console.error(`❌ Research failed for topic "${request.topic}":`, error);
      throw error;
    }
  }

  /**
   * Plan the research strategy using research-based understanding (NOT AI knowledge)
   * Always includes 5 mandatory general engine queries for balanced perspective
   */
  private async planResearch(
    topic: string, 
    understanding: TopicUnderstanding, 
    userContext?: any
  ): Promise<any> {
    const prompt = `You are a research strategist creating a plan based ONLY on the topic understanding provided below. You have NO prior knowledge about "${topic}".

RESEARCH-BASED TOPIC UNDERSTANDING:
- Definition: ${understanding.definition}
- Category: ${understanding.category}  
- Complexity: ${understanding.complexity}
- Relevant Domains: ${understanding.relevantDomains.join(", ")}
- Research Approach: ${understanding.researchApproach}

ENGINE RECOMMENDATIONS (based on research findings):
${Object.entries(understanding.engineRecommendations)
  .map(([engine, recommended]) => `- ${engine}: ${recommended ? "RECOMMENDED" : "not recommended"} based on topic analysis`)
  .join("\n")}

Available research engines:
- general: Broad web search across multiple sources
- academic: Scientific papers, research, scholarly articles  
- video: Educational videos, tutorials, demonstrations
- community: Forums, discussions, real-world experiences
- computational: Mathematical, algorithmic, technical data

${userContext ? `User context: Level=${userContext.level}, Interests=[${userContext.interests?.join(", ")}]` : ""}

MANDATORY REQUIREMENTS:
1. You MUST include exactly 5 queries using the "general" engine for balanced perspective
2. You MAY include additional queries using recommended engines (academic, video, community, computational)
3. Total queries should be 8-12 (5 general + 3-7 recommended engine queries)

INSTRUCTIONS:
1. Base your research plan ONLY on the understanding provided above
2. ALWAYS start with 5 diverse "general" engine queries covering different aspects of the topic
3. Then add 3-7 additional queries using the recommended engines from the analysis
4. Focus on ${understanding.researchApproach} approach as indicated by the research
5. Each query should be specific and progressive - building from basic to more detailed understanding
6. General queries should cover: overview, practical applications, examples, different perspectives, and foundational concepts

Your goal: Create a comprehensive research plan that balances general accessibility (via 5 general queries) with specialized depth (via recommended engine queries), following the research-driven recommendations above.`;

    try {
      const result = await (generateObject as any)({
        model: this.model,
        prompt,
        schema: ResearchPlanSchema,
        temperature: 0.6, // Lower temperature for more consistent, logical planning
      });

      // Validate the result structure
      if (!result.object || !result.object.researchQueries || !Array.isArray(result.object.researchQueries)) {
        console.error('❌ Invalid research plan structure generated');
        throw new Error('Invalid research plan structure generated');
      }

      // Enhanced validation with schema refinement
      try {
        const validatedPlan = ResearchPlanSchema.parse(result.object);
        console.log('✅ Research plan passed schema validation');
        
        // Additional validation and enhancement
        const plan = this.ensureGeneralQueries(validatedPlan, topic);
        return plan;
        
      } catch (schemaError) {
        console.warn('⚠️ Research plan failed schema validation, applying corrections:', schemaError);
        
        // Try to fix the plan before falling back
        const correctedPlan = this.ensureGeneralQueries(result.object, topic);
        
        // Validate the corrected plan
        try {
          const finalPlan = ResearchPlanSchema.parse(correctedPlan);
          console.log('✅ Corrected research plan passed validation');
          return finalPlan;
        } catch (finalError) {
          console.error('❌ Failed to correct research plan, using fallback');
          throw finalError;
        }
      }
      
    } catch (error) {
      console.error('❌ Structured research plan generation failed, creating fallback plan:', error);
      
      // Create fallback plan with mandatory 5 general queries
      return this.createFallbackPlan(topic, understanding);
    }
  }

  /**
   * Ensures the research plan has at least 5 general engine queries
   * If not, adds them and updates engine distribution
   * Enhanced validation for requirements 5.3 and 5.4
   */
  private ensureGeneralQueries(plan: any, topic: string): any {
    // Validate plan structure
    if (!plan || !Array.isArray(plan.researchQueries)) {
      console.error("❌ Invalid research plan structure, creating fallback");
      throw new Error("Invalid research plan structure");
    }

    const generalQueries = plan.researchQueries.filter((q: any) => q.engine === "general");
    const nonGeneralQueries = plan.researchQueries.filter((q: any) => q.engine !== "general");
    
    // Enhanced validation: ensure we have at least 5 general queries
    if (generalQueries.length < 5) {
      const neededGeneralQueries = 5 - generalQueries.length;
      console.log(`🔧 Adding ${neededGeneralQueries} general engine queries to meet minimum requirement`);
      
      const additionalGeneralQueries = this.generateAdditionalGeneralQueries(topic, neededGeneralQueries);
      
      // Combine all queries, ensuring general queries come first for balanced perspective
      const allQueries = [...generalQueries, ...additionalGeneralQueries, ...nonGeneralQueries];
      
      // Update the plan
      plan.researchQueries = allQueries;
    }

    // Calculate and update engine distribution
    plan.engineDistribution = this.calculateEngineDistribution(plan.researchQueries);
    
    // Final validation: ensure engine distribution is accurate
    const actualGeneral = plan.researchQueries.filter((q: any) => q.engine === "general").length;
    if (actualGeneral < 5) {
      console.error(`❌ Failed to ensure minimum general queries: ${actualGeneral} < 5`);
      throw new Error(`Failed to meet minimum general query requirement: ${actualGeneral} < 5`);
    }

    // Validate query diversity for requirement 5.3 (specialized and accessible search terms)
    this.validateQueryDiversity(plan.researchQueries, topic);
    
    console.log(`✅ Research plan validated: ${actualGeneral} general queries, ${plan.researchQueries.length} total queries`);
    return plan;
  }

  /**
   * Validates query diversity to ensure both specialized and accessible search terms
   * Requirement 5.3: research queries SHALL include both specialized and accessible search terms
   */
  private validateQueryDiversity(queries: Array<{query: string, engine: string}>, topic: string): void {
    const generalQueries = queries.filter(q => q.engine === "general");
    const specializedQueries = queries.filter(q => q.engine !== "general");
    
    // Check for accessible search terms in general queries
    const hasAccessibleTerms = generalQueries.some(q => 
      q.query.includes("basics") || 
      q.query.includes("introduction") || 
      q.query.includes("beginner") ||
      q.query.includes("simple") ||
      q.query.includes("explained")
    );
    
    // Check for specialized terms in non-general queries
    const hasSpecializedTerms = specializedQueries.length > 0 || 
      queries.some(q => 
        q.query.includes("research") || 
        q.query.includes("analysis") || 
        q.query.includes("technical") ||
        q.query.includes("academic")
      );
    
    if (!hasAccessibleTerms) {
      console.warn("⚠️ Query diversity: Missing accessible search terms for general understanding");
    }
    
    if (!hasSpecializedTerms) {
      console.warn("⚠️ Query diversity: Missing specialized search terms for depth");
    }
    
    console.log(`✅ Query diversity validated: ${hasAccessibleTerms ? "accessible" : "no accessible"} terms, ${hasSpecializedTerms ? "specialized" : "no specialized"} terms`);
  }

  /**
   * Generates additional general queries when needed
   * Enhanced for requirement 5.3 - ensures accessible search terms for diverse understanding
   */
  private generateAdditionalGeneralQueries(topic: string, count: number): Array<{query: string, engine: string, reasoning: string}> {
    const generalQueryTemplates = [
      {
        query: `${topic} overview introduction basics fundamentals`,
        reasoning: "Basic overview to understand fundamental concepts and terminology"
      },
      {
        query: `${topic} practical applications real world examples uses`,
        reasoning: "Practical applications and real-world usage for accessible understanding"
      },
      {
        query: `${topic} beginner guide getting started simple explanation`,
        reasoning: "Beginner-friendly introduction with simple, accessible language"
      },
      {
        query: `${topic} benefits advantages importance why useful`,
        reasoning: "Understanding the benefits and practical importance from general perspective"
      },
      {
        query: `${topic} common questions frequently asked problems issues`,
        reasoning: "Common questions and concerns from general user perspective"
      },
      {
        query: `${topic} explained simple terms easy understanding definition`,
        reasoning: "Simple explanations and definitions for better accessibility"
      },
      {
        query: `${topic} different types categories variations kinds`,
        reasoning: "Understanding different aspects, variations, and classifications"
      },
      {
        query: `${topic} how it works process steps method`,
        reasoning: "Understanding the process and methodology in accessible terms"
      },
      {
        query: `${topic} pros cons advantages disadvantages comparison`,
        reasoning: "Balanced perspective on benefits and limitations"
      },
      {
        query: `${topic} history background development evolution`,
        reasoning: "Historical context and development for comprehensive understanding"
      },
      {
        query: `${topic} tools resources materials needed requirements`,
        reasoning: "Practical resources and requirements for implementation"
      },
      {
        query: `${topic} tips advice best practices recommendations`,
        reasoning: "Practical advice and best practices from general sources"
      }
    ];

    // Ensure we don't exceed available templates
    const actualCount = Math.min(count, generalQueryTemplates.length);
    
    // Select diverse templates to ensure variety in accessible search terms
    const selectedTemplates = generalQueryTemplates.slice(0, actualCount);
    
    return selectedTemplates.map(template => ({
      query: template.query,
      engine: "general",
      reasoning: template.reasoning
    }));
  }

  /**
   * Calculates engine distribution from research queries
   */
  private calculateEngineDistribution(queries: Array<{engine: string}>): {general: number, academic: number, video: number, community: number, computational: number} {
    const distribution = {
      general: 0,
      academic: 0,
      video: 0,
      community: 0,
      computational: 0
    };

    queries.forEach(query => {
      if (distribution.hasOwnProperty(query.engine)) {
        distribution[query.engine as keyof typeof distribution]++;
      }
    });

    return distribution;
  }

  /**
   * Creates a fallback research plan with mandatory 5 general queries
   * Enhanced for requirements 5.3 and 5.4 - ensures diverse source types and query terms
   */
  private createFallbackPlan(topic: string, understanding: TopicUnderstanding): any {
    console.log(`🔧 Creating fallback research plan for "${topic}"`);
    
    const fallbackQueries: { query: string; engine: string; reasoning: string }[] = [];
    
    // Always include 5 diverse general queries first (requirement 5.3 - accessible search terms)
    const generalQueries = this.generateAdditionalGeneralQueries(topic, 5);
    fallbackQueries.push(...generalQueries);

    // Add engine-specific queries based on recommendations (requirement 5.3 - specialized search terms)
    if (understanding.engineRecommendations.academic) {
      fallbackQueries.push({
        query: `${topic} research studies academic papers scholarly analysis`,
        engine: "academic", 
        reasoning: "Academic research for scholarly perspective and specialized terminology"
      });
      
      // Add a second academic query for depth
      fallbackQueries.push({
        query: `${topic} peer reviewed literature scientific findings`,
        engine: "academic",
        reasoning: "Peer-reviewed sources for credible specialized knowledge"
      });
    }

    if (understanding.engineRecommendations.video) {
      fallbackQueries.push({
        query: `${topic} tutorial explanation educational video`,
        engine: "video",
        reasoning: "Visual content for better understanding and accessibility"
      });
    }

    if (understanding.engineRecommendations.community) {
      fallbackQueries.push({
        query: `${topic} discussion forum community insights practical experience`,
        engine: "community",
        reasoning: "Community perspectives and real-world practical insights"
      });
    }

    if (understanding.engineRecommendations.computational) {
      fallbackQueries.push({
        query: `${topic} computational analysis data algorithms technical`,
        engine: "computational",
        reasoning: "Computational and data-driven technical insights"
      });
    }

    // Ensure we have diverse source types (requirement 5.4)
    if (fallbackQueries.length < 8) {
      // Add more general queries to ensure minimum diversity
      const additionalGeneral = this.generateAdditionalGeneralQueries(topic, 8 - fallbackQueries.length);
      fallbackQueries.push(...additionalGeneral);
    }

    const engineDistribution = this.calculateEngineDistribution(fallbackQueries);
    
    // Validate that we meet the minimum requirements
    if (engineDistribution.general < 5) {
      console.error(`❌ Fallback plan failed to create minimum general queries: ${engineDistribution.general} < 5`);
      throw new Error("Failed to create valid fallback research plan");
    }

    console.log(`✅ Fallback plan created: ${engineDistribution.general} general, ${fallbackQueries.length} total queries`);

    return {
      researchQueries: fallbackQueries,
      researchStrategy: `Enhanced fallback research strategy for ${topic} focusing on ${understanding.researchApproach} approach with balanced general and specialized sources, ensuring diverse source types and query terms`,
      expectedOutcomes: [
        `Comprehensive understanding of ${topic} from multiple perspectives`,
        `Practical applications and real-world examples from accessible sources`,
        `Key concepts and terminology explained accessibly`,
        `Specialized knowledge from academic and technical sources`,
        `Different viewpoints from general and specialized sources`,
        `Foundation for deeper learning and exploration`,
        `Diverse source types for comprehensive coverage`
      ],
      engineDistribution
    };
  }

  /**
   * Execute research using planned queries and engines
   * Enhanced for requirement 5.5: proper handling of general and specialized engine queries
   * with robust error handling for engine availability issues
   */
  private async executeResearch(researchPlan: {
    researchQueries: Array<{
      query: string;
      engine: AgentConfigName;
      reasoning: string;
    }>;
    researchStrategy: string;
    expectedOutcomes: string[];
    engineDistribution?: {
      general: number;
      academic: number;
      video: number;
      community: number;
      computational: number;
    };
  }): Promise<Array<SearchResult & { engine: string; reasoning: string }>> {
    // Enhanced validation for requirements 5.4 and 5.5
    const generalQueries = researchPlan.researchQueries.filter(q => q.engine === "general");
    const specializedQueries = researchPlan.researchQueries.filter(q => q.engine !== "general");
    const engineTypes = Array.from(new Set(researchPlan.researchQueries.map(q => q.engine)));
    
    // Validate minimum general queries (requirement 5.5)
    if (generalQueries.length < 5) {
      console.error(`❌ Research plan validation failed: only ${generalQueries.length} general queries, expected at least 5`);
      throw new Error(`Invalid research plan: insufficient general queries (${generalQueries.length} < 5)`);
    }
    
    // Validate diverse source types (requirement 5.4)
    console.log(`✅ Research plan validation passed:`);
    console.log(`   - ${generalQueries.length} general engine queries for balanced perspective`);
    console.log(`   - ${specializedQueries.length} specialized engine queries for depth`);
    console.log(`   - ${engineTypes.length} different engine types: ${engineTypes.join(', ')}`);
    console.log(`   - ${researchPlan.researchQueries.length} total queries for comprehensive coverage`);
    
    // Validate engine distribution matches expectations
    if (researchPlan.engineDistribution) {
      const expectedGeneral = researchPlan.engineDistribution.general;
      if (expectedGeneral !== generalQueries.length) {
        console.warn(`⚠️ Engine distribution mismatch: expected ${expectedGeneral} general queries, found ${generalQueries.length}`);
      }
    }

    const results: Array<SearchResult & { engine: string; reasoning: string }> = [];
    const failedQueries: Array<{ query: string; engine: string; error: string }> = [];
    let generalQueriesSuccessful = 0;
    let specializedQueriesSuccessful = 0;

    // Execute research queries with enhanced error handling and engine availability monitoring
    const researchPromises = researchPlan.researchQueries.map(
      async ({ query, engine, reasoning }) => {
        try {
          console.log(`  🔍 Searching ${engine}: "${query}"`);
          
          // Enhanced error handling with engine availability checks
          const response = await SearxngUtils.searchWithAgent(
            engine as AgentConfigName,
            query,
          );

          // Validate response structure
          if (!response || !response.results || !Array.isArray(response.results)) {
            throw new Error(`Invalid response structure from ${engine} engine`);
          }

          // Track successful queries by type for requirement 5.5 validation
          if (engine === "general") {
            generalQueriesSuccessful++;
          } else {
            specializedQueriesSuccessful++;
          }

          const processedResults = response.results.map((result) => ({
            ...result,
            title: result.title || "Untitled",
            url: result.url || "#",
            snippet: result.content || result.snippet || "No description",
            source: result.engine || engine,
            relevanceScore: result.score || 0.5,
            engine: engine,
            reasoning: reasoning,
          }));

          console.log(`  ✅ ${engine} search successful: ${processedResults.length} results`);
          return processedResults;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Failed to search ${engine} for "${query}":`, errorMessage);
          
          // Track failed queries for analysis
          failedQueries.push({
            query,
            engine,
            error: errorMessage
          });

          // Enhanced error handling for engine availability issues (requirement 5.5)
          if (engine === "general") {
            // General engine failures are critical - try fallback strategies
            console.warn(`⚠️ Critical: General engine query failed, attempting fallback`);
            return await this.handleGeneralEngineFailure(query, reasoning, errorMessage);
          } else {
            // Specialized engine failures are less critical but should be logged
            console.warn(`⚠️ Specialized engine ${engine} unavailable, continuing with other engines`);
            return await this.handleSpecializedEngineFailure(query, engine, reasoning, errorMessage);
          }
        }
      },
    );

    const researchResultsArrays = await Promise.all(researchPromises);

    // Flatten and deduplicate results
    const allResults = researchResultsArrays.flat();
    const deduplicatedResults = this.deduplicateResults(allResults);

    // Enhanced validation of research execution success (requirement 5.5)
    this.validateResearchExecutionSuccess(
      generalQueriesSuccessful,
      specializedQueriesSuccessful,
      failedQueries,
      deduplicatedResults.length
    );

    console.log(`  ✅ Research execution completed:`);
    console.log(`     - ${deduplicatedResults.length} unique sources collected`);
    console.log(`     - ${generalQueriesSuccessful}/${generalQueries.length} general queries successful`);
    console.log(`     - ${specializedQueriesSuccessful}/${specializedQueries.length} specialized queries successful`);
    console.log(`     - ${failedQueries.length} queries failed`);

    return deduplicatedResults.slice(0, 30); // Limit to top 30 results
  }

  /**
   * Handle general engine failure with fallback strategies
   * General engine queries are critical for balanced perspective (requirement 5.5)
   */
  private async handleGeneralEngineFailure(
    query: string, 
    reasoning: string, 
    errorMessage: string
  ): Promise<Array<SearchResult & { engine: string; reasoning: string }>> {
    console.log(`🔧 Attempting general engine fallback for query: "${query}"`);
    
    try {
      // Try alternative general search approaches
      const fallbackQueries = [
        query.replace(/advanced|complex|technical/gi, 'basic'),
        query.split(' ').slice(0, 3).join(' '), // Simplified query
        `${query} beginner guide overview` // More accessible version
      ];

      for (const fallbackQuery of fallbackQueries) {
        try {
          console.log(`  🔄 Trying fallback query: "${fallbackQuery}"`);
          const response = await SearxngUtils.searchWithAgent("general", fallbackQuery);
          
          if (response && response.results && response.results.length > 0) {
            console.log(`  ✅ Fallback successful with ${response.results.length} results`);
            return response.results.map((result) => ({
              ...result,
              title: result.title || "Untitled",
              url: result.url || "#",
              snippet: result.content || result.snippet || "No description",
              source: result.engine || "general",
              relevanceScore: (result.score || 0.5) * 0.8, // Slightly lower score for fallback
              engine: "general",
              reasoning: `${reasoning} (fallback due to: ${errorMessage})`,
            }));
          }
        } catch (fallbackError) {
          console.warn(`  ⚠️ Fallback query failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
          continue;
        }
      }

      // If all fallbacks fail, return empty results but log the critical failure
      console.error(`❌ All general engine fallbacks failed for query: "${query}"`);
      return [];

    } catch (error) {
      console.error(`❌ General engine fallback handler failed:`, error);
      return [];
    }
  }

  /**
   * Handle specialized engine failure with graceful degradation
   * Specialized engines enhance depth but are not critical for basic understanding
   */
  private async handleSpecializedEngineFailure(
    query: string,
    engine: string,
    reasoning: string,
    errorMessage: string
  ): Promise<Array<SearchResult & { engine: string; reasoning: string }>> {
    console.log(`🔧 Handling specialized engine failure for ${engine}: "${query}"`);
    
    try {
      // Try to get similar information from general engine as fallback
      const generalizedQuery = `${query} general information overview`;
      
      console.log(`  🔄 Attempting general engine fallback: "${generalizedQuery}"`);
      const response = await SearxngUtils.searchWithAgent("general", generalizedQuery);
      
      if (response && response.results && response.results.length > 0) {
        console.log(`  ✅ General fallback successful for specialized query`);
        return response.results.slice(0, 3).map((result) => ({ // Limit fallback results
          ...result,
          title: result.title || "Untitled",
          url: result.url || "#",
          snippet: result.content || result.snippet || "No description",
          source: result.engine || "general",
          relevanceScore: (result.score || 0.5) * 0.6, // Lower score for cross-engine fallback
          engine: "general", // Mark as general since that's what we used
          reasoning: `${reasoning} (general fallback for ${engine} due to: ${errorMessage})`,
        }));
      }

      console.warn(`  ⚠️ No fallback results available for specialized engine ${engine}`);
      return [];

    } catch (error) {
      console.error(`❌ Specialized engine fallback failed for ${engine}:`, error);
      return [];
    }
  }

  /**
   * Validate research execution success and ensure minimum requirements are met
   * Requirement 5.5: validate that general engine queries are executed successfully
   */
  private validateResearchExecutionSuccess(
    generalQueriesSuccessful: number,
    specializedQueriesSuccessful: number,
    failedQueries: Array<{ query: string; engine: string; error: string }>,
    totalResults: number
  ): void {
    const criticalFailures: string[] = [];
    const warnings: string[] = [];

    // Critical validation: ensure minimum general queries succeeded (requirement 5.5)
    if (generalQueriesSuccessful < 3) {
      criticalFailures.push(
        `Insufficient general engine queries succeeded (${generalQueriesSuccessful} < 3). ` +
        `This compromises the balanced perspective requirement.`
      );
    }

    // Warning: check if we have reasonable specialized query success
    const specializedFailureRate = failedQueries.filter(f => f.engine !== "general").length;
    if (specializedFailureRate > 0 && specializedQueriesSuccessful === 0) {
      warnings.push(
        `All specialized engine queries failed. Research will rely entirely on general sources.`
      );
    }

    // Critical validation: ensure we have minimum viable results
    if (totalResults < 5) {
      criticalFailures.push(
        `Insufficient research results collected (${totalResults} < 5). ` +
        `Cannot generate comprehensive content with so few sources.`
      );
    }

    // Log engine availability issues for monitoring
    if (failedQueries.length > 0) {
      console.warn(`⚠️ Engine availability issues detected:`);
      const engineFailures = failedQueries.reduce((acc, failure) => {
        acc[failure.engine] = (acc[failure.engine] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(engineFailures).forEach(([engine, count]) => {
        console.warn(`   - ${engine}: ${count} failed queries`);
      });
    }

    // Report warnings
    warnings.forEach(warning => {
      console.warn(`⚠️ Research execution warning: ${warning}`);
    });

    // Throw error for critical failures
    if (criticalFailures.length > 0) {
      const errorMessage = `Research execution failed critical validations:\n${criticalFailures.join('\n')}`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // Success validation
    if (generalQueriesSuccessful >= 3 && totalResults >= 5) {
      console.log(`✅ Research execution validation passed:`);
      console.log(`   - General queries: ${generalQueriesSuccessful} successful (≥3 required)`);
      console.log(`   - Total results: ${totalResults} collected (≥5 required)`);
      console.log(`   - Engine diversity maintained despite any failures`);
    }
  }

  /**
   * Synthesize research results using AI with enhanced weighting for practical understanding
   * 
   * ENHANCED FOR PRACTICAL UNDERSTANDING (Task 5):
   * - Weights general sources appropriately for balanced perspective (Requirement 2.4)
   * - Focuses on practical applications over academic theory (Requirement 4.1, 4.2)
   * - Balances academic credibility with accessibility (Requirement 4.3)
   */
  private async synthesizeResearch(
    topic: string,
    researchResults: Array<
      SearchResult & { engine: string; reasoning: string }
    >,
  ): Promise<any> {
    // Enhanced source weighting: prioritize general sources for practical understanding
    const weightedResults = this.weightSourcesForPracticalUnderstanding(researchResults);
    
    // Build research context with balanced representation
    const researchContext = weightedResults
      .slice(0, 20) // Use top 20 weighted sources for synthesis
      .map(
        (result, index) =>
          `[${index + 1}] ${result.engine.toUpperCase()}: "${result.title}"\n${
            result.snippet
          }\nURL: ${result.url}\nRelevance: ${result.relevanceScore?.toFixed(
            2,
          )} | Practical Weight: ${result.practicalWeight?.toFixed(2)}\n`,
      )
      .join("\n");

    const prompt = `You are a knowledge analyst synthesizing information about "${topic}". Extract key insights and themes from the sources provided below, focusing on practical understanding and real-world applications.

INFORMATION SOURCES:
${researchContext}

ANALYSIS GOALS:
1. PRACTICAL FOCUS - Identify how this topic is used in real-world situations
2. ACCESSIBLE INSIGHTS - Extract information that is understandable and actionable
3. REAL-WORLD RELEVANCE - Focus on benefits, applications, and practical considerations

EXTRACT:
1. KEY INSIGHTS about practical applications and real-world uses
2. MAIN THEMES focusing on:
   - How this topic works in practice
   - What problems it solves or benefits it provides
   - Real-world examples and applications
   - Practical considerations and limitations

SYNTHESIS APPROACH:
- Focus on actionable insights that can be understood and applied
- Emphasize practical value over theoretical complexity
- Highlight concrete examples and use cases
- Extract clear, useful information about the topic

Provide insights and themes that help explain what ${topic} is, how it works, and why it's useful in practical terms.`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.6,
    });

    // Parse the AI response with enhanced focus on practical insights
    const insights = this.extractPracticalInsights(result.text);
    const themes = this.extractPracticalThemes(result.text);
    const quality = this.assessBalancedSourceQuality(researchResults);
    const comprehensiveness = this.calculatePracticalComprehensiveness(researchResults);

    return {
      keyInsights: insights,
      contentThemes: themes,
      sourceQuality: quality,
      comprehensivenesss: comprehensiveness,
      practicalFocus: this.assessPracticalFocus(researchResults), // New: track practical understanding emphasis
    };
  }

  /**
   * Generate comprehensive content using AI with progressive learning structure
   * 
   * ENHANCED FOR PROGRESSIVE LEARNING (Task 4):
   * - Organizes information in logical learning sequence (Requirement 3.2)
   * - Breaks down complex topics into digestible components (Requirement 3.3) 
   * - Ensures each section builds upon previous knowledge clearly (Requirement 3.4)
   * - Focuses on practical understanding over academic theory (Requirement 1.5)
   * 
   * Content structure follows: Foundation → Building Blocks → Applications
   * Each section includes learning objectives and complexity indicators
   */
  private async generateContent(
    topic: string,
    synthesis: any,
  ): Promise<GeneratedContent> {
    const prompt = `You are an educational content creator specializing in clear, practical explanations. Create comprehensive learning content about "${topic}" using the insights provided below.

AVAILABLE INSIGHTS:
${synthesis.keyInsights?.join("\n- ") || ""}

KEY THEMES:
${synthesis.contentThemes?.join("\n- ") || ""}

CONTENT REQUIREMENTS:
1. CLEAR STRUCTURE - Organize information from basic concepts to practical applications
2. ACCESSIBLE LANGUAGE - Use simple, everyday language with clear explanations
3. PRACTICAL FOCUS - Emphasize real-world applications and examples
4. PROGRESSIVE FLOW - Each section naturally builds understanding

SECTION STRUCTURE:
Create 4-6 sections that flow logically:
- Start with foundational concepts and definitions
- Progress through key components and how things work
- Conclude with practical applications and getting started

WRITING GUIDELINES:
- Use conversational, clear language
- Explain technical terms simply when first used
- Include concrete examples and analogies
- Focus on practical understanding over theory
- Break complex ideas into digestible parts
- Use numbered steps for processes

CONTENT FOCUS:
- What the topic actually is and why it matters
- Key components and how they work together
- Real-world examples and applications
- Practical steps readers can take
- Concrete benefits and use cases

FORMATTING REQUIREMENTS:
- keyTakeaways: array of clear, practical summary points
- nextSteps: array of specific, actionable recommendations
- Each section should have clear, descriptive titles
- Include practical examples throughout

Create content that helps readers truly understand ${topic} and how to apply it in practice.`;

    let result;
    try {
      result = await (generateObject as any)({
        model: this.model,
        prompt,
        schema: ContentStructureSchema,
        temperature: 0.7,
      });
    } catch (error) {
      console.error(
        "Structured generation failed, attempting enhanced fallback:",
        error,
      );

      // Enhanced fallback mechanism (Requirements 3.5, 4.4, 4.5)
      try {
        // First attempt: text generation with structured parsing
        const textResult = await generateText({
          model: this.model,
          prompt:
            prompt +
            "\n\nGenerate the response in a structured format that can be parsed as JSON.",
          temperature: 0.7,
        });

        // Try to parse the fallback response
        result = { object: this.parseContentFallback(textResult.text, topic) };
        console.log("✅ Text generation fallback succeeded");
        
      } catch (fallbackError) {
        console.error("Text generation fallback also failed:", fallbackError);
        
        // Final fallback: create structured content using synthesis data
        const fallbackContent = this.createFallbackContent(topic, synthesis, error as Error);
        return fallbackContent;
      }
    }

    // Convert structured result to our content format
    const content = result.object;

    // Ensure arrays contain only strings and validate progressive structure
    const cleanKeyTakeaways = this.ensureStringArray(content.keyTakeaways);
    const cleanNextSteps = this.ensureStringArray(content.nextSteps);
    const cleanSections = content.sections.map((section: any, index: number) => ({
      ...section,
      sources: this.ensureStringArray(section.sources || []),
      // Ensure progressive learning structure is maintained
      complexity: section.complexity || this.inferSectionComplexity(index, content.sections.length),
      learningObjective: section.learningObjective || `Understand ${section.title.toLowerCase()}`,
    }));

    // Validate progressive learning structure
    this.validateProgressiveLearningStructure(cleanSections);

    const estimatedReadTime = this.estimateReadTime(
      cleanSections.reduce(
        (total: number, section: any) => total + section.content.length,
        0,
      ),
    );

    const generatedContent: GeneratedContent = {
      title: content.title,
      content: this.formatAsMDX({
        title: content.title,
        sections: cleanSections,
        keyTakeaways: cleanKeyTakeaways,
        nextSteps: cleanNextSteps,
      }),
      sections: cleanSections,
      keyTakeaways: cleanKeyTakeaways,
      nextSteps: cleanNextSteps,
      estimatedReadTime,
    };

    // Enhanced content validation (Requirements 3.5, 4.4, 4.5)
    const validation = this.validateContentAccessibility(generatedContent);
    
    if (!validation.isValid) {
      console.warn(`⚠️ Content validation found issues, applying improvements:`, validation.issues);
      
      // Apply suggested improvements
      if (validation.suggestions.length > 0) {
        this.applyBasicContentFixes(generatedContent, validation.suggestions);
        console.log("🔧 Applied content improvements based on validation feedback");
      }
    }

    return generatedContent;
  }

  /**
   * Identify subtopics for further exploration
   */
  private async identifySubtopics(
    topic: string,
    synthesis: any,
    nextDepth: number,
  ): Promise<SubtopicInfo[]> {
    const prompt = `You are analyzing research findings about "${topic}" to discover subtopics for further exploration. You have NO prior knowledge about this topic - use ONLY the research insights provided.

RESEARCH FINDINGS - YOUR ONLY KNOWLEDGE SOURCE:
${synthesis.keyInsights?.join("\n- ") || ""}

THEMES DISCOVERED IN RESEARCH:
${synthesis.contentThemes?.join("\n- ") || ""}

SUBTOPIC IDENTIFICATION INSTRUCTIONS:
Based ONLY on what the research revealed, identify exactly 5 subtopics that:

1. Are MENTIONED or IMPLIED in the research findings above
2. Represent different aspects discovered through research
3. Would benefit from their own dedicated research (not covered in depth by current research)
4. Are substantial enough based on research mentions/themes
5. Logically connect to the main topic based on research findings

ANALYSIS APPROACH:
- Look through the research insights for specific areas mentioned
- Examine the themes for different aspects of the topic
- Identify gaps where research pointed to areas needing deeper exploration
- Consider different angles the research revealed (causes, effects, applications, etc.)
- Select subtopics that would expand knowledge beyond current research

PRIORITY ASSIGNMENT (1=highest, 5=lowest):
- Priority 1: Most frequently mentioned or most fundamental based on research
- Priority 2-5: Decreasing importance based on research emphasis and relevance

COMPLEXITY ASSIGNMENT:
- Use EXACTLY one of these values: "beginner", "intermediate", or "advanced"
- Do NOT use combinations like "beginner-intermediate" or hyphenated values
- Choose based on the language and concepts mentioned in the research:
  * "beginner": Simple concepts, basic terminology, foundational ideas
  * "intermediate": Moderate complexity, some technical terms, building on basics  
  * "advanced": Complex concepts, specialized terminology, expert-level topics

OUTPUT FORMAT REQUIREMENTS:
You MUST provide exactly 5 subtopics in this JSON format:

{
  "subtopics": [
    {
      "title": "Subtopic 1 Name",
      "description": "Brief description of what this covers",
      "priority": 1,
      "complexity": "beginner"
    },
    {
      "title": "Subtopic 2 Name", 
      "description": "Brief description",
      "priority": 2,
      "complexity": "intermediate"
    },
    ... (continue for all 5 subtopics)
  ]
}

CRITICAL REQUIREMENTS:
- MUST include exactly 5 subtopics in the subtopics array
- Each priority must be unique (1, 2, 3, 4, 5)
- Each complexity must be exactly: "beginner", "intermediate", or "advanced"
- Base subtopics ONLY on what the research findings and themes reveal
- Do not add subtopics from your own knowledge - only those that emerged from the research data`;

    try {
      const result = await (generateObject as any)({
        model: this.fastModel, // Use faster model for subtopic identification
        prompt,
        schema: SubtopicsSchema,
        temperature: 0.6, // Lower temperature for more consistent structure
      });

      if (!result.object || !result.object.subtopics || !Array.isArray(result.object.subtopics)) {
        throw new Error('Invalid subtopics structure generated');
      }

      return result.object.subtopics.map((subtopic: any) => ({
        ...subtopic,
        estimatedReadTime: this.estimateSubtopicReadTime(subtopic.complexity),
      }));
      
    } catch (error) {
      console.error('Structured subtopic generation failed, creating fallback subtopics:', error);
      
      // Fallback: Create basic subtopics based on research themes
      const themes = synthesis.contentThemes || [];
      const fallbackSubtopics = themes.slice(0, 5).map((theme: string, index: number) => ({
        title: theme,
        description: `Exploration of ${theme} as mentioned in research findings`,
        priority: index + 1,
        complexity: index < 2 ? "beginner" : index < 4 ? "intermediate" : "advanced",
        estimatedReadTime: this.estimateSubtopicReadTime(index < 2 ? "beginner" : index < 4 ? "intermediate" : "advanced")
      }));

      // If we don't have enough themes, pad with generic subtopics
      while (fallbackSubtopics.length < 5) {
        const index = fallbackSubtopics.length;
        fallbackSubtopics.push({
          title: `${topic} - Aspect ${index + 1}`,
          description: `Additional aspect of ${topic} for further exploration`,
          priority: index + 1,
          complexity: "intermediate",
          estimatedReadTime: this.estimateSubtopicReadTime("intermediate")
        });
      }

      return fallbackSubtopics.slice(0, 5); // Ensure exactly 5 subtopics
    }
  }

  // Helper methods
  private deduplicateResults<T extends { title: string; url: string }>(
    results: T[],
  ): T[] {
    const seen = new Set<string>();
    return results.filter((result) => {
      const key = `${result.title.toLowerCase()}-${result.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private buildSourceAttributions(
    researchResults: Array<SearchResult & { engine: string }>,
    sections: ContentSection[],
  ): SourceAttribution[] {
    return researchResults.map((result, index) => ({
      id: `source-${index + 1}`,
      title: result.title,
      url: result.url,
      source: result.source || result.engine,
      engine: result.engine,
      relevanceScore: result.relevanceScore || 0.5,
      credibilityScore: this.calculateCredibilityScore(result),
      contentType: this.classifyContentType(result),
      usedInSections: this.findUsageInSections(result, sections),
    }));
  }

  private calculateCredibilityScore(result: SearchResult): number {
    let score = 0.5;

    // URL-based credibility
    if (result.url.includes(".edu") || result.url.includes(".gov"))
      score += 0.3;
    else if (result.url.includes("wikipedia.org")) score += 0.2;
    else if (result.url.includes("arxiv.org") || result.url.includes("pubmed"))
      score += 0.4;

    // Title-based indicators
    const title = result.title.toLowerCase();
    if (title.includes("research") || title.includes("study")) score += 0.1;
    if (title.includes("peer-reviewed")) score += 0.2;

    return Math.min(score, 1.0);
  }

  private classifyContentType(
    result: SearchResult,
  ): SourceAttribution["contentType"] {
    const url = result.url.toLowerCase();
    const title = result.title.toLowerCase();

    if (url.includes("youtube.com") || url.includes("video")) return "video";
    if (
      url.includes("arxiv") ||
      url.includes("pubmed") ||
      title.includes("research")
    )
      return "academic";
    if (url.includes("reddit.com") || url.includes("forum"))
      return "discussion";
    if (url.includes("docs") || title.includes("documentation"))
      return "documentation";

    return "article";
  }

  private findUsageInSections(
    result: SearchResult,
    sections: ContentSection[],
  ): string[] {
    // Simplified - in practice you'd track which sources were used in which sections
    return sections
      .filter((section) =>
        section.sources.some((sourceRef) =>
          sourceRef.includes(result.title.slice(0, 20)),
        ),
      )
      .map((section) => section.title);
  }

  private calculateConfidenceScore(
    researchResults: SearchResult[],
    content: GeneratedContent,
  ): number {
    const sourceQuality =
      researchResults.reduce((sum, r) => sum + (r.relevanceScore || 0.5), 0) /
      researchResults.length;
    const contentDepth = Math.min(content.sections.length / 5, 1); // Expect ~5 sections for full score
    const sourceCount = Math.min(researchResults.length / 15, 1); // Expect ~15 sources for full score

    return sourceQuality * 0.4 + contentDepth * 0.3 + sourceCount * 0.3;
  }

  private generateCacheKey(topic: string, userContext?: any): string {
    const baseKey = topic.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const contextKey = userContext?.level || "general";
    return `${baseKey}-${contextKey}`;
  }

  private formatAsMDX(content: {
    title: string;
    sections: ContentSection[];
    keyTakeaways: string[];
    nextSteps: string[];
  }): string {
    let mdx = `# ${content.title}\n\n`;

    content.sections.forEach((section, index) => {
      mdx += `## ${section.title}\n\n`;
      mdx += `${section.content}\n\n`;
      
      // Add section separator for non-final sections
      if (index < content.sections.length - 1) {
        mdx += `---\n\n`;
      }
    });

    if (content.keyTakeaways.length > 0) {
      mdx += `## Key Takeaways\n\n`;
      content.keyTakeaways.forEach((takeaway) => {
        mdx += `- ${takeaway}\n`;
      });
      mdx += "\n";
    }

    if (content.nextSteps.length > 0) {
      mdx += `## Next Steps\n\n`;
      content.nextSteps.forEach((step, index) => {
        mdx += `${index + 1}. ${step}\n`;
      });
      mdx += "\n";
    }

    return mdx;
  }

  private estimateReadTime(contentLength: number): number {
    const wordsPerMinute = 200;
    const wordCount = contentLength / 5; // Rough estimate: 5 chars per word
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  private estimateSubtopicReadTime(complexity: string): number {
    switch (complexity) {
      case "beginner":
        return 5;
      case "intermediate":
        return 10;
      case "advanced":
        return 15;
      default:
        return 8;
    }
  }

  /**
   * Weight sources to prioritize practical understanding while maintaining academic credibility
   * Requirement 2.4: prioritize practical understanding over theoretical complexity
   * Requirement 4.3: balance academic credibility with accessibility
   */
  private weightSourcesForPracticalUnderstanding(
    results: Array<SearchResult & { engine: string; reasoning: string }>
  ): Array<SearchResult & { engine: string; reasoning: string; practicalWeight: number }> {
    return results.map(result => {
      let practicalWeight = result.relevanceScore || 0.5;
      
      // Enhanced weighting for general sources (Requirement 2.4)
      if (result.engine === "general") {
        practicalWeight *= 1.3; // Boost general sources for practical understanding
      }
      
      // Moderate boost for community sources (practical experiences)
      if (result.engine === "community") {
        practicalWeight *= 1.2;
      }
      
      // Maintain academic credibility but don't over-prioritize
      if (result.engine === "academic") {
        practicalWeight *= 1.1; // Slight boost for credibility
      }
      
      // Boost sources with practical indicators in title/content
      const practicalIndicators = [
        'practical', 'application', 'example', 'use', 'how to', 'guide', 
        'tutorial', 'real world', 'implementation', 'benefits', 'advantages'
      ];
      
      const titleAndSnippet = `${result.title} ${result.snippet}`.toLowerCase();
      const practicalMatches = practicalIndicators.filter(indicator => 
        titleAndSnippet.includes(indicator)
      ).length;
      
      if (practicalMatches > 0) {
        practicalWeight *= (1 + practicalMatches * 0.1); // Boost based on practical indicators
      }
      
      return {
        ...result,
        practicalWeight: Math.min(practicalWeight, 1.0) // Cap at 1.0
      };
    }).sort((a, b) => (b.practicalWeight || 0) - (a.practicalWeight || 0));
  }

  // Enhanced text parsing helpers focused on practical understanding
  private extractPracticalInsights(text: string): string[] {
    // Extract bullet points or numbered items as insights, prioritizing practical ones
    const insights = text.match(/[•\-\*]\s*([^\n]+)/g) || [];
    const practicalInsights = insights
      .map((item) => item.replace(/^[•\-\*]\s*/, "").trim())
      .filter(insight => {
        const practicalKeywords = [
          'practical', 'application', 'use', 'example', 'real world', 
          'implementation', 'benefit', 'advantage', 'how', 'when', 'where'
        ];
        const lowerInsight = insight.toLowerCase();
        return practicalKeywords.some(keyword => lowerInsight.includes(keyword));
      });
    
    // If we have practical insights, prioritize them; otherwise use general insights
    const finalInsights = practicalInsights.length > 0 ? practicalInsights : 
      insights.map((item) => item.replace(/^[•\-\*]\s*/, "").trim());
    
    return finalInsights.slice(0, 5);
  }

  private extractPracticalThemes(text: string): string[] {
    // Enhanced keyword extraction focusing on practical themes
    const commonWords = [
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"
    ];
    
    // Prioritize practical terms
    const practicalTerms = [
      'application', 'practical', 'example', 'implementation', 'benefit', 
      'advantage', 'solution', 'method', 'approach', 'technique', 'strategy'
    ];
    
    const words = text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 4 && !commonWords.includes(word));

    // Count word frequency with boost for practical terms
    const frequency: Record<string, number> = {};
    words.forEach((word) => {
      const baseCount = (frequency[word] || 0) + 1;
      const practicalBoost = practicalTerms.includes(word) ? 2 : 1;
      frequency[word] = baseCount * practicalBoost;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Assess source quality with balance between academic credibility and practical accessibility
   * Requirement 4.3: balance academic credibility with accessibility
   */
  private assessBalancedSourceQuality(
    results: Array<SearchResult & { engine: string }>
  ): "high" | "medium" | "low" {
    const avgRelevance =
      results.reduce((sum, r) => sum + (r.relevanceScore || 0.5), 0) /
      results.length;
    
    // Count both academic credibility and practical accessibility sources
    const credibleSources = results.filter(
      (r) =>
        r.url.includes(".edu") ||
        r.url.includes(".gov") ||
        r.url.includes("arxiv")
    ).length;
    
    const generalSources = results.filter(r => r.engine === "general").length;
    const practicalSources = results.filter(r => 
      r.engine === "community" || r.engine === "general"
    ).length;
    
    // Balance academic credibility with practical accessibility
    const credibilityScore = credibleSources / results.length;
    const accessibilityScore = practicalSources / results.length;
    const balanceScore = (credibilityScore + accessibilityScore) / 2;

    if (avgRelevance > 0.7 && balanceScore > 0.4) return "high";
    if (avgRelevance > 0.5 && balanceScore > 0.25) return "medium";
    return "low";
  }

  /**
   * Calculate comprehensiveness with emphasis on practical understanding
   * Requirement 2.4: weight general sources appropriately
   */
  private calculatePracticalComprehensiveness(
    results: Array<SearchResult & { engine: string }>
  ): number {
    // Enhanced heuristic that values both source diversity and practical coverage
    const engines = new Set(results.map((r) => r.engine));
    const engineDiversity = engines.size / 5; // Expect up to 5 different engines
    const sourceCount = Math.min(results.length / 20, 1); // Expect ~20 sources for full score
    
    // Bonus for having good general source coverage (practical understanding)
    const generalSources = results.filter(r => r.engine === "general").length;
    const generalCoverage = Math.min(generalSources / 5, 1); // Expect at least 5 general sources
    
    // Weight: 40% engine diversity, 40% source count, 20% general coverage
    return engineDiversity * 0.4 + sourceCount * 0.4 + generalCoverage * 0.2;
  }

  /**
   * Assess how well the research focuses on practical understanding
   * New metric to track practical understanding emphasis
   */
  private assessPracticalFocus(
    results: Array<SearchResult & { engine: string }>
  ): "high" | "medium" | "low" {
    const generalRatio = results.filter(r => r.engine === "general").length / results.length;
    const practicalRatio = results.filter(r => 
      r.engine === "general" || r.engine === "community"
    ).length / results.length;
    
    // Check for practical keywords in titles/snippets
    const practicalKeywords = [
      'practical', 'application', 'example', 'tutorial', 'guide', 'how to',
      'real world', 'implementation', 'benefits', 'use case'
    ];
    
    const practicalContentRatio = results.filter(result => {
      const content = `${result.title} ${result.snippet}`.toLowerCase();
      return practicalKeywords.some(keyword => content.includes(keyword));
    }).length / results.length;
    
    const overallPracticalScore = (practicalRatio + practicalContentRatio) / 2;
    
    if (overallPracticalScore > 0.6) return "high";
    if (overallPracticalScore > 0.3) return "medium";
    return "low";
  }

  // Legacy methods for backward compatibility
  private extractInsights(text: string): string[] {
    return this.extractPracticalInsights(text);
  }

  private extractThemes(text: string): string[] {
    return this.extractPracticalThemes(text);
  }

  private assessSourceQuality(results: SearchResult[]): "high" | "medium" | "low" {
    return this.assessBalancedSourceQuality(results as Array<SearchResult & { engine: string }>);
  }

  private calculateComprehensiveness(results: SearchResult[]): number {
    return this.calculatePracticalComprehensiveness(results as Array<SearchResult & { engine: string }>);
  }

  // Helper methods for content generation fallback
  private ensureStringArray(arr: any): string[] {
    if (!Array.isArray(arr)) return [];

    return arr
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          // If it's an object, try to extract a string value
          return (
            item.text ||
            item.content ||
            item.title ||
            item.description ||
            JSON.stringify(item)
          );
        }
        return String(item);
      })
      .filter((item) => item && item.trim().length > 0);
  }

  private parseContentFallback(text: string, topic: string): any {
    // Fallback parsing if structured generation fails
    // This is a simple implementation - in production you might want more sophisticated parsing

    try {
      // Try to find JSON-like structure in the text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      // JSON parsing failed, create manual structure
    }

    // Manual fallback structure
    const sections = [
      {
        title: "Overview",
        content: text.length > 500 ? text.substring(0, 500) + "..." : text,
        sources: [],
      },
    ];

    const keyTakeaways = text
      .split("\n")
      .filter(
        (line) => line.trim().startsWith("-") || line.trim().startsWith("•"),
      )
      .map((line) => line.replace(/^[-•]\s*/, "").trim())
      .slice(0, 5);

    const nextSteps = [
      "Research specific subtopics in more detail",
      "Explore practical applications",
      "Review additional sources and examples",
    ];

    return {
      title: topic,
      sections,
      keyTakeaways:
        keyTakeaways.length > 0
          ? keyTakeaways
          : ["Key concepts identified from research"],
      nextSteps,
    };
  }

  /**
   * Infer section complexity based on position in learning sequence
   * Requirements 3.2, 3.3: Organize information in logical learning sequence and break down complex topics
   */
  private inferSectionComplexity(index: number, totalSections: number): "foundation" | "building" | "application" {
    const position = index / (totalSections - 1); // 0 to 1
    
    if (position <= 0.33) {
      return "foundation"; // First third - foundational concepts
    } else if (position <= 0.66) {
      return "building"; // Middle third - building concepts
    } else {
      return "application"; // Final third - practical applications
    }
  }

  /**
   * Validate that content follows progressive learning structure
   * Requirements 3.2, 3.3, 3.4: Logical sequence, digestible components, clear knowledge building
   */
  private validateProgressiveLearningStructure(sections: ContentSection[]): void {
    if (sections.length < 3) {
      console.warn("⚠️ Progressive learning: Content should have at least 3 sections for proper progression");
      return;
    }

    // Check for foundational content in early sections
    const earlyTitles = sections.slice(0, Math.ceil(sections.length / 3))
      .map(s => s.title.toLowerCase());
    
    const hasFoundationalStart = earlyTitles.some(title =>
      title.includes('basic') ||
      title.includes('foundation') ||
      title.includes('introduction') ||
      title.includes('what is') ||
      title.includes('overview') ||
      title.includes('fundamental')
    );

    // Check for practical applications in later sections
    const lateTitles = sections.slice(Math.floor(sections.length * 2/3))
      .map(s => s.title.toLowerCase());
    
    const hasPracticalEnd = lateTitles.some(title =>
      title.includes('application') ||
      title.includes('practical') ||
      title.includes('example') ||
      title.includes('use') ||
      title.includes('getting started') ||
      title.includes('implement')
    );

    // Check for logical complexity progression
    const complexityProgression = sections.map(s => s.complexity);
    const hasLogicalProgression = this.validateComplexityProgression(complexityProgression);

    // Log validation results
    if (!hasFoundationalStart) {
      console.warn("⚠️ Progressive learning: Missing foundational concepts in early sections");
    }
    
    if (!hasPracticalEnd) {
      console.warn("⚠️ Progressive learning: Missing practical applications in later sections");
    }
    
    if (!hasLogicalProgression) {
      console.warn("⚠️ Progressive learning: Complexity progression may not be optimal");
    }

    if (hasFoundationalStart && hasPracticalEnd && hasLogicalProgression) {
      console.log("✅ Progressive learning structure validated: foundation → building → application");
    }
  }

  /**
   * Validate that complexity progresses logically through sections
   * Requirement 3.4: Each section builds upon previous knowledge clearly
   */
  private validateComplexityProgression(complexities: (string | undefined)[]): boolean {
    const complexityOrder = { "foundation": 1, "building": 2, "application": 3 };
    
    let previousLevel = 0;
    let hasProgression = true;
    
    for (const complexity of complexities) {
      if (!complexity) continue;
      
      const currentLevel = complexityOrder[complexity as keyof typeof complexityOrder] || 2;
      
      // Allow same level or progression, but not regression
      if (currentLevel < previousLevel - 1) {
        hasProgression = false;
        break;
      }
      
      previousLevel = Math.max(previousLevel, currentLevel);
    }
    
    return hasProgression;
  }

  /**
   * Enhanced content validation for accessibility and structure
   * Requirements 3.5, 4.4, 4.5: Validate accessibility, structure, logical flow, and clear takeaways
   */
  private validateContentAccessibility(content: GeneratedContent): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Validate content accessibility (Requirement 3.5)
    this.validateLanguageAccessibility(content, issues, suggestions);
    
    // Validate content structure (Requirement 4.4)
    this.validateContentStructure(content, issues, suggestions);
    
    // Validate logical flow (Requirement 4.5)
    this.validateLogicalFlow(content, issues, suggestions);
    
    // Validate clear takeaways (Requirement 4.5)
    this.validateClearTakeaways(content, issues, suggestions);

    const isValid = issues.length === 0;
    
    if (!isValid) {
      console.warn(`⚠️ Content validation found ${issues.length} issues:`, issues);
    } else {
      console.log("✅ Content accessibility and structure validation passed");
    }

    return { isValid, issues, suggestions };
  }

  /**
   * Validate language accessibility
   * Requirement 3.5: Content maintains accessibility
   */
  private validateLanguageAccessibility(
    content: GeneratedContent, 
    issues: string[], 
    suggestions: string[]
  ): void {
    // Check for overly complex sentences
    const allText = content.sections.map(s => s.content).join(' ');
    const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const longSentences = sentences.filter(sentence => sentence.split(' ').length > 25);
    if (longSentences.length > sentences.length * 0.2) {
      issues.push("Content contains too many complex sentences (>25 words)");
      suggestions.push("Break down complex sentences into shorter, clearer statements");
    }

    // Check for technical jargon without explanation
    const technicalTerms = this.identifyTechnicalTerms(allText);
    const unexplainedTerms = technicalTerms.filter(term => 
      !this.hasExplanation(term, allText)
    );
    
    if (unexplainedTerms.length > 0) {
      issues.push(`Technical terms used without explanation: ${unexplainedTerms.slice(0, 3).join(', ')}`);
      suggestions.push("Provide simple explanations for technical terms when first introduced");
    }

    // Check for practical examples
    const hasExamples = content.sections.some(section => 
      section.content.toLowerCase().includes('example') ||
      section.content.toLowerCase().includes('for instance') ||
      section.content.toLowerCase().includes('such as')
    );
    
    if (!hasExamples) {
      issues.push("Content lacks practical examples for accessibility");
      suggestions.push("Add real-world examples to illustrate abstract concepts");
    }
  }

  /**
   * Validate content structure for progressive learning
   * Requirement 4.4: Content maintains logical structure
   */
  private validateContentStructure(
    content: GeneratedContent, 
    issues: string[], 
    suggestions: string[]
  ): void {
    // Validate section count
    if (content.sections.length < 3) {
      issues.push("Content has too few sections for proper learning progression");
      suggestions.push("Include at least 3 sections: foundation, building, and application");
    }

    if (content.sections.length > 6) {
      issues.push("Content has too many sections, may overwhelm learners");
      suggestions.push("Consolidate content into 3-6 focused sections");
    }

    // Validate section balance
    const sectionLengths = content.sections.map(s => s.content.length);
    const avgLength = sectionLengths.reduce((sum, len) => sum + len, 0) / sectionLengths.length;
    const imbalancedSections = sectionLengths.filter(len => 
      len < avgLength * 0.3 || len > avgLength * 3
    );

    if (imbalancedSections.length > 0) {
      issues.push("Sections are significantly imbalanced in length");
      suggestions.push("Ensure sections are roughly balanced to maintain learning flow");
    }

    // Validate learning objectives
    const sectionsWithObjectives = content.sections.filter(s => s.learningObjective);
    if (sectionsWithObjectives.length < content.sections.length * 0.5) {
      issues.push("Many sections lack clear learning objectives");
      suggestions.push("Add learning objectives to help learners understand section goals");
    }
  }

  /**
   * Validate logical flow between sections
   * Requirement 4.5: Content maintains logical flow
   */
  private validateLogicalFlow(
    content: GeneratedContent, 
    issues: string[], 
    suggestions: string[]
  ): void {
    // Check for transitional language between sections
    const hasTransitions = content.sections.slice(1).some((section, index) => {
      const sectionStart = section.content.substring(0, 200).toLowerCase();
      const transitionWords = [
        'building on', 'now that', 'with this understanding', 'next', 
        'following', 'after', 'once you understand', 'having covered'
      ];
      return transitionWords.some(word => sectionStart.includes(word));
    });

    if (!hasTransitions) {
      issues.push("Sections lack transitional language for smooth flow");
      suggestions.push("Add connecting phrases to link sections and show progression");
    }

    // Validate complexity progression
    const complexities = content.sections.map(s => s.complexity).filter(Boolean);
    if (complexities.length > 0 && !this.validateComplexityProgression(complexities)) {
      issues.push("Section complexity does not follow logical progression");
      suggestions.push("Ensure sections progress from foundation to building to application");
    }

    // Check for concept building
    const conceptWords = this.extractKeyConceptWords(content.sections[0]?.content || '');
    const laterSectionsReferenceEarlyConcepts = content.sections.slice(1).some(section => 
      conceptWords.some(concept => 
        section.content.toLowerCase().includes(concept.toLowerCase())
      )
    );

    if (conceptWords.length > 0 && !laterSectionsReferenceEarlyConcepts) {
      issues.push("Later sections don't build upon concepts from earlier sections");
      suggestions.push("Reference and build upon concepts introduced in earlier sections");
    }
  }

  /**
   * Validate clear takeaways and actionable content
   * Requirement 4.5: Content provides clear takeaways
   */
  private validateClearTakeaways(
    content: GeneratedContent, 
    issues: string[], 
    suggestions: string[]
  ): void {
    // Validate key takeaways quality
    if (content.keyTakeaways.length < 3) {
      issues.push("Too few key takeaways for comprehensive understanding");
      suggestions.push("Include 3-7 key takeaways that summarize main learning points");
    }

    // Check takeaway clarity and actionability
    const vagueTakeaways = content.keyTakeaways.filter(takeaway => {
      const vagueWords = ['important', 'useful', 'good', 'bad', 'interesting', 'complex'];
      return vagueWords.some(word => takeaway.toLowerCase().includes(word)) &&
             !this.hasSpecificDetails(takeaway);
    });

    if (vagueTakeaways.length > content.keyTakeaways.length * 0.3) {
      issues.push("Key takeaways are too vague or generic");
      suggestions.push("Make takeaways specific and actionable with concrete details");
    }

    // Validate next steps actionability
    if (content.nextSteps.length < 2) {
      issues.push("Too few next steps for continued learning");
      suggestions.push("Include 2-5 specific, actionable next steps");
    }

    const nonActionableSteps = content.nextSteps.filter(step => {
      const actionWords = ['try', 'practice', 'explore', 'build', 'create', 'implement', 'learn', 'study'];
      return !actionWords.some(word => step.toLowerCase().includes(word));
    });

    if (nonActionableSteps.length > content.nextSteps.length * 0.5) {
      issues.push("Next steps are not sufficiently actionable");
      suggestions.push("Use action verbs and specific activities in next steps");
    }
  }

  /**
   * Implement fallback mechanisms for content generation failures
   * Requirements 3.5, 4.4, 4.5: Fallback mechanisms for generation failures
   */
  private createFallbackContent(
    topic: string, 
    synthesis: any, 
    error: Error
  ): GeneratedContent {
    console.warn(`🔧 Creating fallback content for "${topic}" due to generation failure:`, error.message);

    // Extract available insights and themes
    const insights = synthesis?.keyInsights || [];
    const themes = synthesis?.contentThemes || [];
    
    // Create basic progressive structure
    const sections: ContentSection[] = [
      {
        title: `Understanding ${topic} - Foundation`,
        content: this.createFoundationContent(topic, insights.slice(0, 2)),
        sources: [],
        complexity: "foundation",
        learningObjective: `Understand the basic concepts of ${topic}`
      },
      {
        title: `Key Components of ${topic}`,
        content: this.createBuildingContent(topic, insights.slice(2, 4), themes.slice(0, 2)),
        sources: [],
        complexity: "building", 
        learningObjective: `Identify the main elements and components of ${topic}`
      },
      {
        title: `Practical Applications of ${topic}`,
        content: this.createApplicationContent(topic, insights.slice(4), themes.slice(2)),
        sources: [],
        complexity: "application",
        learningObjective: `Apply ${topic} concepts in practical situations`
      }
    ];

    // Create fallback takeaways and next steps
    const keyTakeaways = this.createFallbackTakeaways(topic, insights, themes);
    const nextSteps = this.createFallbackNextSteps(topic);

    const fallbackContent: GeneratedContent = {
      title: `Understanding ${topic}`,
      content: this.formatAsMDX({
        title: `Understanding ${topic}`,
        sections,
        keyTakeaways,
        nextSteps
      }),
      sections,
      keyTakeaways,
      nextSteps,
      estimatedReadTime: this.estimateReadTime(
        sections.reduce((total, section) => total + section.content.length, 0)
      )
    };

    // Validate the fallback content
    const validation = this.validateContentAccessibility(fallbackContent);
    if (!validation.isValid) {
      console.warn("⚠️ Fallback content validation issues:", validation.issues);
      // Apply basic fixes to fallback content
      this.applyBasicContentFixes(fallbackContent, validation.suggestions);
    }

    console.log("✅ Fallback content created with progressive learning structure");
    return fallbackContent;
  }

  /**
   * Helper methods for fallback content creation
   */
  private createFoundationContent(topic: string, insights: string[]): string {
    const baseContent = `${topic} is a concept that requires understanding from multiple perspectives. `;
    
    if (insights.length > 0) {
      return baseContent + `Based on research findings:\n\n${insights.map(insight => `- ${insight}`).join('\n')}\n\nThese foundational insights help us understand what ${topic} involves and why it's important to study.`;
    }
    
    return baseContent + `To understand ${topic} effectively, we need to start with the basic concepts and build our knowledge progressively. This foundation will help us explore more complex aspects in the following sections.`;
  }

  private createBuildingContent(topic: string, insights: string[], themes: string[]): string {
    let content = `Building on our foundational understanding of ${topic}, we can now explore its key components and characteristics.\n\n`;
    
    if (insights.length > 0) {
      content += `Key insights from research include:\n${insights.map(insight => `- ${insight}`).join('\n')}\n\n`;
    }
    
    if (themes.length > 0) {
      content += `Important themes that emerge include:\n${themes.map(theme => `- ${theme}`).join('\n')}\n\n`;
    }
    
    content += `These elements work together to form a comprehensive understanding of ${topic} and prepare us for practical applications.`;
    
    return content;
  }

  private createApplicationContent(topic: string, insights: string[], themes: string[]): string {
    let content = `Now that we understand the foundations and key components of ${topic}, we can explore how these concepts apply in practical situations.\n\n`;
    
    if (insights.length > 0) {
      content += `Practical insights include:\n${insights.map(insight => `- ${insight}`).join('\n')}\n\n`;
    }
    
    if (themes.length > 0) {
      content += `Real-world applications involve:\n${themes.map(theme => `- ${theme}`).join('\n')}\n\n`;
    }
    
    content += `These applications demonstrate how ${topic} can be used effectively in various contexts and situations.`;
    
    return content;
  }

  private createFallbackTakeaways(topic: string, insights: string[], themes: string[]): string[] {
    const takeaways: string[] = [
      `${topic} involves multiple interconnected concepts that build upon each other`,
      `Understanding the foundations is essential before exploring advanced applications`,
      `Practical applications help bridge theoretical knowledge with real-world usage`
    ];

    // Add insight-based takeaways if available
    if (insights.length > 0) {
      takeaways.push(`Research reveals key insights about ${topic} that inform practical understanding`);
    }

    if (themes.length > 0) {
      takeaways.push(`Multiple themes and perspectives contribute to comprehensive ${topic} knowledge`);
    }

    return takeaways.slice(0, 5); // Limit to 5 takeaways
  }

  private createFallbackNextSteps(topic: string): string[] {
    return [
      `Explore specific aspects of ${topic} that interest you most`,
      `Practice applying ${topic} concepts in simple, real-world scenarios`,
      `Seek out additional resources and examples to deepen understanding`,
      `Connect with others who have experience with ${topic}`,
      `Start with small, manageable projects to build practical skills`
    ].slice(0, 4); // Limit to 4 next steps
  }

  /**
   * Apply basic fixes to content based on validation suggestions
   */
  private applyBasicContentFixes(content: GeneratedContent, suggestions: string[]): void {
    // Add learning objectives if missing
    content.sections.forEach((section, index) => {
      if (!section.learningObjective) {
        section.learningObjective = `Understand ${section.title.toLowerCase()}`;
      }
    });

    // Ensure minimum takeaways
    while (content.keyTakeaways.length < 3) {
      content.keyTakeaways.push(`Important aspect of ${content.title} for continued learning`);
    }

    // Ensure minimum next steps
    while (content.nextSteps.length < 2) {
      content.nextSteps.push(`Continue exploring ${content.title} through additional resources`);
    }

    console.log("🔧 Applied basic content fixes based on validation suggestions");
  }

  /**
   * Helper methods for content validation
   */
  private identifyTechnicalTerms(text: string): string[] {
    // Simple heuristic: words that are capitalized, contain technical suffixes, or are domain-specific
    const technicalPatterns = [
      /\b[A-Z][a-z]*(?:[A-Z][a-z]*)+\b/g, // CamelCase words
      /\b\w+(?:tion|sion|ment|ness|ity|ism|ology|graphy)\b/g, // Technical suffixes
      /\b(?:API|SDK|HTTP|JSON|XML|SQL|AI|ML|IoT|VR|AR)\b/g // Common technical acronyms
    ];

    const terms = new Set<string>();
    technicalPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => terms.add(match));
    });

    return Array.from(terms).slice(0, 10); // Limit to 10 terms for performance
  }

  private hasExplanation(term: string, text: string): boolean {
    const explanationPatterns = [
      new RegExp(`${term}\\s+(?:is|means|refers to|stands for)`, 'i'),
      new RegExp(`(?:is|means|refers to|stands for)\\s+${term}`, 'i'),
      new RegExp(`${term}\\s*\\([^)]+\\)`, 'i'), // Term with parenthetical explanation
      new RegExp(`${term}\\s*[-–—]\\s*[a-z]`, 'i') // Term with dash explanation
    ];

    return explanationPatterns.some(pattern => pattern.test(text));
  }

  private hasSpecificDetails(text: string): boolean {
    // Check for specific numbers, examples, or concrete details
    const specificPatterns = [
      /\d+/g, // Numbers
      /\b(?:example|instance|such as|like|including)\b/i, // Example indicators
      /\b(?:specifically|particularly|exactly|precisely)\b/i // Specificity indicators
    ];

    return specificPatterns.some(pattern => pattern.test(text));
  }

  private extractKeyConceptWords(text: string): string[] {
    // Extract important nouns and concepts from the first section
    const words = text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 4)
      .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were'].includes(word));

    // Simple frequency analysis
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }
}

// Export singleton instance
export const aiLearningAgent = new AILearningAgent();
