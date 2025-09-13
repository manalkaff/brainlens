import { useState, useEffect, useCallback } from 'react';
import { startIterativeResearch, expandTopicDepth, generateSubtopics, checkResearchFreshness } from '../operations/iterativeResearchClient';
/**
 * Hook for managing iterative research with the new AI learning engine
 */
export function useIterativeResearch(options = {}) {
    const { topicSlug, autoStart = false, maxDepth = 3, userContext = { level: 'intermediate', interests: [] } } = options;
    // State
    const [isResearching, setIsResearching] = useState(false);
    const [researchProgress, setResearchProgress] = useState(0);
    const [error, setError] = useState(null);
    const [researchResult, setResearchResult] = useState(null);
    const [hierarchy, setHierarchy] = useState(null);
    // Start iterative research
    const startResearch = useCallback(async (opts = {}) => {
        if (!topicSlug) {
            setError('No topic slug provided');
            return;
        }
        // Deduplication: prevent multiple simultaneous research for the same topic
        if (isResearching) {
            console.log(`⏭️ Research already in progress for: ${topicSlug}, skipping duplicate`);
            return;
        }
        setIsResearching(true);
        setError(null);
        setResearchProgress(0);
        try {
            console.log(`🎯 Starting iterative research for: ${topicSlug}`);
            // Check if research is needed
            let shouldResearch = opts.forceRefresh || !researchResult;
            if (!shouldResearch && researchResult) {
                // Check cache freshness (simplified - you might want more sophisticated logic)
                const timestamp = researchResult.mainTopic.timestamp;
                let timestampMs;
                if (timestamp instanceof Date) {
                    timestampMs = timestamp.getTime();
                }
                else if (typeof timestamp === 'string') {
                    timestampMs = new Date(timestamp).getTime();
                }
                else {
                    // Invalid timestamp, force research
                    shouldResearch = true;
                    timestampMs = 0;
                }
                if (!shouldResearch) {
                    const ageHours = (Date.now() - timestampMs) / (1000 * 60 * 60);
                    shouldResearch = ageHours > 24 * 7; // 7 days
                }
            }
            if (!shouldResearch) {
                console.log('📋 Using existing research results');
                setIsResearching(false);
                return;
            }
            // Simulate progress updates for better UX
            const progressInterval = setInterval(() => {
                setResearchProgress(prev => Math.min(prev + Math.random() * 15, 85));
            }, 1000);
            const result = await startIterativeResearch({
                topicSlug,
                options: {
                    maxDepth,
                    forceRefresh: opts.forceRefresh,
                    userContext
                }
            }, {});
            clearInterval(progressInterval);
            setResearchProgress(100);
            setResearchResult(result);
            console.log(`✅ Research completed: ${result.totalTopicsProcessed} topics processed`);
            // Load hierarchy if we have a main topic
            if (result.mainTopic) {
                try {
                    // This would need to be implemented to get the topic ID from the result
                    // For now, we'll skip hierarchy loading
                    console.log('🌳 Hierarchy loading not yet implemented');
                }
                catch (hierarchyError) {
                    console.warn('Failed to load hierarchy:', hierarchyError);
                }
            }
        }
        catch (err) {
            console.error('❌ Research failed:', err);
            setError(err instanceof Error ? err.message : 'Research failed');
        }
        finally {
            setIsResearching(false);
        }
    }, [topicSlug, maxDepth, userContext, researchResult]);
    // Auto-start research when topic slug is provided
    useEffect(() => {
        if (autoStart && topicSlug && !researchResult && !isResearching) {
            console.log(`🎯 Auto-starting research for topic: ${topicSlug}`);
            startResearch();
        }
    }, [topicSlug, autoStart, researchResult, isResearching, startResearch]);
    // Expand topic to specific depth
    const expandDepth = useCallback(async (topicId, targetDepth) => {
        if (isResearching)
            return;
        setIsResearching(true);
        setError(null);
        try {
            console.log(`🌳 Expanding topic ${topicId} to depth ${targetDepth}`);
            const result = await expandTopicDepth({
                topicId,
                targetDepth,
                userContext,
                forceRefresh: false
            }, {});
            // Update hierarchy
            setHierarchy(result.expandedHierarchy);
            console.log(`✅ Expansion completed: ${result.newTopicsCreated} new topics`);
        }
        catch (err) {
            console.error('❌ Expansion failed:', err);
            setError(err instanceof Error ? err.message : 'Expansion failed');
        }
        finally {
            setIsResearching(false);
        }
    }, [isResearching, userContext]);
    // Generate subtopics for a specific topic
    const generateTopicSubtopics = useCallback(async (topicId) => {
        if (isResearching)
            return;
        setIsResearching(true);
        setError(null);
        try {
            console.log(`🔬 Generating subtopics for: ${topicId}`);
            const result = await generateSubtopics({
                topicId,
                userContext,
                forceRefresh: false
            }, {});
            console.log(`✅ Generated ${result.subtopics.length} subtopics`);
            // You might want to update the hierarchy or trigger a refresh here
        }
        catch (err) {
            console.error('❌ Subtopic generation failed:', err);
            setError(err instanceof Error ? err.message : 'Subtopic generation failed');
        }
        finally {
            setIsResearching(false);
        }
    }, [isResearching, userContext]);
    // Refresh research (force refresh)
    const refreshResearch = useCallback(async () => {
        await startResearch({ forceRefresh: true });
    }, [startResearch]);
    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);
    // Check if topic is expanded (has subtopics)
    const isTopicExpanded = useCallback((topicId) => {
        if (!hierarchy)
            return false;
        const findTopic = (node) => {
            if (node.id === topicId) {
                return node.children.length > 0;
            }
            return node.children.some(child => findTopic(child));
        };
        return findTopic(hierarchy);
    }, [hierarchy]);
    // Get research statistics
    const getResearchStats = useCallback(() => {
        if (!researchResult && !hierarchy) {
            return {
                totalTopics: 0,
                completedTopics: 0,
                pendingTopics: 0
            };
        }
        if (researchResult) {
            return {
                totalTopics: researchResult.totalTopicsProcessed,
                completedTopics: researchResult.totalTopicsProcessed - researchResult.cacheHits,
                pendingTopics: 0 // All are completed in the current result
            };
        }
        // Calculate from hierarchy
        if (hierarchy) {
            const flattenHierarchy = (node) => {
                return [node, ...node.children.flatMap(child => flattenHierarchy(child))];
            };
            const allTopics = flattenHierarchy(hierarchy);
            const completedTopics = allTopics.filter(t => t.researchStatus === 'completed').length;
            const pendingTopics = allTopics.filter(t => t.researchStatus === 'pending').length;
            return {
                totalTopics: allTopics.length,
                completedTopics,
                pendingTopics
            };
        }
        return {
            totalTopics: 0,
            completedTopics: 0,
            pendingTopics: 0
        };
    }, [researchResult, hierarchy]);
    return {
        // State
        isResearching,
        researchProgress,
        error,
        researchResult,
        hierarchy,
        // Actions
        startResearch,
        expandDepth,
        generateTopicSubtopics,
        refreshResearch,
        // Utils
        clearError,
        isTopicExpanded,
        getResearchStats
    };
}
/**
 * Hook for checking research freshness
 */
export function useResearchFreshness(topicId, cacheTtlDays = 7) {
    const [freshness, setFreshness] = useState({
        needsUpdate: false,
        isLoading: false
    });
    useEffect(() => {
        if (!topicId)
            return;
        const checkFreshness = async () => {
            setFreshness(prev => ({ ...prev, isLoading: true }));
            try {
                const result = await checkResearchFreshness({ topicId, cacheTtlDays }, {});
                setFreshness({
                    needsUpdate: result.needsUpdate,
                    lastResearched: result.lastResearched ? new Date(result.lastResearched) : undefined,
                    cacheStatus: result.cacheStatus,
                    isLoading: false
                });
            }
            catch (error) {
                console.error('Failed to check research freshness:', error);
                setFreshness({
                    needsUpdate: true, // Assume update needed on error
                    isLoading: false
                });
            }
        };
        checkFreshness();
    }, [topicId, cacheTtlDays]);
    return freshness;
}
//# sourceMappingURL=useIterativeResearch.js.map