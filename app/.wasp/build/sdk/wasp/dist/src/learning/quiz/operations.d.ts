import type { GenerateQuiz, SubmitQuizAnswer, GetUserQuizzes, GetQuiz } from 'wasp/server/operations';
import type { Quiz, QuizQuestion } from 'wasp/entities';
type GenerateQuizInput = {
    topicId: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
};
export declare const generateQuiz: GenerateQuiz<GenerateQuizInput, Quiz>;
type SubmitQuizAnswerInput = {
    quizId: string;
    questionId: string;
    userAnswer: string;
};
type SubmitQuizAnswerOutput = {
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
    currentScore: number;
    totalQuestions: number;
    isQuizCompleted: boolean;
};
export declare const submitQuizAnswer: SubmitQuizAnswer<SubmitQuizAnswerInput, SubmitQuizAnswerOutput>;
type GetUserQuizzesInput = {
    topicId?: string;
    completed?: boolean;
    limit?: number;
    offset?: number;
};
type GetUserQuizzesOutput = {
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
    total: number;
    hasMore: boolean;
};
export declare const getUserQuizzes: GetUserQuizzes<GetUserQuizzesInput, GetUserQuizzesOutput>;
type GetQuizInput = {
    quizId: string;
};
type GetQuizOutput = Quiz & {
    questions: QuizQuestion[];
    topic: {
        id: string;
        title: string;
        slug: string;
    };
};
export declare const getQuiz: GetQuiz<GetQuizInput, GetQuizOutput>;
export {};
//# sourceMappingURL=operations.d.ts.map