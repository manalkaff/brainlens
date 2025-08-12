import { HttpError } from 'wasp/server';
import { vectorStore, VectorDocument, SearchResult } from './vectorStore';
import type { Topic } from 'wasp/entities';

/**
 * Initialize vector storage for a topic
 */
export async function initializeTopicVectorStorage(topicId: string): Promise<void> {
  try {
    await vectorStore.initializeCollection();
    console.log(`Vector storage initialized for topic ${topicId}`);
  } catch (error) {
    console.error('Failed to initialize vector storage:', error);
    throw new HttpError(500, 'Failed to initialize vector storage');
  }
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
  try {
    const document: VectorDocument = {
      id: `${topicId}-${contentType}-${Date.now()}`,
      content,
      metadata: {
        topicId,
        topicSlug,
        contentType,
        depth,
        createdAt: new Date().toISOString(),
        ...additionalMetadata
      }
    };

    await vectorStore.storeDocument(document);
    console.log(`Stored ${contentType} content for topic ${topicSlug}`);
  } catch (error) {
    console.error('Failed to store topic content:', error);
    throw new HttpError(500, 'Failed to store content in vector database');
  }
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

    await vectorStore.storeDocuments(documents);
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
  try {
    const { limit = 10, scoreThreshold = 0.7, contentTypes } = options;

    const results = await vectorStore.searchInTopic(query, topicId, {
      limit,
      scoreThreshold,
      contentTypes
    });

    console.log(`Found ${results.length} relevant content items for query: ${query}`);
    return results;
  } catch (error) {
    console.error('Failed to search topic content:', error);
    throw new HttpError(500, 'Failed to search content in vector database');
  }
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
    const { limit = 20, scoreThreshold = 0.6, contentTypes, topicIds } = options;

    let filter: Record<string, any> | undefined;

    if (topicIds && topicIds.length > 0) {
      filter = {
        key: 'metadata.topicId',
        match: { any: topicIds }
      };
    }

    if (contentTypes && contentTypes.length > 0) {
      const contentTypeFilter = {
        key: 'metadata.contentType',
        match: { any: contentTypes }
      };

      if (filter) {
        filter = {
          must: [filter, contentTypeFilter]
        };
      } else {
        filter = contentTypeFilter;
      }
    }

    const results = await vectorStore.searchSimilar(query, {
      limit,
      scoreThreshold,
      filter
    });

    console.log(`Found ${results.length} relevant content items across all topics for query: ${query}`);
    return results;
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
  } = {}
): Promise<SearchResult[]> {
  try {
    const { limit = 10, excludeCurrentTopic = true, contentTypes } = options;

    let filter: Record<string, any> | undefined;

    if (excludeCurrentTopic) {
      filter = {
        key: 'metadata.topicId',
        match: { except: [topicId] }
      };
    }

    if (contentTypes && contentTypes.length > 0) {
      const contentTypeFilter = {
        key: 'metadata.contentType',
        match: { any: contentTypes }
      };

      if (filter) {
        filter = {
          must: [filter, contentTypeFilter]
        };
      } else {
        filter = contentTypeFilter;
      }
    }

    const results = await vectorStore.searchSimilar(topicTitle, {
      limit,
      scoreThreshold: 0.5, // Lower threshold for recommendations
      filter
    });

    console.log(`Found ${results.length} content recommendations for topic: ${topicTitle}`);
    return results;
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
    await vectorStore.deleteByTopic(topicId);
    console.log(`Deleted all vector content for topic ${topicId}`);
  } catch (error) {
    console.error('Failed to delete topic vector content:', error);
    throw new HttpError(500, 'Failed to delete topic content from vector database');
  }
}

/**
 * Get vector storage statistics
 */
export async function getVectorStorageStats(): Promise<{
  collectionInfo: any;
  isHealthy: boolean;
}> {
  try {
    const [collectionInfo, isHealthy] = await Promise.all([
      vectorStore.getCollectionInfo(),
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

    // Build context string with token limit
    let context = '';
    let totalTokens = 0;
    const sources: SearchResult[] = [];

    for (const result of searchResults) {
      // Rough token estimation (1 token ≈ 4 characters)
      const contentTokens = Math.ceil(result.content.length / 4);
      const metadataTokens = includeMetadata ? Math.ceil(JSON.stringify(result.metadata).length / 4) : 0;
      const resultTokens = contentTokens + metadataTokens;

      if (totalTokens + resultTokens > maxTokens) {
        break;
      }

      // Add content to context
      if (includeMetadata) {
        context += `[Source: ${result.metadata.contentType} from ${result.metadata.topicSlug}]\n`;
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