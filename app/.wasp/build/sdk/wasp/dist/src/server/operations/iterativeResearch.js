import { HttpError } from 'wasp/server';
import { prisma } from 'wasp/server';
import { makeSerializable } from '../../learning/api/iterativeResearch';
import { makeDepthExpansionSerializable } from '../../learning/api/topicDepthManager';
import { progressTracker, RESEARCH_STEPS } from '../../learning/api/progressTracker';
/**
 * Start iterative research for a topic
 * This is the main entry point for the new AI learning engine
 */
// Map to track active research operations per topic
const activeResearchOperations = new Map();
export const startIterativeResearch = async ({ topicSlug, options = {} }, context) => {
    try {
        console.log(`🎯 Starting iterative research for topic: ${topicSlug}`);
        // Deduplication: check if research is already in progress for this topic
        const existingOperation = activeResearchOperations.get(topicSlug);
        if (existingOperation) {
            console.log(`⏭️ Research already in progress for ${topicSlug}, reusing existing operation`);
            return await existingOperation;
        }
        // Create and store the research operation promise
        const researchOperation = performResearch(topicSlug, options, context);
        activeResearchOperations.set(topicSlug, researchOperation);
        // Clean up the operation when it completes (success or failure)
        researchOperation.finally(() => {
            activeResearchOperations.delete(topicSlug);
        });
        return await researchOperation;
    }
    catch (error) {
        // Make sure to clean up on error
        activeResearchOperations.delete(topicSlug);
        throw error;
    }
};
// Extracted research logic
async function performResearch(topicSlug, options, context) {
    try {
        // Find the topic in database
        const topic = await prisma.topic.findUnique({
            where: { slug: topicSlug }
        });
        if (!topic) {
            throw new HttpError(404, `Topic with slug "${topicSlug}" not found`);
        }
        // Set default options
        const researchOptions = {
            maxDepth: 3,
            forceRefresh: false,
            userContext: {
                level: 'intermediate',
                interests: [],
                previousKnowledge: []
            },
            ...options
        };
        // Dynamic import to avoid circular dependency issues
        const { researchAndStore } = await import('../../learning/api/iterativeResearch');
        // Perform iterative research with user context
        const userContext = {
            userId: context.user?.id,
            level: researchOptions.userContext?.level || 'intermediate',
            style: 'textual' // Default learning style
        };
        console.log(`🔍 DEBUG: Starting research for user ID: ${userContext.userId}, topic: ${topic.title}`);
        console.log(`🔍 DEBUG: User context:`, userContext);
        const result = await researchAndStore(topic.title, topicSlug, researchOptions, userContext);
        // Update topic status
        await prisma.topic.update({
            where: { id: topic.id },
            data: {
                status: 'COMPLETED',
                cacheStatus: 'FRESH',
                lastResearched: new Date(),
                researchVersion: '1.0.0',
                subtopicsGenerated: result.research.subtopicResults.size > 0
            }
        });
        console.log(`✅ Iterative research completed for: ${topicSlug}`);
        return makeSerializable(result.research);
    }
    catch (error) {
        console.error(`❌ Iterative research failed for topic "${topicSlug}":`, error);
        // Update topic status to error
        try {
            await prisma.topic.updateMany({
                where: { slug: topicSlug },
                data: {
                    status: 'ERROR',
                    cacheStatus: 'ERROR'
                }
            });
        }
        catch (updateError) {
            console.error('Failed to update topic status:', updateError);
        }
        throw new HttpError(500, `Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
;
/**
 * Expand a topic to a specific depth
 */
export const expandTopicDepth = async ({ topicId, targetDepth, userContext, forceRefresh = false }, context) => {
    try {
        console.log(`🌳 Expanding topic ${topicId} to depth ${targetDepth}`);
        const request = {
            topicId,
            targetDepth,
            userContext,
            forceRefresh
        };
        // Dynamic import to avoid circular dependency issues
        const { topicDepthManager } = await import('../../learning/api/topicDepthManager');
        const result = await topicDepthManager.expandToDepth(request);
        console.log(`✅ Topic expansion completed: ${result.newTopicsCreated} new topics`);
        return makeDepthExpansionSerializable(result);
    }
    catch (error) {
        console.error(`❌ Topic expansion failed:`, error);
        throw new HttpError(500, `Topic expansion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
/**
 * Generate subtopics for a topic
 */
export const generateSubtopics = async ({ topicId, userContext, forceRefresh = false }, context) => {
    try {
        console.log(`🔬 Generating subtopics for topic: ${topicId}`);
        // Dynamic import to avoid circular dependency issues
        const { topicDepthManager } = await import('../../learning/api/topicDepthManager');
        const result = await topicDepthManager.generateSubtopics(topicId, userContext, forceRefresh);
        // Update topic to mark subtopics as generated
        await prisma.topic.update({
            where: { id: topicId },
            data: { subtopicsGenerated: true }
        });
        console.log(`✅ Generated ${result.subtopics.length} subtopics`);
        return {
            subtopics: result.subtopics,
            researchResult: result.researchResult ? makeSerializable(result.researchResult) : undefined
        };
    }
    catch (error) {
        console.error(`❌ Subtopic generation failed:`, error);
        throw new HttpError(500, `Subtopic generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
/**
 * Get topic hierarchy with research status
 */
export const getTopicHierarchy = async ({ topicId, maxDepth }, context) => {
    try {
        // Dynamic import to avoid circular dependency issues
        const { topicDepthManager } = await import('../../learning/api/topicDepthManager');
        const hierarchy = await topicDepthManager.getTopicHierarchy(topicId, maxDepth);
        return hierarchy;
    }
    catch (error) {
        console.error(`Failed to get topic hierarchy:`, error);
        throw new HttpError(500, `Failed to get topic hierarchy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
/**
 * Get research statistics with real-time progress integration
 */
export const getResearchStats = async ({ topicId }, context) => {
    try {
        // Get basic database statistics (existing functionality)
        const topic = await prisma.topic.findUnique({
            where: { id: topicId },
            include: {
                generatedContent: {
                    select: {
                        id: true,
                        createdAt: true,
                        contentType: true,
                        userLevel: true,
                        metadata: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });
        if (!topic) {
            throw new HttpError(404, `Topic with ID "${topicId}" not found`);
        }
        // Base response with existing database information
        let response = {
            topicId,
            status: topic.status,
            lastResearched: topic.lastResearched?.toISOString() || undefined,
            cacheStatus: topic.cacheStatus || undefined,
            // Required ResearchStats fields for compatibility
            totalTopics: 1,
            researchedTopics: topic.status === 'COMPLETED' ? 1 : 0,
            pendingTopics: topic.status === 'PENDING' ? 1 : 0,
            averageDepth: 1,
            lastResearchDate: topic.lastResearched?.toISOString() || undefined,
            isActive: topic.status === 'IN_PROGRESS' || false,
            // Legacy fields maintained for compatibility
            totalTopicsProcessed: 1,
            cacheHits: 0,
            processingTime: 0
        };
        // Try to get real-time progress from Redis
        try {
            // console.log(`🔍 DEBUG: Getting progress for topicId: ${topicId}`);
            let progressData = await progressTracker.getProgressWithFallback(topicId);
            // Fallback: try with topic title if no progress found with ID
            if (!progressData && topic) {
                // console.log(`🔍 DEBUG: No progress found with ID, trying with topic title: ${topic.title}`);
                progressData = await progressTracker.getProgressWithFallback(topic.title);
            }
            if (progressData) {
                // console.log(`🔍 DEBUG: Found progress data for ${topicId}:`, JSON.stringify(progressData, null, 2));
                // Research is active or recently completed
                response.realTimeProgress = {
                    isActive: progressData.status !== 'completed' && progressData.status !== 'failed',
                    phase: mapProgressPhaseToApiPhase(progressData.phase),
                    completedSteps: [],
                    overallProgress: progressData.overallProgress || 0,
                    mainTopicCompleted: progressData.mainTopicCompleted || false,
                    mainTopicResult: progressData.mainTopicResult,
                    subtopicsProgress: progressData.subtopicsProgress || [],
                    error: progressData.error,
                    estimatedTimeRemaining: calculateEstimatedTimeRemaining(progressData)
                };
                // Include current step if research is active
                if (progressData.currentStep !== undefined && progressData.currentStep >= 0 && response.realTimeProgress) {
                    const stepDetails = progressData.steps[progressData.currentStep];
                    if (stepDetails) {
                        response.realTimeProgress.currentStep = {
                            number: progressData.currentStep,
                            name: stepDetails.name,
                            description: stepDetails.description,
                            startTime: stepDetails.startTime ? (stepDetails.startTime instanceof Date ? stepDetails.startTime.toISOString() : String(stepDetails.startTime)) : new Date().toISOString(),
                            estimatedDuration: RESEARCH_STEPS.find(s => s.stepNumber === progressData.currentStep)?.estimatedDuration || 15,
                            progress: stepDetails.progress || 0
                        };
                    }
                }
                // Include completed steps
                if (progressData.completedSteps && response.realTimeProgress) {
                    response.realTimeProgress.completedSteps = progressData.completedSteps.map(step => ({
                        number: step.stepNumber,
                        name: step.name,
                        description: step.description,
                        startTime: step.startTime ? (step.startTime instanceof Date ? step.startTime.toISOString() : String(step.startTime)) : new Date().toISOString(),
                        endTime: step.endTime ? (step.endTime instanceof Date ? step.endTime.toISOString() : String(step.endTime)) : new Date().toISOString(),
                        duration: step.duration || 0,
                        result: step.result
                    }));
                }
                // Override database status with real-time status if available
                if (progressData.status) {
                    response.status = mapProgressStatusToDbStatus(progressData.status);
                }
            }
            else {
                console.log(`🔍 DEBUG: No progress data found for ${topicId}`);
            }
        }
        catch (redisError) {
            console.warn('Failed to get progress from Redis, using database only:', redisError);
            // Continue with database-only response
        }
        // If no real-time progress but topic is completed, check for main topic completion
        if (!response.realTimeProgress?.isActive && topic.status === 'COMPLETED') {
            const latestContent = topic.generatedContent[0];
            if (latestContent) {
                response.realTimeProgress = {
                    isActive: false,
                    phase: 'completed',
                    overallProgress: 100,
                    mainTopicCompleted: true,
                    mainTopicResult: {
                        contentId: latestContent.id,
                        createdAt: latestContent.createdAt,
                        contentType: latestContent.contentType
                    },
                    subtopicsProgress: [],
                    completedSteps: RESEARCH_STEPS.map(step => ({
                        number: step.stepNumber,
                        name: step.name,
                        description: step.description,
                        startTime: latestContent.createdAt.toISOString(),
                        endTime: latestContent.createdAt.toISOString(),
                        duration: 0,
                        result: { cached: true }
                    }))
                };
            }
        }
        return response;
    }
    catch (error) {
        console.error(`Failed to get research stats:`, error);
        throw new HttpError(500, `Failed to get research stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
// Helper functions for Task 4
function calculateEstimatedTimeRemaining(progressData) {
    if (!progressData.currentStep || progressData.overallProgress >= 100) {
        return undefined;
    }
    const remainingProgress = 100 - progressData.overallProgress;
    const currentStepWeight = RESEARCH_STEPS[progressData.currentStep]?.progressWeight || 10;
    const averageStepDuration = 20; // seconds, could be calculated from historical data
    return Math.ceil((remainingProgress / currentStepWeight) * averageStepDuration);
}
function mapProgressStatusToDbStatus(progressStatus) {
    switch (progressStatus) {
        case 'starting':
            return 'PENDING';
        case 'researching_main':
        case 'main_completed':
        case 'processing_subtopics':
            return 'IN_PROGRESS';
        case 'completed':
            return 'COMPLETED';
        case 'failed':
            return 'ERROR';
        default:
            return 'PENDING';
    }
}
function mapProgressPhaseToApiPhase(progressPhase) {
    switch (progressPhase) {
        case 'initialization':
        case 'main_topic':
            return 'main_topic';
        case 'subtopics':
            return 'subtopics';
        case 'complete':
            return 'completed';
        default:
            return 'main_topic';
    }
}
/**
 * Get cache statistics for monitoring
 */
export const getCacheStatistics = async (args, context) => {
    try {
        // Dynamic import to avoid circular dependency issues
        const { getCacheStats } = await import('../../learning/api/cachingSystem');
        const stats = await getCacheStats();
        return stats;
    }
    catch (error) {
        console.error(`Failed to get cache stats:`, error);
        throw new HttpError(500, `Failed to get cache stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
/**
 * Clean up expired cache entries
 */
export const cleanupCache = async (args, context) => {
    try {
        // Dynamic import to avoid circular dependency issues
        const { cleanupExpiredEntries } = await import('../../learning/api/cachingSystem');
        const cleaned = await cleanupExpiredEntries();
        return { cleanedEntries: cleaned };
    }
    catch (error) {
        console.error(`Cache cleanup failed:`, error);
        throw new HttpError(500, `Cache cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
/**
 * Check if topic needs research update
 */
export const checkResearchFreshness = async ({ topicId, cacheTtlDays = 7 }, context) => {
    try {
        // Dynamic import to avoid circular dependency issues
        const { topicDepthManager } = await import('../../learning/api/topicDepthManager');
        const needsUpdate = await topicDepthManager.needsResearchUpdate(topicId, cacheTtlDays);
        const topic = await prisma.topic.findUnique({
            where: { id: topicId },
            select: {
                lastResearched: true,
                cacheStatus: true,
                generatedContent: {
                    select: { createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        return {
            needsUpdate,
            lastResearched: topic?.lastResearched,
            cacheStatus: topic?.cacheStatus,
            lastContentGenerated: topic?.generatedContent[0]?.createdAt
        };
    }
    catch (error) {
        console.error(`Failed to check research freshness:`, error);
        throw new HttpError(500, `Failed to check research freshness: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
//# sourceMappingURL=iterativeResearch.js.map