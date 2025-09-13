/**
 * Client-side state management optimization for large topic trees
 * Implements virtualization, lazy loading, and efficient updates
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
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

const DEFAULT_CONFIG: TopicTreeConfig = {
  itemHeight: 48,
  containerHeight: 600,
  overscan: 5,
  maxVisibleItems: 100,
  lazyLoadThreshold: 3,
  searchDebounceMs: 300,
};

class TopicTreeOptimizer {
  private state: TopicTreeState;
  private config: TopicTreeConfig;
  private updateCallbacks: Set<() => void> = new Set();
  private searchTimeout: NodeJS.Timeout | null = null;

  constructor(config: Partial<TopicTreeConfig> = {}) {
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
  initializeTree(topics: Topic[], userProgress: UserTopicProgress[] = []): void {
    // Clear existing state
    this.state.nodes.clear();
    this.state.rootNodes = [];
    this.state.expandedNodes.clear();

    // Create progress lookup
    const progressMap = new Map<string, UserTopicProgress>();
    userProgress.forEach(progress => {
      progressMap.set(progress.topicId, progress);
    });

    // Build node map and hierarchy
    const nodeMap = new Map<string, TopicNode>();
    const childrenMap = new Map<string, string[]>();

    // First pass: create all nodes
    topics.forEach(topic => {
      const node: TopicNode = {
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
        childrenMap.get(topic.parentId)!.push(topic.id);
      } else {
        this.state.rootNodes.push(topic.id);
      }
    });

    // Third pass: set children and hasChildren flag
    nodeMap.forEach((node, nodeId) => {
      const childIds = childrenMap.get(nodeId) || [];
      node.hasChildren = childIds.length > 0;
      node.children = childIds.map(childId => nodeMap.get(childId)!).filter(Boolean);
    });

    this.state.nodes = nodeMap;
    this.updateVisibleNodes();
    this.notifyUpdate();
  }

  /**
   * Toggle node expansion
   */
  toggleNode(nodeId: string): void {
    const node = this.state.nodes.get(nodeId);
    if (!node) return;

    if (this.state.expandedNodes.has(nodeId)) {
      this.state.expandedNodes.delete(nodeId);
      node.isExpanded = false;
    } else {
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
  expandToLevel(level: number): void {
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
  collapseAll(): void {
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
  search(query: string): void {
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
  selectNode(nodeId: string | null): void {
    this.state.selectedNode = nodeId;
    this.notifyUpdate();
  }

  /**
   * Update user progress for a node
   */
  updateProgress(nodeId: string, progress: Partial<UserTopicProgress>): void {
    const node = this.state.nodes.get(nodeId);
    if (!node) return;

    if (node.userProgress) {
      Object.assign(node.userProgress, progress);
    } else {
      node.userProgress = progress as UserTopicProgress;
    }

    this.notifyUpdate();
  }

  /**
   * Get virtualized items for rendering
   */
  getVirtualizedItems(scrollTop: number): VirtualizedItem[] {
    const startIndex = Math.floor(scrollTop / this.config.itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(this.config.containerHeight / this.config.itemHeight) + this.config.overscan,
      this.state.visibleNodes.length
    );

    const items: VirtualizedItem[] = [];
    
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
  getState(): Readonly<TopicTreeState> {
    return this.state;
  }

  /**
   * Subscribe to state updates
   */
  subscribe(callback: () => void): () => void {
    this.updateCallbacks.add(callback);
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

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
  } {
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

  private updateVisibleNodes(): void {
    const visibleNodes: string[] = [];
    
    const addVisibleNodes = (nodeIds: string[], level: number = 0) => {
      for (const nodeId of nodeIds) {
        const node = this.state.nodes.get(nodeId);
        if (!node) continue;

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
    } else {
      // Show normal hierarchy
      addVisibleNodes(this.state.rootNodes);
    }

    this.state.visibleNodes = visibleNodes;
    this.updateVirtualizedItems();
  }

  private updateVirtualizedItems(): void {
    this.state.virtualizedItems = this.state.visibleNodes.map((nodeId, index) => {
      const node = this.state.nodes.get(nodeId)!;
      return {
        id: nodeId,
        index,
        height: this.config.itemHeight,
        offset: index * this.config.itemHeight,
        data: node,
      };
    });
  }

  private performSearch(query: string): void {
    if (!query.trim()) {
      this.state.searchResults = [];
      this.updateVisibleNodes();
      this.notifyUpdate();
      return;
    }

    const results: string[] = [];
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

  private async lazyLoadChildren(nodeId: string): Promise<void> {
    if (this.state.loadingNodes.has(nodeId)) return;

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
    } catch (error) {
      console.error(`Failed to load children for node ${nodeId}:`, error);
    } finally {
      this.state.loadingNodes.delete(nodeId);
      this.notifyUpdate();
    }
  }

  private notifyUpdate(): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in update callback:', error);
      }
    });
  }
}

/**
 * React hook for using the topic tree optimizer
 */
export function useTopicTreeOptimizer(
  topics: Topic[],
  userProgress: UserTopicProgress[] = [],
  config: Partial<TopicTreeConfig> = {}
) {
  const optimizerRef = useRef<TopicTreeOptimizer | null>(null);
  const forceUpdateRef = useRef<() => void>();

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
    const optimizer = optimizerRef.current!;
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
    toggleNode: (nodeId: string) => optimizerRef.current?.toggleNode(nodeId),
    expandToLevel: (level: number) => optimizerRef.current?.expandToLevel(level),
    collapseAll: () => optimizerRef.current?.collapseAll(),
    search: (query: string) => optimizerRef.current?.search(query),
    selectNode: (nodeId: string | null) => optimizerRef.current?.selectNode(nodeId),
    updateProgress: (nodeId: string, progress: Partial<UserTopicProgress>) => 
      optimizerRef.current?.updateProgress(nodeId, progress),
    getVirtualizedItems: (scrollTop: number) => 
      optimizerRef.current?.getVirtualizedItems(scrollTop) || [],
    getState: () => optimizerRef.current?.getState(),
    getStats: () => optimizerRef.current?.getStats(),
  }), []);

  return methods;
}

export { TopicTreeOptimizer, type TopicNode, type VirtualizedItem, type TopicTreeConfig };