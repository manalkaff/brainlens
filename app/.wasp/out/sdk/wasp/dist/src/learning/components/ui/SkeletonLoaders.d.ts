import React from 'react';
export declare function TopicTreeSkeleton(): React.JSX.Element;
export declare function ContentSkeleton(): React.JSX.Element;
export declare function SubtopicCardsSkeleton({ count }: {
    count?: number;
}): React.JSX.Element;
export declare function BreadcrumbSkeleton(): React.JSX.Element;
export declare function ContentHeaderSkeleton(): React.JSX.Element;
export declare function NavigationSkeleton(): React.JSX.Element;
interface LoadingStateProps {
    message?: string;
    showSpinner?: boolean;
}
export declare function LoadingState({ message, showSpinner }: LoadingStateProps): React.JSX.Element;
export declare function ContentGenerationSkeleton(): React.JSX.Element;
export {};
//# sourceMappingURL=SkeletonLoaders.d.ts.map