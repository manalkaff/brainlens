import React from 'react';
import type { TopicTreeItem } from './TopicTree';
interface ContentHeaderProps {
    topic: TopicTreeItem;
    isSubtopic: boolean;
    parentTopic?: TopicTreeItem | null;
    onBookmarkToggle: () => void;
    isBookmarked: boolean;
    isRead: boolean;
    onMarkAsRead: () => void;
}
export declare function ContentHeader({ topic, isSubtopic, parentTopic, onBookmarkToggle, isBookmarked, isRead, onMarkAsRead }: ContentHeaderProps): React.JSX.Element;
export {};
//# sourceMappingURL=ContentHeader.d.ts.map