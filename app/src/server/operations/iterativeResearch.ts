import { HttpError } from 'wasp/server';
import type { Topic } from 'wasp/entities';
import { prisma } from 'wasp/server';
import type { 
  IterativeResearchOptions,
  SerializableIterativeResearchResult
} from '../../learning/api/iterativeResearch';
import { makeSerializable } from '../../learning/api/iterativeResearch';
import type { 
  DepthExpansionRequest,
  SerializableDepthExpansionResult
} from '../../learning/api/topicDepthManager';
import { makeDepthExpansionSerializable } from '../../learning/api/topicDepthManager';
import type { SubtopicInfo } from '../../learning/api/aiLearningAgent';
import type { TopicHierarchy } from '../../learning/api/topicDepthManager';

// Types for operations
export interface StartIterativeResearchArgs {
  topicSlug: string;
  options?: IterativeResearchOptions;
}

export interface ExpandTopicDepthArgs {
  topicId: string;
  targetDepth: number;
  userContext?: {
    level?: "beginner" | "intermediate" | "advanced";
    interests?: string[];
  };
  forceRefresh?: boolean;
}

export interface GenerateSubtopicsArgs {
  topicId: string;
  userContext?: any;
  forceRefresh?: boolean;
}

/**
 * Start iterative research for a topic
 * This is the main entry point for the new AI learning engine
 */
export const startIterativeResearch = async (
  { topicSlug, options = {} }: StartIterativeResearchArgs,
  context: any
): Promise<SerializableIterativeResearchResult> => {
  try {
    console.log(`🎯 Starting iterative research for topic: ${topicSlug}`);

    // Find the topic in database
    const topic = await prisma.topic.findUnique({
      where: { slug: topicSlug }
    });

    if (!topic) {
      throw new HttpError(404, `Topic with slug "${topicSlug}" not found`);
    }

    // Set default options
    const researchOptions: IterativeResearchOptions = {
      maxDepth: 3,
      forceRefresh: false,
      userContext: {
        level: 'intermediate',
        interests: [],
        previousKnowledge: []
      },
      ...options
    };

    // Dynamic import to avoid circular dependency issues
    const { researchAndStore } = await import('../../learning/api/iterativeResearch');
    
    // Perform iterative research with user context
    const userContext = {
      userId: context.user?.id,
      level: researchOptions.userContext?.level || 'intermediate',
      style: 'textual' // Default learning style
    };
    
    console.log(`🔍 DEBUG: Starting research for user ID: ${userContext.userId}, topic: ${topic.title}`);
    console.log(`🔍 DEBUG: User context:`, userContext);
    
    const result = await researchAndStore(topic.title, topicSlug, researchOptions, userContext);

    // Update topic status
    await prisma.topic.update({
      where: { id: topic.id },
      data: {
        status: 'COMPLETED',
        cacheStatus: 'FRESH',
        lastResearched: new Date(),
        researchVersion: '1.0.0',
        subtopicsGenerated: result.research.subtopicResults.size > 0
      }
    });

    console.log(`✅ Iterative research completed for: ${topicSlug}`);
    return makeSerializable(result.research);

  } catch (error) {
    console.error(`❌ Iterative research failed for topic "${topicSlug}":`, error);
    
    // Update topic status to error
    try {
      await prisma.topic.updateMany({
        where: { slug: topicSlug },
        data: { 
          status: 'ERROR',
          cacheStatus: 'ERROR' 
        }
      });
    } catch (updateError) {
      console.error('Failed to update topic status:', updateError);
    }

    throw new HttpError(500, `Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Expand a topic to a specific depth
 */
export const expandTopicDepth = async (
  { topicId, targetDepth, userContext, forceRefresh = false }: ExpandTopicDepthArgs,
  context: any
): Promise<SerializableDepthExpansionResult> => {
  try {
    console.log(`🌳 Expanding topic ${topicId} to depth ${targetDepth}`);

    const request: DepthExpansionRequest = {
      topicId,
      targetDepth,
      userContext,
      forceRefresh
    };

    // Dynamic import to avoid circular dependency issues
    const { topicDepthManager } = await import('../../learning/api/topicDepthManager');
    const result = await topicDepthManager.expandToDepth(request);

    console.log(`✅ Topic expansion completed: ${result.newTopicsCreated} new topics`);
    return makeDepthExpansionSerializable(result);

  } catch (error) {
    console.error(`❌ Topic expansion failed:`, error);
    throw new HttpError(500, `Topic expansion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generate subtopics for a topic
 */
export const generateSubtopics = async (
  { topicId, userContext, forceRefresh = false }: GenerateSubtopicsArgs,
  context: any
): Promise<{ subtopics: SubtopicInfo[]; researchResult?: SerializableIterativeResearchResult }> => {
  try {
    console.log(`🔬 Generating subtopics for topic: ${topicId}`);

    // Dynamic import to avoid circular dependency issues
    const { topicDepthManager } = await import('../../learning/api/topicDepthManager');
    const result = await topicDepthManager.generateSubtopics(topicId, userContext, forceRefresh);

    // Update topic to mark subtopics as generated
    await prisma.topic.update({
      where: { id: topicId },
      data: { subtopicsGenerated: true }
    });

    console.log(`✅ Generated ${result.subtopics.length} subtopics`);
    return {
      subtopics: result.subtopics,
      researchResult: result.researchResult ? makeSerializable(result.researchResult) : undefined
    };

  } catch (error) {
    console.error(`❌ Subtopic generation failed:`, error);
    throw new HttpError(500, `Subtopic generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get topic hierarchy with research status
 */
export const getTopicHierarchy = async (
  { topicId, maxDepth }: { topicId: string; maxDepth?: number },
  context: any
): Promise<TopicHierarchy> => {
  try {
    // Dynamic import to avoid circular dependency issues
    const { topicDepthManager } = await import('../../learning/api/topicDepthManager');
    const hierarchy = await topicDepthManager.getTopicHierarchy(topicId, maxDepth);
    return hierarchy;
  } catch (error) {
    console.error(`Failed to get topic hierarchy:`, error);
    throw new HttpError(500, `Failed to get topic hierarchy: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get research statistics
 */
export const getResearchStats = async (
  { topicId }: { topicId: string },
  context: any
) => {
  try {
    // Dynamic import to avoid circular dependency issues
    const { topicDepthManager } = await import('../../learning/api/topicDepthManager');
    const stats = await topicDepthManager.getResearchStats(topicId);
    return stats;
  } catch (error) {
    console.error(`Failed to get research stats:`, error);
    throw new HttpError(500, `Failed to get research stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get cache statistics for monitoring
 */
export const getCacheStatistics = async (
  args: any,
  context: any
) => {
  try {
    // Dynamic import to avoid circular dependency issues
    const { getCacheStats } = await import('../../learning/api/cachingSystem');
    const stats = await getCacheStats();
    return stats;
  } catch (error) {
    console.error(`Failed to get cache stats:`, error);
    throw new HttpError(500, `Failed to get cache stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Clean up expired cache entries
 */
export const cleanupCache = async (
  args: any,
  context: any
) => {
  try {
    // Dynamic import to avoid circular dependency issues
    const { cleanupExpiredEntries } = await import('../../learning/api/cachingSystem');
    const cleaned = await cleanupExpiredEntries();
    return { cleanedEntries: cleaned };
  } catch (error) {
    console.error(`Cache cleanup failed:`, error);
    throw new HttpError(500, `Cache cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Check if topic needs research update
 */
export const checkResearchFreshness = async (
  { topicId, cacheTtlDays = 7 }: { topicId: string; cacheTtlDays?: number },
  context: any
) => {
  try {
    // Dynamic import to avoid circular dependency issues
    const { topicDepthManager } = await import('../../learning/api/topicDepthManager');
    const needsUpdate = await topicDepthManager.needsResearchUpdate(topicId, cacheTtlDays);
    
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { 
        lastResearched: true, 
        cacheStatus: true,
        generatedContent: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    return {
      needsUpdate,
      lastResearched: topic?.lastResearched,
      cacheStatus: topic?.cacheStatus,
      lastContentGenerated: topic?.generatedContent[0]?.createdAt
    };

  } catch (error) {
    console.error(`Failed to check research freshness:`, error);
    throw new HttpError(500, `Failed to check research freshness: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};