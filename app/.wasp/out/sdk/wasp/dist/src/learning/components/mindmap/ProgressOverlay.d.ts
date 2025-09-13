import React from 'react';
interface ProgressStats {
    total: number;
    completed: number;
    inProgress: number;
    completionRate: number;
    totalTimeSpent?: number;
    averageSessionTime?: number;
}
interface ProgressOverlayProps {
    stats: ProgressStats;
    onFocusProgress: (type: 'completed' | 'inProgress' | 'notStarted') => void;
    className?: string;
}
export declare function ProgressOverlay({ stats, onFocusProgress, className }: ProgressOverlayProps): React.JSX.Element;
export declare function CompactProgressOverlay({ stats, onFocusProgress, className }: ProgressOverlayProps): React.JSX.Element;
export {};
//# sourceMappingURL=ProgressOverlay.d.ts.map