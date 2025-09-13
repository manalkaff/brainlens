import React from 'react';
interface ContextualTooltipProps {
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    trigger?: React.ReactNode;
    className?: string;
}
export declare function ContextualTooltip({ title, content, position, trigger, className }: ContextualTooltipProps): React.JSX.Element;
export declare const HelpTooltips: {
    knowledgeAssessment: {
        title: string;
        content: string;
    };
    learningPaths: {
        title: string;
        content: string;
    };
    streamingContent: {
        title: string;
        content: string;
    };
    conceptExpansion: {
        title: string;
        content: string;
    };
    topicTree: {
        title: string;
        content: string;
    };
    vectorSearch: {
        title: string;
        content: string;
    };
    mindMapNavigation: {
        title: string;
        content: string;
    };
    adaptiveQuiz: {
        title: string;
        content: string;
    };
    progressTracking: {
        title: string;
        content: string;
    };
    bookmarking: {
        title: string;
        content: string;
    };
};
interface QuickHelpProps {
    type: keyof typeof HelpTooltips;
    position?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
}
export declare function QuickHelp({ type, position, className }: QuickHelpProps): React.JSX.Element;
export {};
//# sourceMappingURL=ContextualTooltip.d.ts.map