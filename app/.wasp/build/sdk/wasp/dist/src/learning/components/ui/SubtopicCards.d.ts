import React from 'react';
import { TopicTreeItem } from './TopicTree';
export interface SubtopicCard {
    id: string;
    title: string;
    description: string;
    complexity: 'beginner' | 'intermediate' | 'advanced';
    priority: number;
    estimatedReadTime: number;
    hasContent: boolean;
    topic: TopicTreeItem;
}
interface SubtopicCardsProps {
    subtopics: SubtopicCard[];
    onSubtopicClick: (subtopic: TopicTreeItem) => void;
    selectedSubtopicId?: string;
    isGeneratingContent?: boolean;
    className?: string;
}
export declare function SubtopicCards({ subtopics, onSubtopicClick, selectedSubtopicId, isGeneratingContent, className }: SubtopicCardsProps): React.JSX.Element | null;
export declare function topicToSubtopicCard(topic: TopicTreeItem): SubtopicCard;
export declare function topicsToSubtopicCards(topics: TopicTreeItem[]): SubtopicCard[];
export {};
//# sourceMappingURL=SubtopicCards.d.ts.map