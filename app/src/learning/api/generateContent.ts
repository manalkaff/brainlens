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

    console.log('No existing content found, checking for cached research results...');
    
    // Check if we have cached research results for this topic that we can reuse
    const cacheKey = `research:${topicId}:${options.contentType || 'exploration'}`;
    const cachedResearch = await getCachedContent(cacheKey);
    
    // Get the topic
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId },
      include: {
        vectorDocuments: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Check if we have research results (vector documents) - if not, we need to research first
    let researchResults: any[] = [];
    let fromCache = false;
    
    // Use cached research if available, otherwise use vector documents
    if (cachedResearch && cachedResearch.results && cachedResearch.results.length > 0) {
      console.log('Using cached research results:', cachedResearch.results.length, 'items');
      researchResults = cachedResearch.results;
      fromCache = true;
    } else if (topic.vectorDocuments && topic.vectorDocuments.length > 0) {
      console.log('Using vector documents as research results:', topic.vectorDocuments.length, 'items');
      // Convert vector documents to research results with better source attribution
      researchResults = topic.vectorDocuments.map((doc: any, index: number) => {
      // Try to parse metadata for better source info
      let sourceInfo = {
        title: `Research Document ${doc.id.slice(0, 8)}`,
        source: 'Research Database',
        url: undefined,
        contentType: 'article' as const
      };

      // If the document has metadata, use it for better attribution
      if (doc.metadata && typeof doc.metadata === 'object') {
        const metadata = doc.metadata;
        if (metadata.sourceAgent) {
          sourceInfo.source = `${metadata.sourceAgent.charAt(0).toUpperCase() + metadata.sourceAgent.slice(1)} Research Agent`;
        }
        if (metadata.sourceUrl) {
          sourceInfo.url = metadata.sourceUrl;
        }
        if (metadata.sourceTitle) {
          sourceInfo.title = metadata.sourceTitle;
        }
        if (metadata.sourceType) {
          sourceInfo.contentType = metadata.sourceType;
        }
      }

        return {
          ...sourceInfo,
          content: doc.content,
          relevanceScore: 0.8
        };
      });
    } else {
      // No cached research and no vector documents
      return res.status(400).json({ 
        error: 'No research data available for this topic',
        message: 'Please run research for this topic first before generating content',
        suggestion: 'Use the "Start Research" action in the Explore tab to gather sources, then try generating content again',
        needsResearch: true,
        topicId: topic.id
      });
    }

    console.log('Total research results available:', researchResults.length, fromCache ? '(from cache)' : '(from vector documents)');

    // Generate content based on the content type
    let generatedContent;
    
    console.log('Generating content for topic:', topic.title, 'with type:', options.contentType);
    
    if (options.contentType === 'exploration') {
      // For exploration content, generate MDX content
      const subtopics = await generateSubtopics(topic, context);
      console.log('Generated subtopics:', subtopics);
      
      const mdxContent = await aiContentGenerator.generateExplorationContent(topic, subtopics, researchResults);
      console.log('Generated MDX content length:', mdxContent.content.length);
      console.log('Research results available:', researchResults.length);
      console.log('Content preview:', mdxContent.content.substring(0, 500) + '...');
      
      // Convert research results to source attributions for exploration content too
      const sources = researchResults.map((result: any, index: number) => ({
        id: `source-${index + 1}`,
        title: result.title,
        url: result.url,
        source: result.source,
        contentType: result.contentType,
        relevanceScore: result.relevanceScore,
      }));

      generatedContent = {
        content: mdxContent.content,
        metadata: {
          ...mdxContent.frontmatter,
          contentType: options.contentType,
          userLevel: options.userLevel,
          learningStyle: options.learningStyle,
          tokensUsed: 0,
          generatedAt: new Date(),
          sections: mdxContent.sections.map(s => s.title),
          sources
        }
      };
    } else {
      // For other content types, use the standard generator
      console.log('Using standard content generator with research results:', researchResults.length);
      generatedContent = await aiContentGenerator.generateLearningContent(
        topic,
        researchResults,
        options as ContentGenerationOptions
      );
    }
    
    console.log('Final generated content length:', generatedContent.content.length);

    // Save the generated content to the database
    try {
      const savedContent = await context.entities.GeneratedContent.create({
        data: {
          topicId: topic.id,
          contentType: options.contentType || 'exploration',
          content: generatedContent.content,
          metadata: generatedContent.metadata,
          sources: generatedContent.metadata?.sources || [],
          userLevel: options.userLevel || null,
          learningStyle: options.learningStyle || null
        }
      });
      console.log('Successfully saved generated content to database');
    } catch (saveError) {
      console.error('Failed to save generated content to database:', saveError);
      // Don't fail the request if saving fails, just log the error
    }

    // If we used vector documents (not cache), cache the research results for future users
    if (!fromCache && researchResults.length > 0) {
      try {
        const researchData = {
          topic: topic.title,
          depth: 0,
          content: {
            title: topic.title,
            content: generatedContent.content,
            sections: [],
            keyTakeaways: [],
            nextSteps: [],
            estimatedReadTime: 5
          },
          subtopics: [],
          sources: researchResults,
          metadata: {
            totalSources: researchResults.length,
            researchDuration: 0,
            enginesUsed: ['vector_database'],
            researchStrategy: 'Using existing vector documents for content generation',
            confidenceScore: 0.8,
            lastUpdated: new Date(),
            contentType: options.contentType || 'exploration'
          },
          cacheKey,
          timestamp: new Date(),
          results: researchResults // Keep the research results accessible
        };
        await setCachedContent(cacheKey, researchData);
        console.log('Cached research results for future users with key:', cacheKey);
      } catch (cacheError) {
        console.error('Failed to cache research results:', cacheError);
        // Don't fail the request if caching fails
      }
    }

    // Return the generated content with source attribution
    res.json({
      success: true,
      content: generatedContent.content,
      metadata: generatedContent.metadata,
      sources: generatedContent.metadata?.sources || [],
      topicId: topic.id,
      topicTitle: topic.title,
      cached: false,
      usedCachedResearch: fromCache,
      researchSource: fromCache ? 'cache' : 'vector_documents'
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