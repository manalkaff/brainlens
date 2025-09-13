/**
 * Client-side state management optimization for large topic trees
 * Implements virtualization, lazy loading, and efficient updates
 */
import { useMemo, useCallback, useRef, useEffect } from 'react';
const DEFAULT_CONFIG = {
    itemHeight: 48,
    containerHeight: 600,
    overscan: 5,
    maxVisibleItems: 100,
    lazyLoadThreshold: 3,
    searchDebounceMs: 300,
};
class TopicTreeOptimizer {
    state;
    config;
    updateCallbacks = new Set();
    searchTimeout = null;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.state = {
            nodes: new Map(),
            rootNodes: [],
            expandedNodes: new Set(),
            visibleNodes: [],
            virtualizedItems: [],
            searchResults: [],
            selectedNode: null,
            loadingNodes: new Set(),
        };
    }
    /**
     * Initialize tree with topic data
     */
    initializeTree(topics, userProgress = []) {
        // Clear existing state
        this.state.nodes.clear();
        this.state.rootNodes = [];
        this.state.expandedNodes.clear();
        // Create progress lookup
        const progressMap = new Map();
        userProgress.forEach(progress => {
            progressMap.set(progress.topicId, progress);
        });
        // Build node map and hierarchy
        const nodeMap = new Map();
        const childrenMap = new Map();
        // First pass: create all nodes
        topics.forEach(topic => {
            const node = {
                ...topic,
                userProgress: progressMap.get(topic.id),
                isExpanded: false,
                isVisible: true,
                level: topic.depth || 0,
                hasChildren: false,
                isLoaded: true,
            };
            nodeMap.set(topic.id, node);
        });
        // Second pass: build parent-child relationships
        topics.forEach(topic => {
            if (topic.parentId) {
                if (!childrenMap.has(topic.parentId)) {
                    childrenMap.set(topic.parentId, []);
                }
                childrenMap.get(topic.parentId).push(topic.id);
            }
            else {
                this.state.rootNodes.push(topic.id);
            }
        });
        // Third pass: set children and hasChildren flag
        nodeMap.forEach((node, nodeId) => {
            const childIds = childrenMap.get(nodeId) || [];
            node.hasChildren = childIds.length > 0;
            node.children = childIds.map(childId => nodeMap.get(childId)).filter(Boolean);
        });
        this.state.nodes = nodeMap;
        this.updateVisibleNodes();
        this.notifyUpdate();
    }
    /**
     * Toggle node expansion
     */
    toggleNode(nodeId) {
        const node = this.state.nodes.get(nodeId);
        if (!node)
            return;
        if (this.state.expandedNodes.has(nodeId)) {
            this.state.expandedNodes.delete(nodeId);
            node.isExpanded = false;
        }
        else {
            this.state.expandedNodes.add(nodeId);
            node.isExpanded = true;
            // Lazy load children if needed
            if (node.hasChildren && (!node.children || node.children.length === 0)) {
                this.lazyLoadChildren(nodeId);
            }
        }
        this.updateVisibleNodes();
        this.notifyUpdate();
    }
    /**
     * Expand node to a specific level
     */
    expandToLevel(level) {
        this.state.nodes.forEach((node, nodeId) => {
            if (node.level !== undefined && node.level <= level && node.hasChildren) {
                this.state.expandedNodes.add(nodeId);
                node.isExpanded = true;
            }
        });
        this.updateVisibleNodes();
        this.notifyUpdate();
    }
    /**
     * Collapse all nodes
     */
    collapseAll() {
        this.state.expandedNodes.clear();
        this.state.nodes.forEach(node => {
            node.isExpanded = false;
        });
        this.updateVisibleNodes();
        this.notifyUpdate();
    }
    /**
     * Search nodes
     */
    search(query) {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, this.config.searchDebounceMs);
    }
    /**
     * Select a node
     */
    selectNode(nodeId) {
        this.state.selectedNode = nodeId;
        this.notifyUpdate();
    }
    /**
     * Update user progress for a node
     */
    updateProgress(nodeId, progress) {
        const node = this.state.nodes.get(nodeId);
        if (!node)
            return;
        if (node.userProgress) {
            Object.assign(node.userProgress, progress);
        }
        else {
            node.userProgress = progress;
        }
        this.notifyUpdate();
    }
    /**
     * Get virtualized items for rendering
     */
    getVirtualizedItems(scrollTop) {
        const startIndex = Math.floor(scrollTop / this.config.itemHeight);
        const endIndex = Math.min(startIndex + Math.ceil(this.config.containerHeight / this.config.itemHeight) + this.config.overscan, this.state.visibleNodes.length);
        const items = [];
        for (let i = Math.max(0, startIndex - this.config.overscan); i < endIndex; i++) {
            const nodeId = this.state.visibleNodes[i];
            const node = this.state.nodes.get(nodeId);
            if (node) {
                items.push({
                    id: nodeId,
                    index: i,
                    height: this.config.itemHeight,
                    offset: i * this.config.itemHeight,
                    data: node,
                });
            }
        }
        return items;
    }
    /**
     * Get current state
     */
    getState() {
        return this.state;
    }
    /**
     * Subscribe to state updates
     */
    subscribe(callback) {
        this.updateCallbacks.add(callback);
        return () => {
            this.updateCallbacks.delete(callback);
        };
    }
    /**
     * Get tree statistics
     */
    getStats() {
        let maxDepth = 0;
        this.state.nodes.forEach(node => {
            if (node.level !== undefined && node.level > maxDepth) {
                maxDepth = node.level;
            }
        });
        // Rough memory usage calculation
        const memoryUsage = this.state.nodes.size * 1024 + // Approximate node size
            this.state.visibleNodes.length * 32 + // Visible nodes array
            this.state.virtualizedItems.length * 128; // Virtualized items
        return {
            totalNodes: this.state.nodes.size,
            visibleNodes: this.state.visibleNodes.length,
            expandedNodes: this.state.expandedNodes.size,
            maxDepth,
            loadingNodes: this.state.loadingNodes.size,
            memoryUsage,
        };
    }
    // Private methods
    updateVisibleNodes() {
        const visibleNodes = [];
        const addVisibleNodes = (nodeIds, level = 0) => {
            for (const nodeId of nodeIds) {
                const node = this.state.nodes.get(nodeId);
                if (!node)
                    continue;
                visibleNodes.push(nodeId);
                if (node.isExpanded && node.children) {
                    const childIds = node.children.map(child => child.id);
                    addVisibleNodes(childIds, level + 1);
                }
            }
        };
        if (this.state.searchResults.length > 0) {
            // Show search results
            visibleNodes.push(...this.state.searchResults);
        }
        else {
            // Show normal hierarchy
            addVisibleNodes(this.state.rootNodes);
        }
        this.state.visibleNodes = visibleNodes;
        this.updateVirtualizedItems();
    }
    updateVirtualizedItems() {
        this.state.virtualizedItems = this.state.visibleNodes.map((nodeId, index) => {
            const node = this.state.nodes.get(nodeId);
            return {
                id: nodeId,
                index,
                height: this.config.itemHeight,
                offset: index * this.config.itemHeight,
                data: node,
            };
        });
    }
    performSearch(query) {
        if (!query.trim()) {
            this.state.searchResults = [];
            this.updateVisibleNodes();
            this.notifyUpdate();
            return;
        }
        const results = [];
        const queryLower = query.toLowerCase();
        this.state.nodes.forEach((node, nodeId) => {
            const titleMatch = node.title.toLowerCase().includes(queryLower);
            const summaryMatch = node.summary?.toLowerCase().includes(queryLower);
            const descriptionMatch = node.description?.toLowerCase().includes(queryLower);
            if (titleMatch || summaryMatch || descriptionMatch) {
                results.push(nodeId);
            }
        });
        this.state.searchResults = results;
        this.updateVisibleNodes();
        this.notifyUpdate();
    }
    async lazyLoadChildren(nodeId) {
        if (this.state.loadingNodes.has(nodeId))
            return;
        this.state.loadingNodes.add(nodeId);
        this.notifyUpdate();
        try {
            // This would be replaced with actual API call
            // const children = await loadTopicChildren(nodeId);
            // For now, we'll simulate loading
            await new Promise(resolve => setTimeout(resolve, 500));
            // Update node as loaded
            const node = this.state.nodes.get(nodeId);
            if (node) {
                node.isLoaded = true;
            }
        }
        catch (error) {
            console.error(`Failed to load children for node ${nodeId}:`, error);
        }
        finally {
            this.state.loadingNodes.delete(nodeId);
            this.notifyUpdate();
        }
    }
    notifyUpdate() {
        this.updateCallbacks.forEach(callback => {
            try {
                callback();
            }
            catch (error) {
                console.error('Error in update callback:', error);
            }
        });
    }
}
/**
 * React hook for using the topic tree optimizer
 */
export function useTopicTreeOptimizer(topics, userProgress = [], config = {}) {
    const optimizerRef = useRef(null);
    const forceUpdateRef = useRef();
    // Initialize optimizer
    if (!optimizerRef.current) {
        optimizerRef.current = new TopicTreeOptimizer(config);
    }
    // Force update function
    const forceUpdate = useCallback(() => {
        if (forceUpdateRef.current) {
            forceUpdateRef.current();
        }
    }, []);
    // Subscribe to updates
    useEffect(() => {
        const optimizer = optimizerRef.current;
        const unsubscribe = optimizer.subscribe(forceUpdate);
        return unsubscribe;
    }, [forceUpdate]);
    // Initialize tree when topics change
    useEffect(() => {
        if (optimizerRef.current && topics.length > 0) {
            optimizerRef.current.initializeTree(topics, userProgress);
        }
    }, [topics, userProgress]);
    // Memoized methods
    const methods = useMemo(() => ({
        toggleNode: (nodeId) => optimizerRef.current?.toggleNode(nodeId),
        expandToLevel: (level) => optimizerRef.current?.expandToLevel(level),
        collapseAll: () => optimizerRef.current?.collapseAll(),
        search: (query) => optimizerRef.current?.search(query),
        selectNode: (nodeId) => optimizerRef.current?.selectNode(nodeId),
        updateProgress: (nodeId, progress) => optimizerRef.current?.updateProgress(nodeId, progress),
        getVirtualizedItems: (scrollTop) => optimizerRef.current?.getVirtualizedItems(scrollTop) || [],
        getState: () => optimizerRef.current?.getState(),
        getStats: () => optimizerRef.current?.getStats(),
    }), []);
    return methods;
}
export { TopicTreeOptimizer };
//# sourceMappingURL=topicTreeOptimizer.js.map