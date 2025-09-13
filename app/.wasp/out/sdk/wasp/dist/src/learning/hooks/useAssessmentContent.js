import { useState, useCallback } from 'react';
/**
 * Hook for managing assessment content generation
 */
export function useAssessmentContent() {
    const [assessmentContent, setAssessmentContent] = useState({
        content: null,
        startingPoint: null,
        recommendedPath: [],
        estimatedDuration: 0,
        adaptations: [],
        learningObjectives: [],
        isLoading: false,
        error: null
    });
    const [personalizedPath, setPersonalizedPath] = useState({
        path: null,
        isLoading: false,
        error: null
    });
    const [startingPoint, setStartingPoint] = useState({
        recommendation: null,
        isLoading: false,
        error: null
    });
    const [streaming, setStreaming] = useState({
        streamId: null,
        isStreaming: false,
        error: null
    });
    /**
     * Generate assessment content based on user's assessment results
     */
    const generateContent = useCallback(async (topicId, assessment) => {
        setAssessmentContent(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            // TODO: Uncomment when operations are available
            // const result = await generateAssessmentContent({
            //   topicId,
            //   assessment
            // });
            // Mock result for now
            const result = {
                content: 'Generated content will appear here',
                startingPoint: 'Starting point recommendation',
                recommendedPath: ['Step 1', 'Step 2', 'Step 3'],
                estimatedDuration: 2,
                adaptations: ['Adapted for your learning style'],
                learningObjectives: ['Learn the basics', 'Apply concepts']
            };
            setAssessmentContent({
                content: result.content,
                startingPoint: result.startingPoint,
                recommendedPath: result.recommendedPath,
                estimatedDuration: result.estimatedDuration,
                adaptations: result.adaptations,
                learningObjectives: result.learningObjectives,
                isLoading: false,
                error: null
            });
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate assessment content';
            setAssessmentContent(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage
            }));
            throw error;
        }
    }, []);
    /**
     * Generate personalized learning path
     */
    const generatePath = useCallback(async (topicId, assessment, includeContent = false) => {
        setPersonalizedPath(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            // TODO: Uncomment when operations are available
            // const result = await generatePersonalizedPath({
            //   topicId,
            //   assessment,
            //   includeContent
            // });
            // Mock result for now
            const result = {
                id: 'mock-path',
                title: 'Personalized Learning Path',
                description: 'A path tailored to your needs',
                estimatedTime: '2-3 hours',
                difficulty: 'intermediate',
                topics: ['Topic 1', 'Topic 2', 'Topic 3']
            };
            setPersonalizedPath({
                path: result,
                isLoading: false,
                error: null
            });
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate personalized path';
            setPersonalizedPath(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage
            }));
            throw error;
        }
    }, []);
    /**
     * Generate starting point recommendation
     */
    const generateStartingPointRecommendation = useCallback(async (topicId, assessment) => {
        setStartingPoint(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            // TODO: Uncomment when operations are available
            // const result = await generateStartingPoint({
            //   topicId,
            //   assessment
            // });
            // Mock result for now
            const result = {
                title: 'Recommended Starting Point',
                description: 'Based on your assessment',
                rationale: 'This is the best place to start',
                content: 'Starting content here',
                estimatedDuration: 1.5,
                difficulty: 'beginner',
                keyTopics: ['Key Topic 1', 'Key Topic 2'],
                learningObjectives: ['Objective 1', 'Objective 2']
            };
            setStartingPoint({
                recommendation: result,
                isLoading: false,
                error: null
            });
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate starting point';
            setStartingPoint(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage
            }));
            throw error;
        }
    }, []);
    /**
     * Start streaming assessment content
     */
    const startStreaming = useCallback(async (topicId, assessment, existingStreamId) => {
        setStreaming(prev => ({ ...prev, isStreaming: true, error: null }));
        try {
            // TODO: Uncomment when operations are available
            // const result = await streamAssessmentContent({
            //   topicId,
            //   assessment,
            //   streamId: existingStreamId
            // });
            // Mock result for now
            const result = {
                streamId: existingStreamId || 'mock-stream-id',
                status: 'started',
                message: 'Streaming started'
            };
            if (result.status === 'started') {
                setStreaming({
                    streamId: result.streamId,
                    isStreaming: true,
                    error: null
                });
            }
            else {
                setStreaming({
                    streamId: null,
                    isStreaming: false,
                    error: result.message
                });
            }
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to start streaming';
            setStreaming({
                streamId: null,
                isStreaming: false,
                error: errorMessage
            });
            throw error;
        }
    }, []);
    /**
     * Stop streaming
     */
    const stopStreaming = useCallback(() => {
        setStreaming({
            streamId: null,
            isStreaming: false,
            error: null
        });
    }, []);
    /**
     * Reset all states
     */
    const reset = useCallback(() => {
        setAssessmentContent({
            content: null,
            startingPoint: null,
            recommendedPath: [],
            estimatedDuration: 0,
            adaptations: [],
            learningObjectives: [],
            isLoading: false,
            error: null
        });
        setPersonalizedPath({
            path: null,
            isLoading: false,
            error: null
        });
        setStartingPoint({
            recommendation: null,
            isLoading: false,
            error: null
        });
        setStreaming({
            streamId: null,
            isStreaming: false,
            error: null
        });
    }, []);
    return {
        // State
        assessmentContent,
        personalizedPath,
        startingPoint,
        streaming,
        // Actions
        generateContent,
        generatePath,
        generateStartingPointRecommendation,
        startStreaming,
        stopStreaming,
        reset,
        // Computed properties
        isAnyLoading: assessmentContent.isLoading || personalizedPath.isLoading || startingPoint.isLoading,
        hasError: !!(assessmentContent.error || personalizedPath.error || startingPoint.error || streaming.error),
        errors: [
            assessmentContent.error,
            personalizedPath.error,
            startingPoint.error,
            streaming.error
        ].filter(Boolean)
    };
}
/**
 * Hook for streaming assessment content with real-time updates
 */
export function useStreamingAssessmentContent() {
    const [streamingContent, setStreamingContent] = useState({
        content: '',
        isStreaming: false,
        isComplete: false,
        progress: 0,
        currentSection: '',
        error: null
    });
    /**
     * Connect to streaming endpoint and handle real-time updates
     */
    const connectToStream = useCallback((streamId) => {
        const eventSource = new EventSource(`/api/learning/stream/create?streamId=${streamId}`);
        setStreamingContent(prev => ({
            ...prev,
            isStreaming: true,
            error: null
        }));
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'content') {
                    setStreamingContent(prev => ({
                        ...prev,
                        content: prev.content + data.chunk,
                        progress: data.progress || prev.progress
                    }));
                }
                else if (data.type === 'status') {
                    setStreamingContent(prev => ({
                        ...prev,
                        progress: data.progress || prev.progress,
                        currentSection: data.currentSection || prev.currentSection
                    }));
                }
                else if (data.type === 'complete') {
                    setStreamingContent(prev => ({
                        ...prev,
                        isStreaming: false,
                        isComplete: true,
                        progress: 100
                    }));
                    eventSource.close();
                }
            }
            catch (error) {
                console.error('Failed to parse streaming data:', error);
            }
        };
        eventSource.onerror = (error) => {
            console.error('Streaming error:', error);
            setStreamingContent(prev => ({
                ...prev,
                isStreaming: false,
                error: 'Streaming connection failed'
            }));
            eventSource.close();
        };
        return () => {
            eventSource.close();
            setStreamingContent(prev => ({
                ...prev,
                isStreaming: false
            }));
        };
    }, []);
    /**
     * Reset streaming state
     */
    const resetStream = useCallback(() => {
        setStreamingContent({
            content: '',
            isStreaming: false,
            isComplete: false,
            progress: 0,
            currentSection: '',
            error: null
        });
    }, []);
    return {
        streamingContent,
        connectToStream,
        resetStream
    };
}
//# sourceMappingURL=useAssessmentContent.js.map