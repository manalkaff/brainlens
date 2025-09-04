import type { Topic } from "wasp/entities";
import { aiLearningAgent, type TopicResearchRequest, type TopicResearchResult, type SubtopicInfo } from "./aiLearningAgent";
import { prisma } from "wasp/server";
import { getCachedContent, setCachedContent, isCacheValid } from "./cachingSystem";
import { storeTopicContent, initializeTopicVectorStorage } from "../research/vectorOperations";

// Utility function to ensure timestamp is a Date object
function ensureTimestamp(timestamp: any): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  // If timestamp is undefined or invalid, return current date
  return new Date();
}

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
    options: IterativeResearchOptions = {},
    userContext?: { userId?: string; level?: string; style?: string }
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
      }, options.forceRefresh, userContext?.userId ? {
        userId: userContext.userId,
        level: userContext.level,
        style: userContext.style
      } : undefined);
      
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
          },
          userContext?.userId ? {
            userId: userContext.userId,
            level: userContext.level,
            style: userContext.style
          } : undefined
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
   * Research a single topic with proper user content vs shared cache logic
   */
  private async researchSingleTopic(
    request: TopicResearchRequest,
    forceRefresh: boolean = false,
    userContext?: { userId: string; level?: string; style?: string }
  ): Promise<{ result: TopicResearchResult; fromCache: boolean }> {
    console.log(`🔍 DEBUG: researchSingleTopic called with userContext:`, userContext);
    console.log(`🔍 DEBUG: forceRefresh: ${forceRefresh}, topic: "${request.topic}"`);
    
    // First check if we have existing user content for this topic
    if (userContext?.userId && !forceRefresh) {
      console.log(`🔍 DEBUG: Checking for existing user content...`);
      const existingUserContent = await this.getUserExistingContent(request.topic, {
        userId: userContext.userId,
        level: userContext.level,
        style: userContext.style
      });
      if (existingUserContent) {
        console.log(`👤 User content found for "${request.topic}"`);
        return { result: existingUserContent, fromCache: false }; // It's stored content, not cache
      } else {
        console.log(`🔍 DEBUG: No existing user content found for "${request.topic}"`);
      }
    } else {
      console.log(`🔍 DEBUG: Skipping user content check - userId: ${userContext?.userId}, forceRefresh: ${forceRefresh}`);
    }
    
    const cacheKey = this.generateCacheKey(request.topic, request.userContext);
    
    // Check shared research cache (unless forcing refresh)
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
    
    // Store as user content if user context provided
    if (userContext?.userId) {
      await this.storeUserContent(request.topic, result, {
        userId: userContext.userId,
        level: userContext.level,
        style: userContext.style
      });
    }
    
    // Also cache for other users to benefit from
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
    onProgress: (fromCache: boolean) => void,
    userContext?: { userId?: string; level?: string; style?: string }
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
            options.forceRefresh || false,
            userContext?.userId ? {
              userId: userContext.userId,
              level: userContext.level,
              style: userContext.style
            } : undefined
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
              onProgress,
              userContext?.userId ? {
                userId: userContext.userId,
                level: userContext.level,
                style: userContext.style
              } : undefined
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
        // Use upsert to handle potential race conditions
        mainTopic = await prisma.topic.upsert({
          where: { slug: topicSlug },
          update: {
            title: result.mainTopic.topic,
            summary: result.mainTopic.content.keyTakeaways.join(" "),
            status: 'COMPLETED',
            metadata: {
              researchMetadata: JSON.parse(JSON.stringify(result.mainTopic.metadata)),
              cacheKey: result.cacheKey,
              lastResearchUpdate: ensureTimestamp(result.mainTopic.timestamp).toISOString()
            } as any
          },
          create: {
            slug: topicSlug,
            title: result.mainTopic.topic,
            summary: result.mainTopic.content.keyTakeaways.join(" "),
            depth: 0,
            status: 'COMPLETED',
            metadata: {
              researchMetadata: JSON.parse(JSON.stringify(result.mainTopic.metadata)),
              cacheKey: result.cacheKey,
              lastResearchUpdate: ensureTimestamp(result.mainTopic.timestamp).toISOString()
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
              lastResearchUpdate: ensureTimestamp(result.mainTopic.timestamp).toISOString()
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
          
          // Use upsert to handle race conditions
          subtopic = await prisma.topic.upsert({
            where: { slug: uniqueSlug },
            update: {
              title: subtopicTitle,
              summary: subtopicResult.content.keyTakeaways.join(" "),
              status: 'COMPLETED',
              metadata: {
                researchMetadata: JSON.parse(JSON.stringify(subtopicResult.metadata)),
                cacheKey: subtopicResult.cacheKey,
                lastResearchUpdate: ensureTimestamp(subtopicResult.timestamp).toISOString()
              } as any
            },
            create: {
              slug: uniqueSlug,
              title: subtopicTitle,
              summary: subtopicResult.content.keyTakeaways.join(" "),
              depth: subtopicResult.depth,
              parentId: mainTopic!.id,
              status: 'COMPLETED',
              metadata: {
                researchMetadata: JSON.parse(JSON.stringify(subtopicResult.metadata)),
                cacheKey: subtopicResult.cacheKey,
                lastResearchUpdate: ensureTimestamp(subtopicResult.timestamp).toISOString()
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

      // Store content in vector database for RAG
      try {
        // Get topic information for vector storage
        const topic = await prisma.topic.findUnique({
          where: { id: topicId }
        });

        if (topic) {
          // Initialize vector storage collection if needed
          await initializeTopicVectorStorage(topicId);

          // Store main content
          await storeTopicContent(
            topicId,
            topic.slug,
            result.content.content, // MDX content
            'generated',
            topic.depth || 0,
            {
              sections: result.content.sections,
              keyTakeaways: result.content.keyTakeaways,
              nextSteps: result.content.nextSteps,
              sources: result.sources,
              confidence: result.metadata?.confidence || 0.8
            }
          );

          // Store key takeaways separately for better RAG retrieval
          if (result.content.keyTakeaways.length > 0) {
            await storeTopicContent(
              topicId,
              topic.slug,
              result.content.keyTakeaways.join('\n'),
              'summary',
              topic.depth || 0,
              {
                contentType: 'key_takeaways',
                confidence: result.metadata?.confidence || 0.8
              }
            );
          }

          console.log(`✅ Stored topic content in vector database for RAG: ${topic.title}`);
        }
      } catch (vectorError) {
        console.error(`Failed to store vector content for topic ${topicId}:`, vectorError);
        // Don't throw - vector storage failure shouldn't break the entire process
      }
    } catch (error) {
      console.error(`Failed to store generated content for topic ${topicId}:`, error);
      // Don't throw - content storage failure shouldn't break the entire process
    }
  }

  /**
   * Check if user has existing content for this topic
   */
  private async getUserExistingContent(
    topic: string, 
    userContext: { userId: string; level?: string; style?: string }
  ): Promise<TopicResearchResult | null> {
    try {
      console.log(`🔍 DEBUG: getUserExistingContent called for user ${userContext.userId}, topic: "${topic}"`);
      
      // Find topic by title or slug (including slug variations)
      const topicSlug = this.generateSlug(topic);
      console.log(`🔍 DEBUG: Looking for topic with title "${topic}" or slug starting with "${topicSlug}"`);
      
      const existingTopic = await prisma.topic.findFirst({
        where: {
          OR: [
            { title: topic },
            { slug: topicSlug },
            { slug: { startsWith: topicSlug + '-' } } // Match variations like "digital-marketing-1"
          ]
        }
      });
      
      console.log(`🔍 DEBUG: Found topic:`, existingTopic ? { id: existingTopic.id, title: existingTopic.title, slug: existingTopic.slug } : 'None');
      
      if (!existingTopic) return null;
      
      // Check for existing generated content for this user
      const searchParams = {
        topicId: existingTopic.id,
        contentType: 'research',
        userLevel: userContext.level || 'intermediate',
        learningStyle: userContext.style || 'textual',
        NOT: {
          userLevel: 'cache'
        }
      };
      console.log(`🔍 DEBUG: Searching for existing content with params:`, searchParams);
      
      const existingContent = await prisma.generatedContent.findFirst({
        where: searchParams
      });
      
      console.log(`🔍 DEBUG: Found existing content:`, existingContent ? { 
        id: existingContent.id, 
        contentType: existingContent.contentType,
        userLevel: existingContent.userLevel,
        learningStyle: existingContent.learningStyle,
        hasMetadata: !!existingContent.metadata 
      } : 'None');
      
      if (existingContent && existingContent.metadata) {
        const metadata = existingContent.metadata as any;
        console.log(`🔍 DEBUG: Metadata keys:`, Object.keys(metadata));
        if (metadata.researchResult) {
          console.log(`📚 Found existing user content for topic: ${topic}`);
          return metadata.researchResult;
        } else if (metadata.isUserContent) {
          console.log(`📚 Found user content but no researchResult field for topic: ${topic}`);
        }
      }
      
      // Also check for any content type (not just 'research') 
      console.log(`🔍 DEBUG: Checking for ANY content type for this topic...`);
      const anyContent = await prisma.generatedContent.findMany({
        where: {
          topicId: existingTopic.id,
          NOT: {
            userLevel: 'cache'
          }
        },
        select: {
          id: true,
          contentType: true,
          userLevel: true,
          learningStyle: true,
          metadata: true
        }
      });
      console.log(`🔍 DEBUG: All content for this topic:`, anyContent);
      
      // Try to find ANY content that could be adapted for the user
      if (anyContent.length > 0) {
        const adaptableContent = anyContent.find(content => {
          const metadata = content.metadata as any;
          return metadata && (metadata.researchResult || metadata.isUserContent);
        });
        
        if (adaptableContent) {
          console.log(`🔍 DEBUG: Found adaptable content:`, {
            id: adaptableContent.id,
            contentType: adaptableContent.contentType,
            userLevel: adaptableContent.userLevel
          });
          
          const metadata = adaptableContent.metadata as any;
          if (metadata.researchResult) {
            console.log(`📚 Using adaptable content for topic: ${topic}`);
            return metadata.researchResult;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking user existing content:', error);
      return null;
    }
  }

  /**
   * Store research result as permanent user content
   */
  private async storeUserContent(
    topic: string,
    result: TopicResearchResult,
    userContext: { userId: string; level?: string; style?: string }
  ): Promise<void> {
    try {
      console.log(`🔍 DEBUG: storeUserContent for user ${userContext.userId}, topic: "${topic}"`);
      
      // First try to find existing topic (including variations)
      const topicSlug = this.generateSlug(topic);
      let topicRecord = await prisma.topic.findFirst({
        where: {
          OR: [
            { title: topic },
            { slug: topicSlug },
            { slug: { startsWith: topicSlug + '-' } }
          ]
        }
      });
      
      if (!topicRecord) {
        // Create new topic only if none exists
        console.log(`🔍 DEBUG: Creating new topic with slug: ${topicSlug}`);
        topicRecord = await prisma.topic.create({
          data: {
            slug: topicSlug,
            title: topic,
            summary: result.content.keyTakeaways.join(' '),
            depth: result.depth || 0,
            status: 'COMPLETED'
          }
        });
      } else {
        console.log(`🔍 DEBUG: Using existing topic:`, { id: topicRecord.id, slug: topicRecord.slug });
      }
      
      // Store as user-specific content
      console.log(`🔍 DEBUG: Storing user content with params:`, {
        topicId: topicRecord.id,
        contentType: 'research',
        userLevel: userContext.level || 'intermediate',
        learningStyle: userContext.style || 'textual',
        userId: userContext.userId
      });
      
      const storedContent = await prisma.generatedContent.upsert({
        where: {
          topicId_contentType_userLevel_learningStyle: {
            topicId: topicRecord.id,
            contentType: 'research',
            userLevel: userContext.level || 'intermediate',
            learningStyle: userContext.style || 'textual'
          }
        },
        create: {
          topicId: topicRecord.id,
          contentType: 'research',
          content: result.content.content || '',
          userLevel: userContext.level || 'intermediate',
          learningStyle: userContext.style || 'textual',
          metadata: {
            researchResult: JSON.parse(JSON.stringify(result)),
            userId: userContext.userId,
            isUserContent: true
          } as any
        },
        update: {
          content: result.content.content || '',
          metadata: {
            researchResult: JSON.parse(JSON.stringify(result)),
            userId: userContext.userId,
            isUserContent: true
          } as any
        }
      });
      
      console.log(`✅ Stored user content successfully:`, { id: storedContent.id, contentType: storedContent.contentType });
      
      console.log(`💾 Stored research as user content for: ${topic}`);
    } catch (error) {
      console.error('Error storing user content:', error);
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
    // Clean up the base slug to be safe
    const cleanBaseSlug = baseSlug.substring(0, 40); // Leave room for suffixes
    
    // First try the base slug
    const existingTopic = await prisma.topic.findUnique({
      where: { slug: cleanBaseSlug }
    });
    
    if (!existingTopic) {
      return cleanBaseSlug;
    }
    
    // If it exists, try appending a timestamp-based suffix for uniqueness
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const uniqueSlug = `${cleanBaseSlug}-${timestamp}`.substring(0, 50);
    
    // Check if this timestamp-based slug exists (very unlikely)
    const existingWithTimestamp = await prisma.topic.findUnique({
      where: { slug: uniqueSlug }
    });
    
    if (!existingWithTimestamp) {
      return uniqueSlug;
    }
    
    // If even that exists (extremely unlikely), append a counter
    let counter = 1;
    let finalSlug: string;
    do {
      finalSlug = `${cleanBaseSlug}-${timestamp}-${counter}`.substring(0, 50);
      const existing = await prisma.topic.findUnique({
        where: { slug: finalSlug }
      });
      if (!existing) {
        break;
      }
      counter++;
    } while (counter < 100); // Prevent infinite loop
    
    return finalSlug;
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
  options: IterativeResearchOptions = {},
  userContext?: { userId?: string; level?: string; style?: string }
): Promise<IterativeResearchResult> {
  return await iterativeResearchEngine.researchAndGenerate(topic, options, userContext);
}

/**
 * Convenience function to research and store to database
 */
export async function researchAndStore(
  topic: string,
  topicSlug: string,
  options: IterativeResearchOptions = {},
  userContext?: { userId?: string; level?: string; style?: string }
): Promise<{ 
  research: IterativeResearchResult; 
  storage: { mainTopicId: string; subtopicIds: string[] } 
}> {
  const research = await researchAndGenerate(topic, options, userContext);
  const storage = await iterativeResearchEngine.storeToDatabase(research, topicSlug);
  
  return { research, storage };
}