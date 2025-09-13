/**
 * Client-side state management optimization for large topic trees
 * Implements virtualization, lazy loading, and efficient updates
 */
import type { Topic, UserTopicProgress } from 'wasp/entities';
interface TopicNode extends Topic {
    children?: TopicNode[];
    userProgress?: UserTopicProgress;
    isExpanded?: boolean;
    isVisible?: boolean;
    level?: number;
    hasChildren?: boolean;
    isLoaded?: boolean;
}
interface VirtualizedItem {
    id: string;
    index: number;
    height: number;
    offset: number;
    data: TopicNode;
}
interface TopicTreeState {
    nodes: Map<string, TopicNode>;
    rootNodes: string[];
    expandedNodes: Set<string>;
    visibleNodes: string[];
    virtualizedItems: VirtualizedItem[];
    searchResults: string[];
    selectedNode: string | null;
    loadingNodes: Set<string>;
}
interface TopicTreeConfig {
    itemHeight: number;
    containerHeight: number;
    overscan: number;
    maxVisibleItems: number;
    lazyLoadThreshold: number;
    searchDebounceMs: number;
}
declare class TopicTreeOptimizer {
    private state;
    private config;
    private updateCallbacks;
    private searchTimeout;
    constructor(config?: Partial<TopicTreeConfig>);
    /**
     * Initialize tree with topic data
     */
    initializeTree(topics: Topic[], userProgress?: UserTopicProgress[]): void;
    /**
     * Toggle node expansion
     */
    toggleNode(nodeId: string): void;
    /**
     * Expand node to a specific level
     */
    expandToLevel(level: number): void;
    /**
     * Collapse all nodes
     */
    collapseAll(): void;
    /**
     * Search nodes
     */
    search(query: string): void;
    /**
     * Select a node
     */
    selectNode(nodeId: string | null): void;
    /**
     * Update user progress for a node
     */
    updateProgress(nodeId: string, progress: Partial<UserTopicProgress>): void;
    /**
     * Get virtualized items for rendering
     */
    getVirtualizedItems(scrollTop: number): VirtualizedItem[];
    /**
     * Get current state
     */
    getState(): Readonly<TopicTreeState>;
    /**
     * Subscribe to state updates
     */
    subscribe(callback: () => void): () => void;
    /**
     * Get tree statistics
     */
    getStats(): {
        totalNodes: number;
        visibleNodes: number;
        expandedNodes: number;
        maxDepth: number;
        loadingNodes: number;
        memoryUsage: number;
    };
    private updateVisibleNodes;
    private updateVirtualizedItems;
    private performSearch;
    private lazyLoadChildren;
    private notifyUpdate;
}
/**
 * React hook for using the topic tree optimizer
 */
export declare function useTopicTreeOptimizer(topics: Topic[], userProgress?: UserTopicProgress[], config?: Partial<TopicTreeConfig>): {
    toggleNode: (nodeId: string) => void | undefined;
    expandToLevel: (level: number) => void | undefined;
    collapseAll: () => void | undefined;
    search: (query: string) => void | undefined;
    selectNode: (nodeId: string | null) => void | undefined;
    updateProgress: (nodeId: string, progress: Partial<UserTopicProgress>) => void | undefined;
    getVirtualizedItems: (scrollTop: number) => VirtualizedItem[];
    getState: () => Readonly<TopicTreeState> | undefined;
    getStats: () => {
        totalNodes: number;
        visibleNodes: number;
        expandedNodes: number;
        maxDepth: number;
        loadingNodes: number;
        memoryUsage: number;
    } | undefined;
};
export { TopicTreeOptimizer, type TopicNode, type VirtualizedItem, type TopicTreeConfig };
//# sourceMappingURL=topicTreeOptimizer.d.ts.map