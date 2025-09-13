import React from 'react';
export type TopicTreeItem = {
    id: string;
    slug: string;
    title: string;
    summary?: string | null;
    description?: string | null;
    depth: number;
    parentId?: string | null;
    status: string;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
    children: TopicTreeItem[];
    userProgress?: {
        id: string;
        userId: string;
        topicId: string;
        completed: boolean;
        timeSpent: number;
        lastAccessed: Date;
        preferences?: any;
        bookmarks: string[];
    };
};
interface TopicTreeProps {
    topics: TopicTreeItem[];
    selectedTopicPath: string[];
    onTopicSelect: (topic: TopicTreeItem, path: string[]) => void;
    onGenerateSubtopics?: (topicId: string) => void;
    expandedNodes: Set<string>;
    onToggleExpand: (topicId: string) => void;
    isGenerating?: boolean;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    compact?: boolean;
}
export declare function TopicTree({ topics, selectedTopicPath, onTopicSelect, onGenerateSubtopics, expandedNodes, onToggleExpand, isGenerating, searchQuery, onSearchChange, compact }: TopicTreeProps): React.JSX.Element;
export {};
//# sourceMappingURL=TopicTree.d.ts.map