import { useState, useCallback, useEffect } from 'react';
/**
 * Hook to manage TopicTree expand/collapse state with proper persistence
 * and automatic expansion for selected topics
 */
export function useTopicTreeState({ topics, selectedTopicPath = [], autoExpandSelected = true, persistExpansion = true }) {
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    // Toggle expand/collapse for a specific node
    const onToggleExpand = useCallback((topicId) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(topicId)) {
                newSet.delete(topicId);
            }
            else {
                newSet.add(topicId);
            }
            return newSet;
        });
    }, []);
    // Expand all nodes in a specific path
    const expandPath = useCallback((path) => {
        if (path.length === 0)
            return;
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            // Expand all parent nodes in the path (exclude the leaf)
            for (let i = 0; i < path.length - 1; i++) {
                newSet.add(path[i]);
            }
            return newSet;
        });
    }, []);
    // Ensure a path is expanded (used for navigation)
    const ensurePathExpanded = useCallback((path) => {
        if (path.length === 0)
            return;
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            let hasChanges = false;
            // Expand all parent nodes in the path (exclude the leaf)
            for (let i = 0; i < path.length - 1; i++) {
                if (!newSet.has(path[i])) {
                    newSet.add(path[i]);
                    hasChanges = true;
                }
            }
            return hasChanges ? newSet : prev;
        });
    }, []);
    // Expand all nodes
    const expandAll = useCallback(() => {
        const allIds = new Set();
        const collectIds = (topicList) => {
            topicList.forEach(topic => {
                allIds.add(topic.id);
                if (topic.children && topic.children.length > 0) {
                    collectIds(topic.children);
                }
            });
        };
        collectIds(topics);
        setExpandedNodes(allIds);
    }, [topics]);
    // Collapse all nodes
    const collapseAll = useCallback(() => {
        setExpandedNodes(new Set());
    }, []);
    // Auto-expand selected topic path when it changes
    useEffect(() => {
        if (autoExpandSelected && selectedTopicPath.length > 0) {
            ensurePathExpanded(selectedTopicPath);
        }
    }, [selectedTopicPath, autoExpandSelected, ensurePathExpanded]);
    // Auto-expand when navigating to deep subtopics via URL
    useEffect(() => {
        if (selectedTopicPath.length > 1) {
            ensurePathExpanded(selectedTopicPath);
        }
    }, [selectedTopicPath, ensurePathExpanded]);
    return {
        expandedNodes,
        onToggleExpand,
        expandPath,
        expandAll,
        collapseAll,
        ensurePathExpanded
    };
}
//# sourceMappingURL=useTopicTreeState.js.map