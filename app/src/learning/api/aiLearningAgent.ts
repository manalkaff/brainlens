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
        title: z.string().describe("Section title"),
        content: z.string().describe("Detailed content for this section"),
        sources: z
          .array(z.string())
          .describe(
            "Source references used in this section - must be strings only",
          ),
      }),
    )
    .describe("Array of content sections"),
  keyTakeaways: z
    .array(z.string())
    .describe(
      "Main learning points - must be an array of strings only, not objects",
    ),
  nextSteps: z
    .array(z.string())
    .describe(
      "Suggested next learning steps - must be an array of strings only, not objects",
    ),
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
        request.userContext,
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
          enginesUsed: [...new Set(researchResults.map((r) => r.engine))],
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

INSTRUCTIONS:
1. Base your research plan ONLY on the understanding provided above
2. Use the engine recommendations from the research analysis
3. Focus on ${understanding.researchApproach} approach as indicated by the research
4. Create 4-6 targeted research queries that will build upon the basic understanding
5. Do NOT use engines that were marked "not recommended" unless absolutely essential
6. Each query should be specific and progressive - building from basic to more detailed understanding

Your goal: Create targeted searches that will expand knowledge from the basic definition to comprehensive understanding, following the research-driven recommendations above.`;

    try {
      const result = await (generateObject as any)({
        model: this.model,
        prompt,
        schema: ResearchPlanSchema,
        temperature: 0.6, // Lower temperature for more consistent, logical planning
      });

      // Validate the result structure
      if (!result.object || !result.object.researchQueries || !Array.isArray(result.object.researchQueries)) {
        throw new Error('Invalid research plan structure generated');
      }

      return result.object;
      
    } catch (error) {
      console.error('Structured research plan generation failed, creating fallback plan:', error);
      
      // Fallback research plan based on understanding
      const fallbackQueries: { query: string; engine: string; reasoning: string }[] = [];
      
      // Always include general search
      fallbackQueries.push({
        query: `${topic} overview introduction basics`,
        engine: "general",
        reasoning: "Basic overview to understand fundamental concepts"
      });

      // Add engine-specific queries based on recommendations
      if (understanding.engineRecommendations.academic) {
        fallbackQueries.push({
          query: `${topic} research studies academic papers`,
          engine: "academic", 
          reasoning: "Academic research for scholarly perspective"
        });
      }

      if (understanding.engineRecommendations.video && fallbackQueries.length < 5) {
        fallbackQueries.push({
          query: `${topic} tutorial explanation video`,
          engine: "video",
          reasoning: "Visual content for better understanding"
        });
      }

      if (understanding.engineRecommendations.community && fallbackQueries.length < 5) {
        fallbackQueries.push({
          query: `${topic} discussion forum community insights`,
          engine: "community",
          reasoning: "Community perspectives and practical insights"
        });
      }

      // Pad with general queries if needed
      while (fallbackQueries.length < 4) {
        fallbackQueries.push({
          query: `${topic} detailed information guide`,
          engine: "general",
          reasoning: "Additional general information for comprehensive coverage"
        });
      }

      return {
        researchQueries: fallbackQueries.slice(0, 6), // Max 6 queries
        researchStrategy: `Fallback research strategy for ${topic} focusing on ${understanding.researchApproach} approach`,
        expectedOutcomes: [
          `Basic understanding of ${topic}`,
          `Key concepts and terminology`,
          `Practical applications and examples`,
          `Different perspectives and approaches`
        ]
      };
    }
  }

  /**
   * Execute research using planned queries and engines
   */
  private async executeResearch(researchPlan: {
    researchQueries: Array<{
      query: string;
      engine: AgentConfigName;
      reasoning: string;
    }>;
    researchStrategy: string;
    expectedOutcomes: string[];
  }): Promise<Array<SearchResult & { engine: string; reasoning: string }>> {
    const results: Array<SearchResult & { engine: string; reasoning: string }> =
      [];

    // Execute research queries in parallel for efficiency
    const researchPromises = researchPlan.researchQueries.map(
      async ({ query, engine, reasoning }) => {
        try {
          console.log(`  🔍 Searching ${engine}: "${query}"`);
          const response = await SearxngUtils.searchWithAgent(
            engine as AgentConfigName,
            query,
          );

          return response.results.map((result) => ({
            ...result,
            title: result.title || "Untitled",
            url: result.url || "#",
            snippet: result.content || result.snippet || "No description",
            source: result.engine || engine,
            relevanceScore: result.score || 0.5,
            engine: engine,
            reasoning: reasoning,
          }));
        } catch (error) {
          console.error(`Failed to search ${engine} for "${query}":`, error);
          return [];
        }
      },
    );

    const researchResultsArrays = await Promise.all(researchPromises);

    // Flatten and deduplicate results
    const allResults = researchResultsArrays.flat();
    const deduplicatedResults = this.deduplicateResults(allResults);

    console.log(
      `  ✅ Collected ${deduplicatedResults.length} unique sources from ${researchPlan.researchQueries.length} engines`,
    );

    return deduplicatedResults.slice(0, 30); // Limit to top 30 results
  }

  /**
   * Synthesize research results using AI
   */
  private async synthesizeResearch(
    topic: string,
    researchResults: Array<
      SearchResult & { engine: string; reasoning: string }
    >,
  ): Promise<any> {
    // Build research context from all sources
    const researchContext = researchResults
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 20) // Use top 20 sources for synthesis
      .map(
        (result, index) =>
          `[${index + 1}] ${result.engine.toUpperCase()}: "${result.title}"\n${
            result.snippet
          }\nURL: ${result.url}\nRelevance: ${result.relevanceScore?.toFixed(
            2,
          )}\n`,
      )
      .join("\n");

    const prompt = `You are a research analyst with NO prior knowledge about "${topic}". Your job is to synthesize insights based SOLELY on the research data provided below.

RESEARCH DATA FROM MULTIPLE SOURCES:
${researchContext}

ANALYSIS INSTRUCTIONS:
1. Extract KEY INSIGHTS that emerge from examining all these sources together
2. Identify MAIN THEMES and patterns that appear across multiple sources  
3. Assess SOURCE QUALITY based on:
   - Consistency between sources
   - Depth of information provided
   - Credibility indicators (domains, publication types)
   - Coverage breadth across the topic

IMPORTANT: 
- Base your analysis ONLY on what these sources reveal
- Look for patterns and connections between different sources
- Identify gaps where sources disagree or lack information
- Do NOT add information from your own knowledge
- Focus on what can be LEARNED and UNDERSTOOD from this specific research data

Provide your synthesis focusing on:
1. What the research collectively tells us about "${topic}"
2. How the different sources complement or contradict each other
3. What themes and patterns emerge from the data
4. Assessment of the research quality and comprehensiveness`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.6,
    });

    // Parse the AI response (simplified - in production you might use structured generation)
    const insights = this.extractInsights(result.text);
    const themes = this.extractThemes(result.text);
    const quality = this.assessSourceQuality(researchResults);
    const comprehensiveness = this.calculateComprehensiveness(researchResults);

    return {
      keyInsights: insights,
      contentThemes: themes,
      sourceQuality: quality,
      comprehensivenesss: comprehensiveness,
    };
  }

  /**
   * Generate comprehensive content using AI
   */
  private async generateContent(
    topic: string,
    synthesis: any,
    userContext?: any,
  ): Promise<GeneratedContent> {
    const prompt = `You are an educational content creator with NO prior knowledge about "${topic}". You can ONLY use the research insights provided below to create learning content.

RESEARCH-BASED INSIGHTS (your only source of knowledge):
${synthesis.keyInsights?.join("\n- ") || ""}

RESEARCH-IDENTIFIED THEMES:
${synthesis.contentThemes?.join("\n- ") || ""}

${
  userContext
    ? `USER CONTEXT: Level=${
        userContext.level
      }, Interests=[${userContext.interests?.join(", ")}]`
    : ""
}

CONTENT CREATION INSTRUCTIONS:
1. Create educational content using ONLY the research insights and themes above
2. Structure the content logically based on the themes discovered in research
3. Explain concepts using ONLY what you learned from the research synthesis
4. Do NOT add information from your own knowledge - stick strictly to the research findings
5. Organize content in a way that builds understanding progressively
6. Reference the research insights throughout your content

CONTENT REQUIREMENTS:
- Create comprehensive educational content based solely on research findings
- Structure with clear sections that match the research themes
- Include detailed explanations drawn from research insights
- Make content suitable for the user's level (${userContext?.level || "general"})
- Ensure all information traces back to the research provided

IMPORTANT FORMATTING REQUIREMENTS:
- keyTakeaways must be an array of simple strings (not objects)
- nextSteps must be an array of simple strings (not objects)  
- Each section's sources should be an array of simple strings (not objects)
- All content should be in plain text/markdown format

Remember: You are teaching based on research findings, not your own knowledge. Every section should reflect what was discovered through the research process.`;

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
        "Structured generation failed, attempting fallback:",
        error,
      );

      // Fallback to text generation and manual parsing
      const textResult = await generateText({
        model: this.model,
        prompt:
          prompt +
          "\n\nGenerate the response in a structured format that can be parsed as JSON.",
        temperature: 0.7,
      });

      // Try to parse the fallback response
      result = { object: this.parseContentFallback(textResult.text, topic) };
    }

    // Convert structured result to our content format
    const content = result.object;

    // Ensure arrays contain only strings
    const cleanKeyTakeaways = this.ensureStringArray(content.keyTakeaways);
    const cleanNextSteps = this.ensureStringArray(content.nextSteps);
    const cleanSections = content.sections.map((section: any) => ({
      ...section,
      sources: this.ensureStringArray(section.sources || []),
    }));

    const estimatedReadTime = this.estimateReadTime(
      cleanSections.reduce(
        (total: number, section: any) => total + section.content.length,
        0,
      ),
    );

    return {
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

    content.sections.forEach((section) => {
      mdx += `## ${section.title}\n\n${section.content}\n\n`;
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
      content.nextSteps.forEach((step) => {
        mdx += `- ${step}\n`;
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

  // Simple text parsing helpers (in production, you might use more sophisticated NLP)
  private extractInsights(text: string): string[] {
    // Extract bullet points or numbered items as insights
    const insights = text.match(/[•\-\*]\s*([^\n]+)/g) || [];
    return insights
      .map((item) => item.replace(/^[•\-\*]\s*/, "").trim())
      .slice(0, 5);
  }

  private extractThemes(text: string): string[] {
    // Simple keyword extraction - in production you'd use more sophisticated methods
    const commonWords = [
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ];
    const words = text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 4 && !commonWords.includes(word));

    // Count word frequency and return top themes
    const frequency: Record<string, number> = {};
    words.forEach((word) => (frequency[word] = (frequency[word] || 0) + 1));

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private assessSourceQuality(
    results: SearchResult[],
  ): "high" | "medium" | "low" {
    const avgRelevance =
      results.reduce((sum, r) => sum + (r.relevanceScore || 0.5), 0) /
      results.length;
    const credibleSources = results.filter(
      (r) =>
        r.url.includes(".edu") ||
        r.url.includes(".gov") ||
        r.url.includes("arxiv"),
    ).length;

    if (avgRelevance > 0.7 && credibleSources > results.length * 0.3)
      return "high";
    if (avgRelevance > 0.5 && credibleSources > results.length * 0.15)
      return "medium";
    return "low";
  }

  private calculateComprehensiveness(results: SearchResult[]): number {
    // Simple heuristic based on source diversity and count
    const engines = new Set(results.map((r) => r.source));
    const engineDiversity = engines.size / 5; // Expect up to 5 different engines
    const sourceCount = Math.min(results.length / 20, 1); // Expect ~20 sources for full score

    return engineDiversity * 0.5 + sourceCount * 0.5;
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
}

// Export singleton instance
export const aiLearningAgent = new AILearningAgent();
