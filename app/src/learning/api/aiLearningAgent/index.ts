import { TopicUnderstandingModule } from './topicUnderstanding';
import { ResearchPlanningModule } from './researchPlanning';
import { ResearchExecutionModule } from './researchExecution';
import { SynthesisModule } from './synthesis';
import { ContentGenerationModule } from './contentGeneration';
import { SubtopicIdentificationModule } from './subtopicIdentification';
import { ValidationModule } from './validation';
import { FallbackModule } from './fallback';
import { UtilsModule } from './utils';
import {
  TopicResearchRequest,
  TopicResearchResult,
  TopicUnderstanding,
  GeneratedContent,
  SubtopicInfo,
  SourceAttribution,
  ResearchMetadata,
  SearchResultWithEngine,
  SynthesisResult,
  ResearchPlan
} from './types';

/**
 * AI Learning Agent - Core of the iterative research system
 * Uses Vercel AI SDK to create an intelligent agent that uses SearXNG as tools
 * 
 * This is the main orchestrator class that composes all the specialized modules
 * to provide the complete learning agent functionality while maintaining the
 * original public API.
 */
export class AILearningAgent {
  // Module instances
  private topicUnderstanding = new TopicUnderstandingModule();
  private researchPlanning = new ResearchPlanningModule();
  private researchExecution = new ResearchExecutionModule();
  private synthesis = new SynthesisModule();
  private contentGeneration = new ContentGenerationModule();
  private subtopicIdentification = new SubtopicIdentificationModule();
  private validation = new ValidationModule();
  private fallback = new FallbackModule();
  private utils = new UtilsModule();

  /**
   * Understand a topic from scratch using basic research
   * This function performs initial research to understand what a topic is about
   * without relying on AI's pre-trained knowledge
   */
  async understandTopic(topic: string): Promise<TopicUnderstanding> {
    return this.topicUnderstanding.understandTopic(topic);
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

    // For testing we want only depth 1 so we dont waste tokens
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
      const researchPlan = await this.researchPlanning.planResearch(
        request.topic,
        understanding,
        request.userContext,
      );

      // Step 2: Execute research using planned queries and engines
      console.log("🔍 Step 2: Executing research plan...");
      const researchResults = await this.researchExecution.executeResearch(researchPlan);

      // Step 3: Analyze and synthesize the research
      console.log("🧠 Step 3: Analyzing research results...");
      const synthesis = await this.synthesis.synthesizeResearch(
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
        subtopics = await this.subtopicIdentification.identifySubtopics(
          request.topic,
          synthesis,
          request.depth + 1,
        );
      }

      // Step 6: Build source attributions
      const sources = this.utils.buildSourceAttributions(
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
          confidenceScore: this.utils.calculateConfidenceScore(
            researchResults,
            content,
          ),
          lastUpdated: new Date(),
        },
        cacheKey: this.utils.generateCacheKey(request.topic, request.userContext),
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
   * Generate comprehensive content using AI with progressive learning structure
   * 
   * Enhanced with validation and fallback mechanisms
   */
  private async generateContent(
    topic: string,
    synthesis: SynthesisResult,
  ): Promise<GeneratedContent> {
    try {
      // Attempt normal content generation
      const content = await this.contentGeneration.generateContent(topic, synthesis);

      // Enhanced content validation (Requirements 3.5, 4.4, 4.5)
      const validation = this.validation.validateContentAccessibility(content);
      
      if (!validation.isValid) {
        console.warn(`⚠️ Content validation found issues, applying improvements:`, validation.issues);
        
        // Apply suggested improvements
        if (validation.suggestions.length > 0) {
          this.validation.applyBasicContentFixes(content, validation.suggestions);
          console.log("🔧 Applied content improvements based on validation feedback");
        }
      }

      return content;

    } catch (error) {
      console.error("Content generation failed, using fallback:", error);
      
      // Use fallback content creation
      return this.fallback.createFallbackContent(
        topic, 
        synthesis, 
        error as Error,
        this.utils.formatAsMDX.bind(this.utils),
        this.utils.estimateReadTime.bind(this.utils)
      );
    }
  }

  // Expose utility methods for backward compatibility and external use
  formatAsMDX = this.utils.formatAsMDX.bind(this.utils);
  estimateReadTime = this.utils.estimateReadTime.bind(this.utils);
  generateCacheKey = this.utils.generateCacheKey.bind(this.utils);
  calculateConfidenceScore = this.utils.calculateConfidenceScore.bind(this.utils);
}

// Export singleton instance for backward compatibility
export const aiLearningAgent = new AILearningAgent();

// Export all types for external use
export * from './types';