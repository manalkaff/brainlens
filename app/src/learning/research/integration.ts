import { HttpError } from 'wasp/server';
import { RecursiveResearchSystem, ResearchStatus } from './pipeline';
import { TopicStatus } from '@prisma/client';

// Integration utilities for connecting research pipeline with Wasp operations

export interface ResearchIntegrationConfig {
  enableRealTimeUpdates: boolean;
  maxConcurrentResearch: number;
  defaultUserContext: {
    userLevel: 'beginner' | 'intermediate' | 'advanced';
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  };
}

// Default integration configuration
const DEFAULT_INTEGRATION_CONFIG: ResearchIntegrationConfig = {
  enableRealTimeUpdates: true,
  maxConcurrentResearch: 3,
  defaultUserContext: {
    userLevel: 'intermediate',
    learningStyle: 'mixed'
  }
};

// Research integration manager
export class ResearchIntegrationManager {
  private static instance: ResearchIntegrationManager;
  private config: ResearchIntegrationConfig;
  private activeResearch: Map<string, RecursiveResearchSystem> = new Map();
  private researchQueue: string[] = [];

  private constructor(config: Partial<ResearchIntegrationConfig> = {}) {
    this.config = { ...DEFAULT_INTEGRATION_CONFIG, ...config };
  }

  static getInstance(config?: Partial<ResearchIntegrationConfig>): ResearchIntegrationManager {
    if (!ResearchIntegrationManager.instance) {
      ResearchIntegrationManager.instance = new ResearchIntegrationManager(config);
    }
    return ResearchIntegrationManager.instance;
  }

  // Start research for a topic with integration to Wasp entities
  async startTopicResearch(
    topicId: string,
    context: any,
    userContext?: any
  ): Promise<void> {
    try {
      // Check if research is already active for this topic
      if (this.activeResearch.has(topicId)) {
        throw new HttpError(409, 'Research already in progress for this topic');
      }

      // Check concurrent research limit
      if (this.activeResearch.size >= this.config.maxConcurrentResearch) {
        // Add to queue
        this.researchQueue.push(topicId);
        throw new HttpError(429, 'Maximum concurrent research limit reached. Added to queue.');
      }

      // Get topic from database
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

      // Update topic status to researching
      await context.entities.Topic.update({
        where: { id: topicId },
        data: { 
          status: TopicStatus.RESEARCHING,
          updatedAt: new Date()
        }
      });

      // Prepare research context
      const researchContext = {
        userId: context.user.id,
        topicId,
        ...this.config.defaultUserContext,
        ...userContext
      };

      // Initialize research system
      const researchSystem = new RecursiveResearchSystem({
        enableRealTimeUpdates: this.config.enableRealTimeUpdates
      });

      // Add to active research
      this.activeResearch.set(topicId, researchSystem);

      // Start research (non-blocking)
      this.executeResearch(researchSystem, topic.title, topicId, researchContext, context)
        .catch(error => {
          console.error(`Research failed for topic ${topicId}:`, error);
          this.handleResearchError(topicId, error, context);
        });

    } catch (error) {
      console.error('Failed to start topic research:', error);
      throw error;
    }
  }

  // Execute research and handle completion
  private async executeResearch(
    researchSystem: RecursiveResearchSystem,
    topicTitle: string,
    topicId: string,
    researchContext: any,
    context: any
  ): Promise<void> {
    try {
      // Start recursive research
      const researchResult = await researchSystem.startRecursiveResearch(
        topicTitle,
        topicId,
        researchContext,
        // Status update callback
        (status: ResearchStatus) => {
          this.handleStatusUpdate(status, context);
        },
        // Depth completion callback
        async (result) => {
          await this.handleDepthCompletion(result, context);
        }
      );

      // Handle successful completion
      await this.handleResearchCompletion(topicId, researchResult, context);

    } catch (error) {
      await this.handleResearchError(topicId, error, context);
    } finally {
      // Remove from active research
      this.activeResearch.delete(topicId);
      
      // Process queue
      await this.processQueue(context);
    }
  }

  // Handle status updates
  private async handleStatusUpdate(status: ResearchStatus, context: any): Promise<void> {
    try {
      // Update topic metadata with current status
      await context.entities.Topic.update({
        where: { id: status.topicId },
        data: {
          metadata: {
            researchStatus: {
              status: status.status,
              progress: status.progress,
              activeAgents: status.activeAgents,
              completedAgents: status.completedAgents,
              totalAgents: status.totalAgents,
              lastUpdate: new Date()
            }
          },
          updatedAt: new Date()
        }
      });

      console.log(`Research status update for ${status.topic}: ${status.status} (${status.progress}%)`);
    } catch (error) {
      console.error('Failed to handle status update:', error);
    }
  }

  // Handle depth completion
  private async handleDepthCompletion(result: any, context: any): Promise<void> {
    try {
      // Store research results as vector documents
      for (const agentResult of result.agentResults) {
        if (agentResult.status === 'success' && agentResult.results.length > 0) {
          const content = JSON.stringify({
            agent: agentResult.agent,
            summary: agentResult.summary,
            results: agentResult.results.slice(0, 5),
            subtopics: agentResult.subtopics
          });

          await context.entities.VectorDocument.create({
            data: {
              topicId: result.topicId,
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

      console.log(`Completed research depth ${result.depth} for ${result.topic}`);
    } catch (error) {
      console.error('Failed to handle depth completion:', error);
    }
  }

  // Handle research completion
  private async handleResearchCompletion(
    topicId: string,
    researchResult: any,
    context: any
  ): Promise<void> {
    try {
      // Update topic status to completed
      await context.entities.Topic.update({
        where: { id: topicId },
        data: {
          status: TopicStatus.COMPLETED,
          metadata: {
            researchCompleted: true,
            totalNodes: researchResult.totalNodes,
            completedNodes: researchResult.completedNodes,
            researchDuration: researchResult.endTime.getTime() - researchResult.startTime.getTime(),
            completedAt: new Date()
          },
          updatedAt: new Date()
        }
      });

      // Create subtopics from research results
      await this.createSubtopicsFromResearch(researchResult, topicId, context);

      console.log(`Research completed successfully for topic ${topicId}`);
    } catch (error) {
      console.error('Failed to handle research completion:', error);
      await this.handleResearchError(topicId, error, context);
    }
  }

  // Handle research errors
  private async handleResearchError(
    topicId: string,
    error: any,
    context: any
  ): Promise<void> {
    try {
      // Update topic status to error
      await context.entities.Topic.update({
        where: { id: topicId },
        data: {
          status: TopicStatus.ERROR,
          metadata: {
            researchError: true,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorTime: new Date()
          },
          updatedAt: new Date()
        }
      });

      console.error(`Research error for topic ${topicId}:`, error);
    } catch (updateError) {
      console.error('Failed to update topic status to error:', updateError);
    }
  }

  // Create subtopics from research results
  private async createSubtopicsFromResearch(
    researchResult: any,
    parentTopicId: string,
    context: any
  ): Promise<void> {
    try {
      await this.createSubtopicsFromNode(
        researchResult.researchTree,
        parentTopicId,
        context
      );
    } catch (error) {
      console.error('Failed to create subtopics from research:', error);
    }
  }

  // Recursively create subtopics from research nodes
  private async createSubtopicsFromNode(
    node: any,
    parentTopicId: string,
    context: any
  ): Promise<void> {
    for (const child of node.children) {
      if (child.status === 'completed' && child.result) {
        try {
          // Generate unique slug
          const slug = await this.generateUniqueSlug(child.topic, context);
          
          // Create subtopic
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

          // Recursively create subtopics for children
          if (child.children.length > 0) {
            await this.createSubtopicsFromNode(child, subtopic.id, context);
          }

        } catch (error) {
          console.error(`Failed to create subtopic ${child.topic}:`, error);
        }
      }
    }
  }

  // Generate unique slug
  private async generateUniqueSlug(title: string, context: any): Promise<string> {
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

  // Process research queue
  private async processQueue(context: any): Promise<void> {
    if (this.researchQueue.length > 0 && this.activeResearch.size < this.config.maxConcurrentResearch) {
      const nextTopicId = this.researchQueue.shift();
      if (nextTopicId) {
        try {
          await this.startTopicResearch(nextTopicId, context);
        } catch (error) {
          console.error(`Failed to start queued research for topic ${nextTopicId}:`, error);
        }
      }
    }
  }

  // Get research status for a topic
  getResearchStatus(topicId: string): 'active' | 'queued' | 'inactive' {
    if (this.activeResearch.has(topicId)) {
      return 'active';
    }
    if (this.researchQueue.includes(topicId)) {
      return 'queued';
    }
    return 'inactive';
  }

  // Get active research count
  getActiveResearchCount(): number {
    return this.activeResearch.size;
  }

  // Get queue length
  getQueueLength(): number {
    return this.researchQueue.length;
  }

  // Cancel research for a topic
  async cancelResearch(topicId: string, context: any): Promise<void> {
    // Remove from active research
    this.activeResearch.delete(topicId);
    
    // Remove from queue
    const queueIndex = this.researchQueue.indexOf(topicId);
    if (queueIndex > -1) {
      this.researchQueue.splice(queueIndex, 1);
    }

    // Update topic status
    try {
      await context.entities.Topic.update({
        where: { id: topicId },
        data: {
          status: TopicStatus.PENDING,
          metadata: {
            researchCancelled: true,
            cancelledAt: new Date()
          },
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to update topic status after cancellation:', error);
    }
  }
}

// Export utility functions
export function getResearchManager(config?: Partial<ResearchIntegrationConfig>): ResearchIntegrationManager {
  return ResearchIntegrationManager.getInstance(config);
}

export async function startTopicResearch(
  topicId: string,
  context: any,
  userContext?: any
): Promise<void> {
  const manager = getResearchManager();
  return manager.startTopicResearch(topicId, context, userContext);
}

export function getTopicResearchStatus(topicId: string): 'active' | 'queued' | 'inactive' {
  const manager = getResearchManager();
  return manager.getResearchStatus(topicId);
}