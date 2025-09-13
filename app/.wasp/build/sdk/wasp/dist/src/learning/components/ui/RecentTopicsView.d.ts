import React from 'react';
import type { TopicTreeItem } from './TopicTree';
interface RecentTopicsViewProps {
    recentTopics: TopicTreeItem[];
    onTopicSelect: (topic: TopicTreeItem) => void;
    onToggleBookmark: (topicId: string) => void;
    bookmarkedTopics: string[];
    selectedTopicId?: string;
}
export declare function RecentTopicsView({ recentTopics, onTopicSelect, onToggleBookmark, bookmarkedTopics, selectedTopicId }: RecentTopicsViewProps): React.JSX.Element;
export {};
//# sourceMappingURL=RecentTopicsView.d.ts.map