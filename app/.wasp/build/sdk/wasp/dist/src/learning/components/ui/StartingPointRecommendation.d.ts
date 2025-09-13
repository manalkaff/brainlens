import React from 'react';
import { AssessmentResult } from './KnowledgeAssessment';
interface StartingPointRecommendationProps {
    assessment: AssessmentResult;
    onStartLearning: (path: LearningPath) => void;
    isLoading?: boolean;
}
export interface LearningPath {
    id: string;
    title: string;
    description: string;
    estimatedTime: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    topics: string[];
    recommended: boolean;
}
export declare function StartingPointRecommendation({ assessment, onStartLearning, isLoading }: StartingPointRecommendationProps): React.JSX.Element | null;
export {};
//# sourceMappingURL=StartingPointRecommendation.d.ts.map