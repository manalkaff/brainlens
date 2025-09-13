import React from 'react';
import { TopicTree } from './TopicTree';
import { useTopicTreeState } from '../../hooks/useTopicTreeState';
/**
 * Enhanced TopicTree component that provides backward compatibility
 * while implementing new path-based selection and proper state management
 */
export function EnhancedTopicTree({ topics, selectedTopicId, selectedTopicPath: propSelectedTopicPath, onTopicSelect, onGenerateSubtopics, isGenerating = false, searchQuery = '', onSearchChange, compact = false, autoExpandSelected = true, persistExpansion = true }) {
    // Convert selectedTopicId to path for backward compatibility
    const selectedTopicPath = React.useMemo(() => {
        if (propSelectedTopicPath) {
            return propSelectedTopicPath;
        }
        if (selectedTopicId) {
            // Find the topic and build its path
            const findTopicPath = (topicList, targetId, currentPath = []) => {
                for (const topic of topicList) {
                    const newPath = [...currentPath, topic.id];
                    if (topic.id === targetId) {
                        return newPath;
                    }
                    if (topic.children && topic.children.length > 0) {
                        const foundPath = findTopicPath(topic.children, targetId, newPath);
                        if (foundPath) {
                            return foundPath;
                        }
                    }
                }
                return null;
            };
            return findTopicPath(topics, selectedTopicId) || [];
        }
        return [];
    }, [propSelectedTopicPath, selectedTopicId, topics]);
    // Use the topic tree state hook
    const { expandedNodes, onToggleExpand, ensurePathExpanded } = useTopicTreeState({
        topics,
        selectedTopicPath,
        autoExpandSelected,
        persistExpansion
    });
    // Enhanced topic select handler
    const handleTopicSelect = React.useCallback((topic, path) => {
        // Ensure the path to this topic is expanded
        ensurePathExpanded(path);
        // Call the original handler with both topic and path
        if (onTopicSelect.length > 1) {
            // New interface - pass both topic and path
            onTopicSelect(topic, path);
        }
        else {
            // Legacy interface - pass only topic
            onTopicSelect(topic);
        }
    }, [onTopicSelect, ensurePathExpanded]);
    return (<TopicTree topics={topics} selectedTopicPath={selectedTopicPath} onTopicSelect={handleTopicSelect} onGenerateSubtopics={onGenerateSubtopics} expandedNodes={expandedNodes} onToggleExpand={onToggleExpand} isGenerating={isGenerating} searchQuery={searchQuery} onSearchChange={onSearchChange} compact={compact}/>);
}
// Export both components for flexibility
export { TopicTree } from './TopicTree';
//# sourceMappingURL=EnhancedTopicTree.jsx.map