import { HttpError } from 'wasp/server';
import { cacheService } from './cacheService';
import * as vectorOps from '../research/vectorOperations';
/**
 * Cached wrapper for vector operations to reduce API calls and improve performance
 */
/**
 * Search for content within a specific topic with caching
 */
export async function searchTopicContentCached(query, topicId, options = {}) {
    try {
        // Try to get from cache first
        const cachedResults = await cacheService.getSearchResults(query, topicId, options);
        if (cachedResults) {
            console.log(`Cache hit for search query: ${query} in topic: ${topicId}`);
            return cachedResults;
        }
        // Cache miss - perform actual search
        console.log(`Cache miss for search query: ${query} in topic: ${topicId}`);
        const results = await vectorOps.searchTopicContent(query, topicId, options);
        // Cache the results
        await cacheService.setSearchResults(query, topicId, options, results);
        return results;
    }
    catch (error) {
        console.error('Failed to search topic content (cached):', error);
        throw new HttpError(500, 'Failed to search content in vector database');
    }
}
/**
 * Search across all topics with caching
 */
export async function searchAllContentCached(query, options = {}) {
    try {
        // Create a cache key based on the query and options
        const cacheKey = `global_search:${query}:${JSON.stringify(options)}`;
        const topicId = 'global'; // Use 'global' as a special topic ID for cross-topic searches
        // Try to get from cache first - use query as the key, not cacheKey
        const cachedResults = await cacheService.getSearchResults(query, topicId, options);
        if (cachedResults) {
            console.log(`Cache hit for global search query: ${query}`);
            return cachedResults;
        }
        // Cache miss - perform actual search
        console.log(`Cache miss for global search query: ${query}`);
        const results = await vectorOps.searchAllContent(query, options);
        // Cache the results
        await cacheService.setSearchResults(query, topicId, options, results);
        return results;
    }
    catch (error) {
        console.error('Failed to search all content (cached):', error);
        throw new HttpError(500, 'Failed to search content across topics');
    }
}
/**
 * Get content recommendations with caching
 */
export async function getContentRecommendationsCached(topicId, topicTitle, options = {}) {
    try {
        const recommendationQuery = `recommendations:${topicTitle}`;
        // Try to get from cache first
        const cachedResults = await cacheService.getSearchResults(recommendationQuery, topicId, options);
        if (cachedResults) {
            console.log(`Cache hit for recommendations for topic: ${topicTitle}`);
            return cachedResults;
        }
        // Cache miss - get actual recommendations
        console.log(`Cache miss for recommendations for topic: ${topicTitle}`);
        const results = await vectorOps.getContentRecommendations(topicId, topicTitle, options);
        // Cache the results
        await cacheService.setSearchResults(recommendationQuery, topicId, options, results);
        return results;
    }
    catch (error) {
        console.error('Failed to get content recommendations (cached):', error);
        throw new HttpError(500, 'Failed to get content recommendations');
    }
}
/**
 * Extract RAG context with caching for frequently accessed queries
 */
export async function extractRAGContextCached(query, topicId, options = {}) {
    try {
        // For RAG context, we cache the search results but not the final context
        // since context assembly might vary based on token limits
        const searchResults = await searchTopicContentCached(query, topicId, {
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
        // Build context string with token limit (this part is not cached)
        const { maxTokens = 4000, includeMetadata = true } = options;
        let context = '';
        let totalTokens = 0;
        const sources = [];
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
    }
    catch (error) {
        console.error('Failed to extract RAG context (cached):', error);
        throw new HttpError(500, 'Failed to extract context for RAG system');
    }
}
/**
 * Store topic content and invalidate related caches
 */
export async function storeTopicContentCached(topicId, topicSlug, content, contentType, depth = 0, additionalMetadata = {}) {
    try {
        // Store the content using the original function
        await vectorOps.storeTopicContent(topicId, topicSlug, content, contentType, depth, additionalMetadata);
        // Invalidate related caches
        await cacheService.invalidateSearchResults(topicId);
        await cacheService.invalidateSearchResults(); // Also invalidate global search cache
        console.log(`Stored ${contentType} content for topic ${topicSlug} and invalidated caches`);
    }
    catch (error) {
        console.error('Failed to store topic content (cached):', error);
        throw new HttpError(500, 'Failed to store content in vector database');
    }
}
/**
 * Store multiple content pieces and invalidate related caches
 */
export async function storeTopicContentBatchCached(topicId, topicSlug, contentItems) {
    try {
        // Store the content batch using the original function
        await vectorOps.storeTopicContentBatch(topicId, topicSlug, contentItems);
        // Invalidate related caches
        await cacheService.invalidateSearchResults(topicId);
        await cacheService.invalidateSearchResults(); // Also invalidate global search cache
        console.log(`Stored ${contentItems.length} content items for topic ${topicSlug} and invalidated caches`);
    }
    catch (error) {
        console.error('Failed to store topic content batch (cached):', error);
        throw new HttpError(500, 'Failed to store content batch in vector database');
    }
}
/**
 * Delete topic vector content and invalidate related caches
 */
export async function deleteTopicVectorContentCached(topicId) {
    try {
        // Delete the content using the original function
        await vectorOps.deleteTopicVectorContent(topicId);
        // Invalidate all related caches
        await cacheService.invalidateTopicCache(topicId);
        console.log(`Deleted all vector content for topic ${topicId} and invalidated caches`);
    }
    catch (error) {
        console.error('Failed to delete topic vector content (cached):', error);
        throw new HttpError(500, 'Failed to delete topic content from vector database');
    }
}
/**
 * Cache management utilities
 */
export async function invalidateTopicSearchCache(topicId) {
    await cacheService.invalidateSearchResults(topicId);
}
export async function invalidateAllSearchCache() {
    await cacheService.invalidateSearchResults();
}
export async function warmSearchCache(commonQueries, topicIds) {
    console.log('Warming search cache...');
    const promises = [];
    for (const topicId of topicIds) {
        for (const query of commonQueries) {
            // Pre-populate cache with common searches
            promises.push(searchTopicContentCached(query, topicId, { limit: 10 })
                .catch(error => console.error(`Failed to warm cache for query "${query}" in topic ${topicId}:`, error)));
        }
    }
    await Promise.allSettled(promises);
    console.log(`Cache warming completed for ${commonQueries.length} queries across ${topicIds.length} topics`);
}
// Re-export non-cached functions that don't need caching
export { initializeTopicVectorStorage, getVectorStorageStats } from '../research/vectorOperations';
//# sourceMappingURL=cachedVectorOperations.js.map