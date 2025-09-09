import { HttpError } from 'wasp/server';
// Trigger restart to see errors
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
import { consumeCredits } from './subscription/operations';
import { 
  handleServerError, 
  withDatabaseErrorHandling, 
  validateInput, 
  sanitizeInput,
  withRetry
} from './errors/errorHandler';
import { 
  createAuthenticationError, 
  createValidationError,
  createLearningError,
  ErrorType,
  ErrorSeverity,
  ERROR_CODES
} from './errors/errorTypes';

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
    throw createAuthenticationError('Authentication required to create topics');
  }

  // Assert user is defined after authentication check
  const user = context.user;

  // Validate and sanitize inputs
  const title = validateInput(
    args.title,
    (input) => {
      if (!input || typeof input !== 'string' || input.trim().length === 0) {
        throw new Error('Topic title is required');
      }
      return sanitizeInput(input, 200);
    },
    'title',
    { userId: user.id }
  );

  const summary = args.summary ? sanitizeInput(args.summary, 500) : null;
  const description = args.description ? sanitizeInput(args.description, 2000) : null;
  const parentId = args.parentId;

  // Initialize depth variable in outer scope
  let depth = 0;

  return withDatabaseErrorHandling(async () => {
    // Validate parent topic exists if parentId is provided
    if (parentId) {
      const parentTopic = await context.entities.Topic.findUnique({
        where: { id: parentId }
      });

      if (!parentTopic) {
        throw createValidationError('parentId', 'Parent topic not found');
      }

      depth = parentTopic.depth + 1;

      // Limit depth to 3 levels as per requirements
      if (depth > 3) {
        throw createValidationError('depth', 'Maximum topic depth of 3 levels exceeded');
      }
    }

    // Consume credits for topic research (only for root topics)
    if (depth === 0) {
      await withRetry(
        () => consumeCredits(user.id, 'TOPIC_RESEARCH', context, {
          topicTitle: title,
          parentId: parentId || null
        }),
        3,
        1000,
        'CONSUME_CREDITS'
      );
    }

    const slug = await generateUniqueSlug(title, context);

    const topic = await context.entities.Topic.create({
      data: {
        title,
        slug,
        summary,
        description,
        parentId: parentId || null,
        depth,
        status: TopicStatus.PENDING,
        metadata: {}
      }
    });

    // Create initial progress record for the user
    await context.entities.UserTopicProgress.create({
      data: {
        userId: user.id,
        topicId: topic.id,
        completed: false,
        timeSpent: 0,
        preferences: {},
        bookmarks: []
      }
    });

    return topic;
  }, 'CREATE_TOPIC', { userId: user.id, title, depth });
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
    throw createAuthenticationError('Authentication required to access topics');
  }

  // Assert user is defined after authentication check
  const user = context.user;

  const slug = validateInput(
    args.slug,
    (input) => {
      if (!input || typeof input !== 'string' || input.trim().length === 0) {
        throw new Error('Topic slug is required');
      }
      // More permissive slug validation - allow letters, numbers, hyphens, and underscores
      const trimmed = input.trim();
      if (trimmed.length > 100) {
        throw new Error('Slug is too long (maximum 100 characters)');
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        throw new Error(`Slug '${trimmed}' contains invalid characters. Only letters, numbers, hyphens, and underscores are allowed.`);
      }
      return trimmed;
    },
    'slug',
    { userId: user.id, originalSlug: args.slug }
  );

  return withDatabaseErrorHandling(async () => {
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
          where: { userId: user.id }
        }
      }
    });

    if (!topic) {
      throw createLearningError(
        ErrorType.TOPIC_NOT_FOUND,
        ERROR_CODES.TOPIC_NOT_FOUND,
        `Topic with slug '${slug}' not found`,
        {
          severity: ErrorSeverity.LOW,
          recoverable: false,
          userMessage: `Topic '${slug}' not found. It may have been deleted or you may not have access to it.`,
          context: { slug, userId: user.id }
        }
      );
    }

    return {
      ...topic,
      userProgress: topic.userProgress[0] || undefined
    };
  }, 'GET_TOPIC', { userId: user.id, slug });
};

type GetTopicTreeItem = Topic & {
  children: GetTopicTreeItem[];
  userProgress?: UserTopicProgress;
};

type GetTopicTreeOutput = GetTopicTreeItem[];

export const getTopicTree: GetTopicTree<void, GetTopicTreeOutput> = async (_args, context) => {
  if (!context.user) {
    throw createAuthenticationError('Authentication required to access topic tree');
  }

  // Assert user is defined after authentication check
  const user = context.user;
  const userId = user.id;

  return withDatabaseErrorHandling(async () => {
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
  }, 'GET_TOPIC_TREE', { userId });
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
    throw createAuthenticationError('Authentication required to update progress');
  }

  // Assert user is defined after authentication check
  const user = context.user;

  const topicId = validateInput(
    args.topicId,
    (input) => {
      if (!input || typeof input !== 'string') {
        throw new Error('Topic ID is required');
      }
      return input;
    },
    'topicId',
    { userId: user.id }
  );

  // Validate optional inputs
  const { completed, timeSpent, preferences, bookmarks } = args;

  if (timeSpent !== undefined && (typeof timeSpent !== 'number' || timeSpent < 0)) {
    throw createValidationError('timeSpent', 'Time spent must be a non-negative number');
  }

  if (bookmarks !== undefined && !Array.isArray(bookmarks)) {
    throw createValidationError('bookmarks', 'Bookmarks must be an array');
  }

  return withDatabaseErrorHandling(async () => {
    // Validate topic exists
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId },
      include: {
        parent: true,
        children: true
      }
    });

    if (!topic) {
      throw createValidationError('topicId', 'Topic not found');
    }

    // Find existing progress record
    const existingProgress = await context.entities.UserTopicProgress.findUnique({
      where: {
        userId_topicId: {
          userId: user.id,
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
      // Sanitize bookmark strings
      updateData.bookmarks = bookmarks.map((bookmark: string) => 
        sanitizeInput(bookmark, 500)
      );
    }

    let updatedProgress;
    if (existingProgress) {
      // Update existing progress
      updatedProgress = await context.entities.UserTopicProgress.update({
        where: {
          userId_topicId: {
            userId: user.id,
            topicId
          }
        },
        data: updateData
      });
    } else {
      // Create new progress record
      updatedProgress = await context.entities.UserTopicProgress.create({
        data: {
          userId: user.id,
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
      await withRetry(
        () => updateParentProgress(user.id, topic.parent!.id, context),
        2,
        1000,
        'UPDATE_PARENT_PROGRESS'
      );
    }

    return updatedProgress;
  }, 'UPDATE_TOPIC_PROGRESS', { userId: user.id, topicId });
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
    const completedChildren = parentTopic.children.filter((child: any) => 
      child.userProgress.length > 0 && child.userProgress[0].completed
    ).length;

    const totalChildren = parentTopic.children.length;
    const isParentCompleted = completedChildren === totalChildren;

    // Calculate total time spent on all children
    const totalTimeSpent = parentTopic.children.reduce((total: number, child: any) => {
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
  recentActivity: (UserTopicProgress & {
    topic: {
      id: string;
      title: string;
      slug: string;
      depth: number;
    };
  })[];
  topicsInProgress: number;
};

export const getUserProgressStats: GetUserProgressStats<void, UserProgressStats> = async (_args, context) => {
  if (!context.user) {
    throw createAuthenticationError('Authentication required to get progress stats');
  }

  // Assert user is defined after authentication check
  const user = context.user;

  return withDatabaseErrorHandling(async () => {
    // Get all user progress records
    const allProgress = await context.entities.UserTopicProgress.findMany({
      where: { userId: user.id },
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
  }, 'GET_USER_PROGRESS_STATS', { userId: user.id });
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
    throw createAuthenticationError('Authentication required to get progress summary');
  }

  // Assert user is defined after authentication check
  const user = context.user;
  const userId = user.id;
  const { topicId } = args;

  const validatedTopicId = validateInput(
    topicId,
    (input) => {
      if (!input || typeof input !== 'string') {
        throw new Error('Topic ID is required');
      }
      return input;
    },
    'topicId',
    { userId: user.id }
  );

  return withDatabaseErrorHandling(async () => {
    // Get topic with all descendants
    const topic = await context.entities.Topic.findUnique({
      where: { id: validatedTopicId },
      include: {
        userProgress: {
          where: { userId }
        }
      }
    });

    if (!topic) {
      throw createValidationError('topicId', 'Topic not found');
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

    const descendants = await getAllDescendants(validatedTopicId);
    
    // Calculate children progress (direct children only)
    const directChildren = descendants.filter(d => d.parentId === validatedTopicId);
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
  }, 'GET_TOPIC_PROGRESS_SUMMARY', { userId: user.id, topicId: validatedTopicId });
};