import { QuestionType } from '@prisma/client';
import type { Topic, UserTopicProgress, VectorDocument, GeneratedContent } from 'wasp/entities';
export interface QuizQuestion {
    question: string;
    type: QuestionType;
    options: string[];
    correctAnswer: string;
    explanation: string;
}
export interface GeneratedQuiz {
    title: string;
    questions: QuizQuestion[];
}
export interface QuizGenerationOptions {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questionCount: number;
    questionTypes: QuestionType[];
    focusAreas?: string[];
}
export declare function generateQuizWithAI(topic: Topic, userProgress: UserTopicProgress | null, vectorDocuments: VectorDocument[], generatedContent: GeneratedContent[], options: QuizGenerationOptions): Promise<GeneratedQuiz>;
export declare function adjustDifficultyBasedOnPerformance(currentDifficulty: 'beginner' | 'intermediate' | 'advanced', recentScores: number[]): 'beginner' | 'intermediate' | 'advanced';
export declare function getQuestionTypeDistribution(difficulty: 'beginner' | 'intermediate' | 'advanced'): QuestionType[];
//# sourceMappingURL=generator.d.ts.map