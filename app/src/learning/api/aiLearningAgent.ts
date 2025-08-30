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
        .describe("Priority level (1=highest, 5=lowest)"),
      complexity: z
        .enum(["beginner", "intermediate", "advanced"])
        .describe("Complexity level"),
    }),
  ),
});

const ResearchPlanSchema = z.object({
  researchQueries: z.array(
    z.object({
      query: z.string().describe("The search query to execute"),
      engine: z
        .enum(["general", "academic", "video", "community", "computational"])
        .describe("Which SearXNG engine to use"),
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
      // Step 1: Plan the research strategy
      console.log("📋 Step 1: Planning research strategy...");
      const researchPlan = await this.planResearch(
        request.topic,
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
   * Plan the research strategy using AI
   */
  private async planResearch(topic: string, userContext?: any): Promise<any> {
    const prompt = `You are an expert research strategist. Plan a comprehensive research strategy for the topic: "${topic}".

Available research engines:
- general: Broad web search across multiple sources
- academic: Scientific papers, research, scholarly articles
- video: Educational videos, tutorials, demonstrations
- community: Forums, discussions, real-world experiences
- computational: Mathematical, algorithmic, technical data

${
  userContext
    ? `User context: Level=${
        userContext.level
      }, Interests=[${userContext.interests?.join(", ")}]`
    : ""
}

Create a research plan that will provide comprehensive coverage of this topic. Think like a student who wants to become an expert - what would you need to research to truly understand this topic?

Plan 4-6 research queries using different engines strategically.`;

    const result = await (generateObject as any)({
      model: this.model,
      prompt,
      schema: ResearchPlanSchema,
      temperature: 0.7,
    });

    return result.object;
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

    const prompt = `Analyze the following research results for the topic "${topic}" and provide insights:

RESEARCH RESULTS:
${researchContext}

Analyze this research data and provide:
1. Key insights that emerge from the data
2. Main content themes to organize the information
3. Assessment of source quality and comprehensiveness

Focus on what we can LEARN from this research, not just what it says.`;

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
    const prompt = `You are an expert educator creating comprehensive learning content about "${topic}".

RESEARCH INSIGHTS:
${synthesis.keyInsights?.join("\n- ") || ""}

CONTENT THEMES:
${synthesis.contentThemes?.join("\n- ") || ""}

${
  userContext
    ? `USER CONTEXT: Level=${
        userContext.level
      }, Interests=[${userContext.interests?.join(", ")}]`
    : ""
}

Create comprehensive educational content that goes deep into this topic. This is NOT a summary - you are teaching someone to become knowledgeable about this topic.

Structure your content with clear sections, detailed explanations, and practical insights. Make it engaging and comprehensive for someone who wants to truly understand this topic.

IMPORTANT FORMATTING REQUIREMENTS:
- keyTakeaways must be an array of simple strings (not objects)
- nextSteps must be an array of simple strings (not objects)
- Each section's sources should be an array of simple strings (not objects)
- All content should be in plain text/markdown format

Example format:
keyTakeaways: ["Key point 1", "Key point 2", "Key point 3"]
nextSteps: ["Next step 1", "Next step 2", "Next step 3"]`;

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
    const prompt = `Based on the research about "${topic}", identify exactly 5 important subtopics that someone learning about this topic should explore in depth.

KEY INSIGHTS FROM RESEARCH:
${synthesis.keyInsights?.join("\n- ") || ""}

CONTENT THEMES:
${synthesis.contentThemes?.join("\n- ") || ""}

Think like a curriculum designer - what are the key areas within this topic that deserve dedicated deep exploration? These subtopics will each get their own comprehensive research and content generation.

Focus on subtopics that:
1. Are substantial enough to warrant deep exploration
2. Are logically connected to the main topic
3. Would help someone become an expert in the field
4. Cover different aspects (theoretical, practical, applications, etc.)

IMPORTANT: You must provide exactly 5 subtopics with priorities 1, 2, 3, 4, and 5 (where 1 is highest priority).`;

    const result = await (generateObject as any)({
      model: this.fastModel, // Use faster model for subtopic identification
      prompt,
      schema: SubtopicsSchema,
      temperature: 0.8,
    });

    return result.object.subtopics.map((subtopic: any) => ({
      ...subtopic,
      estimatedReadTime: this.estimateSubtopicReadTime(subtopic.complexity),
    }));
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
