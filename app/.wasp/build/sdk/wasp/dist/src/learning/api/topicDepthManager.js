import { prisma } from "wasp/server";
import { researchAndGenerate } from "./iterativeResearch";
// Utility functions for serialization
export function makeDepthExpansionSerializable(result) {
    return {
        ...result,
        researchResults: Object.fromEntries(result.researchResults)
    };
}
export function makeDepthExpansionFromSerializable(serialized) {
    return {
        ...serialized,
        researchResults: new Map(Object.entries(serialized.researchResults))
    };
}
/**
 * Topic Depth Management System
 * Handles multi-level topic exploration and hierarchical research
 */
export class TopicDepthManager {
    MAX_EXPANSION_DEPTH = 5;
    BATCH_SIZE = 3;
    /**
     * Expand a topic to a specific depth level
     */
    async expandToDepth(request) {
        const startTime = Date.now();
        console.log(`🌳 Expanding topic ${request.topicId} to depth ${request.targetDepth}`);
        if (request.targetDepth > this.MAX_EXPANSION_DEPTH) {
            throw new Error(`Maximum expansion depth is ${this.MAX_EXPANSION_DEPTH}`);
        }
        try {
            // Get the root topic
            const rootTopic = await prisma.topic.findUnique({
                where: { id: request.topicId },
                include: { children: { include: { children: true } } }
            });
            if (!rootTopic) {
                throw new Error(`Topic with ID ${request.topicId} not found`);
            }
            // Build current hierarchy
            let hierarchy = await this.buildTopicHierarchy(rootTopic.id);
            // Track new topics and research results
            const researchResults = new Map();
            let newTopicsCreated = 0;
            // Expand recursively to target depth
            const { updatedHierarchy, newTopics, results } = await this.expandHierarchyToDepth(hierarchy, request.targetDepth, request.userContext, request.forceRefresh || false);
            newTopicsCreated = newTopics;
            for (const [key, value] of results.entries()) {
                researchResults.set(key, value);
            }
            const totalProcessingTime = Date.now() - startTime;
            console.log(`✅ Topic expansion completed: ${newTopicsCreated} new topics, ${totalProcessingTime}ms`);
            return {
                expandedHierarchy: updatedHierarchy,
                newTopicsCreated,
                totalProcessingTime,
                researchResults
            };
        }
        catch (error) {
            console.error(`❌ Topic expansion failed:`, error);
            throw error;
        }
    }
    /**
     * Generate subtopics for a specific topic
     */
    async generateSubtopics(topicId, userContext, forceRefresh = false) {
        console.log(`🔬 Generating subtopics for topic ${topicId}`);
        try {
            const topic = await prisma.topic.findUnique({ where: { id: topicId } });
            if (!topic) {
                throw new Error(`Topic ${topicId} not found`);
            }
            // Check if we already have subtopics and they're fresh (unless forcing refresh)
            if (!forceRefresh) {
                const existingSubtopics = await prisma.topic.findMany({
                    where: { parentId: topicId },
                    orderBy: { createdAt: 'asc' }
                });
                if (existingSubtopics.length > 0) {
                    // Convert existing topics to SubtopicInfo format
                    const subtopics = existingSubtopics.map((subtopic, index) => ({
                        title: subtopic.title,
                        description: subtopic.summary || "Explore this subtopic",
                        priority: index + 1,
                        complexity: this.inferComplexity(subtopic.depth, subtopic.title),
                        estimatedReadTime: 8
                    }));
                    console.log(`📚 Using existing ${subtopics.length} subtopics`);
                    return { subtopics };
                }
            }
            // Generate new subtopics using research
            const options = {
                maxDepth: topic.depth + 2, // Only go 2 levels deep for subtopic generation
                forceRefresh,
                userContext
            };
            const researchResult = await researchAndGenerate(topic.title, options);
            // Extract subtopics from main research result
            const subtopics = researchResult.mainTopic.subtopics;
            // Create database entries for new subtopics
            const createdSubtopics = await this.createSubtopicsInDatabase(topicId, subtopics, topic.depth + 1);
            console.log(`✅ Generated ${subtopics.length} subtopics for "${topic.title}"`);
            return {
                subtopics,
                researchResult
            };
        }
        catch (error) {
            console.error(`❌ Failed to generate subtopics for topic ${topicId}:`, error);
            throw error;
        }
    }
    /**
     * Get topic hierarchy with depth information
     */
    async getTopicHierarchy(topicId, maxDepth) {
        return await this.buildTopicHierarchy(topicId, 0, maxDepth);
    }
    /**
     * Check if a topic needs research update based on cache TTL
     */
    async needsResearchUpdate(topicId, cacheTtlDays = 7) {
        try {
            const topic = await prisma.topic.findUnique({
                where: { id: topicId },
                include: { generatedContent: true }
            });
            if (!topic || topic.generatedContent.length === 0) {
                return true; // No content exists, needs research
            }
            // Check if content is older than cache TTL
            const latestContent = topic.generatedContent.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
            const ageMs = Date.now() - latestContent.createdAt.getTime();
            const maxAgeMs = cacheTtlDays * 24 * 60 * 60 * 1000;
            return ageMs > maxAgeMs;
        }
        catch (error) {
            console.error(`Error checking research update need for topic ${topicId}:`, error);
            return true; // Error case, assume update needed
        }
    }
    /**
     * Get research statistics for a topic hierarchy
     */
    async getResearchStats(topicId) {
        try {
            const hierarchy = await this.buildTopicHierarchy(topicId);
            const flatTopics = this.flattenHierarchy(hierarchy);
            const totalTopics = flatTopics.length;
            const researchedTopics = flatTopics.filter(t => t.researchStatus === 'completed').length;
            const pendingTopics = flatTopics.filter(t => t.researchStatus === 'pending').length;
            const averageDepth = flatTopics.reduce((sum, t) => sum + t.depth, 0) / totalTopics;
            const researchDates = flatTopics
                .filter(t => t.lastResearched)
                .map(t => t.lastResearched)
                .sort((a, b) => b.getTime() - a.getTime());
            const lastResearchDate = researchDates[0];
            return {
                totalTopics,
                researchedTopics,
                pendingTopics,
                averageDepth,
                lastResearchDate
            };
        }
        catch (error) {
            console.error(`Error getting research stats for topic ${topicId}:`, error);
            return {
                totalTopics: 0,
                researchedTopics: 0,
                pendingTopics: 0,
                averageDepth: 0
            };
        }
    }
    // Private methods
    async expandHierarchyToDepth(hierarchy, targetDepth, userContext, forceRefresh = false) {
        const results = new Map();
        let newTopics = 0;
        // Expand current level if needed
        if (hierarchy.depth < targetDepth && !hierarchy.subtopicsGenerated) {
            const subtopicResult = await this.generateSubtopics(hierarchy.id, userContext, forceRefresh);
            if (subtopicResult.researchResult) {
                results.set(hierarchy.id, subtopicResult.researchResult);
            }
            // Update hierarchy with new children
            hierarchy.subtopicsGenerated = true;
            hierarchy.children = await this.buildChildrenHierarchy(hierarchy.id);
            newTopics += hierarchy.children.length;
        }
        // Recursively expand children
        for (let i = 0; i < hierarchy.children.length; i++) {
            const child = hierarchy.children[i];
            if (child.depth < targetDepth) {
                const childResult = await this.expandHierarchyToDepth(child, targetDepth, userContext, forceRefresh);
                hierarchy.children[i] = childResult.updatedHierarchy;
                newTopics += childResult.newTopics;
                for (const [key, value] of childResult.results.entries()) {
                    results.set(key, value);
                }
            }
        }
        return {
            updatedHierarchy: hierarchy,
            newTopics,
            results
        };
    }
    async buildTopicHierarchy(topicId, currentDepth = 0, maxDepth) {
        if (maxDepth !== undefined && currentDepth > maxDepth) {
            throw new Error("Maximum depth exceeded in hierarchy building");
        }
        const topic = await prisma.topic.findUnique({
            where: { id: topicId },
            include: {
                children: {
                    orderBy: { createdAt: 'asc' }
                },
                generatedContent: true
            }
        });
        if (!topic) {
            throw new Error(`Topic ${topicId} not found`);
        }
        // Determine research status
        const researchStatus = this.determineResearchStatus(topic);
        const lastResearched = topic.generatedContent.length > 0
            ? topic.generatedContent.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
            : undefined;
        // Build children hierarchy
        const children = [];
        if (!maxDepth || currentDepth < maxDepth) {
            for (const child of topic.children) {
                const childHierarchy = await this.buildTopicHierarchy(child.id, currentDepth + 1, maxDepth);
                children.push(childHierarchy);
            }
        }
        return {
            id: topic.id,
            slug: topic.slug,
            title: topic.title,
            summary: topic.summary || undefined,
            depth: topic.depth,
            parentId: topic.parentId || undefined,
            children,
            researchStatus,
            lastResearched,
            subtopicsGenerated: topic.children.length > 0,
            metadata: topic.metadata ? {
                estimatedReadTime: topic.metadata.estimatedReadTime,
                complexity: topic.metadata.complexity,
                priority: topic.metadata.priority
            } : undefined
        };
    }
    async buildChildrenHierarchy(parentId) {
        const children = await prisma.topic.findMany({
            where: { parentId },
            orderBy: { createdAt: 'asc' }
        });
        const hierarchies = [];
        for (const child of children) {
            const hierarchy = await this.buildTopicHierarchy(child.id);
            hierarchies.push(hierarchy);
        }
        return hierarchies;
    }
    async createSubtopicsInDatabase(parentId, subtopics, depth) {
        const createdTopics = [];
        for (const subtopic of subtopics) {
            const baseSlug = this.generateSlug(subtopic.title);
            // Check if subtopic already exists with this exact relationship
            const existing = await prisma.topic.findFirst({
                where: {
                    slug: baseSlug,
                    parentId
                }
            });
            if (!existing) {
                // Get parent topic to generate unique slug
                const parentTopic = await prisma.topic.findUnique({
                    where: { id: parentId },
                    select: { slug: true }
                });
                const uniqueSlug = await this.generateUniqueSlug(baseSlug, parentTopic?.slug || 'unknown');
                const topic = await prisma.topic.create({
                    data: {
                        slug: uniqueSlug,
                        title: subtopic.title,
                        summary: subtopic.description,
                        depth,
                        parentId,
                        status: 'PENDING',
                        metadata: {
                            priority: subtopic.priority,
                            complexity: subtopic.complexity,
                            estimatedReadTime: subtopic.estimatedReadTime
                        }
                    }
                });
                createdTopics.push(topic);
            }
        }
        return createdTopics;
    }
    determineResearchStatus(topic) {
        switch (topic.status) {
            case 'COMPLETED': return 'completed';
            case 'RESEARCHING': return 'researching';
            case 'ERROR': return 'error';
            default: return 'pending';
        }
    }
    inferComplexity(depth, title) {
        // Simple heuristic based on depth and title keywords
        if (depth >= 3)
            return 'advanced';
        const advancedKeywords = ['advanced', 'complex', 'optimization', 'algorithm', 'architecture'];
        if (advancedKeywords.some(keyword => title.toLowerCase().includes(keyword))) {
            return 'advanced';
        }
        if (depth >= 2)
            return 'intermediate';
        return 'beginner';
    }
    flattenHierarchy(hierarchy) {
        const flat = [hierarchy];
        for (const child of hierarchy.children) {
            flat.push(...this.flattenHierarchy(child));
        }
        return flat;
    }
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            .substring(0, 50);
    }
    /**
     * Generate a unique slug that avoids database conflicts
     * If the base slug already exists, append parent slug or counter
     */
    async generateUniqueSlug(baseSlug, parentSlug) {
        // First try the base slug
        const existingTopic = await prisma.topic.findUnique({
            where: { slug: baseSlug }
        });
        if (!existingTopic) {
            return baseSlug;
        }
        // If it exists, try appending parent slug
        const slugWithParent = `${baseSlug}-${parentSlug}`.substring(0, 50);
        const existingWithParent = await prisma.topic.findUnique({
            where: { slug: slugWithParent }
        });
        if (!existingWithParent) {
            return slugWithParent;
        }
        // If that also exists, append a counter
        let counter = 1;
        let uniqueSlug;
        do {
            uniqueSlug = `${baseSlug}-${counter}`.substring(0, 50);
            const existing = await prisma.topic.findUnique({
                where: { slug: uniqueSlug }
            });
            if (!existing) {
                break;
            }
            counter++;
        } while (counter < 100); // Prevent infinite loop
        return uniqueSlug;
    }
}
// Export singleton instance
export const topicDepthManager = new TopicDepthManager();
//# sourceMappingURL=topicDepthManager.js.map