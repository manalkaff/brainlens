import React, { useState, useEffect } from 'react';
import { ContentDisplay } from './ContentDisplay';
import { NavigationLoadingState, NavigationLoadingOverlay } from './NavigationLoadingState';
import { useNavigationAnalytics } from '../../analytics/navigationAnalytics';
import { useTopicNavigation } from '../../hooks/useTopicNavigation';
/**
 * Example integration showing how to use SubtopicCards with the navigation system
 * This demonstrates the complete flow from card clicks to content updates
 */
export function SubtopicCardsIntegrationExample({ topics, initialTopicId }) {
    const analytics = useNavigationAnalytics();
    // Use the topic navigation hook
    const { selectedTopic, selectedSubtopic, contentPath, isGeneratingContent, selectTopic, selectSubtopic, navigateToPath, generateContentForTopic, getTopicContent, setTopicContent, getNavigationBreadcrumbs, isTopicSelected } = useTopicNavigation(topics);
    // Local state for demo
    const [isNavigating, setIsNavigating] = useState(false);
    const [navigationProgress, setNavigationProgress] = useState(0);
    // Initialize with a topic if provided
    useEffect(() => {
        if (initialTopicId && topics.length > 0) {
            const initialTopic = topics.find(t => t.id === initialTopicId);
            if (initialTopic) {
                selectTopic(initialTopic, 'url');
            }
        }
    }, [initialTopicId, topics, selectTopic]);
    // Handle subtopic card clicks
    const handleSubtopicClick = async (subtopic) => {
        const startTime = Date.now();
        setIsNavigating(true);
        setNavigationProgress(0);
        try {
            // Simulate navigation progress
            const progressInterval = setInterval(() => {
                setNavigationProgress(prev => Math.min(prev + 10, 90));
            }, 100);
            // Track analytics
            analytics.trackSubtopicCardClick({
                fromTopic: selectedTopic?.id || '',
                toSubtopic: subtopic.id,
                subtopicTitle: subtopic.title,
                navigationDepth: contentPath.length,
                navigationSource: 'cards',
                timestamp: new Date().toISOString()
            });
            // Perform navigation
            selectSubtopic(subtopic, 'cards');
            // Check if content exists
            const existingContent = getTopicContent(subtopic.id);
            if (!existingContent) {
                // Generate content if it doesn't exist
                await generateContentForTopic(subtopic);
            }
            // Complete progress
            clearInterval(progressInterval);
            setNavigationProgress(100);
            // Track loading time
            const loadingTime = Date.now() - startTime;
            analytics.trackLoadingState({
                topicId: subtopic.id,
                loadingType: 'navigation',
                duration: loadingTime,
                success: true
            });
        }
        catch (error) {
            console.error('Navigation failed:', error);
            // Track error
            analytics.trackError('subtopic_navigation_failed', {
                subtopicId: subtopic.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            analytics.trackLoadingState({
                topicId: subtopic.id,
                loadingType: 'navigation',
                duration: Date.now() - startTime,
                success: false
            });
        }
        finally {
            // Clear loading state after a brief delay
            setTimeout(() => {
                setIsNavigating(false);
                setNavigationProgress(0);
            }, 500);
        }
    };
    // Handle content generation
    const handleGenerateContent = async () => {
        const currentTopic = selectedSubtopic || selectedTopic;
        if (!currentTopic)
            return;
        const startTime = Date.now();
        try {
            analytics.trackContentGeneration({
                topicId: currentTopic.id,
                topicTitle: currentTopic.title,
                generationTrigger: 'manual',
                success: false // Will be updated on success
            });
            await generateContentForTopic(currentTopic);
            analytics.trackContentGeneration({
                topicId: currentTopic.id,
                topicTitle: currentTopic.title,
                generationTrigger: 'manual',
                generationTime: Date.now() - startTime,
                success: true
            });
        }
        catch (error) {
            analytics.trackContentGeneration({
                topicId: currentTopic.id,
                topicTitle: currentTopic.title,
                generationTrigger: 'manual',
                generationTime: Date.now() - startTime,
                success: false,
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
    // Handle breadcrumb navigation
    const handleBreadcrumbNavigation = (path) => {
        analytics.trackBreadcrumbClick({
            fromTopic: selectedTopic?.id || '',
            toSubtopic: path[path.length - 1] || '',
            subtopicTitle: 'Breadcrumb Navigation',
            navigationDepth: path.length,
            navigationSource: 'breadcrumb',
            timestamp: new Date().toISOString()
        });
        navigateToPath(path);
    };
    // Get current topic for display
    const currentTopic = selectedSubtopic || selectedTopic;
    const currentContent = currentTopic ? getTopicContent(currentTopic.id) : null;
    const navigationBreadcrumbs = getNavigationBreadcrumbs();
    // Get subtopics for the current topic
    const currentSubtopics = currentTopic?.children || [];
    // Show loading state if navigating
    if (isNavigating) {
        return (<NavigationLoadingState type="navigation" message="Navigating to subtopic..." progress={navigationProgress} topicTitle={selectedSubtopic?.title}/>);
    }
    // Show empty state if no topic selected
    if (!currentTopic) {
        return (<div className="text-center py-12">
        <p className="text-muted-foreground">Select a topic to begin exploring</p>
      </div>);
    }
    return (<div className="relative">
      {/* Content Display with integrated SubtopicCards */}
      <ContentDisplay topic={currentTopic} content={currentContent?.content} sources={currentContent?.sources} subtopics={currentSubtopics} isGenerating={isGeneratingContent} onSubtopicClick={handleSubtopicClick} onGenerateContent={handleGenerateContent} navigationPath={navigationBreadcrumbs} onNavigateToPath={handleBreadcrumbNavigation} selectedSubtopicId={selectedSubtopic?.id} onAnalyticsEvent={(event, data) => {
            // Handle custom analytics events
            console.log('Analytics event:', event, data);
        }}/>

      {/* Loading overlay for content generation */}
      {isGeneratingContent && (<NavigationLoadingOverlay type="content_generation" message="Generating comprehensive content..."/>)}

      {/* Demo: Analytics Summary (only in development) */}
      {process.env.NODE_ENV === 'development' && (<div className="fixed bottom-4 right-4 p-4 bg-card border rounded-lg shadow-lg max-w-sm">
          <h4 className="font-semibold text-sm mb-2">Analytics Summary</h4>
          <div className="text-xs space-y-1">
            <p>Total Events: {analytics.getAnalyticsSummary().totalEvents}</p>
            <div className="space-y-1">
              {Object.entries(analytics.getAnalyticsSummary().eventTypes).map(([event, count]) => (<p key={event} className="text-muted-foreground">
                  {event}: {count}
                </p>))}
            </div>
            <button onClick={analytics.clearAnalytics} className="mt-2 text-xs text-red-600 hover:text-red-800">
              Clear Analytics
            </button>
          </div>
        </div>)}
    </div>);
}
// Example usage component
export function SubtopicCardsDemo() {
    // Mock topic data for demonstration
    const mockTopics = [
        {
            id: 'topic-1',
            slug: 'react-fundamentals',
            title: 'React Fundamentals',
            summary: 'Learn the core concepts of React',
            description: 'A comprehensive guide to React fundamentals',
            depth: 0,
            parentId: null,
            status: 'active',
            metadata: {
                complexity: 'beginner',
                estimatedReadTime: 15,
                hasContent: true
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            children: [
                {
                    id: 'subtopic-1',
                    slug: 'components',
                    title: 'Components',
                    summary: 'Understanding React components',
                    description: 'Learn how to create and use React components',
                    depth: 1,
                    parentId: 'topic-1',
                    status: 'active',
                    metadata: {
                        complexity: 'beginner',
                        priority: 3,
                        estimatedReadTime: 8,
                        hasContent: false
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    children: []
                },
                {
                    id: 'subtopic-2',
                    slug: 'state-management',
                    title: 'State Management',
                    summary: 'Managing component state',
                    description: 'Learn how to manage state in React components',
                    depth: 1,
                    parentId: 'topic-1',
                    status: 'active',
                    metadata: {
                        complexity: 'intermediate',
                        priority: 4,
                        estimatedReadTime: 12,
                        hasContent: true
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    children: []
                }
            ]
        }
    ];
    return (<div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Subtopic Cards Integration Demo</h2>
      <SubtopicCardsIntegrationExample topics={mockTopics} initialTopicId="topic-1"/>
    </div>);
}
export default SubtopicCardsIntegrationExample;
//# sourceMappingURL=SubtopicCardsIntegration.example.jsx.map