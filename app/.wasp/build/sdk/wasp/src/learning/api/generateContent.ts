import type { Request, Response } from 'express';
import type { Topic, VectorDocument } from 'wasp/entities';
import { iterativeResearchEngine } from './iterativeResearch';
import { progressTracker } from './progressTracker';

export const generateContentHandler = async (req: Request, res: Response, context: any) => {
  try {
    console.log('🔍 SERVER RECEIVED API CALL (delegating to iterative research):', { 
      topicId: req.body.topicId, 
      options: req.body.options,
      fullBody: req.body,
      timestamp: new Date().toISOString()
    });
    
    if (!context.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { topicId, options } = req.body;

    if (!topicId) {
      return res.status(400).json({ error: 'Topic ID is required' });
    }

    // Get topic to use for research
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    console.log('🔍 Checking for existing content in database before starting research');

    // Check for existing content in database first
    const existingContent = await context.entities.GeneratedContent.findFirst({
      where: {
        topicId,
        userLevel: options.userLevel || 'beginner',
        learningStyle: options.learningStyle || 'textual',
        NOT: {
          userLevel: "cache"
        }
      },
      include: {
        topic: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Configuration for content freshness (7 days TTL)
    const CONTENT_TTL_DAYS = 7;
    const now = new Date();
    const isContentFresh = (createdAt: Date) => {
      const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return ageInDays < CONTENT_TTL_DAYS;
    };

    // Return existing content if found and fresh
    if (existingContent && isContentFresh(existingContent.createdAt)) {
      console.log('✅ Found fresh existing content, returning from database');
      
      // Mark progress as completed for cached content
      await progressTracker.setCompleted(topic.id, 'Found existing content in database');
      
      return res.json({
        success: true,
        content: existingContent.content,
        metadata: {
          ...existingContent.metadata,
          contentType: options.contentType || 'exploration',
          fromDatabase: true,
          cached: true,
          contentAge: Math.floor((now.getTime() - existingContent.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
          totalTopicsProcessed: existingContent.metadata?.totalTopicsProcessed || 0,
          cacheHits: existingContent.metadata?.cacheHits || 0,
          processingTime: existingContent.metadata?.processingTime || 0
        },
        sources: existingContent.sources || [],
        topicId: existingContent.topicId,
        fromDatabase: true,
        cached: true
      });
    }

    console.log(existingContent ? 
      '⏰ Found existing content but it\'s stale, proceeding with research' : 
      '🚀 No existing content found, delegating to iterative research system for: ' + topic.title
    );

    // Use iterative research system to generate/get content
    const userContext = {
      userId: context.user.id,
      level: options.userLevel || 'beginner',
      style: options.learningStyle || 'textual'
    };

    const researchOptions = {
      maxDepth: 3,
      forceRefresh: false,
      userContext: {
        level: options.userLevel || 'beginner',
        interests: [],
        previousKnowledge: []
      }
    };

    try {
      // Initialize progress tracking before starting research
      await progressTracker.initializeResearch(topic.id, {
        topicTitle: topic.title,
        status: 'starting',
        message: `Starting research for: ${topic.title}`
      });

      // Use the iterative research engine
      const researchResult = await iterativeResearchEngine.researchAndGenerate(
        topic.title,
        researchOptions,
        userContext
      );

      // Store the results to database if not already stored
      await iterativeResearchEngine.storeToDatabase(researchResult, topic.slug);

      // Return content in the expected format with immediate main topic results
      return res.json({
        success: true,
        content: researchResult.mainTopic.content.content,
        metadata: {
          ...researchResult.mainTopic.metadata,
          contentType: options.contentType || 'exploration',
          totalTopicsProcessed: researchResult.totalTopicsProcessed,
          cacheHits: researchResult.cacheHits,
          processingTime: researchResult.totalProcessingTime,
          mainTopicOnly: researchResult.mainTopicOnly || false,
          subtopicsInProgress: researchResult.subtopicsInProgress || false
        },
        sources: researchResult.mainTopic.sources.map(source => ({
          id: source.id,
          title: source.title,
          url: source.url,
          source: source.source,
          engine: source.engine,
          relevanceScore: source.relevanceScore,
          contentType: source.contentType
        })),
        topicId: topic.id,
        fromIterativeResearch: true,
        mainTopicComplete: true,
        subtopicsProcessing: researchResult.subtopicsInProgress || false,
        cached: false
      });

    } catch (researchError) {
      console.error('Iterative research failed:', researchError);
      
      // Track error in progress
      await progressTracker.setError(topic.id, researchError instanceof Error ? researchError.message : 'Unknown error');
      
      // Fallback: check if we have any existing content
      const fallbackContent = await context.entities.GeneratedContent.findFirst({
        where: {
          topicId,
          NOT: {
            userLevel: "cache"
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (fallbackContent) {
        console.log('Using fallback content from database');
        return res.json({
          success: true,
          content: fallbackContent.content,
          metadata: fallbackContent.metadata,
          sources: fallbackContent.sources || [],
          topicId: fallbackContent.topicId,
          fromDatabase: true,
          fallback: true
        });
      }

      // If all else fails, trigger research
      return res.status(202).json({
        error: 'Research in progress',
        message: `Starting research for "${topic.title}". Please wait and try again.`,
        needsResearch: true,
        topicId: topic.id
      });
    }

  } catch (error) {
    console.error('=== SERVER CONTENT GENERATION ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Request body:', req.body);
    console.error('=====================================');
    
    // Check if it's an OpenAI API key issue
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isApiKeyIssue = errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('authentication');
    
    res.status(500).json({ 
      error: isApiKeyIssue 
        ? 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env.server file.'
        : 'Failed to generate content',
      details: errorMessage,
      suggestion: isApiKeyIssue 
        ? 'Add OPENAI_API_KEY=your-key-here to your .env.server file and restart the server'
        : 'Check the server logs for more details'
    });
  }
}

// Helper function to generate subtopics for exploration content
async function generateSubtopics(topic: Topic, context: any): Promise<string[]> {
  // Get existing child topics as subtopics
  const childTopics = await context.entities.Topic.findMany({
    where: { parentId: topic.id },
    select: { title: true },
    orderBy: { createdAt: 'asc' }
  });

  if (childTopics.length > 0) {
    return childTopics.map((child: any) => child.title);
  }

  // If no child topics exist, generate default subtopics based on the topic
  const defaultSubtopics = [
    'Overview and Introduction',
    'Core Concepts and Principles',
    'Practical Applications',
    'Best Practices and Guidelines',
    'Common Challenges and Solutions',
    'Advanced Topics and Techniques',
    'Tools and Resources',
    'Future Trends and Developments'
  ];

  return defaultSubtopics.slice(0, 6); // Limit to 6 subtopics
}