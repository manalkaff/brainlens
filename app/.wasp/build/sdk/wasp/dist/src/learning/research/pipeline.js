import { HttpError } from 'wasp/server';
import { randomUUID } from 'crypto';
import { ResearchAgentFactory } from './agents';
import { vectorStore } from './vectorStore';
// Default configuration for the research pipeline
const DEFAULT_CONFIG = {
    maxDepth: 3,
    maxSubtopicsPerLevel: 5,
    enableRealTimeUpdates: true,
    agentTimeout: 30000, // 30 seconds
    retryAttempts: 2
};
// Multi-agent coordination system
export class MultiAgentCoordinator {
    config;
    statusCallbacks = new Map();
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    // Register callback for real-time status updates
    registerStatusCallback(topicId, callback) {
        this.statusCallbacks.set(topicId, callback);
    }
    // Remove status callback
    unregisterStatusCallback(topicId) {
        this.statusCallbacks.delete(topicId);
    }
    // Emit status update to registered callbacks
    emitStatusUpdate(status) {
        const callback = this.statusCallbacks.get(status.topicId);
        if (callback && this.config.enableRealTimeUpdates) {
            callback(status);
        }
    }
    // Coordinate research across all agents for a single topic
    async coordinateAgents(topic, topicId, depth = 0, context) {
        const agents = ResearchAgentFactory.getAllAgents();
        const startTime = new Date();
        // Initialize status
        const status = {
            topicId,
            topic,
            currentDepth: depth,
            totalAgents: agents.length,
            completedAgents: 0,
            activeAgents: agents.map(a => a.name),
            status: 'initializing',
            progress: 0,
            startTime,
            errors: []
        };
        this.emitStatusUpdate(status);
        try {
            // Update status to researching
            status.status = 'researching';
            status.estimatedCompletion = new Date(Date.now() + (agents.length * this.config.agentTimeout));
            this.emitStatusUpdate(status);
            // Execute agents with timeout and retry logic
            const agentResults = await this.executeAgentsWithRetry(agents, topic, context, status);
            // Update status to aggregating
            status.status = 'aggregating';
            status.progress = 80;
            this.emitStatusUpdate(status);
            // Aggregate results from all agents
            const aggregatedContent = await this.aggregateResults(agentResults, topic);
            // Identify subtopics from aggregated results
            const identifiedSubtopics = await this.identifySubtopics(agentResults, topic, depth);
            // Determine overall success status
            const successfulResults = agentResults.filter(r => r.status === 'success');
            const resultStatus = successfulResults.length === 0 ? 'error' :
                successfulResults.length < agentResults.length ? 'partial' : 'success';
            // Store results in vector database
            await this.storeResultsInVectorDB(topic, topicId, depth, agentResults, aggregatedContent);
            // Final status update
            status.status = 'completed';
            status.progress = 100;
            status.completedAgents = agentResults.length;
            status.activeAgents = [];
            this.emitStatusUpdate(status);
            return {
                topic,
                topicId,
                depth,
                agentResults,
                aggregatedContent,
                identifiedSubtopics,
                status: resultStatus,
                errors: status.errors
            };
        }
        catch (error) {
            status.status = 'error';
            status.errors.push(error instanceof Error ? error.message : 'Unknown error');
            this.emitStatusUpdate(status);
            throw new HttpError(500, `Agent coordination failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Execute agents with timeout and retry logic
    async executeAgentsWithRetry(agents, topic, context, status) {
        const results = [];
        for (const agent of agents) {
            let attempts = 0;
            let success = false;
            while (attempts < this.config.retryAttempts && !success) {
                try {
                    attempts++;
                    // Execute agent with timeout
                    const result = await Promise.race([
                        agent.execute(topic, context),
                        this.createTimeoutPromise(this.config.agentTimeout, agent.name)
                    ]);
                    results.push(result);
                    success = true;
                    // Update progress
                    status.completedAgents++;
                    status.progress = Math.round((status.completedAgents / status.totalAgents) * 70); // 70% for agent execution
                    status.activeAgents = status.activeAgents.filter(name => name !== agent.name);
                    this.emitStatusUpdate(status);
                }
                catch (error) {
                    const errorMessage = `${agent.name} attempt ${attempts} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    console.error(errorMessage);
                    if (attempts >= this.config.retryAttempts) {
                        // Create error result for failed agent
                        results.push({
                            agent: agent.name,
                            topic,
                            results: [],
                            status: 'error',
                            error: errorMessage,
                            timestamp: new Date()
                        });
                        status.errors.push(errorMessage);
                        status.completedAgents++;
                        status.activeAgents = status.activeAgents.filter(name => name !== agent.name);
                        this.emitStatusUpdate(status);
                    }
                }
            }
        }
        return results;
    }
    // Create a timeout promise
    createTimeoutPromise(timeout, agentName) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`${agentName} timed out after ${timeout}ms`));
            }, timeout);
        });
    }
    // Aggregate results from multiple agents
    async aggregateResults(results, topic) {
        const successfulResults = results.filter(r => r.status === 'success');
        if (successfulResults.length === 0) {
            return {
                summary: `No successful results found for ${topic}`,
                keyPoints: [],
                sources: [],
                contentByAgent: {},
                confidence: 0,
                completeness: 0
            };
        }
        // Combine all sources and remove duplicates
        const allSources = [];
        const contentByAgent = {};
        successfulResults.forEach(result => {
            allSources.push(...result.results);
            contentByAgent[result.agent] = result;
        });
        // Deduplicate sources
        const uniqueSources = this.deduplicateSources(allSources);
        // Generate aggregated summary
        const summary = await this.generateAggregatedSummary(successfulResults, topic);
        // Extract key points from all results
        const keyPoints = await this.extractKeyPoints(successfulResults, topic);
        // Calculate confidence and completeness scores
        const confidence = this.calculateConfidence(successfulResults);
        const completeness = this.calculateCompleteness(successfulResults, results.length);
        return {
            summary,
            keyPoints,
            sources: uniqueSources,
            contentByAgent,
            confidence,
            completeness
        };
    }
    // Deduplicate sources based on URL and title similarity
    deduplicateSources(sources) {
        const seen = new Set();
        const unique = [];
        for (const source of sources) {
            const key = `${source.url}-${source.title.toLowerCase().trim()}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(source);
            }
        }
        // Sort by relevance score
        return unique.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }
    // Generate aggregated summary from multiple agent results
    async generateAggregatedSummary(results, topic) {
        // In a real implementation, this would use AI to create a coherent summary
        // For now, we'll create a structured summary from agent summaries
        const agentSummaries = results
            .filter(r => r.summary)
            .map(r => `${r.agent}: ${r.summary}`)
            .join('\n\n');
        if (!agentSummaries) {
            return `Research summary for ${topic} is being compiled from ${results.length} sources.`;
        }
        return `Comprehensive research summary for ${topic}:\n\n${agentSummaries}`;
    }
    // Extract key points from all agent results
    async extractKeyPoints(results, topic) {
        const keyPoints = [];
        // Extract key points from summaries and top search results
        results.forEach(result => {
            if (result.summary) {
                // Simple extraction - in production, this would use NLP
                const sentences = result.summary.split(/[.!?]+/).filter(s => s.trim().length > 20);
                keyPoints.push(...sentences.slice(0, 2).map(s => s.trim()));
            }
            // Extract from top search results
            result.results.slice(0, 2).forEach(searchResult => {
                if (searchResult.snippet) {
                    const sentences = searchResult.snippet.split(/[.!?]+/).filter(s => s.trim().length > 20);
                    keyPoints.push(...sentences.slice(0, 1).map(s => s.trim()));
                }
            });
        });
        // Remove duplicates and return top key points
        const uniqueKeyPoints = [...new Set(keyPoints)];
        return uniqueKeyPoints.slice(0, 10); // Limit to top 10 key points
    }
    // Calculate confidence score based on agent success and result quality
    calculateConfidence(results) {
        if (results.length === 0)
            return 0;
        const totalResults = results.reduce((sum, r) => sum + r.results.length, 0);
        const avgResultsPerAgent = totalResults / results.length;
        const avgRelevance = results.reduce((sum, r) => {
            const relevanceSum = r.results.reduce((rSum, result) => rSum + (result.relevanceScore || 0), 0);
            return sum + (relevanceSum / Math.max(r.results.length, 1));
        }, 0) / results.length;
        // Confidence based on number of results and average relevance
        const resultScore = Math.min(avgResultsPerAgent / 5, 1); // Normalize to 0-1
        const relevanceScore = avgRelevance; // Already 0-1
        return Math.round((resultScore * 0.4 + relevanceScore * 0.6) * 100) / 100;
    }
    // Calculate completeness score based on successful vs total agents
    calculateCompleteness(successfulResults, totalAgents) {
        return Math.round((successfulResults.length / totalAgents) * 100) / 100;
    }
    // Store research results in vector database
    async storeResultsInVectorDB(topic, topicId, depth, agentResults, aggregatedContent) {
        try {
            // Initialize vector store if needed
            await vectorStore.initializeCollection();
            const documents = [];
            const timestamp = new Date().toISOString();
            // Store aggregated summary
            if (aggregatedContent.summary) {
                documents.push({
                    id: randomUUID(),
                    content: aggregatedContent.summary,
                    metadata: {
                        topicId,
                        topicSlug: topicId.split('-').slice(-1)[0] || topicId,
                        contentType: 'summary',
                        depth,
                        createdAt: timestamp,
                        confidence: aggregatedContent.confidence,
                        completeness: aggregatedContent.completeness,
                        agentCount: agentResults.length
                    }
                });
            }
            // Store key points as separate documents
            aggregatedContent.keyPoints.forEach((keyPoint, index) => {
                if (keyPoint.trim()) {
                    documents.push({
                        id: randomUUID(),
                        content: keyPoint,
                        metadata: {
                            topicId,
                            topicSlug: topicId.split('-').slice(-1)[0] || topicId,
                            contentType: 'research',
                            depth,
                            createdAt: timestamp,
                            pointIndex: index,
                            pointType: 'key_point'
                        }
                    });
                }
            });
            // Store individual agent results
            agentResults.forEach((result, agentIndex) => {
                if (result.status === 'success' && result.summary) {
                    documents.push({
                        id: randomUUID(),
                        content: result.summary,
                        metadata: {
                            topicId,
                            topicSlug: topicId.split('-').slice(-1)[0] || topicId,
                            contentType: 'research',
                            depth,
                            createdAt: timestamp,
                            agent: result.agent,
                            agentIndex,
                            resultCount: result.results.length
                        }
                    });
                }
                // Store top search results from each agent
                result.results.slice(0, 3).forEach((searchResult, resultIndex) => {
                    if (searchResult.snippet && searchResult.snippet.length > 50) {
                        documents.push({
                            id: randomUUID(),
                            content: `${searchResult.title}\n\n${searchResult.snippet}`,
                            metadata: {
                                topicId,
                                topicSlug: topicId.split('-').slice(-1)[0] || topicId,
                                contentType: 'research',
                                depth,
                                createdAt: timestamp,
                                agent: result.agent,
                                sourceUrl: searchResult.url,
                                sourceTitle: searchResult.title,
                                relevanceScore: searchResult.relevanceScore || 0
                            }
                        });
                    }
                });
            });
            // Store documents in batch
            if (documents.length > 0) {
                await vectorStore.storeDocuments(documents);
                console.log(`Stored ${documents.length} documents for topic ${topic} at depth ${depth}`);
            }
        }
        catch (error) {
            console.error('Failed to store research results in vector database:', error);
            // Don't throw error to avoid breaking the research pipeline
        }
    }
    // Identify subtopics from aggregated agent results
    async identifySubtopics(results, topic, currentDepth) {
        if (currentDepth >= this.config.maxDepth) {
            return []; // Don't identify subtopics at max depth
        }
        const allSubtopics = [];
        // Collect subtopics from all agents
        results.forEach(result => {
            if (result.subtopics) {
                allSubtopics.push(...result.subtopics);
            }
        });
        // Deduplicate and filter subtopics
        const uniqueSubtopics = [...new Set(allSubtopics)]
            .filter(subtopic => subtopic.length > 2 &&
            subtopic.toLowerCase() !== topic.toLowerCase() &&
            !topic.toLowerCase().includes(subtopic.toLowerCase()))
            .slice(0, this.config.maxSubtopicsPerLevel);
        return uniqueSubtopics;
    }
}
// Recursive research system
export class RecursiveResearchSystem {
    coordinator;
    researchHistory = new Map();
    constructor(config = {}) {
        this.coordinator = new MultiAgentCoordinator(config);
    }
    // Start recursive research for a topic
    async startRecursiveResearch(rootTopic, rootTopicId, context, onStatusUpdate, onDepthComplete) {
        const startTime = new Date();
        const researchTree = {
            topic: rootTopic,
            topicId: rootTopicId,
            depth: 0,
            result: null,
            children: [],
            status: 'pending'
        };
        try {
            // Register status callback if provided
            if (onStatusUpdate) {
                this.coordinator.registerStatusCallback(rootTopicId, onStatusUpdate);
            }
            // Start recursive research
            await this.researchNodeRecursively(researchTree, context, onDepthComplete);
            return {
                rootTopic,
                rootTopicId,
                researchTree,
                totalNodes: this.countNodes(researchTree),
                completedNodes: this.countCompletedNodes(researchTree),
                startTime,
                endTime: new Date(),
                status: 'completed'
            };
        }
        catch (error) {
            console.error('Recursive research failed:', error);
            return {
                rootTopic,
                rootTopicId,
                researchTree,
                totalNodes: this.countNodes(researchTree),
                completedNodes: this.countCompletedNodes(researchTree),
                startTime,
                endTime: new Date(),
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
        finally {
            // Clean up status callback
            this.coordinator.unregisterStatusCallback(rootTopicId);
        }
    }
    // Research a node and its children recursively
    async researchNodeRecursively(node, context, onDepthComplete) {
        try {
            node.status = 'researching';
            // Research current node
            const result = await this.coordinator.coordinateAgents(node.topic, node.topicId, node.depth, context);
            node.result = result;
            node.status = 'completed';
            // Store in history
            this.researchHistory.set(node.topicId, result);
            // Notify completion of this depth
            if (onDepthComplete) {
                onDepthComplete(result);
            }
            // Create child nodes for identified subtopics
            if (result.identifiedSubtopics.length > 0 && node.depth < 2) { // Max depth of 3 (0, 1, 2)
                for (const subtopic of result.identifiedSubtopics) {
                    const childNode = {
                        topic: subtopic,
                        topicId: `${node.topicId}-${subtopic.toLowerCase().replace(/\s+/g, '-')}`,
                        depth: node.depth + 1,
                        result: null,
                        children: [],
                        status: 'pending'
                    };
                    node.children.push(childNode);
                    // Recursively research child node
                    await this.researchNodeRecursively(childNode, context, onDepthComplete);
                }
            }
        }
        catch (error) {
            node.status = 'error';
            node.error = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Research failed for node ${node.topic}:`, error);
        }
    }
    // Count total nodes in the research tree
    countNodes(node) {
        let count = 1;
        node.children.forEach(child => {
            count += this.countNodes(child);
        });
        return count;
    }
    // Count completed nodes in the research tree
    countCompletedNodes(node) {
        let count = node.status === 'completed' ? 1 : 0;
        node.children.forEach(child => {
            count += this.countCompletedNodes(child);
        });
        return count;
    }
    // Get research history
    getResearchHistory() {
        return this.researchHistory;
    }
    // Clear research history
    clearHistory() {
        this.researchHistory.clear();
    }
}
// Export default config with alias
export { DEFAULT_CONFIG as DEFAULT_RESEARCH_CONFIG };
//# sourceMappingURL=pipeline.js.map