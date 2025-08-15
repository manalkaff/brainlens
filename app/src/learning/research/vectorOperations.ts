import { HttpError } from 'wasp/server';
import { QdrantVectorStore, VectorDocument, SearchResult } from './vectorStore';
import { 
  withVectorStoreErrorHandling,
  validateInput, 
  sanitizeInput,
  circuitBreakers
} from '../errors/errorHandler';
import { 
  createValidationError
} from '../errors/errorTypes';

// Create a singleton instance of the vector store
const vectorStore = new QdrantVectorStore();

/**
 * Initialize vector storage for a topic
 */
export async function initializeTopicVectorStorage(topicId: string): Promise<void> {
  const validatedTopicId = validateInput(
    topicId,
    (input) => {
      if (!input || typeof input !== 'string') {
        throw new Error('Topic ID is required');
      }
      return input;
    },
    'topicId'
  );

  await circuitBreakers.vectorStore.execute(async () => {
    return withVectorStoreErrorHandling(async () => {
      await vectorStore.createCollection(validatedTopicId);
      console.log(`Vector storage initialized for topic ${validatedTopicId}`);
    }, 'INITIALIZE_COLLECTION', { topicId: validatedTopicId });
  }, 'VECTOR_STORE');
}

/**
 * Store generated content in vector database
 */
export async function storeTopicContent(
  topicId: string,
  topicSlug: string,
  content: string,
  contentType: 'summary' | 'subtopic' | 'research' | 'generated',
  depth: number = 0,
  additionalMetadata: Record<string, any> = {}
): Promise<void> {
  // Validate inputs
  const validatedTopicId = validateInput(
    topicId,
    (input) => {
      if (!input || typeof input !== 'string') {
        throw new Error('Topic ID is required');
      }
      return input;
    },
    'topicId'
  );

  const validatedTopicSlug = validateInput(
    topicSlug,
    (input) => {
      if (!input || typeof input !== 'string') {
        throw new Error('Topic slug is required');
      }
      return sanitizeInput(input, 100, /^[a-z0-9-]+$/);
    },
    'topicSlug'
  );

  const validatedContent = validateInput(
    content,
    (input) => {
      if (!input || typeof input !== 'string') {
        throw new Error('Content is required');
      }
      if (input.length > 50000) {
        throw new Error('Content is too large (maximum 50,000 characters)');
      }
      return sanitizeInput(input, 50000);
    },
    'content'
  );

  if (!['summary', 'subtopic', 'research', 'generated'].includes(contentType)) {
    throw createValidationError('contentType', 'Invalid content type');
  }

  if (typeof depth !== 'number' || depth < 0 || depth > 10) {
    throw createValidationError('depth', 'Depth must be a number between 0 and 10');
  }

  await circuitBreakers.vectorStore.execute(async () => {
    return withVectorStoreErrorHandling(async () => {
      const document: VectorDocument = {
        id: `${validatedTopicId}-${contentType}-${Date.now()}`,
        content: validatedContent,
        metadata: {
          topicId: validatedTopicId,
          topicSlug: validatedTopicSlug,
          contentType,
          depth,
          createdAt: new Date().toISOString(),
          ...additionalMetadata
        }
      };

      await vectorStore.storeEmbeddings([document]);
      console.log(`Stored ${contentType} content for topic ${validatedTopicSlug}`);
    }, 'STORE_DOCUMENT', { topicId: validatedTopicId, contentType, contentLength: validatedContent.length });
  }, 'VECTOR_STORE');
}

/**
 * Store multiple content pieces for a topic
 */
export async function storeTopicContentBatch(
  topicId: string,
  topicSlug: string,
  contentItems: Array<{
    content: string;
    contentType: 'summary' | 'subtopic' | 'research' | 'generated';
    depth?: number;
    metadata?: Record<string, any>;
  }>
): Promise<void> {
  try {
    const documents: VectorDocument[] = contentItems.map((item, index) => ({
      id: `${topicId}-${item.contentType}-${Date.now()}-${index}`,
      content: item.content,
      metadata: {
        topicId,
        topicSlug,
        contentType: item.contentType,
        depth: item.depth || 0,
        createdAt: new Date().toISOString(),
        ...item.metadata
      }
    }));

    await vectorStore.storeEmbeddings(documents);
    console.log(`Stored ${documents.length} content items for topic ${topicSlug}`);
  } catch (error) {
    console.error('Failed to store topic content batch:', error);
    throw new HttpError(500, 'Failed to store content batch in vector database');
  }
}

/**
 * Search for content within a specific topic
 */
export async function searchTopicContent(
  query: string,
  topicId: string,
  options: {
    limit?: number;
    scoreThreshold?: number;
    contentTypes?: Array<'summary' | 'subtopic' | 'research' | 'generated'>;
  } = {}
): Promise<SearchResult[]> {
  // Validate inputs
  const validatedQuery = validateInput(
    query,
    (input) => {
      if (!input || typeof input !== 'string' || input.trim().length === 0) {
        throw new Error('Search query is required');
      }
      if (input.length > 1000) {
        throw new Error('Search query is too long (maximum 1000 characters)');
      }
      return sanitizeInput(input, 1000);
    },
    'query'
  );

  const validatedTopicId = validateInput(
    topicId,
    (input) => {
      if (!input || typeof input !== 'string') {
        throw new Error('Topic ID is required');
      }
      return input;
    },
    'topicId'
  );

  const { limit = 10, scoreThreshold = 0.7, contentTypes } = options;

  // Validate options
  if (typeof limit !== 'number' || limit < 1 || limit > 100) {
    throw createValidationError('limit', 'Limit must be a number between 1 and 100');
  }

  if (typeof scoreThreshold !== 'number' || scoreThreshold < 0 || scoreThreshold > 1) {
    throw createValidationError('scoreThreshold', 'Score threshold must be a number between 0 and 1');
  }

  if (contentTypes && !Array.isArray(contentTypes)) {
    throw createValidationError('contentTypes', 'Content types must be an array');
  }

  return circuitBreakers.vectorStore.execute(async () => {
    return withVectorStoreErrorHandling(async () => {
      const results = await vectorStore.searchSimilar(validatedQuery, validatedTopicId, limit);

      console.log(`Found ${results.length} relevant content items for query: ${validatedQuery}`);
      return results;
    }, 'SEARCH_TOPIC_CONTENT', { topicId: validatedTopicId, queryLength: validatedQuery.length, limit });
  }, 'VECTOR_STORE');
}

/**
 * Search across all topics for a user
 */
export async function searchAllContent(
  query: string,
  options: {
    limit?: number;
    scoreThreshold?: number;
    contentTypes?: Array<'summary' | 'subtopic' | 'research' | 'generated'>;
    topicIds?: string[];
  } = {}
): Promise<SearchResult[]> {
  try {
    const { limit = 20, topicIds } = options;

    if (!topicIds || topicIds.length === 0) {
      console.warn('No topic IDs provided for search across all content');
      return [];
    }

    // Search across multiple topics
    const allResults: SearchResult[] = [];
    
    for (const topicId of topicIds) {
      try {
        const results = await vectorStore.searchSimilar(query, topicId, Math.ceil(limit / topicIds.length));
        allResults.push(...results);
      } catch (error) {
        console.warn(`Failed to search in topic ${topicId}:`, error);
        // Continue with other topics
      }
    }

    // Sort by score and limit results
    const sortedResults = allResults
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log(`Found ${sortedResults.length} relevant content items across ${topicIds.length} topics for query: ${query}`);
    return sortedResults;
  } catch (error) {
    console.error('Failed to search all content:', error);
    throw new HttpError(500, 'Failed to search content across topics');
  }
}

/**
 * Get content recommendations based on a topic
 */
export async function getContentRecommendations(
  topicId: string,
  topicTitle: string,
  options: {
    limit?: number;
    excludeCurrentTopic?: boolean;
    contentTypes?: Array<'summary' | 'subtopic' | 'research' | 'generated'>;
    relatedTopicIds?: string[];
  } = {}
): Promise<SearchResult[]> {
  try {
    const { limit = 10, relatedTopicIds = [] } = options;

    // Search in related topics for recommendations
    const searchTopicIds = relatedTopicIds.length > 0 ? relatedTopicIds : [topicId];
    const allResults: SearchResult[] = [];
    
    for (const searchTopicId of searchTopicIds) {
      try {
        const results = await vectorStore.searchSimilar(topicTitle, searchTopicId, Math.ceil(limit / searchTopicIds.length));
        allResults.push(...results);
      } catch (error) {
        console.warn(`Failed to get recommendations from topic ${searchTopicId}:`, error);
        // Continue with other topics
      }
    }

    // Sort by score and limit results
    const sortedResults = allResults
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log(`Found ${sortedResults.length} content recommendations for topic: ${topicTitle}`);
    return sortedResults;
  } catch (error) {
    console.error('Failed to get content recommendations:', error);
    throw new HttpError(500, 'Failed to get content recommendations');
  }
}

/**
 * Delete all vector content for a topic
 */
export async function deleteTopicVectorContent(topicId: string): Promise<void> {
  try {
    await vectorStore.deleteCollection(topicId);
    console.log(`Deleted all vector content for topic ${topicId}`);
  } catch (error) {
    console.error('Failed to delete topic vector content:', error);
    throw new HttpError(500, 'Failed to delete topic content from vector database');
  }
}

/**
 * Get vector storage statistics for a topic
 */
export async function getVectorStorageStats(topicId: string): Promise<{
  collectionInfo: any;
  isHealthy: boolean;
}> {
  try {
    const [collectionInfo, isHealthy] = await Promise.all([
      vectorStore.getCollectionInfo(topicId),
      vectorStore.healthCheck()
    ]);

    return {
      collectionInfo,
      isHealthy
    };
  } catch (error) {
    console.error('Failed to get vector storage stats:', error);
    return {
      collectionInfo: null,
      isHealthy: false
    };
  }
}

/**
 * Utility function to extract relevant content for RAG context
 */
export async function extractRAGContext(
  query: string,
  topicId: string,
  options: {
    maxTokens?: number;
    includeMetadata?: boolean;
  } = {}
): Promise<{
  context: string;
  sources: SearchResult[];
  totalTokens: number;
}> {
  try {
    const { maxTokens = 4000, includeMetadata = true } = options;

    // Search for relevant content
    const searchResults = await searchTopicContent(query, topicId, {
      limit: 20,
      scoreThreshold: 0.6
    });

    if (searchResults.length === 0) {
      return {
        context: '',
        sources: [],
        totalTokens: 0
      };
    }

    // Rank results by relevance and content type priority
    const rankedResults = rankSearchResults(searchResults, query);

    // Build context string with token limit
    let context = '';
    let totalTokens = 0;
    const sources: SearchResult[] = [];

    for (const result of rankedResults) {
      // Rough token estimation (1 token ≈ 4 characters)
      const contentTokens = Math.ceil(result.content.length / 4);
      const metadataTokens = includeMetadata ? Math.ceil(JSON.stringify(result.metadata).length / 4) : 0;
      const resultTokens = contentTokens + metadataTokens;

      if (totalTokens + resultTokens > maxTokens) {
        break;
      }

      // Add content to context with structured formatting
      if (includeMetadata) {
        context += `[Source: ${result.metadata.contentType} from ${result.metadata.topicSlug} (Score: ${result.score.toFixed(3)})]\n`;
      }
      context += result.content + '\n\n';
      
      sources.push(result);
      totalTokens += resultTokens;
    }

    return {
      context: context.trim(),
      sources,
      totalTokens
    };
  } catch (error) {
    console.error('Failed to extract RAG context:', error);
    throw new HttpError(500, 'Failed to extract context for RAG system');
  }
}

/**
 * Enhanced search function with metadata filtering and content type categorization
 */
export async function searchTopicContentEnhanced(
  query: string,
  topicId: string,
  options: {
    limit?: number;
    scoreThreshold?: number;
    contentTypes?: Array<'summary' | 'subtopic' | 'research' | 'generated'>;
    includeMetadata?: boolean;
    sortBy?: 'score' | 'date' | 'relevance';
  } = {}
): Promise<SearchResult[]> {
  try {
    const { limit = 10, sortBy = 'relevance' } = options;

    // Get base search results
    const results = await searchTopicContent(query, topicId, options);

    // Apply additional ranking and sorting
    let processedResults = results;

    if (sortBy === 'relevance') {
      processedResults = rankSearchResults(results, query);
    } else if (sortBy === 'date') {
      processedResults = results.sort((a, b) => 
        new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
      );
    } else if (sortBy === 'score') {
      processedResults = results.sort((a, b) => b.score - a.score);
    }

    return processedResults.slice(0, limit);
  } catch (error) {
    console.error('Failed to search topic content with enhancements:', error);
    throw new HttpError(500, 'Failed to perform enhanced content search');
  }
}

/**
 * Rank search results by relevance and content type priority
 */
function rankSearchResults(results: SearchResult[], query: string): SearchResult[] {
  const contentTypePriority = {
    'summary': 1.0,
    'research': 0.9,
    'generated': 0.8,
    'subtopic': 0.7
  };

  return results
    .map(result => ({
      ...result,
      relevanceScore: calculateRelevanceScore(result, query, contentTypePriority)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Calculate relevance score based on multiple factors
 */
function calculateRelevanceScore(
  result: SearchResult, 
  query: string, 
  contentTypePriority: Record<string, number>
): number {
  const baseScore = result.score;
  const contentTypeMultiplier = contentTypePriority[result.metadata.contentType] || 0.5;
  
  // Boost score for newer content (within last 30 days)
  const createdAt = new Date(result.metadata.createdAt);
  const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const freshnessMultiplier = daysSinceCreated <= 30 ? 1.1 : 1.0;
  
  // Boost score for content with higher confidence (if available)
  const confidenceMultiplier = result.metadata.confidence ? result.metadata.confidence : 1.0;
  
  return baseScore * contentTypeMultiplier * freshnessMultiplier * confidenceMultiplier;
}