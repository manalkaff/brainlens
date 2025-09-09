import type { Request, Response } from 'express';
import type { Topic, VectorDocument } from 'wasp/entities';
import { aiContentGenerator, type ContentGenerationOptions } from './contentGenerator';
import { getCachedContent, setCachedContent } from './cachingSystem';

export const generateContentHandler = async (req: Request, res: Response, context: any) => {
  try {
    console.log('Content generation API called with:', { topicId: req.body.topicId, options: req.body.options });
    
    if (!context.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { topicId, options } = req.body;

    if (!topicId) {
      return res.status(400).json({ error: 'Topic ID is required' });
    }

    if (!options) {
      return res.status(400).json({ error: 'Content generation options are required' });
    }

    // Check if content already exists for this user and configuration
    const existingContent = await context.entities.GeneratedContent.findFirst({
      where: {
        topicId,
        contentType: options.contentType || 'exploration',
        userLevel: options.userLevel || null,
        learningStyle: options.learningStyle || null,
        // Only check content that was actually generated for users, not cache entries
        NOT: {
          userLevel: "cache",
          learningStyle: "cache"
        }
      }
    });

    if (existingContent) {
      console.log('Found existing generated content for this configuration');
      return res.json({
        success: true,
        content: existingContent.content,
        metadata: existingContent.metadata,
        sources: existingContent.sources || [],
        topicId: existingContent.topicId,
        cached: false, // This is stored content, not cache
        fromDatabase: true
      });
    }

    // Also check if we have research-type content stored for this user that can be adapted
    const existingResearchContent = await context.entities.GeneratedContent.findFirst({
      where: {
        topicId,
        contentType: 'research',
        userLevel: options.userLevel || 'intermediate',
        learningStyle: options.learningStyle || 'textual',
        NOT: {
          userLevel: "cache"
        }
      }
    });

    if (existingResearchContent && existingResearchContent.metadata) {
      const metadata = existingResearchContent.metadata as any;
      if (metadata.researchResult && metadata.isUserContent) {
        console.log('Found existing user research content for this topic');
        // Convert research result to content format if needed
        const researchResult = metadata.researchResult;
        return res.json({
          success: true,
          content: researchResult.content?.content || existingResearchContent.content,
          metadata: {
            ...researchResult.metadata,
            contentType: options.contentType,
            adaptedFromResearch: true
          },
          sources: researchResult.sources || [],
          topicId: existingResearchContent.topicId,
          cached: false,
          fromDatabase: true,
          adaptedFromResearch: true
        });
      }
    }

    // Check if we have research results from iterative research
    const existingIterativeContent = await context.entities.GeneratedContent.findFirst({
      where: {
        topicId,
        contentType: 'exploration',
        NOT: {
          userLevel: "cache"
        }
      }
    });

    if (existingIterativeContent) {
      return res.json({
        success: true,
        content: existingIterativeContent.content,
        metadata: existingIterativeContent.metadata,
        sources: existingIterativeContent.sources || [],
        topicId: existingIterativeContent.topicId,
        fromDatabase: true
      });
    }

    // Get the topic
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // If no content found, research hasn't completed yet
    return res.status(400).json({ 
      error: 'Topic research in progress',
      message: 'Please wait for research to complete before generating content',
      needsResearch: false,
      topicId: topic.id
    });

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