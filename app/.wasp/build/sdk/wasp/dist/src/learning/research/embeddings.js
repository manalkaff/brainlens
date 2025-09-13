import OpenAI from 'openai';
import Redis from 'ioredis';
import { createHash } from 'crypto';
export class EmbeddingService {
    openai;
    redis;
    cacheEnabled;
    cacheTTL; // Cache TTL in seconds
    defaultChunkingConfig;
    constructor(options = {}) {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.cacheEnabled = options.cacheEnabled ?? true;
        this.cacheTTL = options.cacheTTL ?? 24 * 60 * 60; // 24 hours default
        this.defaultChunkingConfig = {
            maxTokens: 512,
            overlapTokens: 50,
            strategy: 'semantic',
            preserveContext: true,
            respectBoundaries: true,
            ...options.chunkingConfig
        };
        if (this.cacheEnabled) {
            this.initializeRedis(options.redisUrl);
        }
    }
    /**
     * Generate embedding for a single text
     */
    async generateEmbedding(text) {
        try {
            // Check cache first
            if (this.cacheEnabled) {
                const cached = await this.getCachedEmbedding(text);
                if (cached) {
                    console.log('Retrieved embedding from cache');
                    return cached;
                }
            }
            // Generate new embedding
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text,
                encoding_format: 'float',
            });
            const embedding = response.data[0].embedding;
            // Cache the result
            if (this.cacheEnabled) {
                await this.cacheEmbedding(text, embedding);
            }
            return embedding;
        }
        catch (error) {
            console.error('Failed to generate embedding:', error);
            throw new Error(`Embedding generation failed: ${error}`);
        }
    }
    /**
     * Generate embeddings for multiple texts in batch
     */
    async generateBatchEmbeddings(texts) {
        if (texts.length === 0)
            return [];
        try {
            // Check cache for all texts
            const cachedResults = [];
            const uncachedTexts = [];
            const uncachedIndices = [];
            if (this.cacheEnabled) {
                for (let i = 0; i < texts.length; i++) {
                    const cached = await this.getCachedEmbedding(texts[i]);
                    cachedResults[i] = cached;
                    if (!cached) {
                        uncachedTexts.push(texts[i]);
                        uncachedIndices.push(i);
                    }
                }
            }
            else {
                // If cache is disabled, all texts are uncached
                uncachedTexts.push(...texts);
                uncachedIndices.push(...texts.map((_, i) => i));
            }
            // Generate embeddings for uncached texts
            let newEmbeddings = [];
            if (uncachedTexts.length > 0) {
                // Process in batches to avoid API limits
                const batchSize = 100; // OpenAI's batch limit
                const batches = [];
                for (let i = 0; i < uncachedTexts.length; i += batchSize) {
                    batches.push(uncachedTexts.slice(i, i + batchSize));
                }
                for (const batch of batches) {
                    const response = await this.openai.embeddings.create({
                        model: 'text-embedding-3-small',
                        input: batch,
                        encoding_format: 'float',
                    });
                    const batchEmbeddings = response.data.map(item => item.embedding);
                    newEmbeddings.push(...batchEmbeddings);
                    // Cache the new embeddings
                    if (this.cacheEnabled) {
                        for (let i = 0; i < batch.length; i++) {
                            await this.cacheEmbedding(batch[i], batchEmbeddings[i]);
                        }
                    }
                }
            }
            // Combine cached and new embeddings
            const results = new Array(texts.length);
            let newEmbeddingIndex = 0;
            for (let i = 0; i < texts.length; i++) {
                if (cachedResults[i]) {
                    results[i] = cachedResults[i];
                }
                else {
                    results[i] = newEmbeddings[newEmbeddingIndex++];
                }
            }
            console.log(`Generated ${newEmbeddings.length} new embeddings, retrieved ${texts.length - newEmbeddings.length} from cache`);
            return results;
        }
        catch (error) {
            console.error('Failed to generate batch embeddings:', error);
            throw new Error(`Batch embedding generation failed: ${error}`);
        }
    }
    /**
     * Cache an embedding
     */
    async cacheEmbedding(text, embedding) {
        if (!this.redis || !this.cacheEnabled)
            return;
        try {
            const cacheKey = this.getCacheKey(text);
            const cacheEntry = {
                embedding,
                timestamp: new Date(),
                model: 'text-embedding-3-small',
            };
            await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(cacheEntry));
        }
        catch (error) {
            console.error('Failed to cache embedding:', error);
            // Don't throw error for cache failures
        }
    }
    /**
     * Get cached embedding
     */
    async getCachedEmbedding(text) {
        if (!this.redis || !this.cacheEnabled)
            return null;
        try {
            const cacheKey = this.getCacheKey(text);
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                const cacheEntry = JSON.parse(cached);
                return cacheEntry.embedding;
            }
        }
        catch (error) {
            console.error('Failed to retrieve cached embedding:', error);
            // Don't throw error for cache failures
        }
        return null;
    }
    /**
     * Clear embedding cache
     */
    async clearCache() {
        if (!this.redis || !this.cacheEnabled)
            return;
        try {
            const keys = await this.redis.keys('embedding:*');
            if (keys.length > 0) {
                await this.redis.del(...keys);
                console.log(`Cleared ${keys.length} cached embeddings`);
            }
        }
        catch (error) {
            console.error('Failed to clear embedding cache:', error);
            throw new Error(`Cache clearing failed: ${error}`);
        }
    }
    /**
     * Get cache statistics
     */
    async getCacheStats() {
        if (!this.redis || !this.cacheEnabled) {
            return { totalKeys: 0, memoryUsage: '0B' };
        }
        try {
            const keys = await this.redis.keys('embedding:*');
            const info = await this.redis.info('memory');
            const memoryMatch = info.match(/used_memory_human:(.+)/);
            const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'Unknown';
            return {
                totalKeys: keys.length,
                memoryUsage,
            };
        }
        catch (error) {
            console.error('Failed to get cache stats:', error);
            return { totalKeys: 0, memoryUsage: 'Error' };
        }
    }
    /**
     * Health check for the embedding service
     */
    async healthCheck() {
        const result = {
            openai: false,
            cache: false,
            error: undefined,
        };
        try {
            // Test OpenAI connection
            await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: 'test',
                encoding_format: 'float',
            });
            result.openai = true;
        }
        catch (error) {
            result.error = `OpenAI error: ${error}`;
        }
        try {
            // Test Redis connection if enabled
            if (this.redis && this.cacheEnabled) {
                await this.redis.ping();
                result.cache = true;
            }
            else {
                result.cache = !this.cacheEnabled; // True if cache is disabled
            }
        }
        catch (error) {
            if (result.error) {
                result.error += `, Cache error: ${error}`;
            }
            else {
                result.error = `Cache error: ${error}`;
            }
        }
        return result;
    }
    /**
     * Initialize Redis connection
     */
    async initializeRedis(redisUrl) {
        try {
            this.redis = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
                password: process.env.REDIS_PASSWORD || undefined,
                connectTimeout: 10000,
                lazyConnect: true,
            });
            this.redis.on('error', (err) => {
                console.log(process.env.REDIS_HOST || 'localhost');
                console.log(process.env.REDIS_PORT || 6379);
                console.error('Redis client error:', err);
                this.cacheEnabled = false; // Disable cache on connection error
            });
            this.redis.on('connect', () => {
                console.log('Connected to Redis for embedding cache');
            });
            await this.redis.connect();
        }
        catch (error) {
            console.error('Failed to initialize Redis:', error);
            this.cacheEnabled = false; // Disable cache if Redis fails
        }
    }
    /**
     * Generate cache key for text
     */
    getCacheKey(text) {
        // Use a hash of the text to create a consistent key
        const hash = createHash('sha256').update(text).digest('hex');
        return `embedding:${hash}`;
    }
    /**
     * Enhanced method: Generate embeddings for research results with intelligent chunking
     */
    async generateResearchEmbeddings(researchResults, mainTopic, config) {
        const startTime = Date.now();
        const chunkingConfig = { ...this.defaultChunkingConfig, ...config };
        const allChunks = [];
        let cacheHits = 0;
        let totalRequests = 0;
        // Process each research result
        for (const result of researchResults) {
            if (result.status !== 'success')
                continue;
            const agentChunks = await this.chunkResearchResult(result, mainTopic, chunkingConfig);
            allChunks.push(...agentChunks);
        }
        // Generate embeddings for all chunks
        const chunkTexts = allChunks.map(chunk => this.createChunkEmbeddingText(chunk));
        const embeddings = [];
        // Process in batches to handle large numbers of chunks
        const batchSize = 100;
        for (let i = 0; i < chunkTexts.length; i += batchSize) {
            const batch = chunkTexts.slice(i, i + batchSize);
            // Check cache for each text in batch
            const batchResults = [];
            const uncachedIndices = [];
            const uncachedTexts = [];
            for (let j = 0; j < batch.length; j++) {
                totalRequests++;
                const cached = await this.getCachedEmbedding(batch[j]);
                if (cached) {
                    batchResults[j] = cached;
                    cacheHits++;
                }
                else {
                    batchResults[j] = []; // Placeholder
                    uncachedIndices.push(j);
                    uncachedTexts.push(batch[j]);
                }
            }
            // Generate embeddings for uncached texts
            if (uncachedTexts.length > 0) {
                const newEmbeddings = await this.generateBatchEmbeddings(uncachedTexts);
                // Insert new embeddings into results
                for (let k = 0; k < uncachedIndices.length; k++) {
                    batchResults[uncachedIndices[k]] = newEmbeddings[k];
                }
            }
            embeddings.push(...batchResults);
        }
        const processingTime = Date.now() - startTime;
        const cacheHitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;
        return {
            chunks: allChunks,
            embeddings,
            metadata: {
                totalTokens: allChunks.reduce((sum, chunk) => sum + chunk.metadata.tokenCount, 0),
                processingTime,
                cacheHitRate,
                chunksGenerated: allChunks.length,
                strategy: chunkingConfig.strategy
            }
        };
    }
    /**
     * Enhanced method: Generate embeddings for subtopic hierarchy
     */
    async generateSubtopicEmbeddings(subtopics, mainTopic, synthesizedContent, config) {
        const startTime = Date.now();
        const chunkingConfig = { ...this.defaultChunkingConfig, ...config };
        const allChunks = [];
        let cacheHits = 0;
        let totalRequests = 0;
        // Create chunks for each subtopic
        for (const subtopic of subtopics) {
            const subtopicChunks = this.createSubtopicChunks(subtopic, mainTopic, chunkingConfig);
            allChunks.push(...subtopicChunks);
        }
        // If synthesized content is provided, chunk it too
        if (synthesizedContent) {
            const synthesisChunks = this.chunkSynthesizedContent(synthesizedContent, mainTopic, chunkingConfig);
            allChunks.push(...synthesisChunks);
        }
        // Generate embeddings
        const chunkTexts = allChunks.map(chunk => this.createChunkEmbeddingText(chunk));
        const embeddings = [];
        for (const text of chunkTexts) {
            totalRequests++;
            const cached = await this.getCachedEmbedding(text);
            if (cached) {
                embeddings.push(cached);
                cacheHits++;
            }
            else {
                const embedding = await this.generateEmbedding(text);
                embeddings.push(embedding);
            }
        }
        const processingTime = Date.now() - startTime;
        const cacheHitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;
        return {
            chunks: allChunks,
            embeddings,
            metadata: {
                totalTokens: allChunks.reduce((sum, chunk) => sum + chunk.metadata.tokenCount, 0),
                processingTime,
                cacheHitRate,
                chunksGenerated: allChunks.length,
                strategy: chunkingConfig.strategy
            }
        };
    }
    /**
     * Chunk a research result into manageable pieces
     */
    async chunkResearchResult(result, mainTopic, config) {
        const chunks = [];
        // Combine all search results into a single text for the agent
        const combinedContent = result.results.map(searchResult => {
            return `Title: ${searchResult.title}\nContent: ${searchResult.snippet}`;
        }).join('\n\n');
        if (!combinedContent.trim())
            return chunks;
        const textChunks = this.chunkText(combinedContent, config);
        textChunks.forEach((chunk, index) => {
            const chunkId = `${result.agent.replace(/\s/g, '_').toLowerCase()}_${index}`;
            chunks.push({
                id: chunkId,
                content: chunk.content,
                metadata: {
                    chunkIndex: index,
                    totalChunks: textChunks.length,
                    tokenCount: chunk.tokenCount,
                    startOffset: chunk.startOffset,
                    endOffset: chunk.endOffset,
                    contextType: 'research',
                    sourceId: result.agent,
                    parentTopic: mainTopic,
                    agentSource: result.agent,
                    contentType: this.classifyAgentContentType(result.agent)
                }
            });
        });
        return chunks;
    }
    /**
     * Create chunks for subtopic hierarchy
     */
    createSubtopicChunks(subtopic, mainTopic, config) {
        const chunks = [];
        // Create content for the subtopic
        const subtopicContent = this.createSubtopicContent(subtopic);
        const textChunks = this.chunkText(subtopicContent, config);
        textChunks.forEach((chunk, index) => {
            const chunkId = `${subtopic.id}_${index}`;
            chunks.push({
                id: chunkId,
                content: chunk.content,
                metadata: {
                    chunkIndex: index,
                    totalChunks: textChunks.length,
                    tokenCount: chunk.tokenCount,
                    startOffset: chunk.startOffset,
                    endOffset: chunk.endOffset,
                    contextType: 'subtopic',
                    sourceId: subtopic.id,
                    parentTopic: mainTopic,
                    subtopic: subtopic.title,
                    difficulty: subtopic.metadata.difficulty,
                    hierarchy: {
                        level: subtopic.level,
                        path: this.buildHierarchyPath(subtopic)
                    }
                }
            });
        });
        // Recursively process children
        if (subtopic.children) {
            for (const child of subtopic.children) {
                const childChunks = this.createSubtopicChunks(child, mainTopic, config);
                chunks.push(...childChunks);
            }
        }
        return chunks;
    }
    /**
     * Chunk synthesized content
     */
    chunkSynthesizedContent(content, mainTopic, config) {
        const chunks = [];
        const textChunks = this.chunkText(content, config);
        textChunks.forEach((chunk, index) => {
            const chunkId = `synthesis_${index}`;
            chunks.push({
                id: chunkId,
                content: chunk.content,
                metadata: {
                    chunkIndex: index,
                    totalChunks: textChunks.length,
                    tokenCount: chunk.tokenCount,
                    startOffset: chunk.startOffset,
                    endOffset: chunk.endOffset,
                    contextType: 'synthesis',
                    sourceId: 'synthesized_content',
                    parentTopic: mainTopic
                }
            });
        });
        return chunks;
    }
    /**
     * Core text chunking method with multiple strategies
     */
    chunkText(text, config) {
        if (!text.trim())
            return [];
        switch (config.strategy) {
            case 'sentence':
                return this.chunkBySentences(text, config);
            case 'paragraph':
                return this.chunkByParagraphs(text, config);
            case 'semantic':
                return this.chunkSemantically(text, config);
            case 'sliding_window':
                return this.chunkBySliding(text, config);
            default:
                return this.chunkSemantically(text, config);
        }
    }
    /**
     * Chunk text by sentences
     */
    chunkBySentences(text, config) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const chunks = [];
        let currentChunk = '';
        let currentTokens = 0;
        let startOffset = 0;
        for (const sentence of sentences) {
            const sentenceTokens = this.estimateTokens(sentence);
            if (currentTokens + sentenceTokens > config.maxTokens && currentChunk) {
                chunks.push({
                    content: currentChunk.trim(),
                    tokenCount: currentTokens,
                    startOffset,
                    endOffset: startOffset + currentChunk.length
                });
                // Handle overlap
                if (config.overlapTokens > 0) {
                    const overlapText = this.getLastTokens(currentChunk, config.overlapTokens);
                    currentChunk = overlapText + sentence;
                    currentTokens = this.estimateTokens(currentChunk);
                }
                else {
                    currentChunk = sentence;
                    currentTokens = sentenceTokens;
                }
                startOffset += currentChunk.length - sentence.length;
            }
            else {
                currentChunk += (currentChunk ? ' ' : '') + sentence;
                currentTokens += sentenceTokens;
            }
        }
        if (currentChunk.trim()) {
            chunks.push({
                content: currentChunk.trim(),
                tokenCount: currentTokens,
                startOffset,
                endOffset: startOffset + currentChunk.length
            });
        }
        return chunks;
    }
    /**
     * Chunk text by paragraphs
     */
    chunkByParagraphs(text, config) {
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const chunks = [];
        let currentChunk = '';
        let currentTokens = 0;
        let startOffset = 0;
        for (const paragraph of paragraphs) {
            const paragraphTokens = this.estimateTokens(paragraph);
            if (currentTokens + paragraphTokens > config.maxTokens && currentChunk) {
                chunks.push({
                    content: currentChunk.trim(),
                    tokenCount: currentTokens,
                    startOffset,
                    endOffset: startOffset + currentChunk.length
                });
                currentChunk = paragraph;
                currentTokens = paragraphTokens;
                startOffset += currentChunk.length;
            }
            else {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
                currentTokens += paragraphTokens;
            }
        }
        if (currentChunk.trim()) {
            chunks.push({
                content: currentChunk.trim(),
                tokenCount: currentTokens,
                startOffset,
                endOffset: startOffset + currentChunk.length
            });
        }
        return chunks;
    }
    /**
     * Chunk text semantically (most intelligent method)
     */
    chunkSemantically(text, config) {
        // Combine sentence and paragraph boundaries for semantic chunking
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const chunks = [];
        let currentChunk = '';
        let currentTokens = 0;
        let startOffset = 0;
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];
            const sentenceTokens = this.estimateTokens(sentence);
            // Check if adding this sentence would exceed the limit
            if (currentTokens + sentenceTokens > config.maxTokens && currentChunk) {
                // Look for a good breaking point
                const breakPoint = this.findSemanticBreakPoint(currentChunk, config.maxTokens * 0.8);
                if (breakPoint > 0) {
                    const chunkContent = currentChunk.substring(0, breakPoint).trim();
                    chunks.push({
                        content: chunkContent,
                        tokenCount: this.estimateTokens(chunkContent),
                        startOffset,
                        endOffset: startOffset + chunkContent.length
                    });
                    // Continue with remaining content plus overlap
                    const remaining = currentChunk.substring(breakPoint);
                    currentChunk = remaining + (remaining ? ' ' : '') + sentence;
                    currentTokens = this.estimateTokens(currentChunk);
                    startOffset += chunkContent.length;
                }
                else {
                    // No good break point found, chunk at current position
                    chunks.push({
                        content: currentChunk.trim(),
                        tokenCount: currentTokens,
                        startOffset,
                        endOffset: startOffset + currentChunk.length
                    });
                    currentChunk = sentence;
                    currentTokens = sentenceTokens;
                    startOffset += currentChunk.length;
                }
            }
            else {
                currentChunk += (currentChunk ? ' ' : '') + sentence;
                currentTokens += sentenceTokens;
            }
        }
        if (currentChunk.trim()) {
            chunks.push({
                content: currentChunk.trim(),
                tokenCount: currentTokens,
                startOffset,
                endOffset: startOffset + currentChunk.length
            });
        }
        return chunks;
    }
    /**
     * Chunk text using sliding window
     */
    chunkBySliding(text, config) {
        const words = text.split(/\s+/);
        const chunks = [];
        const wordsPerChunk = Math.floor(config.maxTokens * 0.75); // Rough conversion
        const overlapWords = Math.floor(config.overlapTokens * 0.75);
        for (let i = 0; i < words.length; i += wordsPerChunk - overlapWords) {
            const chunkWords = words.slice(i, i + wordsPerChunk);
            const chunkContent = chunkWords.join(' ');
            if (chunkContent.trim()) {
                chunks.push({
                    content: chunkContent,
                    tokenCount: this.estimateTokens(chunkContent),
                    startOffset: i * 5, // Rough estimate
                    endOffset: (i + chunkWords.length) * 5
                });
            }
            if (i + wordsPerChunk >= words.length)
                break;
        }
        return chunks;
    }
    /**
     * Find semantic break points in text
     */
    findSemanticBreakPoint(text, targetLength) {
        const sentences = text.split(/[.!?]+/);
        let currentLength = 0;
        for (let i = 0; i < sentences.length - 1; i++) {
            currentLength += sentences[i].length;
            if (currentLength >= targetLength) {
                return currentLength;
            }
        }
        return 0; // No good break point found
    }
    /**
     * Estimate token count (rough approximation)
     */
    estimateTokens(text) {
        // Rough estimate: 1 token ≈ 4 characters for English text
        return Math.ceil(text.length / 4);
    }
    /**
     * Get last N tokens from text
     */
    getLastTokens(text, tokenCount) {
        const approxCharCount = tokenCount * 4;
        return text.length > approxCharCount ? text.slice(-approxCharCount) : text;
    }
    /**
     * Create content for a subtopic
     */
    createSubtopicContent(subtopic) {
        let content = `Title: ${subtopic.title}\n`;
        content += `Description: ${subtopic.description}\n`;
        content += `Difficulty: ${subtopic.metadata.difficulty}\n`;
        content += `Estimated Time: ${subtopic.metadata.estimatedTimeMinutes} minutes\n`;
        if (subtopic.metadata.prerequisites.length > 0) {
            content += `Prerequisites: ${subtopic.metadata.prerequisites.join(', ')}\n`;
        }
        if (subtopic.metadata.keyTerms.length > 0) {
            content += `Key Terms: ${subtopic.metadata.keyTerms.join(', ')}\n`;
        }
        if (subtopic.metadata.practicalApplications.length > 0) {
            content += `Applications: ${subtopic.metadata.practicalApplications.join(', ')}\n`;
        }
        return content;
    }
    /**
     * Build hierarchy path for a subtopic
     */
    buildHierarchyPath(subtopic) {
        const path = [subtopic.title];
        // In a real implementation, this would trace back to the root
        return path;
    }
    /**
     * Classify agent content type
     */
    classifyAgentContentType(agentName) {
        const name = agentName.toLowerCase();
        if (name.includes('academic'))
            return 'academic';
        if (name.includes('community'))
            return 'community';
        if (name.includes('video'))
            return 'video';
        if (name.includes('computational'))
            return 'computational';
        return 'general';
    }
    /**
     * Create embedding text for a chunk (includes metadata for better semantic understanding)
     */
    createChunkEmbeddingText(chunk) {
        let embeddingText = chunk.content;
        // Add context metadata to improve embedding quality
        if (chunk.metadata.parentTopic) {
            embeddingText = `Topic: ${chunk.metadata.parentTopic}\n${embeddingText}`;
        }
        if (chunk.metadata.subtopic) {
            embeddingText = `Subtopic: ${chunk.metadata.subtopic}\n${embeddingText}`;
        }
        if (chunk.metadata.difficulty) {
            embeddingText = `Difficulty: ${chunk.metadata.difficulty}\n${embeddingText}`;
        }
        return embeddingText;
    }
    /**
     * Update chunking configuration
     */
    updateChunkingConfig(config) {
        this.defaultChunkingConfig = { ...this.defaultChunkingConfig, ...config };
    }
    /**
     * Get current chunking configuration
     */
    getChunkingConfig() {
        return { ...this.defaultChunkingConfig };
    }
    /**
     * Close connections and cleanup
     */
    async close() {
        if (this.redis) {
            this.redis.disconnect();
        }
    }
}
// Export singleton instance
export const embeddingService = new EmbeddingService();
//# sourceMappingURL=embeddings.js.map