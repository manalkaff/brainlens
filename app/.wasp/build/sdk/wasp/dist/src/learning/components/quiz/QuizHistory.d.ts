import React from 'react';
import type { Quiz } from 'wasp/entities';
interface QuizHistoryProps {
    quizzes: (Quiz & {
        topic: {
            id: string;
            title: string;
            slug: string;
        };
        _count: {
            questions: number;
        };
    })[];
    onViewQuiz: (quiz: Quiz) => void;
    onRetakeQuiz: (topicId: string) => void;
}
export declare function QuizHistory({ quizzes, onViewQuiz, onRetakeQuiz }: QuizHistoryProps): React.JSX.Element;
export {};
//# sourceMappingURL=QuizHistory.d.ts.map