import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { TopicUnderstanding, ResearchPlan, ResearchPlanSchema } from "./types";

/**
 * Research Planning Module
 * Handles research strategy planning and query generation
 */
export class ResearchPlanningModule {
  private model = openai("gpt-5-mini");

  /**
   * Plan the research strategy using research-based understanding (NOT AI knowledge)
   * Always includes 5 mandatory general engine queries for balanced perspective
   */
  async planResearch(
    topic: string, 
    understanding: TopicUnderstanding, 
    userContext?: any
  ): Promise<ResearchPlan> {
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
2. You MUST include exactly 5 queries using the "community" engine for user opinions, techniques, and real experiences
3. You MUST include exactly 5 queries using the "video" engine for visual content and demonstrations
4. You MAY include additional queries using other recommended engines (academic, computational)
5. Total queries should be 15-20 (5 general + 5 community + 5 video + 0-5 other engines)

INSTRUCTIONS:
1. Base your research plan ONLY on the understanding provided above
2. ALWAYS start with 5 diverse "general" engine queries covering different aspects of the topic
3. ALWAYS include 5 "community" engine queries focusing on user experiences, personal techniques, tips, and real examples
4. ALWAYS include 5 "video" engine queries for visual learning and demonstrations
5. Then add 0-5 additional queries using other recommended engines from the analysis
6. Focus on ${understanding.researchApproach} approach as indicated by the research
7. Each query should be specific and progressive - building from basic to more detailed understanding
8. General queries should cover: overview, practical applications, examples, different perspectives, and foundational concepts
9. Community queries should focus on: user opinions, personal techniques, community tips, real examples, discussions
10. Video queries should focus on: tutorials, demonstrations, visual explanations, step-by-step guides, practical examples

Your goal: Create a comprehensive research plan that balances general accessibility (via 5 general queries) with specialized depth (via recommended engine queries), following the research-driven recommendations above.`;

    try {
      const aiStartTime = Date.now();
      console.log(`TIMING LOGS: Starting AI research plan generation using ${this.model.modelId} - prompt length: ${prompt.length} chars`);
      const result = await (generateObject as any)({
        model: this.model,
        prompt,
        schema: ResearchPlanSchema,
        temperature: 0.6, // Lower temperature for more consistent, logical planning
      });
      const aiDuration = Date.now() - aiStartTime;
      console.log(`TIMING LOGS: Completed AI research plan generation in ${aiDuration}ms - model: ${this.model.modelId}`);

      // Validate the result structure
      if (!result.object || !result.object.researchQueries || !Array.isArray(result.object.researchQueries)) {
        console.error('❌ Invalid research plan structure generated');
        throw new Error('Invalid research plan structure generated');
      }

      // Enhanced validation with schema refinement
      try {
        const validationStartTime = Date.now();
        console.log(`TIMING LOGS: Starting research plan schema validation`);
        const validatedPlan = ResearchPlanSchema.parse(result.object);
        const validationDuration = Date.now() - validationStartTime;
        console.log(`TIMING LOGS: Completed research plan schema validation in ${validationDuration}ms`);
        console.log('✅ Research plan passed schema validation');
        
        // Additional validation and enhancement
        const enhancementStartTime = Date.now();
        console.log(`TIMING LOGS: Starting research plan enhancement and query validation`);
        const plan = this.ensureGeneralQueries(validatedPlan, topic);
        const enhancementDuration = Date.now() - enhancementStartTime;
        console.log(`TIMING LOGS: Completed research plan enhancement in ${enhancementDuration}ms`);
        return plan;
        
      } catch (schemaError) {
        console.warn('⚠️ Research plan failed schema validation, applying corrections:', schemaError);
        
        // Try to fix the plan before falling back
        const correctionStartTime = Date.now();
        console.log(`TIMING LOGS: Starting research plan correction due to validation failure`);
        const correctedPlan = this.ensureGeneralQueries(result.object, topic);
        
        // Validate the corrected plan
        try {
          const finalPlan = ResearchPlanSchema.parse(correctedPlan);
          const correctionDuration = Date.now() - correctionStartTime;
          console.log(`TIMING LOGS: Completed research plan correction in ${correctionDuration}ms`);
          console.log('✅ Corrected research plan passed validation');
          return finalPlan;
        } catch (finalError) {
          const correctionDuration = Date.now() - correctionStartTime;
          console.log(`TIMING LOGS: Failed research plan correction after ${correctionDuration}ms`);
          console.error('❌ Failed to correct research plan, using fallback');
          throw finalError;
        }
      }
      
    } catch (error) {
      console.error('❌ Structured research plan generation failed, creating fallback plan:', error);
      
      // Create fallback plan with mandatory 5 general queries
      const fallbackStartTime = Date.now();
      console.log(`TIMING LOGS: Starting fallback research plan creation due to AI generation failure`);
      const fallbackPlan = this.createFallbackPlan(topic, understanding);
      const fallbackDuration = Date.now() - fallbackStartTime;
      console.log(`TIMING LOGS: Completed fallback research plan creation in ${fallbackDuration}ms`);
      return fallbackPlan;
    }
  }

  /**
   * Ensures the research plan has minimum required queries for all mandatory engines
   * Enhanced to require 5 general, 5 community, and 5 video queries
   */
  private ensureGeneralQueries(plan: any, topic: string): ResearchPlan {
    // Validate plan structure
    if (!plan || !Array.isArray(plan.researchQueries)) {
      console.error("❌ Invalid research plan structure, creating fallback");
      throw new Error("Invalid research plan structure");
    }

    const generalQueries = plan.researchQueries.filter((q: any) => q.engine === "general");
    const communityQueries = plan.researchQueries.filter((q: any) => q.engine === "community");
    const videoQueries = plan.researchQueries.filter((q: any) => q.engine === "video");
    const otherQueries = plan.researchQueries.filter((q: any) => !['general', 'community', 'video'].includes(q.engine));
    
    let updatedQueries = [...plan.researchQueries];
    
    // Ensure we have at least 5 general queries
    if (generalQueries.length < 5) {
      const neededGeneralQueries = 5 - generalQueries.length;
      console.log(`🔧 Adding ${neededGeneralQueries} general engine queries to meet minimum requirement`);
      
      const additionalGeneralQueries = this.generateAdditionalGeneralQueries(topic, neededGeneralQueries);
      updatedQueries = updatedQueries.concat(additionalGeneralQueries);
    }
    
    // Ensure we have at least 5 community queries
    if (communityQueries.length < 5) {
      const neededCommunityQueries = 5 - communityQueries.length;
      console.log(`🔧 Adding ${neededCommunityQueries} community engine queries to meet minimum requirement`);
      
      const additionalCommunityQueries = this.generateAdditionalCommunityQueries(topic, neededCommunityQueries);
      updatedQueries = updatedQueries.concat(additionalCommunityQueries);
    }
    
    // Ensure we have at least 5 video queries
    if (videoQueries.length < 5) {
      const neededVideoQueries = 5 - videoQueries.length;
      console.log(`🔧 Adding ${neededVideoQueries} video engine queries to meet minimum requirement`);
      
      const additionalVideoQueries = this.generateAdditionalVideoQueries(topic, neededVideoQueries);
      updatedQueries = updatedQueries.concat(additionalVideoQueries);
    }
    
    // Update the plan with all queries
    plan.researchQueries = updatedQueries;

    // Calculate and update engine distribution
    plan.engineDistribution = this.calculateEngineDistribution(plan.researchQueries);
    
    // Final validation: ensure all mandatory engine distributions are met
    const actualGeneral = plan.researchQueries.filter((q: any) => q.engine === "general").length;
    const actualCommunity = plan.researchQueries.filter((q: any) => q.engine === "community").length;
    const actualVideo = plan.researchQueries.filter((q: any) => q.engine === "video").length;
    
    if (actualGeneral < 5) {
      console.error(`❌ Failed to ensure minimum general queries: ${actualGeneral} < 5`);
      throw new Error(`Failed to meet minimum general query requirement: ${actualGeneral} < 5`);
    }
    
    if (actualCommunity < 5) {
      console.error(`❌ Failed to ensure minimum community queries: ${actualCommunity} < 5`);
      throw new Error(`Failed to meet minimum community query requirement: ${actualCommunity} < 5`);
    }
    
    if (actualVideo < 5) {
      console.error(`❌ Failed to ensure minimum video queries: ${actualVideo} < 5`);
      throw new Error(`Failed to meet minimum video query requirement: ${actualVideo} < 5`);
    }

    // Validate query diversity for requirement 5.3 (specialized and accessible search terms)
    this.validateQueryDiversity(plan.researchQueries, topic);
    
    console.log(`✅ Research plan validated: ${actualGeneral} general, ${actualCommunity} community, ${actualVideo} video queries, ${plan.researchQueries.length} total queries`);
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
   * Generates additional community queries focusing on user opinions, techniques, and experiences
   */
  private generateAdditionalCommunityQueries(topic: string, count: number): Array<{query: string, engine: string, reasoning: string}> {
    const communityQueryTemplates = [
      {
        query: `${topic} user experiences opinions personal thoughts forums discussion`,
        reasoning: "User experiences and opinions from community discussions for real perspectives"
      },
      {
        query: `${topic} personal techniques methods strategies workflow tips tricks`,
        reasoning: "Personal techniques and methods shared by practitioners in the community"
      },
      {
        query: `${topic} community advice recommendations best practices shared wisdom`,
        reasoning: "Community-driven advice and recommendations from experienced users"
      },
      {
        query: `${topic} real examples use cases practical implementations user stories`,
        reasoning: "Real-world examples and use cases shared by community members"
      },
      {
        query: `${topic} discussion questions answers community insights problems solutions`,
        reasoning: "Community discussions focusing on common questions and crowdsourced solutions"
      },
      {
        query: `${topic} user tips lessons learned mistakes avoid success stories`,
        reasoning: "User-shared tips, lessons learned, and success stories from community"
      },
      {
        query: `${topic} forum insights reddit community experiences personal approaches`,
        reasoning: "Forum and community insights showing diverse personal approaches and experiences"
      },
      {
        query: `${topic} practitioners advice expert users community knowledge sharing`,
        reasoning: "Advice and knowledge sharing from expert practitioners in community forums"
      },
      {
        query: `${topic} user guides community created resources personal methodologies`,
        reasoning: "Community-created resources and personal methodologies shared by users"
      },
      {
        query: `${topic} real world usage community feedback user reviews experiences`,
        reasoning: "Real-world usage patterns and community feedback on practical applications"
      }
    ];

    const actualCount = Math.min(count, communityQueryTemplates.length);
    const selectedTemplates = communityQueryTemplates.slice(0, actualCount);
    
    return selectedTemplates.map(template => ({
      query: template.query,
      engine: "community",
      reasoning: template.reasoning
    }));
  }

  /**
   * Generates additional video queries focusing on visual learning and demonstrations
   */
  private generateAdditionalVideoQueries(topic: string, count: number): Array<{query: string, engine: string, reasoning: string}> {
    const videoQueryTemplates = [
      {
        query: `${topic} tutorial step by step guide walkthrough demonstration`,
        reasoning: "Tutorial videos providing step-by-step visual guidance and demonstrations"
      },
      {
        query: `${topic} explained visual examples practical demonstration how to`,
        reasoning: "Visual explanations and practical demonstrations for better understanding"
      },
      {
        query: `${topic} beginner tutorial introduction basics getting started video`,
        reasoning: "Beginner-friendly video tutorials for foundational understanding"
      },
      {
        query: `${topic} advanced techniques video course in-depth explanation`,
        reasoning: "Advanced video content for deeper technical understanding and techniques"
      },
      {
        query: `${topic} practical examples real world application video case study`,
        reasoning: "Real-world application videos and case studies showing practical usage"
      },
      {
        query: `${topic} comparison review analysis video detailed explanation`,
        reasoning: "Video reviews and comparative analysis for comprehensive understanding"
      },
      {
        query: `${topic} masterclass expert tutorial professional guide video`,
        reasoning: "Expert-level tutorials and masterclasses from professional practitioners"
      },
      {
        query: `${topic} hands on workshop practical session video tutorial`,
        reasoning: "Hands-on workshop videos and practical sessions for applied learning"
      },
      {
        query: `${topic} tips tricks shortcuts video guide optimization techniques`,
        reasoning: "Video guides focusing on tips, tricks, and optimization techniques"
      },
      {
        query: `${topic} common mistakes troubleshooting video help guide`,
        reasoning: "Video content addressing common mistakes and troubleshooting guidance"
      }
    ];

    const actualCount = Math.min(count, videoQueryTemplates.length);
    const selectedTemplates = videoQueryTemplates.slice(0, actualCount);
    
    return selectedTemplates.map(template => ({
      query: template.query,
      engine: "video",
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
  private createFallbackPlan(topic: string, understanding: TopicUnderstanding): ResearchPlan {
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
    
    // Add mandatory community and video queries to fallback plan
    const communityQueries = this.generateAdditionalCommunityQueries(topic, 5);
    const videoQueries = this.generateAdditionalVideoQueries(topic, 5);
    
    fallbackQueries.push(...communityQueries);
    fallbackQueries.push(...videoQueries);
    
    // Recalculate distribution with all mandatory queries
    const finalEngineDistribution = this.calculateEngineDistribution(fallbackQueries);
    
    // Validate that we meet all minimum requirements
    if (finalEngineDistribution.general < 5) {
      console.error(`❌ Fallback plan failed to create minimum general queries: ${finalEngineDistribution.general} < 5`);
      throw new Error("Failed to create valid fallback research plan");
    }
    
    if (finalEngineDistribution.community < 5) {
      console.error(`❌ Fallback plan failed to create minimum community queries: ${finalEngineDistribution.community} < 5`);
      throw new Error("Failed to create valid fallback research plan");
    }
    
    if (finalEngineDistribution.video < 5) {
      console.error(`❌ Fallback plan failed to create minimum video queries: ${finalEngineDistribution.video} < 5`);
      throw new Error("Failed to create valid fallback research plan");
    }

    console.log(`✅ Fallback plan created: ${finalEngineDistribution.general} general, ${finalEngineDistribution.community} community, ${finalEngineDistribution.video} video, ${fallbackQueries.length} total queries`);

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
      engineDistribution: finalEngineDistribution
    };
  }
}