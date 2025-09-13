import React from 'react';
import type { TopicTreeItem } from './TopicTree';
interface BookmarksViewProps {
    bookmarkedTopics: string[];
    allTopics: TopicTreeItem[];
    onTopicSelect: (topic: TopicTreeItem) => void;
    onToggleBookmark: (topicId: string) => void;
    selectedTopicId?: string;
}
export declare function BookmarksView({ bookmarkedTopics, allTopics, onTopicSelect, onToggleBookmark, selectedTopicId }: BookmarksViewProps): React.JSX.Element;
export {};
//# sourceMappingURL=BookmarksView.d.ts.map