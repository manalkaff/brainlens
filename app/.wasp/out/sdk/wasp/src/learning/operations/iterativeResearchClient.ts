// Client-side operation proxies for the iterative research system
// Real Wasp operations imported from main.wasp

import {
  startIterativeResearch as waspStartIterativeResearch,
  expandTopicDepth as waspExpandTopicDepth,
  generateSubtopicsForTopic as waspGenerateSubtopics,
  getTopicHierarchy as waspGetTopicHierarchy,
  checkResearchFreshness as waspCheckResearchFreshness,
  getResearchStats as waspGetResearchStats,
  getCacheStatistics as waspGetCacheStatistics,
  cleanupCache as waspCleanupCache
} from 'wasp/client/operations';

export interface StartIterativeResearchArgs {
  topicSlug: string;
  options?: {
    maxDepth?: number;
    forceRefresh?: boolean;
    userContext?: {
      level?: "beginner" | "intermediate" | "advanced";
      interests?: string[];
    };
  };
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

// Real Wasp operation implementations

export const startIterativeResearch = async (
  args: StartIterativeResearchArgs,
  context?: any
): Promise<any> => {
  console.log('🎯 Starting iterative research (real):', args.topicSlug);
  
  try {
    const result = await waspStartIterativeResearch({
      topicSlug: args.topicSlug,
      options: args.options
    });
    
    console.log('✅ Iterative research completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Iterative research failed:', error);
    throw error;
  }
};

export const expandTopicDepth = async (
  args: ExpandTopicDepthArgs,
  context?: any
): Promise<any> => {
  console.log('🌳 Expanding topic depth (real):', args.topicId, 'to depth', args.targetDepth);
  
  try {
    const result = await waspExpandTopicDepth({
      topicId: args.topicId,
      targetDepth: args.targetDepth,
      userContext: args.userContext,
      forceRefresh: args.forceRefresh
    });
    
    console.log('✅ Topic depth expansion completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Topic depth expansion failed:', error);
    throw error;
  }
};

export const generateSubtopics = async (
  args: GenerateSubtopicsArgs,
  context?: any
): Promise<any> => {
  console.log('🔬 Generating subtopics (real):', args.topicId);
  
  try {
    const result = await waspGenerateSubtopics({
      topicId: args.topicId,
      userContext: args.userContext,
      forceRefresh: args.forceRefresh
    });
    
    console.log('✅ Subtopics generation completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Subtopics generation failed:', error);
    throw error;
  }
};

export const getTopicHierarchy = async (
  args: { topicId: string; maxDepth?: number },
  context?: any
): Promise<any> => {
  console.log('🌳 Getting topic hierarchy (real):', args.topicId);
  
  try {
    const result = await waspGetTopicHierarchy({
      topicId: args.topicId,
      maxDepth: args.maxDepth
    });
    
    console.log('✅ Topic hierarchy retrieved successfully');
    return result;
  } catch (error) {
    console.error('❌ Topic hierarchy retrieval failed:', error);
    throw error;
  }
};

export const checkResearchFreshness = async (
  args: { topicId: string; cacheTtlDays?: number },
  context?: any
): Promise<any> => {
  console.log('🔍 Checking research freshness (real):', args.topicId);
  
  try {
    const result = await waspCheckResearchFreshness({
      topicId: args.topicId,
      cacheTtlDays: args.cacheTtlDays
    });
    
    console.log('✅ Research freshness check completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Research freshness check failed:', error);
    throw error;
  }
};

export const getResearchStats = async (
  args: { topicId: string },
  context?: any
): Promise<any> => {
  console.log('📊 Getting research stats (real):', args.topicId);
  
  try {
    const result = await waspGetResearchStats({
      topicId: args.topicId
    });
    
    console.log('✅ Research stats retrieved successfully');
    return result;
  } catch (error) {
    console.error('❌ Research stats retrieval failed:', error);
    throw error;
  }
};

export const getCacheStatistics = async (
  args: any,
  context?: any
): Promise<any> => {
  console.log('💾 Getting cache statistics (real)');
  
  try {
    const result = await waspGetCacheStatistics(args || {});
    
    console.log('✅ Cache statistics retrieved successfully');
    return result;
  } catch (error) {
    console.error('❌ Cache statistics retrieval failed:', error);
    throw error;
  }
};

export const cleanupCache = async (
  args: any,
  context?: any
): Promise<any> => {
  console.log('🧹 Cleaning up cache (real)');
  
  try {
    const result = await waspCleanupCache(args || {});
    
    console.log('✅ Cache cleanup completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Cache cleanup failed:', error);
    throw error;
  }
};