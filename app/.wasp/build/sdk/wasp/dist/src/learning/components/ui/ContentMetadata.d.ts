import React from 'react';
import type { TopicTreeItem } from './TopicTree';
interface SourceAttribution {
    id: string;
    title: string;
    url?: string;
    source: string;
    contentType: string;
    relevanceScore?: number;
}
interface ContentMetadataProps {
    topic: TopicTreeItem;
    parentTopic?: TopicTreeItem;
    sources?: SourceAttribution[];
    estimatedReadTime?: number;
    complexity?: 'beginner' | 'intermediate' | 'advanced';
    prerequisites?: string[];
    learningObjectives?: string[];
    topicPosition?: {
        current: number;
        total: number;
    };
    className?: string;
    compact?: boolean;
}
export declare function calculateReadTime(content: string, wordsPerMinute?: number): number;
export declare function determineComplexity(topic: TopicTreeItem, content?: string): 'beginner' | 'intermediate' | 'advanced';
export declare function extractLearningObjectives(topic: TopicTreeItem): string[];
export declare function ContentMetadata({ topic, parentTopic, sources, estimatedReadTime, complexity, prerequisites, learningObjectives, topicPosition, className, compact }: ContentMetadataProps): React.JSX.Element;
export default ContentMetadata;
//# sourceMappingURL=ContentMetadata.d.ts.map