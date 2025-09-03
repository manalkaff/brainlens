import type { Topic } from "wasp/entities";
import { aiLearningAgent, type TopicResearchRequest, type TopicResearchResult, type SubtopicInfo } from "./aiLearningAgent";
import { prisma } from "wasp/server";
import { getCachedContent, setCachedContent, isCacheValid } from "./cachingSystem";

export interface IterativeResearchOptions {
  maxDepth?: number;
  forceRefresh?: boolean;
  userContext?: {
    level?: "beginner" | "intermediate" | "advanced";
    interests?: string[];
    previousKnowledge?: string[];
  };
}

export interface IterativeResearchResult {
  mainTopic: TopicResearchResult;
  subtopicResults: Map<string, TopicResearchResult>;
  totalTopicsProcessed: number;
  totalProcessingTime: number;
  cacheHits: number;
  cacheKey: string;
}

// Serializable versions for Wasp operations
export interface SerializableIterativeResearchResult {
  mainTopic: TopicResearchResult;
  subtopicResults: Record<string, TopicResearchResult>;
  totalTopicsProcessed: number;
  totalProcessingTime: number;
  cacheHits: number;
  cacheKey: string;
  [key: string]: any;
}

// Utility functions for serialization
export function makeSerializable(result: IterativeResearchResult): SerializableIterativeResearchResult {
  return {
    ...result,
    subtopicResults: Object.fromEntries(result.subtopicResults)
  };
}

export function makeIterativeFromSerializable(serialized: SerializableIterativeResearchResult): IterativeResearchResult {
  return {
    ...serialized,
    subtopicResults: new Map(Object.entries(serialized.subtopicResults))
  };
}

/**
 * Iterative Research Engine
 * Core system that manages recursive topic exploration with intelligent caching
 */
export class IterativeResearchEngine {
  private readonly CACHE_TTL_DAYS = 7;
  private readonly MAX_PARALLEL_SUBTOPICS = 5;
  
  /**
   * Main entry point for iterative research
   * This is the research_and_generate function requested by the user
   */
  async researchAndGenerate(
    topic: string,
    options: IterativeResearchOptions = {}
  ): Promise<IterativeResearchResult> {
    const startTime = Date.now();
    const maxDepth = options.maxDepth || 3;
    let cacheHits = 0;
    let totalTopicsProcessed = 0;
    
    console.log(`🎯 Starting iterative research for: "${topic}"`);
    console.log(`📊 Max depth: ${maxDepth}, Force refresh: ${options.forceRefresh || false}`);
    
    try {
      // Step 1: Research main topic
      console.log("🔬 Step 1: Researching main topic...");
      const mainResult = await this.researchSingleTopic({
        topic,
        depth: 0,
        maxDepth,
        userContext: options.userContext
      }, options.forceRefresh);
      
      if (mainResult.fromCache) cacheHits++;
      totalTopicsProcessed++;
      
      // Step 2: Research subtopics in parallel (if within depth limit)
      console.log("🌳 Step 2: Processing subtopics...");
      const subtopicResults = new Map<string, TopicResearchResult>();
      
      if (mainResult.result.depth < maxDepth && mainResult.result.subtopics.length > 0) {
        subtopicResults.clear();
        await this.processSubtopicsRecursively(
          mainResult.result.subtopics,
          mainResult.result.depth + 1,
          maxDepth,
          subtopicResults,
          options,
          (fromCache: boolean) => {
            if (fromCache) cacheHits++;
            totalTopicsProcessed++;
          }
        );
      }
      
      const totalProcessingTime = Date.now() - startTime;
      
      const result: IterativeResearchResult = {
        mainTopic: mainResult.result,
        subtopicResults,
        totalTopicsProcessed,
        totalProcessingTime,
        cacheHits,
        cacheKey: mainResult.result.cacheKey
      };
      
      console.log(`✅ Iterative research completed!`);
      console.log(`📊 Topics processed: ${totalTopicsProcessed}, Cache hits: ${cacheHits}, Time: ${totalProcessingTime}ms`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Iterative research failed for "${topic}":`, error);
      throw new Error(`Iterative research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Research a single topic with caching support
   */
  private async researchSingleTopic(
    request: TopicResearchRequest,
    forceRefresh: boolean = false
  ): Promise<{ result: TopicResearchResult; fromCache: boolean }> {
    const cacheKey = this.generateCacheKey(request.topic, request.userContext);
    
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedResult = await getCachedContent(cacheKey);
      if (cachedResult && isCacheValid(cachedResult.timestamp, this.CACHE_TTL_DAYS)) {
        console.log(`🎯 Cache hit for "${request.topic}"`);
        return { result: cachedResult, fromCache: true };
      }
    }
    
    // Perform fresh research
    console.log(`🔬 Fresh research for "${request.topic}"`);
    const result = await aiLearningAgent.researchAndGenerate(request);
    
    // Cache the result
    await setCachedContent(cacheKey, result);
    
    return { result, fromCache: false };
  }

  /**
   * Process subtopics recursively in parallel
   */
  private async processSubtopicsRecursively(
    subtopics: SubtopicInfo[],
    currentDepth: number,
    maxDepth: number,
    resultsMap: Map<string, TopicResearchResult>,
    options: IterativeResearchOptions,
    onProgress: (fromCache: boolean) => void
  ): Promise<void> {
    if (currentDepth >= maxDepth || subtopics.length === 0) {
      return;
    }
    
    // Sort subtopics by priority (1 = highest priority)
    const sortedSubtopics = [...subtopics].sort((a, b) => a.priority - b.priority);
    
    // Process subtopics in batches to avoid overwhelming the system
    const batches = this.chunkArray(sortedSubtopics, this.MAX_PARALLEL_SUBTOPICS);
    
    for (const batch of batches) {
      console.log(`🚀 Processing batch of ${batch.length} subtopics at depth ${currentDepth}`);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (subtopic) => {
        try {
          const subtopicRequest: TopicResearchRequest = {
            topic: subtopic.title,
            depth: currentDepth,
            maxDepth,
            parentTopic: subtopic.title, // Store parent reference
            userContext: options.userContext
          };
          
          const { result, fromCache } = await this.researchSingleTopic(
            subtopicRequest, 
            options.forceRefresh || false
          );
          
          resultsMap.set(subtopic.title, result);
          onProgress(fromCache);
          
          // Recursively process subtopics of this subtopic
          if (result.subtopics.length > 0 && currentDepth + 1 < maxDepth) {
            await this.processSubtopicsRecursively(
              result.subtopics,
              currentDepth + 1,
              maxDepth,
              resultsMap,
              options,
              onProgress
            );
          }
          
        } catch (error) {
          console.error(`Failed to process subtopic "${subtopic.title}":`, error);
          // Continue with other subtopics even if one fails
        }
      });
      
      await Promise.allSettled(batchPromises);
    }
  }

  /**
   * Store research results to database for persistence
   */
  async storeToDatabase(
    result: IterativeResearchResult, 
    topicSlug: string
  ): Promise<{ mainTopicId: string; subtopicIds: string[] }> {
    console.log(`💾 Storing research results to database for topic: ${topicSlug}`);
    
    try {
      // Find or create the main topic
      let mainTopic = await prisma.topic.findUnique({
        where: { slug: topicSlug },
        include: { children: true }
      });
      
      if (!mainTopic) {
        mainTopic = await prisma.topic.create({
          data: {
            slug: topicSlug,
            title: result.mainTopic.topic,
            summary: result.mainTopic.content.keyTakeaways.join(" "),
            depth: 0,
            status: 'COMPLETED',
            metadata: {
              researchMetadata: JSON.parse(JSON.stringify(result.mainTopic.metadata)),
              cacheKey: result.cacheKey,
              lastResearchUpdate: result.mainTopic.timestamp.toISOString()
            } as any
          },
          include: { children: true }
        });
      } else {
        // Update existing topic with new research data
        mainTopic = await prisma.topic.update({
          where: { id: mainTopic.id },
          data: {
            title: result.mainTopic.topic,
            summary: result.mainTopic.content.keyTakeaways.join(" "),
            status: 'COMPLETED',
            metadata: {
              ...((mainTopic.metadata as any) || {}),
              researchMetadata: JSON.parse(JSON.stringify(result.mainTopic.metadata)),
              lastResearchUpdate: result.mainTopic.timestamp.toISOString()
            } as any
          },
          include: { children: true }
        });
      }
      
      // Store generated content
      await this.storeGeneratedContent(mainTopic!.id, result.mainTopic);
      
      // Store subtopics
      const subtopicIds: string[] = [];
      for (const [subtopicTitle, subtopicResult] of result.subtopicResults.entries()) {
        const baseSlug = this.generateSlug(subtopicTitle);
        
        // First check if a subtopic with this exact relationship already exists
        let subtopic = await prisma.topic.findFirst({
          where: {
            slug: baseSlug,
            parentId: mainTopic!.id
          }
        });
        
        if (!subtopic) {
          // Generate a unique slug that avoids conflicts
          const uniqueSlug = await this.generateUniqueSlug(baseSlug, mainTopic!.slug);
          
          subtopic = await prisma.topic.create({
            data: {
              slug: uniqueSlug,
              title: subtopicTitle,
              summary: subtopicResult.content.keyTakeaways.join(" "),
              depth: subtopicResult.depth,
              parentId: mainTopic!.id,
              status: 'COMPLETED',
              metadata: {
                researchMetadata: JSON.parse(JSON.stringify(subtopicResult.metadata)),
                cacheKey: subtopicResult.cacheKey,
                lastResearchUpdate: subtopicResult.timestamp.toISOString()
              } as any
            }
          });
        }
        
        // Store generated content for subtopic
        await this.storeGeneratedContent(subtopic.id, subtopicResult);
        subtopicIds.push(subtopic.id);
      }
      
      console.log(`✅ Stored main topic and ${subtopicIds.length} subtopics to database`);
      return { mainTopicId: mainTopic!.id, subtopicIds };
      
    } catch (error) {
      console.error("Failed to store research results to database:", error);
      throw error;
    }
  }

  /**
   * Store generated content in the database
   */
  private async storeGeneratedContent(
    topicId: string,
    result: TopicResearchResult
  ): Promise<void> {
    try {
      // Check if content already exists
      const existingContent = await prisma.generatedContent.findFirst({
        where: {
          topicId,
          contentType: 'exploration'
        }
      });
      
      const contentData = {
        topicId,
        contentType: 'exploration',
        content: result.content.content, // MDX content
        metadata: {
          sections: JSON.parse(JSON.stringify(result.content.sections)),
          keyTakeaways: result.content.keyTakeaways,
          nextSteps: result.content.nextSteps,
          estimatedReadTime: result.content.estimatedReadTime,
          researchMetadata: JSON.parse(JSON.stringify(result.metadata))
        } as any,
        sources: JSON.parse(JSON.stringify(result.sources)) as any,
        userLevel: 'intermediate', // Default level
        learningStyle: 'textual' // Default style
      };
      
      if (existingContent) {
        await prisma.generatedContent.update({
          where: { id: existingContent.id },
          data: contentData
        });
      } else {
        await prisma.generatedContent.create({
          data: contentData
        });
      }
    } catch (error) {
      console.error(`Failed to store generated content for topic ${topicId}:`, error);
      // Don't throw - content storage failure shouldn't break the entire process
    }
  }

  // Helper methods
  private generateCacheKey(topic: string, userContext?: any): string {
    const baseKey = topic.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const contextKey = userContext?.level || 'general';
    return `iterative-research-${baseKey}-${contextKey}`;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50);
  }

  /**
   * Generate a unique slug that avoids database conflicts
   * If the base slug already exists, append parent slug or counter
   */
  private async generateUniqueSlug(baseSlug: string, parentSlug: string): Promise<string> {
    // First try the base slug
    const existingTopic = await prisma.topic.findUnique({
      where: { slug: baseSlug }
    });
    
    if (!existingTopic) {
      return baseSlug;
    }
    
    // If it exists, try appending parent slug
    const slugWithParent = `${baseSlug}-${parentSlug}`.substring(0, 50);
    const existingWithParent = await prisma.topic.findUnique({
      where: { slug: slugWithParent }
    });
    
    if (!existingWithParent) {
      return slugWithParent;
    }
    
    // If that also exists, append a counter
    let counter = 1;
    let uniqueSlug: string;
    do {
      uniqueSlug = `${baseSlug}-${counter}`.substring(0, 50);
      const existing = await prisma.topic.findUnique({
        where: { slug: uniqueSlug }
      });
      if (!existing) {
        break;
      }
      counter++;
    } while (counter < 100); // Prevent infinite loop
    
    return uniqueSlug;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Export singleton instance and main function
export const iterativeResearchEngine = new IterativeResearchEngine();

/**
 * Main research_and_generate function - This is what the user requested
 * Entry point for the iterative research system
 */
export async function researchAndGenerate(
  topic: string,
  options: IterativeResearchOptions = {}
): Promise<IterativeResearchResult> {
  return await iterativeResearchEngine.researchAndGenerate(topic, options);
}

/**
 * Convenience function to research and store to database
 */
export async function researchAndStore(
  topic: string,
  topicSlug: string,
  options: IterativeResearchOptions = {}
): Promise<{ 
  research: IterativeResearchResult; 
  storage: { mainTopicId: string; subtopicIds: string[] } 
}> {
  const research = await researchAndGenerate(topic, options);
  const storage = await iterativeResearchEngine.storeToDatabase(research, topicSlug);
  
  return { research, storage };
}