import type { TopicTreeItem } from '../components/ui/TopicTree';
interface UseTopicTreeStateOptions {
    topics: TopicTreeItem[];
    selectedTopicPath?: string[];
    autoExpandSelected?: boolean;
    persistExpansion?: boolean;
}
interface UseTopicTreeStateReturn {
    expandedNodes: Set<string>;
    onToggleExpand: (topicId: string) => void;
    expandPath: (path: string[]) => void;
    expandAll: () => void;
    collapseAll: () => void;
    ensurePathExpanded: (path: string[]) => void;
}
/**
 * Hook to manage TopicTree expand/collapse state with proper persistence
 * and automatic expansion for selected topics
 */
export declare function useTopicTreeState({ topics, selectedTopicPath, autoExpandSelected, persistExpansion }: UseTopicTreeStateOptions): UseTopicTreeStateReturn;
export {};
//# sourceMappingURL=useTopicTreeState.d.ts.map