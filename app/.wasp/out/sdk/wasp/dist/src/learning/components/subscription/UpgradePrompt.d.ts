import React from 'react';
interface UpgradePromptProps {
    reason: 'credits' | 'feature_limit';
    operation: string;
    currentCredits?: number;
    requiredCredits?: number;
    resetDate?: Date;
    isSubscribed?: boolean;
    subscriptionPlan?: string;
    usageStats?: {
        topicsThisMonth: number;
        chatMessagesToday: number;
        quizzesThisWeek: number;
        limits: {
            topicsPerMonth: number;
            chatMessagesPerDay: number;
            quizzesPerWeek: number;
        };
    };
    onClose?: () => void;
}
export declare function UpgradePrompt({ reason, operation, currentCredits, requiredCredits, resetDate, isSubscribed, subscriptionPlan, usageStats, onClose }: UpgradePromptProps): React.JSX.Element;
export declare function useUpgradePrompt(): {
    upgradePrompt: {
        show: boolean;
        props: Partial<UpgradePromptProps>;
    };
    showUpgradePrompt: (props: Partial<UpgradePromptProps>) => void;
    hideUpgradePrompt: () => void;
};
export {};
//# sourceMappingURL=UpgradePrompt.d.ts.map