import React from 'react';
interface OnboardingFlowProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    currentTab?: string;
}
export declare function OnboardingFlow({ isOpen, onClose, onComplete, currentTab }: OnboardingFlowProps): React.JSX.Element;
export declare function useOnboarding(): {
    hasSeenOnboarding: boolean;
    showOnboarding: boolean;
    setShowOnboarding: React.Dispatch<React.SetStateAction<boolean>>;
    completeOnboarding: () => void;
    resetOnboarding: () => void;
};
export {};
//# sourceMappingURL=OnboardingFlow.d.ts.map