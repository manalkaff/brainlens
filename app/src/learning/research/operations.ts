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
    throw new HttpError(401, 'Authentication required');
  }

  const { topicId, userContext } = args;

  if (!topicId) {
    throw new HttpError(400, 'Topic ID is required');
  }

  try {
    // Verify topic exists and user has access
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId },
      include: {
        userProgress: {
          where: { userId: context.user.id }
        }
      }
    });

    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }

    // Check if topic is already being researched or completed
    if (topic.status === TopicStatus.RESEARCHING) {
      throw new HttpError(409, 'Research is already in progress for this topic');
    }

    if (topic.status === TopicStatus.COMPLETED) {
      throw new HttpError(409, 'Research has already been completed for this topic');
    }

    // Get research manager and start research
    const researchManager = getResearchManager();
    
    await researchManager.startTopicResearch(topicId, context, userContext);

    return {
      success: true,
      message: 'Research started successfully'
    };

  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Failed to start topic research:', error);
    throw new HttpError(500, 'Failed to start research');
  }
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