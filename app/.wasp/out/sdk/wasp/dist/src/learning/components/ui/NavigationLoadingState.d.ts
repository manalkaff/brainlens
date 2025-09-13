import React from 'react';
interface NavigationLoadingStateProps {
    type: 'navigation' | 'content_generation' | 'subtopic_expansion';
    message?: string;
    progress?: number;
    topicTitle?: string;
    className?: string;
}
export declare function NavigationLoadingState({ type, message, progress, topicTitle, className }: NavigationLoadingStateProps): React.JSX.Element;
interface CompactNavigationLoadingProps {
    type: 'navigation' | 'content_generation' | 'subtopic_expansion';
    message?: string;
    className?: string;
}
export declare function CompactNavigationLoading({ type, message, className }: CompactNavigationLoadingProps): React.JSX.Element;
interface NavigationLoadingOverlayProps {
    type: 'navigation' | 'content_generation' | 'subtopic_expansion';
    message?: string;
    progress?: number;
    className?: string;
}
export declare function NavigationLoadingOverlay({ type, message, progress, className }: NavigationLoadingOverlayProps): React.JSX.Element;
export default NavigationLoadingState;
//# sourceMappingURL=NavigationLoadingState.d.ts.map