import React from 'react';
import type { Quiz, QuizQuestion } from 'wasp/entities';
interface QuizResultsProps {
    quiz: Quiz & {
        questions: QuizQuestion[];
    };
    timeElapsed: number;
    onRetakeQuiz: () => void;
    onBackToQuizzes: () => void;
}
export declare function QuizResults({ quiz, timeElapsed, onRetakeQuiz, onBackToQuizzes }: QuizResultsProps): React.JSX.Element;
export {};
//# sourceMappingURL=QuizResults.d.ts.map