import React from 'react';
interface ConceptExpansionProps {
    concept: string;
    topicTitle: string;
    onClose: () => void;
    onNavigateToSubtopic?: (subtopic: string) => void;
    surroundingContent?: string;
    userAssessment?: any;
}
export declare function ConceptExpansion({ concept, topicTitle, onClose, onNavigateToSubtopic, surroundingContent, userAssessment }: ConceptExpansionProps): React.JSX.Element | null;
export {};
//# sourceMappingURL=ConceptExpansion.d.ts.map