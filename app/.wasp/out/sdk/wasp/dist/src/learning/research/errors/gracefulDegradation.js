/**
 * Graceful degradation strategies for research agents
 */
export class GracefulDegradation {
    strategies = [
        {
            name: 'cached_fallback',
            priority: 1,
            execute: this.useCachedResults.bind(this)
        },
        {
            name: 'simplified_search',
            priority: 2,
            execute: this.useSimplifiedSearch.bind(this)
        },
        {
            name: 'default_content',
            priority: 3,
            execute: this.useDefaultContent.bind(this)
        }
    ];
    async handleAgentFailure(agentName, topic, context, error) {
        console.log(`Attempting graceful degradation for ${agentName}: ${error}`);
        for (const strategy of this.strategies.sort((a, b) => a.priority - b.priority)) {
            try {
                const result = await strategy.execute(agentName, topic, context, error);
                if (result) {
                    console.log(`Graceful degradation successful using ${strategy.name} for ${agentName}`);
                    return result;
                }
            }
            catch (strategyError) {
                console.warn(`Degradation strategy ${strategy.name} failed for ${agentName}:`, strategyError);
            }
        }
        console.error(`All degradation strategies failed for ${agentName}`);
        return null;
    }
    async useCachedResults(agentName, topic, context) {
        // In a real implementation, this would check cache for similar topics
        // For now, return null to indicate no cached results available
        return null;
    }
    async useSimplifiedSearch(agentName, topic, context) {
        // Create a minimal result with basic information
        return {
            agent: agentName,
            topic,
            results: [
                {
                    title: `Basic information about ${topic}`,
                    url: '#',
                    snippet: `This is basic information about ${topic}. More detailed results may be available when the ${agentName} is functioning normally.`,
                    source: 'fallback',
                    relevanceScore: 0.3
                }
            ],
            summary: `Basic overview of ${topic} from ${agentName} fallback`,
            subtopics: [topic.split(' ').slice(0, 3).join(' ')], // Simple subtopic extraction
            status: 'partial',
            timestamp: new Date()
        };
    }
    async useDefaultContent(agentName, topic, context) {
        // Return minimal default content as last resort
        return {
            agent: agentName,
            topic,
            results: [
                {
                    title: `Information about ${topic}`,
                    url: '#',
                    snippet: `${topic} is an important subject that requires further research. Please try again later for more detailed information.`,
                    source: 'default',
                    relevanceScore: 0.1
                }
            ],
            summary: `Default information about ${topic}`,
            subtopics: [],
            status: 'partial',
            timestamp: new Date()
        };
    }
    addStrategy(strategy) {
        this.strategies.push(strategy);
        this.strategies.sort((a, b) => a.priority - b.priority);
    }
    getStrategies() {
        return [...this.strategies];
    }
}
// Export singleton instance
export const gracefulDegradation = new GracefulDegradation();
//# sourceMappingURL=gracefulDegradation.js.map