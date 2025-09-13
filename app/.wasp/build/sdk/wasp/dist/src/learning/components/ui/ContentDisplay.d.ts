import React from 'react';
import type { TopicTreeItem } from './TopicTree';
interface SourceAttribution {
    id: string;
    title: string;
    url?: string;
    source: string;
    contentType: string;
    relevanceScore?: number;
    engine?: string;
}
interface ContentDisplayProps {
    topic: TopicTreeItem;
    content?: string;
    sources?: SourceAttribution[];
    subtopics?: TopicTreeItem[];
    isGenerating?: boolean;
    onSubtopicClick: (subtopic: TopicTreeItem) => void;
    onGenerateContent: () => void;
    navigationPath: {
        title: string;
        path: string[];
        topic: TopicTreeItem;
    }[];
    onNavigateToPath: (path: string[]) => void;
    selectedSubtopicId?: string;
    error?: string | null;
    onRetryGeneration?: () => void;
    onClearError?: () => void;
    bookmarks?: string[];
    onToggleBookmark?: (sectionId: string) => void;
    onMarkAsRead?: (sectionId: string) => void;
    isBookmarked?: (sectionId: string) => boolean;
    isRead?: (sectionId: string) => boolean;
    onAnalyticsEvent?: (event: string, data: any) => void;
    className?: string;
}
export declare function ContentDisplay({ topic, content, sources, subtopics, isGenerating, onSubtopicClick, onGenerateContent, navigationPath, onNavigateToPath, selectedSubtopicId, error, onRetryGeneration, onClearError, bookmarks, onToggleBookmark, onMarkAsRead, isBookmarked, isRead, onAnalyticsEvent, className }: ContentDisplayProps): React.JSX.Element;
export default ContentDisplay;
//# sourceMappingURL=ContentDisplay.d.ts.map