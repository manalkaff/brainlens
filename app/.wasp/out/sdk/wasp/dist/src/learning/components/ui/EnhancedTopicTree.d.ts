import React from 'react';
import { type TopicTreeItem } from './TopicTree';
interface EnhancedTopicTreeProps {
    topics: TopicTreeItem[];
    selectedTopicId?: string;
    selectedTopicPath?: string[];
    onTopicSelect: (topic: TopicTreeItem, path?: string[]) => void;
    onGenerateSubtopics?: (topicId: string) => void;
    isGenerating?: boolean;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    compact?: boolean;
    autoExpandSelected?: boolean;
    persistExpansion?: boolean;
}
/**
 * Enhanced TopicTree component that provides backward compatibility
 * while implementing new path-based selection and proper state management
 */
export declare function EnhancedTopicTree({ topics, selectedTopicId, selectedTopicPath: propSelectedTopicPath, onTopicSelect, onGenerateSubtopics, isGenerating, searchQuery, onSearchChange, compact, autoExpandSelected, persistExpansion }: EnhancedTopicTreeProps): React.JSX.Element;
export { TopicTree } from './TopicTree';
export type { TopicTreeItem } from './TopicTree';
//# sourceMappingURL=EnhancedTopicTree.d.ts.map