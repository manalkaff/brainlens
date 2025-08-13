import { HttpError } from 'wasp/server';
import { cacheService } from './cacheService';
import type { 
  GetTopic, 
  GetTopicTree, 
  UpdateTopicProgress,
  CreateTopic 
} from 'wasp/server/operations';
import type { Topic, UserTopicProgress, User } from 'wasp/entities';

/**
 * Cached database operations for improved performance
 */

/**
 * Get topic with caching and optimized database queries
 */
export const getTopicCached: GetTopic<{ slug: string }, Topic | null> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  try {
    const { slug } = args;

    // Try cache first
    let topic = await cacheService.getTopic(`slug:${slug}`);
    
    if (!topic) {
      // Cache miss - query database with optimized query
      topic = await context.entities.Topic.findUnique({
        where: { slug },
        include: {
          parent: {
            select: {
              id: true,
              slug: true,
              title: true,
              depth: true
            }
          },
          children: {
            select: {
              id: true,
              slug: true,
              title: true,
              depth: true,
              status: true,
              createdAt: true
            },
            orderBy: [
              { depth: 'asc' },
              { createdAt: 'asc' }
            ]
          },
          userProgress: {
            where: { userId: context.user.id },
            select: {
              id: true,
              completed: true,
              timeSpent: true,
              lastAccessed: true,
              preferences: true,
              bookmarks: true
            }
          },
          _count: {
            select: {
              children: true,
              chatThreads: true,
              quizzes: true,
              vectorDocuments: true
            }
          }
        }
      });

      if (topic) {
        // Cache the result
        await cacheService.setTopic(topic);
      }
    }

    return topic;
  } catch (error) {
    console.error('Failed to get topic (cached):', error);
    throw new HttpError(500, 'Failed to retrieve topic');
  }
};

/**
 * Get topic tree with caching and optimized recursive queries
 */
export const getTopicTreeCached: GetTopicTree<{ rootSlug: string }, Topic[]> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  try {
    const { rootSlug } = args;

    // Try cache first
    let topicTree = await cacheService.getTopicTree(rootSlug);
    
    if (!topicTree) {
      // Cache miss - build optimized recursive query
      const rootTopic = await context.entities.Topic.findUnique({
        where: { slug: rootSlug }
      });

      if (!rootTopic) {
        throw new HttpError(404, 'Root topic not found');
      }

      // Use a single query with deep includes for better performance
      const fullTree = await context.entities.Topic.findMany({
        where: {
          OR: [
            { id: rootTopic.id },
            { parentId: rootTopic.id },
            { 
              parent: {
                parentId: rootTopic.id
              }
            },
            {
              parent: {
                parent: {
                  parentId: rootTopic.id
                }
              }
            }
          ]
        },
        include: {
          parent: {
            select: {
              id: true,
              slug: true,
              title: true
            }
          },
          userProgress: {
            where: { userId: context.user.id },
            select: {
              completed: true,
              timeSpent: true,
              lastAccessed: true
            }
          },
          _count: {
            select: {
              children: true,
              vectorDocuments: true
            }
          }
        },
        orderBy: [
          { depth: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      topicTree = fullTree;

      if (topicTree.length > 0) {
        // Cache the result
        await cacheService.setTopicTree(rootSlug, topicTree);
      }
    }

    return topicTree;
  } catch (error) {
    console.error('Failed to get topic tree (cached):', error);
    throw new HttpError(500, 'Failed to retrieve topic tree');
  }
};

/**
 * Update topic progress with caching
 */
export const updateTopicProgressCached: UpdateTopicProgress<{
  topicId: string;
  completed?: boolean;
  timeSpent?: number;
  preferences?: any;
  bookmarks?: string[];
}, UserTopicProgress> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  try {
    const { topicId, ...updateData } = args;

    // Update database with optimized upsert
    const progress = await context.entities.UserTopicProgress.upsert({
      where: {
        userId_topicId: {
          userId: context.user.id,
          topicId
        }
      },
      update: {
        ...updateData,
        lastAccessed: new Date()
      },
      create: {
        userId: context.user.id,
        topicId,
        ...updateData,
        lastAccessed: new Date()
      },
      include: {
        topic: {
          select: {
            id: true,
            slug: true,
            title: true
          }
        }
      }
    });

    // Update cache
    await cacheService.setUserProgress(progress);

    // Invalidate related caches
    await cacheService.invalidateTopic(topicId);
    await cacheService.invalidateTopicTree(topicId);

    return progress;
  } catch (error) {
    console.error('Failed to update topic progress (cached):', error);
    throw new HttpError(500, 'Failed to update topic progress');
  }
};

/**
 * Create topic with caching
 */
export const createTopicCached: CreateTopic<{
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  parentId?: string;
  depth?: number;
  metadata?: any;
}, Topic> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  try {
    // Create topic in database
    const topic = await context.entities.Topic.create({
      data: {
        ...args,
        depth: args.depth || 0
      },
      include: {
        parent: {
          select: {
            id: true,
            slug: true,
            title: true,
            depth: true
          }
        },
        _count: {
          select: {
            children: true,
            chatThreads: true,
            quizzes: true,
            vectorDocuments: true
          }
        }
      }
    });

    // Cache the new topic
    await cacheService.setTopic(topic);

    // Invalidate parent topic caches if this is a child topic
    if (args.parentId) {
      await cacheService.invalidateTopic(args.parentId);
      await cacheService.invalidateTopicTree(args.parentId);
    }

    return topic;
  } catch (error) {
    console.error('Failed to create topic (cached):', error);
    throw new HttpError(500, 'Failed to create topic');
  }
};

/**
 * Get user's recent topics with caching
 */
export async function getUserRecentTopicsCached(
  userId: string,
  context: any,
  limit: number = 10
): Promise<UserTopicProgress[]> {
  try {
    const cacheKey = `recent_topics:${userId}:${limit}`;
    
    // Try cache first
    let recentTopics = await cacheService.getResearchStatus(cacheKey);
    
    if (!recentTopics) {
      // Cache miss - query database with optimized query
      const progress = await context.entities.UserTopicProgress.findMany({
        where: { userId },
        include: {
          topic: {
            select: {
              id: true,
              slug: true,
              title: true,
              summary: true,
              status: true,
              depth: true,
              createdAt: true,
              _count: {
                select: {
                  children: true
                }
              }
            }
          }
        },
        orderBy: { lastAccessed: 'desc' },
        take: limit
      });

      recentTopics = progress;

      if (progress.length > 0) {
        // Cache the result - store as a special cache entry
        await cacheService.setResearchStatus(cacheKey, progress);
      }
    }

    return recentTopics || [];
  } catch (error) {
    console.error('Failed to get user recent topics (cached):', error);
    throw new HttpError(500, 'Failed to retrieve recent topics');
  }
}

/**
 * Get topic statistics with caching
 */
export async function getTopicStatsCached(
  topicId: string,
  context: any
): Promise<{
  totalUsers: number;
  completedUsers: number;
  averageTimeSpent: number;
  totalChatThreads: number;
  totalQuizzes: number;
  totalVectorDocuments: number;
}> {
  try {
    const cacheKey = `topic_stats:${topicId}`;
    
    // Try cache first (with shorter TTL for stats)
    let stats = await cacheService.getResearchStatus(cacheKey);
    
    if (!stats) {
      // Cache miss - calculate stats with optimized aggregation queries
      const [
        progressStats,
        chatThreadCount,
        quizCount,
        vectorDocCount
      ] = await Promise.all([
        context.entities.UserTopicProgress.aggregate({
          where: { topicId },
          _count: { id: true },
          _avg: { timeSpent: true }
        }),
        context.entities.ChatThread.count({
          where: { topicId }
        }),
        context.entities.Quiz.count({
          where: { topicId }
        }),
        context.entities.VectorDocument.count({
          where: { topicId }
        })
      ]);

      const completedCount = await context.entities.UserTopicProgress.count({
        where: { 
          topicId,
          completed: true 
        }
      });

      stats = {
        totalUsers: progressStats._count.id || 0,
        completedUsers: completedCount,
        averageTimeSpent: Math.round(progressStats._avg.timeSpent || 0),
        totalChatThreads: chatThreadCount,
        totalQuizzes: quizCount,
        totalVectorDocuments: vectorDocCount
      };

      // Cache with shorter TTL for stats (5 minutes)
      await cacheService.setResearchStatus(cacheKey, stats);
    }

    return stats;
  } catch (error) {
    console.error('Failed to get topic stats (cached):', error);
    throw new HttpError(500, 'Failed to retrieve topic statistics');
  }
}

/**
 * Batch invalidate caches for topic operations
 */
export async function invalidateTopicCaches(topicId: string, userId?: string): Promise<void> {
  await Promise.all([
    cacheService.invalidateTopicCache(topicId),
    userId ? cacheService.invalidateUserProgress(userId, topicId) : Promise.resolve(),
    cacheService.invalidateSearchResults(topicId)
  ]);
}

/**
 * Warm frequently accessed caches
 */
export async function warmTopicCaches(
  userId: string,
  topicIds: string[],
  context: any
): Promise<void> {
  console.log(`Warming topic caches for user ${userId}`);
  
  const promises: Promise<any>[] = [];
  
  // Warm topic caches
  for (const topicId of topicIds) {
    promises.push(
      context.entities.Topic.findUnique({ where: { id: topicId } })
        .then((topic: Topic | null) => {
          if (topic) {
            return cacheService.setTopic(topic);
          }
        })
        .catch((error: any) => console.error(`Failed to warm topic cache for ${topicId}:`, error))
    );
  }
  
  // Warm user progress caches
  promises.push(
    getUserRecentTopicsCached(userId, context, 20)
      .catch(error => console.error('Failed to warm recent topics cache:', error))
  );
  
  await Promise.allSettled(promises);
  console.log(`Topic cache warming completed for ${topicIds.length} topics`);
}