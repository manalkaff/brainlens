import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { SearxngUtils } from "../../research/searxng";
import type { SearchResult } from "../../research/agents";
import { TopicUnderstanding, TopicUnderstandingSchema } from "./types";

/**
 * Topic Understanding Module
 * Handles initial topic research and understanding from scratch
 */
export class TopicUnderstandingModule {
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
      const searchStartTime = Date.now();
      console.log(`TIMING LOGS: Starting SearXNG search for topic understanding - query: "${basicQuery}"`);
      const searchResponse = await SearxngUtils.searchWithAgent("general", basicQuery);
      const searchDuration = Date.now() - searchStartTime;
      console.log(`TIMING LOGS: Completed SearXNG search for topic understanding in ${searchDuration}ms - found ${searchResponse.results?.length || 0} results`);
      
      if (!searchResponse.results || searchResponse.results.length === 0) {
        throw new Error(`No search results found for topic: ${topic}`);
      }
      
      // Take top 5 results for understanding
      const topResults = searchResponse.results.slice(0, 5);
      
      // Step 2: Build research context from sources
      const contextStartTime = Date.now();
      console.log(`TIMING LOGS: Starting research context building from ${topResults.length} search results`);
      const researchContext = topResults
        .map((result: SearchResult, index: number) => 
          `[Source ${index + 1}] ${result.title}\n${result.snippet}\nURL: ${result.url}\n`
        )
        .join("\n");
      const contextDuration = Date.now() - contextStartTime;
      console.log(`TIMING LOGS: Completed research context building in ${contextDuration}ms - context length: ${researchContext.length} chars`);
      
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

      const aiStartTime = Date.now();
      console.log(`TIMING LOGS: Starting AI topic analysis using ${this.fastModel.modelId} - prompt length: ${analysisPrompt.length} chars`);
      const result = await (generateObject as any)({
        model: this.fastModel,
        prompt: analysisPrompt,
        schema: TopicUnderstandingSchema,
        temperature: 0.3, // Low temperature for analytical consistency
      });
      const aiDuration = Date.now() - aiStartTime;
      console.log(`TIMING LOGS: Completed AI topic analysis in ${aiDuration}ms - model: ${this.fastModel.modelId}`);

      // Validate the result structure
      if (!result.object || typeof result.object !== 'object') {
        throw new Error('Invalid topic understanding structure generated');
      }
      
      const processingStartTime = Date.now();
      console.log(`TIMING LOGS: Starting topic understanding result processing`);
      const understanding = result.object;
      
      console.log(`✅ Topic understanding complete:`);
      console.log(`   Definition: ${understanding.definition.substring(0, 100)}...`);
      console.log(`   Category: ${understanding.category}`);
      console.log(`   Complexity: ${understanding.complexity}`);
      console.log(`   Recommended engines: ${Object.entries(understanding.engineRecommendations).filter(([_, value]) => value).map(([key]) => key).join(', ')}`);
      
      const processingDuration = Date.now() - processingStartTime;
      console.log(`TIMING LOGS: Completed topic understanding result processing in ${processingDuration}ms`);
      
      return understanding;
      
    } catch (error) {
      console.error(`❌ Failed to understand topic "${topic}":`, error);
      
      // Fallback understanding if research fails
      return this.createFallbackUnderstanding(topic);
    }
  }

  /**
   * Create fallback understanding when research fails
   */
  private createFallbackUnderstanding(topic: string): TopicUnderstanding {
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