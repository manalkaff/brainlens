import { HttpError } from 'wasp/server';
import type { 
  StartTopicResearch,
  CancelTopicResearch,
  GetResearchStatus,
  GetResearchResults
} from 'wasp/server/operations';
import type { Topic, VectorDocument } from 'wasp/entities';
import { TopicStatus } from '@prisma/client';
import { getResearchManager } from './integration';
import { 
  handleServerError, 
  withDatabaseErrorHandling, 
  withResearchPipelineErrorHandling,
  validateInput, 
  sanitizeInput,
  withRetry,
  circuitBreakers
} from '../errors/errorHandler';
import { 
  createAuthenticationError, 
  createValidationError,
  createLearningError,
  ErrorType,
  ERROR_CODES
} from '../errors/errorTypes';

// Types for research operations
type StartTopicResearchInput = {
  topicId: string;
  userContext?: {
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    preferences?: Record<string, any>;
  };
};

type ResearchStatusOutput = {
  topicId: string;
  status: 'inactive' | 'queued' | 'active' | 'completed' | 'error';
  progress?: number;
  activeAgents?: string[];
  completedAgents?: number;
  totalAgents?: number;
  estimatedCompletion?: Date;
  errors?: string[];
  lastUpdate?: Date;
};

type ResearchResultsOutput = {
  topicId: string;
  results: {
    agent: string;
    summary?: string;
    sources: Array<{
      title: string;
      url: string;
      snippet: string;
      source: string;
      relevanceScore?: number;
    }>;
    subtopics?: string[];
    timestamp: Date;
  }[];
  aggregatedSummary?: string;
  totalSources: number;
  confidence: number;
  completeness: number;
};

// Start research for a topic
export const startTopicResearch: StartTopicResearch<StartTopicResearchInput, { success: boolean; message: string }> = async (args, context) => {
  if (!context.user) {
    throw createAuthenticationError('Authentication required to start research');
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

  const { userContext } = args;

  // Validate user context if provided
  if (userContext) {
    if (userContext.userLevel && !['beginner', 'intermediate', 'advanced'].includes(userContext.userLevel)) {
      throw createValidationError('userLevel', 'Invalid user level');
    }
    if (userContext.learningStyle && !['visual', 'auditory', 'kinesthetic', 'mixed'].includes(userContext.learningStyle)) {
      throw createValidationError('learningStyle', 'Invalid learning style');
    }
  }

  return withDatabaseErrorHandling(async () => {
    // Verify topic exists and user has access
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId },
      include: {
        userProgress: {
          where: { userId: user.id }
        }
      }
    });

    if (!topic) {
      throw createValidationError('topicId', 'Topic not found');
    }

    // Check if topic is already being researched or completed
    if (topic.status === TopicStatus.RESEARCHING) {
      throw createLearningError(
        ErrorType.RESEARCH_PIPELINE_ERROR,
        ERROR_CODES.RESEARCH_INITIALIZATION_FAILED,
        'Research is already in progress for this topic',
        {
          userMessage: 'Research is already in progress for this topic. Please wait for it to complete.',
          context: { topicId, userId: user.id, currentStatus: topic.status }
        }
      );
    }

    if (topic.status === TopicStatus.COMPLETED) {
      throw createLearningError(
        ErrorType.RESEARCH_PIPELINE_ERROR,
        ERROR_CODES.RESEARCH_INITIALIZATION_FAILED,
        'Research has already been completed for this topic',
        {
          userMessage: 'Research has already been completed for this topic.',
          context: { topicId, userId: user.id, currentStatus: topic.status }
        }
      );
    }

    // Start research with circuit breaker and error handling
    await circuitBreakers.aiService.execute(async () => {
      return withResearchPipelineErrorHandling(async () => {
        const researchManager = getResearchManager();
        await researchManager.startTopicResearch(topicId, context, userContext);
      }, 'START_RESEARCH', { topicId, userId: user.id });
    }, 'RESEARCH_SERVICE');

    return {
      success: true,
      message: 'Research started successfully'
    };
  }, 'START_TOPIC_RESEARCH', { userId: user.id, topicId });
};

// Cancel research for a topic
export const cancelTopicResearch: CancelTopicResearch<{ topicId: string }, { success: boolean; message: string }> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { topicId } = args;

  if (!topicId) {
    throw new HttpError(400, 'Topic ID is required');
  }

  try {
    // Verify topic exists
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }

    // Get research manager and cancel research
    const researchManager = getResearchManager();
    await researchManager.cancelResearch(topicId, context);

    return {
      success: true,
      message: 'Research cancelled successfully'
    };

  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Failed to cancel topic research:', error);
    throw new HttpError(500, 'Failed to cancel research');
  }
};

// Get research status for a topic
export const getResearchStatus: GetResearchStatus<{ topicId: string }, ResearchStatusOutput> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { topicId } = args;

  if (!topicId) {
    throw new HttpError(400, 'Topic ID is required');
  }

  try {
    // Get topic with current status
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }

    // Get research manager status
    const researchManager = getResearchManager();
    const managerStatus = researchManager.getResearchStatus(topicId);

    // Build status response
    const status: ResearchStatusOutput = {
      topicId,
      status: managerStatus === 'inactive' ? 
        (topic.status === TopicStatus.COMPLETED ? 'completed' : 
         topic.status === TopicStatus.ERROR ? 'error' : 'inactive') : 
        managerStatus,
      lastUpdate: topic.updatedAt
    };

    // Add research metadata if available
    if (topic.metadata && typeof topic.metadata === 'object') {
      const metadata = topic.metadata as any;
      if (metadata.researchStatus) {
        status.progress = metadata.researchStatus.progress;
        status.activeAgents = metadata.researchStatus.activeAgents;
        status.completedAgents = metadata.researchStatus.completedAgents;
        status.totalAgents = metadata.researchStatus.totalAgents;
        status.errors = metadata.researchStatus.errors;
      }
    }

    return status;

  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Failed to get research status:', error);
    throw new HttpError(500, 'Failed to get research status');
  }
};

// Add missing operations
export const getTopicResearchStatus = getResearchStatus; // Alias for compatibility

// Get research history for user
export const getResearchHistory = async (args: { limit?: number; offset?: number }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { limit = 20, offset = 0 } = args;
  const userId = context.user.id;

  try {
    const topics = await context.entities.Topic.findMany({
      where: {
        userProgress: {
          some: { userId }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        userProgress: {
          where: { userId }
        }
      }
    });

    return topics.map((topic: any) => ({
      id: topic.id,
      title: topic.title,
      status: topic.status,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
      progress: topic.userProgress[0]?.progress || 0
    }));
  } catch (error) {
    console.error('Failed to get research history:', error);
    throw new HttpError(500, 'Failed to get research history');
  }
};

// Search topic content
export const searchTopicContent = async (args: { topicId: string; query: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { topicId, query } = args;

  try {
    const vectorDocs = await context.entities.VectorDocument.findMany({
      where: { 
        topicId,
        content: {
          contains: query
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return vectorDocs.map((doc: any) => ({
      id: doc.id,
      content: doc.content.substring(0, 200) + '...',
      createdAt: doc.createdAt,
      relevance: 0.8 // Placeholder relevance score
    }));
  } catch (error) {
    console.error('Failed to search topic content:', error);
    throw new HttpError(500, 'Failed to search content');
  }
};

// Generate topic content
export const generateTopicContent = async (args: { topicId: string; contentType: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { topicId, contentType } = args;

  try {
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }

    // Placeholder content generation
    const generatedContent = {
      summary: `Generated ${contentType} content for ${topic.title}`,
      keyPoints: [`Key point 1 about ${topic.title}`, `Key point 2 about ${topic.title}`],
      generatedAt: new Date(),
      contentType
    };

    return generatedContent;
  } catch (error) {
    console.error('Failed to generate topic content:', error);
    throw new HttpError(500, 'Failed to generate content');
  }
};

// Get topic subtopics
export const getTopicSubtopics = async (args: { topicId: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { topicId } = args;

  try {
    const subtopics = await context.entities.Topic.findMany({
      where: { parentId: topicId },
      orderBy: { createdAt: 'asc' }
    });

    return subtopics.map((subtopic: any) => ({
      id: subtopic.id,
      title: subtopic.title,
      slug: subtopic.slug,
      summary: subtopic.summary,
      depth: subtopic.depth,
      status: subtopic.status
    }));
  } catch (error) {
    console.error('Failed to get topic subtopics:', error);
    throw new HttpError(500, 'Failed to get subtopics');
  }
};

// Get research results for a topic
export const getResearchResults: GetResearchResults<{ topicId: string }, ResearchResultsOutput> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { topicId } = args;

  if (!topicId) {
    throw new HttpError(400, 'Topic ID is required');
  }

  try {
    // Verify topic exists
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }

    // Get vector documents containing research results
    const vectorDocs = await context.entities.VectorDocument.findMany({
      where: { topicId },
      orderBy: { createdAt: 'desc' }
    });

    if (vectorDocs.length === 0) {
      return {
        topicId,
        results: [],
        totalSources: 0,
        confidence: 0,
        completeness: 0
      };
    }

    // Parse and aggregate research results
    const results = vectorDocs.map(doc => {
      try {
        const content = JSON.parse(doc.content);
        return {
          agent: content.agent || 'Unknown Agent',
          summary: content.summary,
          sources: content.results || [],
          subtopics: content.subtopics || [],
          timestamp: doc.createdAt
        };
      } catch (error) {
        console.error('Failed to parse vector document content:', error);
        return {
          agent: 'Unknown Agent',
          sources: [],
          timestamp: doc.createdAt
        };
      }
    });

    // Calculate aggregated metrics
    const totalSources = results.reduce((sum, result) => sum + result.sources.length, 0);
    
    // Calculate confidence and completeness from topic metadata
    let confidence = 0;
    let completeness = 0;
    
    if (topic.metadata && typeof topic.metadata === 'object') {
      const metadata = topic.metadata as any;
      confidence = metadata.confidence || 0;
      completeness = metadata.completeness || 0;
    }

    // Generate aggregated summary from topic description or summary
    const aggregatedSummary = topic.description || topic.summary || 
      `Research results compiled from ${results.length} agents with ${totalSources} total sources.`;

    return {
      topicId,
      results,
      aggregatedSummary,
      totalSources,
      confidence,
      completeness
    };

  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Failed to get research results:', error);
    throw new HttpError(500, 'Failed to get research results');
  }
};