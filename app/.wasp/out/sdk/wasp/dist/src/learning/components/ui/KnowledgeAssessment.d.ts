import React from 'react';
interface KnowledgeAssessmentProps {
    onComplete: (preferences: AssessmentResult) => void;
    isLoading?: boolean;
}
export interface AssessmentResult {
    knowledgeLevel: number;
    learningStyles: string[];
    startingPoint: 'basics' | 'intermediate' | 'advanced';
    preferences: {
        difficultyPreference: 'gentle' | 'moderate' | 'challenging';
        contentDepth: 'overview' | 'detailed' | 'comprehensive';
        pacePreference: 'slow' | 'moderate' | 'fast';
    };
}
export declare function KnowledgeAssessment({ onComplete, isLoading }: KnowledgeAssessmentProps): React.JSX.Element | null;
export {};
//# sourceMappingURL=KnowledgeAssessment.d.ts.map