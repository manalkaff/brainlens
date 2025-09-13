import React from 'react';
import type { TopicTreeItem } from './TopicTree';
interface DeepLinkManagerProps {
    currentTopic?: TopicTreeItem;
    generateShareableURL: (topic?: TopicTreeItem) => string;
    validateDeepLink: (subtopicPath: string[]) => {
        isValid: boolean;
        mainTopic: TopicTreeItem | null;
        targetTopic: TopicTreeItem | null;
        expandedNodes: string[];
        error?: string;
    };
    onNavigateToDeepLink?: (subtopicPath: string[]) => void;
    className?: string;
}
export declare function DeepLinkManager({ currentTopic, generateShareableURL, validateDeepLink, onNavigateToDeepLink, className }: DeepLinkManagerProps): React.JSX.Element;
export declare function useDeepLinkManager(): {
    isValidating: boolean;
    validateAndNavigate: (url: string, validateDeepLink: (path: string[]) => any, onNavigate: (path: string[]) => void) => Promise<{
        success: boolean;
        message: any;
    }>;
};
export {};
//# sourceMappingURL=DeepLinkManager.d.ts.map