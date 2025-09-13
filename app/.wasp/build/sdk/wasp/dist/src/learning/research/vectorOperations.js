import { HttpError } from 'wasp/server';
import { QdrantVectorStore } from './vectorStore';
import { withVectorStoreErrorHandling, validateInput, sanitizeInput, circuitBreakers } from '../errors/errorHandler';
import { createValidationError } from '../errors/errorTypes';
import { generateUUID } from '../../shared/utils';
// Create a singleton instance of the vector store
const vectorStore = new QdrantVectorStore();
/**
 * Initialize vector storage for a topic
 */
export async function initializeTopicVectorStorage(topicId) {
    const validatedTopicId = validateInput(topicId, (input) => {
        if (!input || typeof input !== 'string') {
            throw new Error('Topic ID is required');
        }
        return input;
    }, 'topicId');
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
export async function storeTopicContent(topicId, topicSlug, content, contentType, depth = 0, additionalMetadata = {}) {
    // Validate inputs
    const validatedTopicId = validateInput(topicId, (input) => {
        if (!input || typeof input !== 'string') {
            throw new Error('Topic ID is required');
        }
        return input;
    }, 'topicId');
    const validatedTopicSlug = validateInput(topicSlug, (input) => {
        if (!input || typeof input !== 'string') {
            throw new Error('Topic slug is required');
        }
        return sanitizeInput(input, 100, /^[a-z0-9-]+$/);
    }, 'topicSlug');
    const validatedContent = validateInput(content, (input) => {
        if (!input || typeof input !== 'string') {
            throw new Error('Content is required');
        }
        if (input.length > 50000) {
            throw new Error('Content is too large (maximum 50,000 characters)');
        }
        return sanitizeInput(input, 50000);
    }, 'content');
    if (!['summary', 'subtopic', 'research', 'generated'].includes(contentType)) {
        throw createValidationError('contentType', 'Invalid content type');
    }
    if (typeof depth !== 'number' || depth < 0 || depth > 10) {
        throw createValidationError('depth', 'Depth must be a number between 0 and 10');
    }
    await circuitBreakers.vectorStore.execute(async () => {
        return withVectorStoreErrorHandling(async () => {
            const document = {
                id: generateUUID(),
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
export async function storeTopicContentBatch(topicId, topicSlug, contentItems) {
    try {
        const documents = contentItems.map((item, index) => ({
            id: generateUUID(),
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
    }
    catch (error) {
        console.error('Failed to store topic content batch:', error);
        throw new HttpError(500, 'Failed to store content batch in vector database');
    }
}
/**
 * Search for content within a specific topic
 */
export async function searchTopicContent(query, topicId, options = {}) {
    // Validate inputs
    const validatedQuery = validateInput(query, (input) => {
        if (!input || typeof input !== 'string' || input.trim().length === 0) {
            throw new Error('Search query is required');
        }
        if (input.length > 1000) {
            throw new Error('Search query is too long (maximum 1000 characters)');
        }
        return sanitizeInput(input, 1000);
    }, 'query');
    const validatedTopicId = validateInput(topicId, (input) => {
        if (!input || typeof input !== 'string') {
            throw new Error('Topic ID is required');
        }
        return input;
    }, 'topicId');
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
            // Perform vector search using Qdrant
            const allResults = await vectorStore.searchSimilar(validatedQuery, validatedTopicId, Math.max(limit * 2, 20));
            // Filter by score threshold
            let filteredResults = allResults.filter(result => result.score >= scoreThreshold);
            // Filter by content types if specified
            if (contentTypes && contentTypes.length > 0) {
                filteredResults = filteredResults.filter(result => contentTypes.includes(result.metadata.contentType));
            }
            // Sort by relevance score and limit results
            const sortedResults = filteredResults
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
            console.log(`Found ${sortedResults.length} relevant content items for query: ${validatedQuery} (filtered from ${allResults.length} total results)`);
            return sortedResults;
        }, 'SEARCH_TOPIC_CONTENT', { topicId: validatedTopicId, queryLength: validatedQuery.length, limit });
    }, 'VECTOR_STORE');
}
/**
 * Search across all topics for a user
 */
export async function searchAllContent(query, options = {}) {
    try {
        const { limit = 20, topicIds } = options;
        if (!topicIds || topicIds.length === 0) {
            console.warn('No topic IDs provided for search across all content');
            return [];
        }
        // Search across multiple topics
        const allResults = [];
        for (const topicId of topicIds) {
            try {
                const results = await vectorStore.searchSimilar(query, topicId, Math.ceil(limit / topicIds.length));
                allResults.push(...results);
            }
            catch (error) {
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
    }
    catch (error) {
        console.error('Failed to search all content:', error);
        throw new HttpError(500, 'Failed to search content across topics');
    }
}
/**
 * Get content recommendations based on a topic
 */
export async function getContentRecommendations(topicId, topicTitle, options = {}) {
    try {
        const { limit = 10, relatedTopicIds = [] } = options;
        // Search in related topics for recommendations
        const searchTopicIds = relatedTopicIds.length > 0 ? relatedTopicIds : [topicId];
        const allResults = [];
        for (const searchTopicId of searchTopicIds) {
            try {
                const results = await vectorStore.searchSimilar(topicTitle, searchTopicId, Math.ceil(limit / searchTopicIds.length));
                allResults.push(...results);
            }
            catch (error) {
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
    }
    catch (error) {
        console.error('Failed to get content recommendations:', error);
        throw new HttpError(500, 'Failed to get content recommendations');
    }
}
/**
 * Delete all vector content for a topic
 */
export async function deleteTopicVectorContent(topicId) {
    try {
        await vectorStore.deleteCollection(topicId);
        console.log(`Deleted all vector content for topic ${topicId}`);
    }
    catch (error) {
        console.error('Failed to delete topic vector content:', error);
        throw new HttpError(500, 'Failed to delete topic content from vector database');
    }
}
/**
 * Get vector storage statistics for a topic
 */
export async function getVectorStorageStats(topicId) {
    try {
        const [collectionInfo, isHealthy] = await Promise.all([
            vectorStore.getCollectionInfo(topicId),
            vectorStore.healthCheck()
        ]);
        return {
            collectionInfo,
            isHealthy
        };
    }
    catch (error) {
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
export async function extractRAGContext(query, topicId, options = {}) {
    const validatedQuery = validateInput(query, (input) => {
        if (!input || typeof input !== 'string' || input.trim().length === 0) {
            throw new Error('Search query is required');
        }
        if (input.length > 1000) {
            throw new Error('Search query is too long (maximum 1000 characters)');
        }
        return sanitizeInput(input, 1000);
    }, 'query');
    const validatedTopicId = validateInput(topicId, (input) => {
        if (!input || typeof input !== 'string') {
            throw new Error('Topic ID is required');
        }
        return input;
    }, 'topicId');
    const { maxTokens = 4000, includeMetadata = true } = options;
    return circuitBreakers.vectorStore.execute(async () => {
        return withVectorStoreErrorHandling(async () => {
            // Search for relevant content using the vector store directly
            const searchResults = await vectorStore.searchSimilar(validatedQuery, validatedTopicId, 20);
            if (searchResults.length === 0) {
                console.log(`No relevant content found for query: ${validatedQuery} in topic: ${validatedTopicId}`);
                return {
                    context: '',
                    sources: [],
                    totalTokens: 0
                };
            }
            // Filter results by score threshold
            const filteredResults = searchResults.filter(result => result.score >= 0.6);
            if (filteredResults.length === 0) {
                console.log(`No high-quality results found for query: ${validatedQuery} (all scores below 0.6)`);
                return {
                    context: '',
                    sources: [],
                    totalTokens: 0
                };
            }
            // Rank results by relevance and content type priority
            const rankedResults = rankSearchResults(filteredResults, validatedQuery);
            // Build context string with token limit
            let context = '';
            let totalTokens = 0;
            const sources = [];
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
            console.log(`Extracted RAG context: ${sources.length} sources, ${totalTokens} tokens for query: ${validatedQuery}`);
            return {
                context: context.trim(),
                sources,
                totalTokens
            };
        }, 'EXTRACT_RAG_CONTEXT', { topicId: validatedTopicId, queryLength: validatedQuery.length, maxTokens });
    }, 'VECTOR_STORE');
}
/**
 * Enhanced search function with metadata filtering and content type categorization
 */
export async function searchTopicContentEnhanced(query, topicId, options = {}) {
    try {
        const { limit = 10, sortBy = 'relevance' } = options;
        // Get base search results
        const results = await searchTopicContent(query, topicId, options);
        // Apply additional ranking and sorting
        let processedResults = results;
        if (sortBy === 'relevance') {
            processedResults = rankSearchResults(results, query);
        }
        else if (sortBy === 'date') {
            processedResults = results.sort((a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime());
        }
        else if (sortBy === 'score') {
            processedResults = results.sort((a, b) => b.score - a.score);
        }
        return processedResults.slice(0, limit);
    }
    catch (error) {
        console.error('Failed to search topic content with enhancements:', error);
        throw new HttpError(500, 'Failed to perform enhanced content search');
    }
}
/**
 * Optimize context window by selecting the most relevant content within token limits
 */
export async function optimizeContextWindow(query, topicId, maxTokens = 4000, options = {}) {
    const { prioritizeRecent = true, includeMetadata = true, diversifyContentTypes = true } = options;
    try {
        // Get comprehensive search results
        const searchResults = await searchTopicContent(query, topicId, {
            limit: 50, // Get more results for better optimization
            scoreThreshold: 0.5 // Lower threshold for more options
        });
        if (searchResults.length === 0) {
            return {
                context: '',
                sources: [],
                totalTokens: 0,
                optimization: {
                    originalResults: 0,
                    selectedResults: 0,
                    tokenEfficiency: 0
                }
            };
        }
        // Rank and optimize results
        let rankedResults = rankSearchResults(searchResults, query);
        // Apply content type diversification if requested
        if (diversifyContentTypes) {
            rankedResults = diversifyContentSelection(rankedResults);
        }
        // Apply recency boost if requested
        if (prioritizeRecent) {
            rankedResults = applyRecencyBoost(rankedResults);
        }
        // Select optimal content within token limits
        const selectedContent = selectOptimalContent(rankedResults, maxTokens, includeMetadata);
        // Build context string
        let context = '';
        for (const result of selectedContent.sources) {
            if (includeMetadata) {
                context += `[Source: ${result.metadata.contentType} from ${result.metadata.topicSlug} (Score: ${result.score.toFixed(3)})]\n`;
            }
            context += result.content + '\n\n';
        }
        const tokenEfficiency = selectedContent.sources.length > 0
            ? selectedContent.totalTokens / maxTokens
            : 0;
        return {
            context: context.trim(),
            sources: selectedContent.sources,
            totalTokens: selectedContent.totalTokens,
            optimization: {
                originalResults: searchResults.length,
                selectedResults: selectedContent.sources.length,
                tokenEfficiency: Math.round(tokenEfficiency * 100) / 100
            }
        };
    }
    catch (error) {
        console.error('Failed to optimize context window:', error);
        throw new HttpError(500, 'Failed to optimize context window');
    }
}
/**
 * Diversify content selection to include different content types
 */
function diversifyContentSelection(results) {
    const contentTypeGroups = {};
    // Group by content type
    for (const result of results) {
        const contentType = result.metadata.contentType;
        if (!contentTypeGroups[contentType]) {
            contentTypeGroups[contentType] = [];
        }
        contentTypeGroups[contentType].push(result);
    }
    // Select top results from each content type
    const diversifiedResults = [];
    const maxPerType = Math.max(2, Math.floor(results.length / Object.keys(contentTypeGroups).length));
    for (const [contentType, typeResults] of Object.entries(contentTypeGroups)) {
        const topResults = typeResults
            .sort((a, b) => b.score - a.score)
            .slice(0, maxPerType);
        diversifiedResults.push(...topResults);
    }
    // Fill remaining slots with highest scoring results
    const remainingSlots = results.length - diversifiedResults.length;
    if (remainingSlots > 0) {
        const usedIds = new Set(diversifiedResults.map(r => r.id));
        const remainingResults = results
            .filter(r => !usedIds.has(r.id))
            .slice(0, remainingSlots);
        diversifiedResults.push(...remainingResults);
    }
    return diversifiedResults;
}
/**
 * Apply recency boost to search results
 */
function applyRecencyBoost(results) {
    const now = Date.now();
    return results.map(result => {
        const createdAt = new Date(result.metadata.createdAt).getTime();
        const daysSinceCreated = (now - createdAt) / (1000 * 60 * 60 * 24);
        // Boost recent content (within last 7 days)
        const recencyBoost = daysSinceCreated <= 7 ? 1.15 :
            daysSinceCreated <= 30 ? 1.05 : 1.0;
        return {
            ...result,
            score: result.score * recencyBoost
        };
    }).sort((a, b) => b.score - a.score);
}
/**
 * Select optimal content within token limits using greedy algorithm
 */
function selectOptimalContent(results, maxTokens, includeMetadata) {
    const selectedSources = [];
    let totalTokens = 0;
    for (const result of results) {
        // Calculate tokens for this result
        const contentTokens = Math.ceil(result.content.length / 4);
        const metadataTokens = includeMetadata ? Math.ceil(JSON.stringify(result.metadata).length / 4) : 0;
        const resultTokens = contentTokens + metadataTokens;
        // Check if adding this result would exceed token limit
        if (totalTokens + resultTokens <= maxTokens) {
            selectedSources.push(result);
            totalTokens += resultTokens;
        }
        else {
            // Try to fit partial content if it's a high-scoring result
            if (result.score > 0.8 && selectedSources.length < 3) {
                const remainingTokens = maxTokens - totalTokens;
                const maxContentLength = (remainingTokens - metadataTokens) * 4;
                if (maxContentLength > 200) { // Minimum useful content length
                    const truncatedResult = {
                        ...result,
                        content: result.content.substring(0, maxContentLength) + '...'
                    };
                    selectedSources.push(truncatedResult);
                    totalTokens = maxTokens; // We've used up all available tokens
                    break;
                }
            }
        }
    }
    return {
        sources: selectedSources,
        totalTokens
    };
}
/**
 * Rank search results by relevance and content type priority
 */
function rankSearchResults(results, query) {
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
function calculateRelevanceScore(result, query, contentTypePriority) {
    const baseScore = result.score;
    const contentTypeMultiplier = contentTypePriority[result.metadata.contentType] || 0.5;
    // Boost score for newer content (within last 30 days)
    const createdAt = new Date(result.metadata.createdAt);
    const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const freshnessMultiplier = daysSinceCreated <= 30 ? 1.1 : 1.0;
    // Boost score for content with higher confidence (if available)
    const confidenceMultiplier = result.metadata.confidence ? result.metadata.confidence : 1.0;
    // Boost score for content length optimization (prefer medium-length content)
    const contentLength = result.content.length;
    const lengthMultiplier = contentLength >= 100 && contentLength <= 2000 ? 1.05 :
        contentLength > 2000 ? 0.95 : 0.9;
    // Boost score for query term overlap (simple keyword matching)
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    const contentLower = result.content.toLowerCase();
    const termMatches = queryTerms.filter(term => contentLower.includes(term)).length;
    const termMatchMultiplier = queryTerms.length > 0 ? 1 + (termMatches / queryTerms.length) * 0.2 : 1.0;
    // Boost score for content depth (deeper content might be more comprehensive)
    const depthMultiplier = result.metadata.depth <= 2 ? 1.0 : 0.95;
    return baseScore * contentTypeMultiplier * freshnessMultiplier * confidenceMultiplier *
        lengthMultiplier * termMatchMultiplier * depthMultiplier;
}
//# sourceMappingURL=vectorOperations.js.map