const DEFAULT_AGGREGATION_CONFIG = {
    duplicateThreshold: 0.8,
    maxResults: 50,
    minRelevanceScore: 0.3,
    minConfidenceScore: 0.4,
    boostFactors: {
        multipleAgents: 0.2,
        highQualitySources: 0.15,
        recentContent: 0.1,
        uniqueContent: 0.1
    },
    penaltyFactors: {
        duplicateContent: 0.3,
        lowQualitySources: 0.2,
        outdatedContent: 0.1
    }
};
// Content aggregation and deduplication system
export class ContentAggregator {
    config;
    constructor(config) {
        this.config = { ...DEFAULT_AGGREGATION_CONFIG, ...config };
    }
    /**
     * Aggregate results from multiple research agents
     */
    async aggregateResults(agentResults, topic, context) {
        // Step 1: Collect all search results from all agents
        const allResults = this.collectAllResults(agentResults);
        // Step 2: Detect and group duplicates
        const groupedResults = await this.groupDuplicates(allResults);
        // Step 3: Create aggregated results from groups
        const aggregatedResults = await this.createAggregatedResults(groupedResults, topic, context);
        // Step 4: Score and rank results
        const scoredResults = await this.scoreAndRankResults(aggregatedResults, context);
        // Step 5: Apply filters and limits
        const filteredResults = this.applyFilters(scoredResults);
        // Step 6: Generate summary and attribution
        const summary = this.generateSummary(agentResults, filteredResults);
        const sourceAttribution = this.generateSourceAttribution(agentResults);
        return {
            aggregatedResults: filteredResults,
            summary,
            sourceAttribution
        };
    }
    /**
     * Collect all search results from agent results
     */
    collectAllResults(agentResults) {
        const allResults = [];
        for (const agentResult of agentResults) {
            if (agentResult.status === 'success' && agentResult.results) {
                for (const result of agentResult.results) {
                    allResults.push({
                        ...result,
                        agentName: agentResult.agent,
                        agentTimestamp: agentResult.timestamp
                    });
                }
            }
        }
        return allResults;
    }
    /**
     * Group duplicate results using similarity detection
     */
    async groupDuplicates(results) {
        const groups = [];
        const processed = new Set();
        for (let i = 0; i < results.length; i++) {
            if (processed.has(i))
                continue;
            const group = {
                primary: results[i],
                duplicates: [],
                similarity: 1.0
            };
            // Find duplicates for this result
            for (let j = i + 1; j < results.length; j++) {
                if (processed.has(j))
                    continue;
                const similarity = this.calculateSimilarity(results[i], results[j]);
                if (similarity >= this.config.duplicateThreshold) {
                    group.duplicates.push({
                        result: results[j],
                        similarity
                    });
                    processed.add(j);
                }
            }
            groups.push(group);
            processed.add(i);
        }
        return groups;
    }
    /**
     * Calculate similarity between two search results
     */
    calculateSimilarity(result1, result2) {
        // URL similarity (exact match gets high score)
        if (result1.url === result2.url)
            return 1.0;
        // Title similarity
        const titleSimilarity = this.calculateTextSimilarity(result1.title, result2.title);
        // Content similarity
        const contentSimilarity = this.calculateTextSimilarity(result1.snippet || '', result2.snippet || '');
        // Domain similarity
        const domainSimilarity = this.calculateDomainSimilarity(result1.url, result2.url);
        // Weighted combination
        const weights = {
            title: 0.4,
            content: 0.3,
            domain: 0.3
        };
        return (titleSimilarity * weights.title +
            contentSimilarity * weights.content +
            domainSimilarity * weights.domain);
    }
    /**
     * Calculate text similarity using simple token-based approach
     */
    calculateTextSimilarity(text1, text2) {
        if (!text1 || !text2)
            return 0;
        const tokens1 = this.tokenize(text1.toLowerCase());
        const tokens2 = this.tokenize(text2.toLowerCase());
        if (tokens1.length === 0 || tokens2.length === 0)
            return 0;
        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return intersection.size / union.size; // Jaccard similarity
    }
    /**
     * Calculate domain similarity
     */
    calculateDomainSimilarity(url1, url2) {
        try {
            const domain1 = new URL(url1).hostname.toLowerCase();
            const domain2 = new URL(url2).hostname.toLowerCase();
            if (domain1 === domain2)
                return 1.0;
            // Check for subdomain similarity
            const parts1 = domain1.split('.');
            const parts2 = domain2.split('.');
            const mainDomain1 = parts1.slice(-2).join('.');
            const mainDomain2 = parts2.slice(-2).join('.');
            return mainDomain1 === mainDomain2 ? 0.7 : 0.0;
        }
        catch {
            return 0.0;
        }
    }
    /**
     * Tokenize text for similarity calculation
     */
    tokenize(text) {
        return text
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 2)
            .slice(0, 50); // Limit tokens for performance
    }
    /**
     * Create aggregated results from grouped duplicates
     */
    async createAggregatedResults(groups, topic, context) {
        const aggregatedResults = [];
        for (const group of groups) {
            const primary = group.primary;
            const allResults = [primary, ...group.duplicates.map(d => d.result)];
            // Collect source attribution
            const sourceAttribution = allResults.map(result => ({
                agent: result.agentName,
                engine: result.source,
                originalScore: result.relevanceScore || 0,
                query: result.metadata?.query || topic,
                timestamp: result.agentTimestamp,
                metadata: result.metadata
            }));
            // Calculate aggregated scores
            const relevanceScore = this.calculateAggregatedRelevance(allResults);
            const confidenceScore = this.calculateConfidenceScore(allResults, group.duplicates.length);
            // Generate quality metrics
            const qualityMetrics = await this.calculateQualityMetrics(primary, allResults, context);
            // Create aggregated result
            const aggregatedResult = {
                id: this.generateResultId(primary),
                title: this.selectBestTitle(allResults),
                url: primary.url,
                snippet: this.selectBestSnippet(allResults),
                sources: [...new Set(allResults.map(r => r.agentName))],
                engines: [...new Set(allResults.map(r => r.source))],
                relevanceScore,
                confidenceScore,
                duplicateCount: group.duplicates.length,
                metadata: {
                    type: [...new Set(allResults.map(r => r.metadata?.type).filter(Boolean))],
                    categories: [...new Set(allResults.flatMap(r => r.metadata?.category ? [r.metadata.category] : []))],
                    publishedDate: this.selectMostRecentDate(allResults),
                    author: primary.metadata?.author,
                    contentLength: primary.snippet?.length || 0,
                    sourceAttribution,
                    qualityMetrics
                }
            };
            aggregatedResults.push(aggregatedResult);
        }
        return aggregatedResults;
    }
    /**
     * Calculate aggregated relevance score
     */
    calculateAggregatedRelevance(results) {
        if (results.length === 0)
            return 0;
        const scores = results.map(r => r.relevanceScore || 0);
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        // Boost for multiple sources
        const multiSourceBoost = results.length > 1 ? this.config.boostFactors.multipleAgents : 0;
        return Math.min(1.0, avgScore + multiSourceBoost);
    }
    /**
     * Calculate confidence score based on multiple factors
     */
    calculateConfidenceScore(results, duplicateCount) {
        if (results.length === 0)
            return 0;
        // Base confidence from number of sources
        const sourceConfidence = Math.min(1.0, results.length / 3); // Max confidence at 3+ sources
        // Boost for duplicates found (indicates consistency)
        const duplicateBoost = Math.min(0.3, duplicateCount * 0.1);
        // Engine diversity boost
        const uniqueEngines = new Set(results.map(r => r.source)).size;
        const diversityBoost = Math.min(0.2, uniqueEngines * 0.05);
        return Math.min(1.0, sourceConfidence + duplicateBoost + diversityBoost);
    }
    /**
     * Calculate comprehensive quality metrics
     */
    async calculateQualityMetrics(primary, allResults, context) {
        const contentQuality = this.assessContentQuality(primary);
        const sourceReliability = this.assessSourceReliability(primary);
        const recency = this.assessRecency(primary);
        const relevance = this.assessRelevance(primary, context);
        const uniqueness = this.assessUniqueness(primary, allResults);
        const overall = (contentQuality + sourceReliability + recency + relevance + uniqueness) / 5;
        return {
            contentQuality,
            sourceReliability,
            recency,
            relevance,
            uniqueness,
            overall
        };
    }
    /**
     * Assess content quality based on various factors
     */
    assessContentQuality(result) {
        let score = 0.5; // Base score
        // Content length (longer content generally better, up to a point)
        const contentLength = result.snippet?.length || 0;
        if (contentLength > 100)
            score += 0.1;
        if (contentLength > 300)
            score += 0.1;
        if (contentLength > 500)
            score += 0.1;
        // Presence of structured content indicators
        const content = result.snippet?.toLowerCase() || '';
        if (content.includes('definition') || content.includes('explanation'))
            score += 0.1;
        if (content.includes('example') || content.includes('tutorial'))
            score += 0.1;
        return Math.min(1.0, score);
    }
    /**
     * Assess source reliability based on domain and engine
     */
    assessSourceReliability(result) {
        let score = 0.5; // Base score
        try {
            const domain = new URL(result.url).hostname.toLowerCase();
            // High-quality domains
            const highQualityDomains = [
                'wikipedia.org', 'arxiv.org', 'pubmed.ncbi.nlm.nih.gov', 'scholar.google.com',
                'stackoverflow.com', 'github.com', 'mozilla.org', 'w3.org'
            ];
            if (highQualityDomains.some(d => domain.includes(d))) {
                score += 0.3;
            }
            // Academic domains
            if (domain.includes('.edu') || domain.includes('.gov')) {
                score += 0.2;
            }
            // Reliable engines
            const reliableEngines = ['arxiv', 'pubmed', 'google scholar', 'wikipedia'];
            if (reliableEngines.includes(result.source.toLowerCase())) {
                score += 0.2;
            }
        }
        catch {
            // Invalid URL, lower score
            score -= 0.1;
        }
        return Math.min(1.0, Math.max(0.0, score));
    }
    /**
     * Assess content recency
     */
    assessRecency(result) {
        const publishedDate = result.metadata?.publishedDate;
        if (!publishedDate)
            return 0.5; // Neutral score for unknown dates
        try {
            const date = new Date(publishedDate);
            const now = new Date();
            const ageInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
            // Score based on age (newer is better)
            if (ageInDays <= 30)
                return 1.0; // Very recent
            if (ageInDays <= 90)
                return 0.9; // Recent
            if (ageInDays <= 365)
                return 0.7; // This year
            if (ageInDays <= 365 * 2)
                return 0.5; // Last 2 years
            if (ageInDays <= 365 * 5)
                return 0.3; // Last 5 years
            return 0.1; // Older than 5 years
        }
        catch {
            return 0.5; // Invalid date format
        }
    }
    /**
     * Assess relevance to the topic
     */
    assessRelevance(result, context) {
        // Use the original relevance score as base
        let score = result.relevanceScore || 0.5;
        // Boost for topic-specific keywords in title
        const topic = context?.topic || '';
        if (topic && result.title.toLowerCase().includes(topic.toLowerCase())) {
            score += 0.1;
        }
        return Math.min(1.0, score);
    }
    /**
     * Assess content uniqueness
     */
    assessUniqueness(result, allResults) {
        // If this is the only result, it's unique
        if (allResults.length === 1)
            return 1.0;
        // Calculate average similarity with other results
        let totalSimilarity = 0;
        let comparisons = 0;
        for (const other of allResults) {
            if (other !== result) {
                totalSimilarity += this.calculateTextSimilarity(result.snippet || '', other.snippet || '');
                comparisons++;
            }
        }
        const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0;
        return Math.max(0.0, 1.0 - avgSimilarity); // Higher uniqueness = lower similarity
    }
    /**
     * Score and rank aggregated results
     */
    async scoreAndRankResults(results, context) {
        // Apply boost and penalty factors
        for (const result of results) {
            let adjustedScore = result.relevanceScore;
            // Apply boosts
            if (result.sources.length > 1) {
                adjustedScore += this.config.boostFactors.multipleAgents;
            }
            if (result.metadata.qualityMetrics.sourceReliability > 0.7) {
                adjustedScore += this.config.boostFactors.highQualitySources;
            }
            if (result.metadata.qualityMetrics.recency > 0.8) {
                adjustedScore += this.config.boostFactors.recentContent;
            }
            if (result.metadata.qualityMetrics.uniqueness > 0.7) {
                adjustedScore += this.config.boostFactors.uniqueContent;
            }
            // Apply penalties
            if (result.duplicateCount > 3) {
                adjustedScore -= this.config.penaltyFactors.duplicateContent;
            }
            if (result.metadata.qualityMetrics.sourceReliability < 0.3) {
                adjustedScore -= this.config.penaltyFactors.lowQualitySources;
            }
            if (result.metadata.qualityMetrics.recency < 0.2) {
                adjustedScore -= this.config.penaltyFactors.outdatedContent;
            }
            result.relevanceScore = Math.min(1.0, Math.max(0.0, adjustedScore));
        }
        // Sort by adjusted relevance score
        return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    /**
     * Apply filters and limits to results
     */
    applyFilters(results) {
        return results
            .filter(result => result.relevanceScore >= this.config.minRelevanceScore)
            .filter(result => result.confidenceScore >= this.config.minConfidenceScore)
            .slice(0, this.config.maxResults);
    }
    /**
     * Select the best title from multiple results
     */
    selectBestTitle(results) {
        // Prefer longer, more descriptive titles
        return results
            .sort((a, b) => (b.title?.length || 0) - (a.title?.length || 0))[0]?.title || 'Untitled';
    }
    /**
     * Select the best snippet from multiple results
     */
    selectBestSnippet(results) {
        // Prefer longer, more informative snippets
        return results
            .sort((a, b) => (b.snippet?.length || 0) - (a.snippet?.length || 0))[0]?.snippet || 'No description available';
    }
    /**
     * Select the most recent publication date
     */
    selectMostRecentDate(results) {
        const dates = results
            .map(r => r.metadata?.publishedDate)
            .filter(Boolean)
            .map(date => new Date(date))
            .sort((a, b) => b.getTime() - a.getTime());
        return dates[0]?.toISOString();
    }
    /**
     * Generate a unique ID for a result
     */
    generateResultId(result) {
        const hash = this.simpleHash(result.url + result.title);
        return `result_${hash}`;
    }
    /**
     * Simple hash function for generating IDs
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    /**
     * Generate aggregation summary
     */
    generateSummary(agentResults, aggregatedResults) {
        const totalOriginalResults = agentResults.reduce((sum, agent) => sum + (agent.results?.length || 0), 0);
        const successfulAgents = agentResults.filter(r => r.status === 'success').length;
        const failedAgents = agentResults.filter(r => r.status === 'error').length;
        const duplicatesRemoved = totalOriginalResults - aggregatedResults.length;
        const averageConfidence = aggregatedResults.length > 0
            ? aggregatedResults.reduce((sum, r) => sum + r.confidenceScore, 0) / aggregatedResults.length
            : 0;
        return {
            totalOriginalResults,
            totalAggregatedResults: aggregatedResults.length,
            duplicatesRemoved,
            successfulAgents,
            failedAgents,
            averageConfidence,
            averageQuality: aggregatedResults.length > 0
                ? aggregatedResults.reduce((sum, r) => sum + r.metadata.qualityMetrics.overall, 0) / aggregatedResults.length
                : 0,
            processingTime: Date.now() // This would be calculated properly in real implementation
        };
    }
    /**
     * Generate source attribution statistics
     */
    generateSourceAttribution(agentResults) {
        const attribution = {};
        for (const agentResult of agentResults) {
            if (agentResult.status === 'success') {
                attribution[agentResult.agent] = agentResult.results?.length || 0;
            }
        }
        return attribution;
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
// Export default instance
export const defaultContentAggregator = new ContentAggregator();
//# sourceMappingURL=aggregation.js.map