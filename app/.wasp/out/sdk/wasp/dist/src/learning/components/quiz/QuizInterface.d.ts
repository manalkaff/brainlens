import React from 'react';
import type { Quiz, QuizQuestion } from 'wasp/entities';
interface QuizInterfaceProps {
    quiz: Quiz & {
        questions: QuizQuestion[];
    };
    onQuizComplete: (finalScore: number) => void;
    onExit: () => void;
}
export declare function QuizInterface({ quiz, onQuizComplete, onExit }: QuizInterfaceProps): React.JSX.Element;
export {};
//# sourceMappingURL=QuizInterface.d.ts.map