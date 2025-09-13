import { useState, useEffect, useCallback, useRef } from 'react';
import { getSubtopicContent } from 'wasp/client/operations';
export function useSubtopicContent(mainTopicId, subtopicId, options = {}) {
    const { userLevel = 'intermediate', learningStyle = 'textual', pollInterval = 2000, maxPollAttempts = 30 } = options;
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    // Refs for polling management
    const pollTimeoutRef = useRef(null);
    const pollAttemptsRef = useRef(0);
    const abortControllerRef = useRef(null);
    // Clear any active polling when component unmounts or dependencies change
    const clearPolling = useCallback(() => {
        if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
        }
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        pollAttemptsRef.current = 0;
    }, []);
    // Fetch subtopic content using Wasp query
    const fetchSubtopicContent = useCallback(async (mainTopicId, subtopicId, signal) => {
        console.log('🔍 Fetching subtopic content:', { mainTopicId, subtopicId, userLevel, learningStyle });
        try {
            const data = await getSubtopicContent({
                mainTopicId,
                subtopicId,
                options: {
                    userLevel,
                    learningStyle,
                },
            });
            console.log('🔍 Subtopic content response:', data);
            return data;
        }
        catch (error) {
            // Handle Wasp query errors
            if (error.statusCode === 404) {
                throw new Error(error.message || 'Subtopic content not found');
            }
            throw new Error(error.message || 'Failed to fetch subtopic content');
        }
    }, [userLevel, learningStyle]);
    // Poll for content when generating
    const pollForContent = useCallback(async (mainTopicId, subtopicId) => {
        if (pollAttemptsRef.current >= maxPollAttempts) {
            console.warn('⚠️ Max poll attempts reached, stopping polling');
            setIsGenerating(false);
            setError('Content generation took too long. Please try again.');
            return;
        }
        try {
            const abortController = new AbortController();
            abortControllerRef.current = abortController;
            const result = await fetchSubtopicContent(mainTopicId, subtopicId, abortController.signal);
            if (result.success && result.content) {
                // Content is ready
                console.log('✅ Subtopic content ready');
                setContent(result);
                setIsGenerating(false);
                setProgress(100);
                clearPolling();
            }
            else if (result.generating && result.progress) {
                // Still generating, continue polling
                console.log('⏳ Still generating subtopic content:', result.progress);
                setProgress(result.progress.progress || 0);
                pollAttemptsRef.current += 1;
                pollTimeoutRef.current = setTimeout(() => {
                    pollForContent(mainTopicId, subtopicId);
                }, pollInterval);
            }
            else {
                // Not generating and no content
                console.log('❌ Subtopic content not found and not generating');
                setContent(result);
                setIsGenerating(false);
                clearPolling();
            }
        }
        catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                // Request was aborted, ignore
                return;
            }
            console.error('❌ Error polling for subtopic content:', err);
            setError(err instanceof Error ? err.message : 'Failed to check content status');
            setIsGenerating(false);
            clearPolling();
        }
    }, [fetchSubtopicContent, pollInterval, maxPollAttempts, clearPolling]);
    // Main fetch function
    const refetch = useCallback(async () => {
        if (!mainTopicId || !subtopicId) {
            console.log('⚠️ Missing mainTopicId or subtopicId for subtopic content fetch');
            return;
        }
        setIsLoading(true);
        setError(null);
        clearPolling();
        try {
            const abortController = new AbortController();
            abortControllerRef.current = abortController;
            const result = await fetchSubtopicContent(mainTopicId, subtopicId, abortController.signal);
            if (result.success && result.content) {
                // Content is available
                console.log('✅ Subtopic content loaded from database');
                setContent(result);
                setProgress(100);
            }
            else if (result.generating) {
                // Content is being generated
                console.log('⏳ Subtopic is being generated, starting polling');
                setContent(result);
                setIsGenerating(true);
                setProgress(result.progress?.progress || 0);
                // Start polling for completion
                pollAttemptsRef.current = 0;
                pollTimeoutRef.current = setTimeout(() => {
                    pollForContent(mainTopicId, subtopicId);
                }, pollInterval);
            }
            else {
                // Content not found and not generating
                console.log('❌ Subtopic content not found');
                setContent(result);
            }
        }
        catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                // Request was aborted, ignore
                return;
            }
            console.error('❌ Error fetching subtopic content:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch subtopic content');
            setContent(null);
        }
        finally {
            setIsLoading(false);
        }
    }, [mainTopicId, subtopicId, fetchSubtopicContent, pollForContent, pollInterval, clearPolling]);
    // Clear error function
    const clearError = useCallback(() => {
        setError(null);
    }, []);
    // Effect to fetch content when dependencies change
    useEffect(() => {
        if (mainTopicId && subtopicId) {
            refetch();
        }
        else {
            // Clear state when no IDs provided
            setContent(null);
            setError(null);
            setProgress(0);
            clearPolling();
        }
        // Cleanup on unmount or dependency change
        return () => {
            clearPolling();
        };
    }, [mainTopicId, subtopicId, refetch, clearPolling]);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearPolling();
        };
    }, [clearPolling]);
    return {
        content,
        isLoading,
        isGenerating,
        error,
        progress,
        refetch,
        clearError,
    };
}
//# sourceMappingURL=useSubtopicContent.js.map