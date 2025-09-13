import React from 'react';
import type { TopicTreeItem } from './TopicTree';
interface ContentPlaceholderProps {
    topic: TopicTreeItem;
    onGenerateContent: () => void;
    isGeneratingContent: boolean;
    error?: string | null;
    onClearError?: () => void;
}
export declare function ContentPlaceholder({ topic, onGenerateContent, isGeneratingContent, error, onClearError }: ContentPlaceholderProps): React.JSX.Element;
export {};
//# sourceMappingURL=ContentPlaceholder.d.ts.map