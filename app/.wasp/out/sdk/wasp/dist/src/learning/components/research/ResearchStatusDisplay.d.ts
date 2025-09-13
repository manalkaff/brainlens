import React from 'react';
interface ResearchStatusDisplayProps {
    topicId: string;
    topicTitle: string;
    onCancel?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onRetry?: () => void;
    className?: string;
    showDetailedProgress?: boolean;
    showAgentStatus?: boolean;
    showEstimatedTime?: boolean;
}
export declare const ResearchStatusDisplay: React.FC<ResearchStatusDisplayProps>;
export default ResearchStatusDisplay;
//# sourceMappingURL=ResearchStatusDisplay.d.ts.map