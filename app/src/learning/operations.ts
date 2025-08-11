import { HttpError } from 'wasp/server';
import type { 
  CreateTopic, 
  GetTopic, 
  GetTopicTree, 
  UpdateTopicProgress,
  GetUserProgressStats,
  GetTopicProgressSummary
} from 'wasp/server/operations';
import type { Topic, UserTopicProgress } from 'wasp/entities';
import { TopicStatus } from '@prisma/client';

// Helper function to generate URL-friendly slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to ensure unique slug
async function generateUniqueSlug(title: string, context: any): Promise<string> {
  let baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingTopic = await context.entities.Topic.findUnique({
      where: { slug }
    });
    
    if (!existingTopic) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

type CreateTopicInput = {
  title: string;
  summary?: string;
  description?: string;
  parentId?: string;
};

export const createTopic: CreateTopic<CreateTopicInput, Topic> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { title, summary, description, parentId } = args;

  if (!title || title.trim().length === 0) {
    throw new HttpError(400, 'Topic title is required');
  }

  // Validate parent topic exists if parentId is provided
  let depth = 0;

  if (parentId) {
    const parentTopic = await context.entities.Topic.findUnique({
      where: { id: parentId }
    });

    if (!parentTopic) {
      throw new HttpError(404, 'Parent topic not found');
    }

    depth = parentTopic.depth + 1;

    // Limit depth to 3 levels as per requirements
    if (depth > 3) {
      throw new HttpError(400, 'Maximum topic depth of 3 levels exceeded');
    }
  }

  try {
    const slug = await generateUniqueSlug(title, context);

    const topic = await context.entities.Topic.create({
      data: {
        title: title.trim(),
        slug,
        summary: summary?.trim() || null,
        description: description?.trim() || null,
        parentId: parentId || null,
        depth,
        status: TopicStatus.PENDING,
        metadata: {}
      }
    });

    // Create initial progress record for the user
    await context.entities.UserTopicProgress.create({
      data: {
        userId: context.user.id,
        topicId: topic.id,
        completed: false,
        timeSpent: 0,
        preferences: {},
        bookmarks: []
      }
    });

    return topic;
  } catch (error) {
    console.error('Failed to create topic:', error);
    throw new HttpError(500, 'Failed to create topic');
  }
};

type GetTopicInput = {
  slug: string;
};

type GetTopicOutput = Topic & {
  userProgress?: UserTopicProgress;
  children: Topic[];
  parent?: Topic | null;
};

export const getTopic: GetTopic<GetTopicInput, GetTopicOutput> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { slug } = args;

  if (!slug) {
    throw new HttpError(400, 'Topic slug is required');
  }

  try {
    const topic = await context.entities.Topic.findUnique({
      where: { slug },
      include: {
        children: {
          orderBy: [
            { depth: 'asc' },
            { createdAt: 'asc' }
          ]
        },
        parent: true,
        userProgress: {
          where: { userId: context.user.id }
        }
      }
    });

    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }

    return {
      ...topic,
      userProgress: topic.userProgress[0] || undefined
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Failed to get topic:', error);
    throw new HttpError(500, 'Failed to retrieve topic');
  }
};

type GetTopicTreeItem = Topic & {
  children: GetTopicTreeItem[];
  userProgress?: UserTopicProgress;
};

type GetTopicTreeOutput = GetTopicTreeItem[];

export const getTopicTree: GetTopicTree<void, GetTopicTreeOutput> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const userId = context.user.id;

  try {
    // Get all root topics (depth 0) with their nested children
    const buildTopicTree = async (parentId: string | null = null): Promise<GetTopicTreeOutput> => {
      const topics = await context.entities.Topic.findMany({
        where: { parentId },
        include: {
          userProgress: {
            where: { userId }
          }
        },
        orderBy: [
          { depth: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      const topicsWithChildren = await Promise.all(
        topics.map(async (topic) => {
          const children = await buildTopicTree(topic.id);
          return {
            ...topic,
            children,
            userProgress: topic.userProgress[0] || undefined
          };
        })
      );

      return topicsWithChildren;
    };

    return await buildTopicTree();
  } catch (error) {
    console.error('Failed to get topic tree:', error);
    throw new HttpError(500, 'Failed to retrieve topic tree');
  }
};

type UpdateTopicProgressInput = {
  topicId: string;
  completed?: boolean;
  timeSpent?: number;
  preferences?: Record<string, any>;
  bookmarks?: string[];
};

export const updateTopicProgress: UpdateTopicProgress<UpdateTopicProgressInput, UserTopicProgress> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { topicId, completed, timeSpent, preferences, bookmarks } = args;

  if (!topicId) {
    throw new HttpError(400, 'Topic ID is required');
  }

  // Validate topic exists
  const topic = await context.entities.Topic.findUnique({
    where: { id: topicId },
    include: {
      parent: true,
      children: true
    }
  });

  if (!topic) {
    throw new HttpError(404, 'Topic not found');
  }

  try {
    // Find existing progress record
    const existingProgress = await context.entities.UserTopicProgress.findUnique({
      where: {
        userId_topicId: {
          userId: context.user.id,
          topicId
        }
      }
    });

    const updateData: any = {
      lastAccessed: new Date()
    };

    if (completed !== undefined) {
      updateData.completed = completed;
    }

    if (timeSpent !== undefined && timeSpent >= 0) {
      // Add to existing time spent
      updateData.timeSpent = existingProgress ? existingProgress.timeSpent + timeSpent : timeSpent;
    }

    if (preferences !== undefined) {
      updateData.preferences = preferences;
    }

    if (bookmarks !== undefined) {
      updateData.bookmarks = bookmarks;
    }

    let updatedProgress;
    if (existingProgress) {
      // Update existing progress
      updatedProgress = await context.entities.UserTopicProgress.update({
        where: {
          userId_topicId: {
            userId: context.user.id,
            topicId
          }
        },
        data: updateData
      });
    } else {
      // Create new progress record
      updatedProgress = await context.entities.UserTopicProgress.create({
        data: {
          userId: context.user.id,
          topicId,
          completed: completed || false,
          timeSpent: timeSpent || 0,
          preferences: preferences || {},
          bookmarks: bookmarks || [],
          ...updateData
        }
      });
    }

    // If this topic was marked as completed, update parent progress
    if (completed === true && topic.parent) {
      await updateParentProgress(context.user.id, topic.parent.id, context);
    }

    return updatedProgress;
  } catch (error) {
    console.error('Failed to update topic progress:', error);
    throw new HttpError(500, 'Failed to update topic progress');
  }
};

// Helper function to calculate and update parent topic progress
async function updateParentProgress(userId: string, parentTopicId: string, context: any): Promise<void> {
  try {
    // Get all children of the parent topic
    const parentTopic = await context.entities.Topic.findUnique({
      where: { id: parentTopicId },
      include: {
        children: {
          include: {
            userProgress: {
              where: { userId }
            }
          }
        },
        parent: true
      }
    });

    if (!parentTopic || parentTopic.children.length === 0) {
      return;
    }

    // Calculate completion percentage based on children
    const completedChildren = parentTopic.children.filter(child => 
      child.userProgress.length > 0 && child.userProgress[0].completed
    ).length;

    const totalChildren = parentTopic.children.length;
    const isParentCompleted = completedChildren === totalChildren;

    // Calculate total time spent on all children
    const totalTimeSpent = parentTopic.children.reduce((total, child) => {
      return total + (child.userProgress.length > 0 ? child.userProgress[0].timeSpent : 0);
    }, 0);

    // Update or create parent progress
    const existingParentProgress = await context.entities.UserTopicProgress.findUnique({
      where: {
        userId_topicId: {
          userId,
          topicId: parentTopicId
        }
      }
    });

    if (existingParentProgress) {
      await context.entities.UserTopicProgress.update({
        where: {
          userId_topicId: {
            userId,
            topicId: parentTopicId
          }
        },
        data: {
          completed: isParentCompleted,
          timeSpent: totalTimeSpent,
          lastAccessed: new Date()
        }
      });
    } else {
      await context.entities.UserTopicProgress.create({
        data: {
          userId,
          topicId: parentTopicId,
          completed: isParentCompleted,
          timeSpent: totalTimeSpent,
          lastAccessed: new Date(),
          preferences: {},
          bookmarks: []
        }
      });
    }

    // Recursively update grandparent if parent is now completed
    if (isParentCompleted && parentTopic.parent) {
      await updateParentProgress(userId, parentTopic.parent.id, context);
    }
  } catch (error) {
    console.error('Failed to update parent progress:', error);
    // Don't throw error to avoid breaking the main progress update
  }
}

// Get user's overall progress statistics
type UserProgressStats = {
  totalTopics: number;
  completedTopics: number;
  totalTimeSpent: number;
  completionPercentage: number;
  recentActivity: UserTopicProgress[];
  topicsInProgress: number;
};

export const getUserProgressStats: GetUserProgressStats<void, UserProgressStats> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  try {
    // Get all user progress records
    const allProgress = await context.entities.UserTopicProgress.findMany({
      where: { userId: context.user.id },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            slug: true,
            depth: true
          }
        }
      },
      orderBy: { lastAccessed: 'desc' }
    });

    const totalTopics = allProgress.length;
    const completedTopics = allProgress.filter(p => p.completed).length;
    const totalTimeSpent = allProgress.reduce((sum, p) => sum + p.timeSpent, 0);
    const completionPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
    const topicsInProgress = allProgress.filter(p => !p.completed && p.timeSpent > 0).length;

    // Get recent activity (last 10 accessed topics)
    const recentActivity = allProgress.slice(0, 10);

    return {
      totalTopics,
      completedTopics,
      totalTimeSpent,
      completionPercentage: Math.round(completionPercentage * 100) / 100, // Round to 2 decimal places
      recentActivity,
      topicsInProgress
    };
  } catch (error) {
    console.error('Failed to get user progress stats:', error);
    throw new HttpError(500, 'Failed to retrieve progress statistics');
  }
};

// Get detailed progress summary for a specific topic and its hierarchy
type TopicProgressSummaryInput = {
  topicId: string;
};

type TopicProgressSummary = {
  topic: Topic;
  userProgress?: UserTopicProgress;
  childrenProgress: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    completionPercentage: number;
  };
  hierarchyProgress: {
    totalTimeSpent: number;
    totalBookmarks: number;
    deepestCompletedLevel: number;
  };
};

export const getTopicProgressSummary: GetTopicProgressSummary<TopicProgressSummaryInput, TopicProgressSummary> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const userId = context.user.id;
  const { topicId } = args;

  if (!topicId) {
    throw new HttpError(400, 'Topic ID is required');
  }

  try {
    // Get topic with all descendants
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId },
      include: {
        userProgress: {
          where: { userId }
        }
      }
    });

    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }

    // Get all descendant topics recursively
    const getAllDescendants = async (parentId: string): Promise<any[]> => {
      const children = await context.entities.Topic.findMany({
        where: { parentId },
        include: {
          userProgress: {
            where: { userId }
          }
        }
      });

      if (!children || children.length === 0) {
        return [];
      }

      let allDescendants = [...children];
      for (const child of children) {
        const grandchildren = await getAllDescendants(child.id);
        allDescendants = [...allDescendants, ...grandchildren];
      }

      return allDescendants;
    };

    const descendants = await getAllDescendants(topicId);
    
    // Calculate children progress (direct children only)
    const directChildren = descendants.filter(d => d.parentId === topicId);
    const completedChildren = directChildren.filter(child => 
      child.userProgress.length > 0 && child.userProgress[0].completed
    ).length;
    const inProgressChildren = directChildren.filter(child => 
      child.userProgress.length > 0 && !child.userProgress[0].completed && child.userProgress[0].timeSpent > 0
    ).length;
    const notStartedChildren = directChildren.length - completedChildren - inProgressChildren;

    const childrenProgress = {
      total: directChildren.length,
      completed: completedChildren,
      inProgress: inProgressChildren,
      notStarted: notStartedChildren,
      completionPercentage: directChildren.length > 0 ? 
        Math.round((completedChildren / directChildren.length) * 100 * 100) / 100 : 0
    };

    // Calculate hierarchy progress (all descendants)
    const allProgressRecords = descendants
      .map(d => d.userProgress[0])
      .filter(Boolean);

    const totalTimeSpent = allProgressRecords.reduce((sum, p) => sum + p.timeSpent, 0) + 
      (topic.userProgress[0]?.timeSpent || 0);
    
    const totalBookmarks = allProgressRecords.reduce((sum, p) => sum + p.bookmarks.length, 0) + 
      (topic.userProgress[0]?.bookmarks.length || 0);

    // Find deepest completed level
    const completedDescendants = descendants.filter(d => 
      d.userProgress.length > 0 && d.userProgress[0].completed
    );
    const deepestCompletedLevel = completedDescendants.length > 0 ? 
      Math.max(...completedDescendants.map(d => d.depth)) : 
      (topic.userProgress[0]?.completed ? topic.depth : -1);

    const hierarchyProgress = {
      totalTimeSpent,
      totalBookmarks,
      deepestCompletedLevel
    };

    return {
      topic,
      userProgress: topic.userProgress[0] || undefined,
      childrenProgress,
      hierarchyProgress
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Failed to get topic progress summary:', error);
    throw new HttpError(500, 'Failed to retrieve topic progress summary');
  }
};