import { HttpError } from 'wasp/server';
import type { MiddlewareConfigFn } from 'wasp/server';
import { 
  RecursiveResearchSystem, 
  ResearchStatus, 
  AgentCoordinationResult,
  RecursiveResearchResult 
} from './pipeline';
import { TopicStatus } from '@prisma/client';

// Types for the research API
export interface ResearchTopicRequest {
  topicId: string;
  topic: string;
  userContext?: {
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    previousTopics?: string[];
    preferences?: Record<string, any>;
  };
  config?: {
    maxDepth?: number;
    maxSubtopicsPerLevel?: number;
    enableRealTimeUpdates?: boolean;
  };
}

export interface ResearchTopicResponse {
  success: boolean;
  message: string;
  data?: {
    researchResult: RecursiveResearchResult;
    generatedSubtopics: string[];
    totalContentGenerated: number;
  };
  error?: string;
}

// Research topic API handler
export const researchTopicHandler = async (req: any, res: any, context: any) => {
  try {
    // Validate authentication
    if (!context.user) {
      throw new HttpError(401, 'Authentication required');
    }

    // Parse request body
    const requestData: ResearchTopicRequest = req.body;
    
    if (!requestData.topicId || !requestData.topic) {
      throw new HttpError(400, 'Topic ID and topic are required');
    }

    // Validate topic exists in database
    const topic = await context.entities.Topic.findUnique({
      where: { id: requestData.topicId },
      include: {
        userProgress: {
          where: { userId: context.user.id }
        }
      }
    });

    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }

    // Check if topic is already being researched
    if (topic.status === TopicStatus.RESEARCHING) {
      return res.json({
        success: false,
        message: 'Topic research is already in progress',
        error: 'RESEARCH_IN_PROGRESS'
      });
    }

    // Update topic status to researching
    await context.entities.Topic.update({
      where: { id: requestData.topicId },
      data: { 
        status: TopicStatus.RESEARCHING,
        updatedAt: new Date()
      }
    });

    // Initialize research system
    const researchSystem = new RecursiveResearchSystem(requestData.config);
    
    // Prepare context for research
    const researchContext = {
      userId: context.user.id,
      topicId: requestData.topicId,
      ...requestData.userContext
    };

    // Track research progress
    let statusUpdates: ResearchStatus[] = [];
    let depthResults: AgentCoordinationResult[] = [];

    // Start recursive research
    const researchResult = await researchSystem.startRecursiveResearch(
      requestData.topic,
      requestData.topicId,
      researchContext,
      // Status update callback
      (status: ResearchStatus) => {
        statusUpdates.push(status);
        console.log(`Research status update for ${status.topic}: ${status.status} (${status.progress}%)`);
      },
      // Depth completion callback
      async (result: AgentCoordinationResult) => {
        depthResults.push(result);
        console.log(`Completed research for ${result.topic} at depth ${result.depth}`);
        
        // Store intermediate results in database
        await storeResearchResults(result, context);
      }
    );

    // Update topic status based on research result
    const finalStatus = researchResult.status === 'completed' ? 
      TopicStatus.COMPLETED : TopicStatus.ERROR;

    await context.entities.Topic.update({
      where: { id: requestData.topicId },
      data: { 
        status: finalStatus,
        updatedAt: new Date(),
        metadata: {
          researchCompleted: true,
          totalNodes: researchResult.totalNodes,
          completedNodes: researchResult.completedNodes,
          researchDuration: researchResult.endTime.getTime() - researchResult.startTime.getTime()
        }
      }
    });

    // Generate subtopics from research results
    const generatedSubtopics = await generateSubtopicsFromResearch(
      researchResult, 
      requestData.topicId, 
      context
    );

    // Calculate total content generated
    const totalContentGenerated = calculateTotalContent(researchResult);

    // Return success response
    const response: ResearchTopicResponse = {
      success: true,
      message: `Research completed for ${requestData.topic}`,
      data: {
        researchResult,
        generatedSubtopics,
        totalContentGenerated
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Research topic API error:', error);
    
    // Update topic status to error if we have the topic ID
    const requestData: ResearchTopicRequest = req.body;
    if (requestData?.topicId && context?.entities?.Topic) {
      try {
        await context.entities.Topic.update({
          where: { id: requestData.topicId },
          data: { 
            status: TopicStatus.ERROR,
            updatedAt: new Date()
          }
        });
      } catch (updateError) {
        console.error('Failed to update topic status to error:', updateError);
      }
    }

    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during research',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Store research results in the database
async function storeResearchResults(
  result: AgentCoordinationResult, 
  context: any
): Promise<void> {
  try {
    // Store vector documents for each agent result
    for (const agentResult of result.agentResults) {
      if (agentResult.status === 'success' && agentResult.results.length > 0) {
        // In a real implementation, this would generate embeddings
        // For now, we'll store the content as JSON
        const content = JSON.stringify({
          agent: agentResult.agent,
          summary: agentResult.summary,
          results: agentResult.results.slice(0, 5), // Store top 5 results
          subtopics: agentResult.subtopics
        });

        await context.entities.VectorDocument.create({
          data: {
            topicId: result.topic, // This should be the actual topic ID
            content,
            embedding: JSON.stringify([]), // Placeholder for actual embeddings
            metadata: {
              agent: agentResult.agent,
              depth: result.depth,
              timestamp: agentResult.timestamp,
              resultCount: agentResult.results.length
            }
          }
        });
      }
    }

    console.log(`Stored research results for ${result.topic} at depth ${result.depth}`);
  } catch (error) {
    console.error('Failed to store research results:', error);
    // Don't throw error to avoid breaking the research pipeline
  }
}

// Generate subtopics from research results and create them in the database
async function generateSubtopicsFromResearch(
  researchResult: RecursiveResearchResult,
  parentTopicId: string,
  context: any
): Promise<string[]> {
  const generatedSubtopics: string[] = [];

  try {
    // Traverse the research tree and create subtopics
    await createSubtopicsFromNode(
      researchResult.researchTree, 
      parentTopicId, 
      context, 
      generatedSubtopics
    );

    return generatedSubtopics;
  } catch (error) {
    console.error('Failed to generate subtopics:', error);
    return [];
  }
}

// Recursively create subtopics from research nodes
async function createSubtopicsFromNode(
  node: any, // ResearchNode type
  parentTopicId: string,
  context: any,
  generatedSubtopics: string[]
): Promise<void> {
  // Create subtopics for children
  for (const child of node.children) {
    if (child.status === 'completed' && child.result) {
      try {
        // Generate unique slug for subtopic
        const slug = await generateUniqueSlug(child.topic, context);
        
        // Create subtopic in database
        const subtopic = await context.entities.Topic.create({
          data: {
            title: child.topic,
            slug,
            summary: child.result.aggregatedContent.summary.substring(0, 500),
            description: child.result.aggregatedContent.keyPoints.join('. '),
            parentId: parentTopicId,
            depth: child.depth,
            status: TopicStatus.COMPLETED,
            metadata: {
              generatedFromResearch: true,
              confidence: child.result.aggregatedContent.confidence,
              completeness: child.result.aggregatedContent.completeness,
              sourceCount: child.result.aggregatedContent.sources.length
            }
          }
        });

        generatedSubtopics.push(child.topic);
        
        // Recursively create subtopics for grandchildren
        if (child.children.length > 0) {
          await createSubtopicsFromNode(child, subtopic.id, context, generatedSubtopics);
        }

      } catch (error) {
        console.error(`Failed to create subtopic ${child.topic}:`, error);
      }
    }
  }
}

// Helper function to generate unique slug
async function generateUniqueSlug(title: string, context: any): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

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

// Calculate total content generated from research
function calculateTotalContent(researchResult: RecursiveResearchResult): number {
  let totalContent = 0;

  function countContentInNode(node: any): void {
    if (node.result && node.result.agentResults) {
      node.result.agentResults.forEach((agentResult: any) => {
        totalContent += agentResult.results.length;
      });
    }
    
    node.children.forEach((child: any) => {
      countContentInNode(child);
    });
  }

  countContentInNode(researchResult.researchTree);
  return totalContent;
}

// Get research status API handler
export const getResearchStatusHandler = async (req: any, res: any, context: any) => {
  try {
    if (!context.user) {
      throw new HttpError(401, 'Authentication required');
    }

    const { topicId } = req.query;
    if (!topicId) {
      throw new HttpError(400, 'Topic ID is required');
    }

    // Get topic with current status
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }

    // Return status
    res.json({
      success: true,
      data: {
        topicId,
        status: topic.status,
        progress: topic.metadata?.progress || 0,
        lastUpdate: topic.updatedAt
      }
    });

  } catch (error) {
    console.error('Get research status error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Cancel research API handler
export const cancelResearchHandler = async (req: any, res: any, context: any) => {
  try {
    if (!context.user) {
      throw new HttpError(401, 'Authentication required');
    }

    const { topicId } = req.body;
    if (!topicId) {
      throw new HttpError(400, 'Topic ID is required');
    }

    // Update topic status to cancelled
    await context.entities.Topic.update({
      where: { id: topicId },
      data: { 
        status: 'ERROR', // Using ERROR as cancelled status
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Research cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel research error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get research history API handler
export const getResearchHistoryHandler = async (req: any, res: any, context: any) => {
  try {
    if (!context.user) {
      throw new HttpError(401, 'Authentication required');
    }

    const userId = context.user.id;
    const { limit = 20, offset = 0 } = req.query;

    // Get user's research history
    const topics = await context.entities.Topic.findMany({
      where: {
        userProgress: {
          some: {
            userId
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        userProgress: {
          where: { userId }
        }
      }
    });

    res.json({
      success: true,
      data: {
        topics: topics.map((topic: any) => ({
          id: topic.id,
          title: topic.title,
          status: topic.status,
          createdAt: topic.createdAt,
          updatedAt: topic.updatedAt,
          progress: topic.userProgress[0]?.progress || 0
        })),
        total: topics.length
      }
    });

  } catch (error) {
    console.error('Get research history error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Middleware configuration for the research API
export const researchApiMiddleware: MiddlewareConfigFn = (middlewareConfig) => {
  // Add any custom middleware configuration here
  return middlewareConfig;
};