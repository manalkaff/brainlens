import React from 'react';
interface SourceAttribution {
    id: string;
    title: string;
    url?: string;
    source: string;
    contentType: string;
    relevanceScore?: number;
}
interface MDXContentProps {
    content: string;
    topicTitle: string;
    sources?: SourceAttribution[];
    bookmarks: string[];
    onToggleBookmark: (sectionId: string) => void;
    onMarkAsRead: (sectionId: string) => void;
    isBookmarked: (sectionId: string) => boolean;
    isRead: (sectionId: string) => boolean;
    isSubtopic?: boolean;
    onBackToMain?: () => void;
}
export declare function MDXContent({ content, topicTitle, sources, bookmarks, onToggleBookmark, onMarkAsRead, isBookmarked, isRead }: MDXContentProps): React.JSX.Element;
export {};
//# sourceMappingURL=MDXContent.d.ts.map