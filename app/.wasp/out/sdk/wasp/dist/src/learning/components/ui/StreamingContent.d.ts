import React from 'react';
interface StreamingContentProps {
    topic: {
        id: string;
        title: string;
        summary?: string;
    };
    assessment: any;
    selectedPath: any;
    onProgressUpdate: (progress: number) => Promise<void>;
    onConceptExpand: (concept: string) => void;
    content?: string;
    isStreaming?: boolean;
    isComplete?: boolean;
    error?: string | null;
    title?: string;
    subtitle?: string;
    agent?: string;
    progress?: number;
    estimatedTime?: number;
    onRetry?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    className?: string;
    showTypewriter?: boolean;
    typewriterSpeed?: number;
    showProgress?: boolean;
    showAgent?: boolean;
}
export declare const StreamingContent: React.FC<StreamingContentProps>;
interface StreamingSectionProps {
    sections: Array<{
        id: string;
        title: string;
        content: string;
        isComplete: boolean;
        isActive: boolean;
        agent?: string;
        progress?: number;
    }>;
    currentSectionIndex: number;
    overallProgress: number;
    isStreaming: boolean;
    error?: string | null;
    onRetry?: () => void;
    className?: string;
}
export declare const StreamingSections: React.FC<StreamingSectionProps>;
export default StreamingContent;
//# sourceMappingURL=StreamingContent.d.ts.map