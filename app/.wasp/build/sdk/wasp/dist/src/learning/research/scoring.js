const DEFAULT_SCORING_CONFIG = {
    weights: {
        relevance: 0.20,
        confidence: 0.15,
        quality: 0.15,
        recency: 0.08,
        uniqueness: 0.08,
        sourceReliability: 0.12,
        engagement: 0.05,
        credibility: 0.10,
        authorityScore: 0.05,
        factualAccuracy: 0.02
    },
    contextBoosts: {
        userLevel: 0.15,
        learningStyle: 0.10,
        topicMatch: 0.20,
        contentType: 0.10,
        domainExpertise: 0.08,
        peerValidation: 0.07
    },
    penalties: {
        duplicateContent: 0.20,
        lowQuality: 0.25,
        outdated: 0.15,
        irrelevant: 0.30,
        suspiciousContent: 0.40,
        biasIndicators: 0.15
    },
    credibilityFactors: {
        domainWeights: {
            'edu': 1.2,
            'gov': 1.3,
            'org': 1.1,
            'com': 0.9,
            'arxiv.org': 1.4,
            'pubmed': 1.3,
            'scholar.google': 1.2,
            'wikipedia.org': 1.0,
            'stackoverflow.com': 1.1,
            'reddit.com': 0.7
        },
        sourceTypes: {
            'academic': 1.3,
            'governmental': 1.2,
            'educational': 1.2,
            'peer-reviewed': 1.4,
            'commercial': 0.8,
            'social': 0.6,
            'blog': 0.5,
            'forum': 0.6,
            'news': 0.9
        },
        authorityIndicators: [
            'peer-reviewed', 'published', 'journal', 'research', 'study',
            'university', 'professor', 'phd', 'dr.', 'institute',
            'official', 'government', 'verified', 'certified'
        ],
        qualityMarkers: [
            'references', 'bibliography', 'citations', 'doi',
            'methodology', 'data', 'evidence', 'analysis',
            'comprehensive', 'detailed', 'systematic', 'empirical'
        ],
        suspiciousPatterns: [
            'click here', 'buy now', 'limited time', 'secret',
            'guaranteed', '100%', 'miracle', 'breakthrough',
            'doctors hate', 'weird trick', 'shocking'
        ]
    }
};
// Advanced scoring and ranking system
export class ResultScorer {
    config;
    constructor(config) {
        this.config = this.mergeConfig(DEFAULT_SCORING_CONFIG, config);
    }
    /**
     * Score and rank aggregated results
     */
    async scoreAndRankResults(results, context) {
        // Step 1: Calculate base scores for all results
        const scoredResults = await Promise.all(results.map(result => this.calculateScore(result, context)));
        // Step 2: Apply relative ranking adjustments
        const adjustedResults = this.applyRelativeAdjustments(scoredResults, context);
        // Step 3: Sort by final score
        adjustedResults.sort((a, b) => b.finalScore - a.finalScore);
        // Step 4: Assign rankings and tiers
        return this.assignRankingsAndTiers(adjustedResults);
    }
    /**
     * Calculate comprehensive score for a single result
     */
    async calculateScore(result, context) {
        // Calculate base score using weighted metrics
        const baseScore = this.calculateBaseScore(result);
        // Calculate context-specific boosts
        const contextBoosts = this.calculateContextBoosts(result, context);
        // Calculate penalties
        const penalties = this.calculatePenalties(result, context);
        // Calculate final score
        const finalScore = Math.max(0, Math.min(1, baseScore + contextBoosts - penalties));
        // Create score breakdown for transparency
        const scoreBreakdown = {
            baseScore,
            contextBoosts,
            penalties,
            adjustments: {
                relevanceBoost: this.calculateRelevanceBoost(result, context),
                qualityBoost: this.calculateQualityBoost(result),
                recencyBoost: this.calculateRecencyBoost(result, context),
                sourceBoost: this.calculateSourceBoost(result),
                userLevelMatch: this.calculateUserLevelMatch(result, context),
                contentTypeMatch: this.calculateContentTypeMatch(result, context)
            }
        };
        return {
            ...result,
            finalScore,
            scoreBreakdown,
            ranking: 0, // Will be set later
            tier: 'fair' // Will be set later
        };
    }
    /**
     * Calculate base score using weighted metrics
     */
    calculateBaseScore(result) {
        const metrics = result.metadata.qualityMetrics;
        const weights = this.config.weights;
        return (result.relevanceScore * weights.relevance +
            result.confidenceScore * weights.confidence +
            metrics.overall * weights.quality +
            metrics.recency * weights.recency +
            metrics.uniqueness * weights.uniqueness +
            metrics.sourceReliability * weights.sourceReliability +
            this.calculateEngagementScore(result) * weights.engagement +
            this.calculateCredibilityScore(result) * weights.credibility +
            this.calculateAuthorityScore(result) * weights.authorityScore +
            this.calculateFactualAccuracyScore(result) * weights.factualAccuracy);
    }
    /**
     * Calculate context-specific boosts
     */
    calculateContextBoosts(result, context) {
        let totalBoost = 0;
        // User level matching boost
        totalBoost += this.calculateUserLevelMatch(result, context) * this.config.contextBoosts.userLevel;
        // Learning style matching boost
        totalBoost += this.calculateLearningStyleMatch(result, context) * this.config.contextBoosts.learningStyle;
        // Topic matching boost
        totalBoost += this.calculateTopicMatch(result, context) * this.config.contextBoosts.topicMatch;
        // Content type preference boost
        totalBoost += this.calculateContentTypeMatch(result, context) * this.config.contextBoosts.contentType;
        return totalBoost;
    }
    /**
     * Calculate penalties for various factors
     */
    calculatePenalties(result, context) {
        let totalPenalty = 0;
        // Duplicate content penalty
        if (result.duplicateCount > 2) {
            totalPenalty += this.config.penalties.duplicateContent * (result.duplicateCount / 10);
        }
        // Low quality penalty
        if (result.metadata.qualityMetrics.overall < 0.4) {
            totalPenalty += this.config.penalties.lowQuality;
        }
        // Outdated content penalty
        if (context.timePreference === 'recent' && result.metadata.qualityMetrics.recency < 0.3) {
            totalPenalty += this.config.penalties.outdated;
        }
        // Irrelevant content penalty
        if (this.isIrrelevant(result, context)) {
            totalPenalty += this.config.penalties.irrelevant;
        }
        return totalPenalty;
    }
    /**
     * Calculate engagement score (for community content)
     */
    calculateEngagementScore(result) {
        // Look for engagement indicators in metadata
        const attribution = result.metadata.sourceAttribution;
        let engagementScore = 0.5; // Base score
        for (const source of attribution) {
            if (source.metadata?.upvotes) {
                engagementScore += Math.min(0.3, source.metadata.upvotes / 1000);
            }
            if (source.metadata?.comments) {
                engagementScore += Math.min(0.2, source.metadata.comments / 100);
            }
            if (source.metadata?.views) {
                const views = this.parseViewCount(source.metadata.views);
                engagementScore += Math.min(0.2, views / 100000);
            }
        }
        return Math.min(1.0, engagementScore);
    }
    /**
     * Calculate user level matching score
     */
    calculateUserLevelMatch(result, context) {
        if (!context.userLevel)
            return 0.5;
        const content = (result.title + ' ' + result.snippet).toLowerCase();
        const userLevel = context.userLevel;
        // Check for level indicators in content
        const levelIndicators = {
            beginner: ['beginner', 'basic', 'introduction', 'getting started', '101', 'fundamentals'],
            intermediate: ['intermediate', 'guide', 'tutorial', 'overview', 'practical'],
            advanced: ['advanced', 'expert', 'deep dive', 'comprehensive', 'detailed', 'professional']
        };
        const indicators = levelIndicators[userLevel] || [];
        const matchCount = indicators.filter(indicator => content.includes(indicator)).length;
        // Base score for appropriate level
        let score = 0.5;
        // Boost for level-appropriate content
        if (matchCount > 0) {
            score += Math.min(0.5, matchCount * 0.1);
        }
        // Penalty for inappropriate level
        const inappropriateIndicators = Object.entries(levelIndicators)
            .filter(([level]) => level !== userLevel)
            .flatMap(([, indicators]) => indicators);
        const inappropriateCount = inappropriateIndicators.filter(indicator => content.includes(indicator)).length;
        if (inappropriateCount > matchCount) {
            score -= 0.2;
        }
        return Math.max(0, Math.min(1, score));
    }
    /**
     * Calculate learning style matching score
     */
    calculateLearningStyleMatch(result, context) {
        if (!context.learningStyle)
            return 0.5;
        const learningStyle = context.learningStyle;
        let score = 0.5;
        // Check content types in sources
        const hasVideo = result.metadata.type.includes('video') || result.sources.includes('Video Learning Agent');
        const hasVisual = result.metadata.sourceAttribution.some(s => s.metadata?.thumbnail);
        const hasInteractive = result.metadata.type.includes('computational') || result.sources.includes('Computational Agent');
        const hasText = result.metadata.type.includes('academic') || result.metadata.type.includes('general');
        const hasCommunity = result.metadata.type.includes('community') || result.sources.includes('Community Discussion Agent');
        switch (learningStyle) {
            case 'visual':
                if (hasVideo || hasVisual)
                    score += 0.3;
                break;
            case 'video':
                if (hasVideo)
                    score += 0.4;
                break;
            case 'interactive':
                if (hasInteractive)
                    score += 0.3;
                break;
            case 'textual':
                if (hasText)
                    score += 0.3;
                break;
            case 'conversational':
                if (hasCommunity)
                    score += 0.3;
                break;
        }
        return Math.min(1, score);
    }
    /**
     * Calculate topic matching score
     */
    calculateTopicMatch(result, context) {
        const topic = context.topic.toLowerCase();
        const title = result.title.toLowerCase();
        const snippet = result.snippet.toLowerCase();
        let score = 0;
        // Exact topic match in title
        if (title.includes(topic)) {
            score += 0.5;
        }
        // Topic keywords in title
        const topicWords = topic.split(/\s+/).filter(word => word.length > 2);
        const titleMatches = topicWords.filter(word => title.includes(word)).length;
        score += (titleMatches / topicWords.length) * 0.3;
        // Topic keywords in snippet
        const snippetMatches = topicWords.filter(word => snippet.includes(word)).length;
        score += (snippetMatches / topicWords.length) * 0.2;
        // Additional keywords boost
        if (context.keywords) {
            const keywordMatches = context.keywords.filter(keyword => title.includes(keyword.toLowerCase()) || snippet.includes(keyword.toLowerCase())).length;
            score += (keywordMatches / context.keywords.length) * 0.2;
        }
        // Exclude keywords penalty
        if (context.excludeKeywords) {
            const excludeMatches = context.excludeKeywords.filter(keyword => title.includes(keyword.toLowerCase()) || snippet.includes(keyword.toLowerCase())).length;
            score -= excludeMatches * 0.1;
        }
        return Math.max(0, Math.min(1, score));
    }
    /**
     * Calculate content type matching score
     */
    calculateContentTypeMatch(result, context) {
        if (!context.preferredContentTypes || context.preferredContentTypes.length === 0) {
            return 0.5;
        }
        const resultTypes = result.metadata.type;
        const preferredTypes = context.preferredContentTypes;
        const matches = resultTypes.filter(type => preferredTypes.some(preferred => type.toLowerCase().includes(preferred.toLowerCase()))).length;
        return matches / Math.max(preferredTypes.length, 1);
    }
    /**
     * Calculate relevance boost
     */
    calculateRelevanceBoost(result, context) {
        // Additional relevance boost based on multiple factors
        let boost = 0;
        // Multiple agent confirmation boost
        if (result.sources.length > 2) {
            boost += 0.1;
        }
        // High confidence boost
        if (result.confidenceScore > 0.8) {
            boost += 0.05;
        }
        return boost;
    }
    /**
     * Calculate quality boost
     */
    calculateQualityBoost(result) {
        const quality = result.metadata.qualityMetrics.overall;
        if (quality > 0.9)
            return 0.1;
        if (quality > 0.8)
            return 0.05;
        if (quality > 0.7)
            return 0.02;
        return 0;
    }
    /**
     * Calculate recency boost
     */
    calculateRecencyBoost(result, context) {
        if (context.timePreference !== 'recent')
            return 0;
        const recency = result.metadata.qualityMetrics.recency;
        if (recency > 0.9)
            return 0.1;
        if (recency > 0.7)
            return 0.05;
        return 0;
    }
    /**
     * Calculate source boost
     */
    calculateSourceBoost(result) {
        const reliability = result.metadata.qualityMetrics.sourceReliability;
        if (reliability > 0.9)
            return 0.1;
        if (reliability > 0.8)
            return 0.05;
        return 0;
    }
    /**
     * Check if result is irrelevant
     */
    isIrrelevant(result, context) {
        // Check for exclude keywords
        if (context.excludeKeywords) {
            const content = (result.title + ' ' + result.snippet).toLowerCase();
            return context.excludeKeywords.some(keyword => content.includes(keyword.toLowerCase()));
        }
        // Check quality threshold
        if (context.qualityThreshold && result.metadata.qualityMetrics.overall < context.qualityThreshold) {
            return true;
        }
        return false;
    }
    /**
     * Apply relative adjustments based on result set
     */
    applyRelativeAdjustments(results, context) {
        if (results.length === 0)
            return results;
        // Calculate diversity bonus
        const diversityBonus = this.calculateDiversityBonus(results);
        // Apply diversity adjustments
        for (let i = 0; i < results.length; i++) {
            results[i].finalScore += diversityBonus[i];
            results[i].scoreBreakdown.adjustments.diversityBonus = diversityBonus[i];
        }
        return results;
    }
    /**
     * Calculate diversity bonus to promote varied results
     */
    calculateDiversityBonus(results) {
        const bonuses = new Array(results.length).fill(0);
        // Track seen domains and content types
        const seenDomains = new Set();
        const seenTypes = new Set();
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            try {
                const domain = new URL(result.url).hostname;
                const types = result.metadata.type;
                // Bonus for new domain
                if (!seenDomains.has(domain)) {
                    bonuses[i] += 0.02;
                    seenDomains.add(domain);
                }
                // Bonus for new content type
                for (const type of types) {
                    if (!seenTypes.has(type)) {
                        bonuses[i] += 0.01;
                        seenTypes.add(type);
                    }
                }
            }
            catch {
                // Invalid URL, skip domain bonus
            }
        }
        return bonuses;
    }
    /**
     * Assign rankings and quality tiers
     */
    assignRankingsAndTiers(results) {
        for (let i = 0; i < results.length; i++) {
            results[i].ranking = i + 1;
            results[i].tier = this.determineTier(results[i].finalScore);
        }
        return results;
    }
    /**
     * Determine quality tier based on final score
     */
    determineTier(score) {
        if (score >= 0.8)
            return 'excellent';
        if (score >= 0.6)
            return 'good';
        if (score >= 0.4)
            return 'fair';
        return 'poor';
    }
    /**
     * Parse view count string to number
     */
    parseViewCount(viewStr) {
        if (!viewStr)
            return 0;
        const str = viewStr.toLowerCase().replace(/[,\s]/g, '');
        const match = str.match(/(\d+(?:\.\d+)?)(k|m|b)?/);
        if (!match)
            return 0;
        const num = parseFloat(match[1]);
        const suffix = match[2];
        switch (suffix) {
            case 'k': return num * 1000;
            case 'm': return num * 1000000;
            case 'b': return num * 1000000000;
            default: return num;
        }
    }
    /**
     * Merge configuration objects
     */
    mergeConfig(base, override) {
        if (!override)
            return base;
        return {
            weights: { ...base.weights, ...override.weights },
            contextBoosts: { ...base.contextBoosts, ...override.contextBoosts },
            penalties: { ...base.penalties, ...override.penalties },
            credibilityFactors: { ...base.credibilityFactors, ...override.credibilityFactors }
        };
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = this.mergeConfig(this.config, newConfig);
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return JSON.parse(JSON.stringify(this.config));
    }
    /**
     * Calculate credibility score based on source and content analysis
     */
    calculateCredibilityScore(result) {
        let credibilityScore = 0.5; // Base credibility
        // Domain-based credibility
        try {
            const url = new URL(result.url);
            const domain = url.hostname.toLowerCase();
            // Check for specific domain weights
            const domainScore = this.getDomainCredibilityScore(domain);
            credibilityScore += domainScore * 0.4;
            // Educational or government domains get additional boost
            if (domain.endsWith('.edu') || domain.endsWith('.gov')) {
                credibilityScore += 0.1;
            }
        }
        catch (error) {
            // Invalid URL, reduce credibility
            credibilityScore -= 0.1;
        }
        // Source type credibility
        const sourceTypeScore = this.getSourceTypeCredibility(result);
        credibilityScore += sourceTypeScore * 0.3;
        // Content-based credibility indicators
        const contentCredibility = this.analyzeContentCredibility(result);
        credibilityScore += contentCredibility * 0.2;
        // Authority indicators
        const authorityBonus = this.detectAuthorityIndicators(result);
        credibilityScore += authorityBonus * 0.1;
        return Math.max(0, Math.min(1, credibilityScore));
    }
    /**
     * Calculate authority score based on author and institutional indicators
     */
    calculateAuthorityScore(result) {
        let authorityScore = 0.3; // Base authority
        const content = `${result.title} ${result.snippet}`.toLowerCase();
        const metadata = result.metadata;
        // Check for authority indicators
        const authorityIndicators = this.config.credibilityFactors.authorityIndicators;
        const foundIndicators = authorityIndicators.filter(indicator => content.includes(indicator.toLowerCase()));
        authorityScore += Math.min(0.4, foundIndicators.length * 0.08);
        // Check for academic affiliation
        if (metadata.sourceAttribution.some(source => source.metadata?.venue?.toLowerCase().includes('university') ||
            source.metadata?.venue?.toLowerCase().includes('institute') ||
            source.metadata?.author?.toLowerCase().includes('prof') ||
            source.metadata?.author?.toLowerCase().includes('dr.'))) {
            authorityScore += 0.2;
        }
        // Peer validation (citations, references)
        if (metadata.sourceAttribution.some(source => source.metadata?.citations && parseInt(source.metadata.citations) > 10)) {
            authorityScore += 0.1;
        }
        return Math.max(0, Math.min(1, authorityScore));
    }
    /**
     * Calculate factual accuracy score based on content analysis
     */
    calculateFactualAccuracyScore(result) {
        let accuracyScore = 0.5; // Neutral starting point
        const content = `${result.title} ${result.snippet}`.toLowerCase();
        // Check for quality markers
        const qualityMarkers = this.config.credibilityFactors.qualityMarkers;
        const foundMarkers = qualityMarkers.filter(marker => content.includes(marker.toLowerCase()));
        accuracyScore += Math.min(0.3, foundMarkers.length * 0.05);
        // Check for suspicious patterns
        const suspiciousPatterns = this.config.credibilityFactors.suspiciousPatterns;
        const foundSuspicious = suspiciousPatterns.filter(pattern => content.includes(pattern.toLowerCase()));
        accuracyScore -= foundSuspicious.length * 0.1;
        // Bonus for multiple source confirmation
        if (result.sources.length > 2) {
            accuracyScore += 0.1;
        }
        // Academic sources get accuracy bonus
        if (result.sources.includes('Academic Research Agent')) {
            accuracyScore += 0.1;
        }
        return Math.max(0, Math.min(1, accuracyScore));
    }
    /**
     * Get domain-specific credibility score
     */
    getDomainCredibilityScore(domain) {
        const domainWeights = this.config.credibilityFactors.domainWeights;
        // Check for exact domain match
        if (domainWeights[domain]) {
            return (domainWeights[domain] - 1.0) * 0.5; // Convert multiplier to score adjustment
        }
        // Check for domain ending patterns
        const tld = domain.split('.').pop() || '';
        if (domainWeights[tld]) {
            return (domainWeights[tld] - 1.0) * 0.3;
        }
        // Check for subdomain patterns
        for (const [pattern, weight] of Object.entries(domainWeights)) {
            if (domain.includes(pattern)) {
                return (weight - 1.0) * 0.4;
            }
        }
        return 0; // No specific credibility information
    }
    /**
     * Get source type credibility
     */
    getSourceTypeCredibility(result) {
        const sourceTypes = this.config.credibilityFactors.sourceTypes;
        let maxCredibility = 0;
        // Check metadata for source type indicators
        const types = result.metadata.type;
        for (const type of types) {
            for (const [sourceType, weight] of Object.entries(sourceTypes)) {
                if (type.toLowerCase().includes(sourceType)) {
                    maxCredibility = Math.max(maxCredibility, (weight - 1.0) * 0.5);
                }
            }
        }
        return maxCredibility;
    }
    /**
     * Analyze content for credibility indicators
     */
    analyzeContentCredibility(result) {
        let credibilityScore = 0;
        const content = `${result.title} ${result.snippet}`.toLowerCase();
        // Check for fact-checking indicators
        const factCheckingTerms = [
            'according to', 'research shows', 'study found',
            'data indicates', 'evidence suggests', 'research by'
        ];
        const foundFactChecking = factCheckingTerms.filter(term => content.includes(term));
        credibilityScore += Math.min(0.3, foundFactChecking.length * 0.1);
        // Check for objectivity indicators
        const objectiveTerms = [
            'research', 'study', 'analysis', 'data', 'findings',
            'results', 'evidence', 'methodology', 'conclusion'
        ];
        const foundObjective = objectiveTerms.filter(term => content.includes(term));
        credibilityScore += Math.min(0.2, foundObjective.length * 0.03);
        // Penalize overly promotional language
        const promotionalTerms = [
            'best', 'amazing', 'incredible', 'revolutionary',
            'breakthrough', 'ultimate', 'perfect', 'guaranteed'
        ];
        const foundPromotional = promotionalTerms.filter(term => content.includes(term));
        credibilityScore -= foundPromotional.length * 0.05;
        return credibilityScore;
    }
    /**
     * Detect authority indicators in content
     */
    detectAuthorityIndicators(result) {
        const content = `${result.title} ${result.snippet}`.toLowerCase();
        const authorityIndicators = this.config.credibilityFactors.authorityIndicators;
        const foundIndicators = authorityIndicators.filter(indicator => content.includes(indicator.toLowerCase()));
        return Math.min(0.3, foundIndicators.length * 0.05);
    }
    /**
     * Enhanced context boost calculation with new factors
     */
    calculateEnhancedContextBoosts(result, context) {
        let totalBoost = this.calculateContextBoosts(result, context);
        // Domain expertise boost
        if (this.hasDomainExpertise(result, context.topic)) {
            totalBoost += this.config.contextBoosts.domainExpertise;
        }
        // Peer validation boost
        if (this.hasPeerValidation(result)) {
            totalBoost += this.config.contextBoosts.peerValidation;
        }
        return totalBoost;
    }
    /**
     * Check if result demonstrates domain expertise
     */
    hasDomainExpertise(result, topic) {
        const content = `${result.title} ${result.snippet}`.toLowerCase();
        const topicWords = topic.toLowerCase().split(/\s+/);
        // Check for technical depth
        const technicalTermCount = this.countTechnicalTerms(content, topicWords);
        // Check for academic or professional indicators
        const professionalIndicators = [
            'research', 'analysis', 'methodology', 'framework',
            'systematic', 'comprehensive', 'empirical', 'theoretical'
        ];
        const professionalCount = professionalIndicators.filter(term => content.includes(term)).length;
        return technicalTermCount > 2 || professionalCount > 1;
    }
    /**
     * Check if result has peer validation
     */
    hasPeerValidation(result) {
        // Check for citations, reviews, or validation indicators
        return result.metadata.sourceAttribution.some(source => (source.metadata?.citations && parseInt(source.metadata.citations) > 0) ||
            (source.metadata?.upvotes && parseInt(source.metadata.upvotes) > 10) ||
            source.metadata?.venue?.toLowerCase().includes('peer'));
    }
    /**
     * Count technical terms relevant to the topic
     */
    countTechnicalTerms(content, topicWords) {
        // This is a simplified implementation
        // In a real system, this would use domain-specific dictionaries
        const technicalSuffixes = ['-tion', '-ism', '-ogy', '-ics', '-ment', '-ance'];
        const words = content.split(/\s+/);
        return words.filter(word => word.length > 6 &&
            technicalSuffixes.some(suffix => word.endsWith(suffix)) &&
            topicWords.some(topicWord => word.includes(topicWord) || topicWord.includes(word))).length;
    }
    /**
     * Enhanced penalty calculation with new factors
     */
    calculateEnhancedPenalties(result, context) {
        let totalPenalty = this.calculatePenalties(result, context);
        // Suspicious content penalty
        if (this.hasSuspiciousContent(result)) {
            totalPenalty += this.config.penalties.suspiciousContent;
        }
        // Bias indicators penalty
        const biasScore = this.detectBiasIndicators(result);
        totalPenalty += biasScore * this.config.penalties.biasIndicators;
        return totalPenalty;
    }
    /**
     * Detect suspicious content patterns
     */
    hasSuspiciousContent(result) {
        const content = `${result.title} ${result.snippet}`.toLowerCase();
        const suspiciousPatterns = this.config.credibilityFactors.suspiciousPatterns;
        return suspiciousPatterns.some(pattern => content.includes(pattern.toLowerCase()));
    }
    /**
     * Detect bias indicators in content
     */
    detectBiasIndicators(result) {
        const content = `${result.title} ${result.snippet}`.toLowerCase();
        let biasScore = 0;
        // Emotional language indicators
        const emotionalWords = [
            'terrible', 'horrible', 'amazing', 'incredible',
            'shocking', 'unbelievable', 'outrageous', 'disgusting'
        ];
        biasScore += emotionalWords.filter(word => content.includes(word)).length * 0.1;
        // Absolute statements
        const absoluteWords = [
            'always', 'never', 'all', 'none', 'every', 'completely',
            'totally', 'absolutely', 'definitely', 'certainly'
        ];
        biasScore += absoluteWords.filter(word => content.includes(word)).length * 0.05;
        // Opinion markers without evidence
        const opinionMarkers = ['i think', 'i believe', 'in my opinion', 'clearly', 'obviously'];
        biasScore += opinionMarkers.filter(marker => content.includes(marker)).length * 0.1;
        return Math.min(1, biasScore);
    }
}
// Export default instance
export const defaultResultScorer = new ResultScorer();
//# sourceMappingURL=scoring.js.map