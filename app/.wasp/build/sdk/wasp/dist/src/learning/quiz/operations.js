import { generateQuizWithAI, getQuestionTypeDistribution } from './generator';
import { consumeCredits } from '../subscription/operations';
import { withDatabaseErrorHandling, withAIServiceErrorHandling, validateInput, sanitizeInput, withRetry } from '../errors/errorHandler';
import { createAuthenticationError, createValidationError, createLearningError, ErrorType, ERROR_CODES } from '../errors/errorTypes';
// Determine difficulty based on user's demonstrated knowledge level
function determineDifficulty(userProgress, topic) {
    if (!userProgress) {
        return 'beginner';
    }
    const preferences = userProgress.preferences;
    const knowledgeLevel = preferences?.knowledgeLevel;
    if (knowledgeLevel) {
        return knowledgeLevel;
    }
    // Determine based on time spent and completion status
    const timeSpent = userProgress.timeSpent;
    const completed = userProgress.completed;
    if (completed && timeSpent > 3600) { // More than 1 hour and completed
        return 'advanced';
    }
    else if (timeSpent > 1800) { // More than 30 minutes
        return 'intermediate';
    }
    else {
        return 'beginner';
    }
}
export const generateQuiz = async (args, context) => {
    if (!context.user) {
        throw createAuthenticationError('Authentication required to generate quizzes');
    }
    // Assert user is defined after authentication check
    const user = context.user;
    const topicId = validateInput(args.topicId, (input) => {
        if (!input || typeof input !== 'string') {
            throw new Error('Topic ID is required');
        }
        return input;
    }, 'topicId', { userId: user.id });
    const difficulty = args.difficulty;
    if (difficulty && !['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
        throw createValidationError('difficulty', 'Invalid difficulty level');
    }
    return withDatabaseErrorHandling(async () => {
        // Get topic and user progress
        const topic = await context.entities.Topic.findUnique({
            where: { id: topicId }
        });
        if (!topic) {
            throw createValidationError('topicId', 'Topic not found');
        }
        const userProgress = await context.entities.UserTopicProgress.findUnique({
            where: {
                userId_topicId: {
                    userId: user.id,
                    topicId
                }
            }
        });
        // Determine difficulty level
        const quizDifficulty = difficulty || determineDifficulty(userProgress, topic);
        // Get vector documents for context (from iterative research system)
        const vectorDocuments = await context.entities.VectorDocument.findMany({
            where: { topicId },
            take: 15, // Increased limit for better quiz generation
            orderBy: { createdAt: 'desc' }
        });
        // Check for generated content from iterative research system
        let generatedContent = [];
        generatedContent = await context.entities.GeneratedContent.findMany({
            where: {
                topicId,
                // Prioritize research-generated content
                OR: [
                    { contentType: 'exploration' },
                    { contentType: 'research' }
                ],
                NOT: {
                    userLevel: 'cache'
                }
            },
            take: 8, // Increased for more comprehensive quiz generation
            orderBy: { createdAt: 'desc' }
        });
        // Combine available content sources
        const hasContent = vectorDocuments.length > 0 || generatedContent.length > 0;
        if (!hasContent) {
            throw createLearningError(ErrorType.QUIZ_GENERATION_ERROR, ERROR_CODES.QUIZ_GENERATION_FAILED, 'No content available for quiz generation', {
                userMessage: 'This topic needs to be researched before a quiz can be generated. Please start research in the Explore tab first.',
                context: { topicId, userId: user.id, suggestion: 'use_iterative_research' }
            });
        }
        // Get question type distribution based on difficulty
        const questionTypes = getQuestionTypeDistribution(quizDifficulty);
        const questionCount = questionTypes.length;
        // Consume credits for quiz generation with retry
        await withRetry(() => consumeCredits(user.id, 'QUIZ_GENERATION', context, {
            topicId,
            difficulty: quizDifficulty,
            questionCount
        }), 3, 1000, 'CONSUME_QUIZ_CREDITS');
        // Generate quiz content using AI with error handling
        const quizGenerationOptions = {
            difficulty: quizDifficulty,
            questionCount,
            questionTypes
        };
        const quizContent = await withAIServiceErrorHandling(() => generateQuizWithAI(topic, userProgress, vectorDocuments, generatedContent, quizGenerationOptions), 'QUIZ_GENERATION_AI', { topicId, difficulty: quizDifficulty, questionCount });
        // Validate generated quiz content
        if (!quizContent.questions || quizContent.questions.length === 0) {
            throw createLearningError(ErrorType.QUIZ_GENERATION_ERROR, ERROR_CODES.QUIZ_GENERATION_FAILED, 'AI failed to generate quiz questions', {
                userMessage: 'Failed to generate quiz questions. Please try again.',
                context: { topicId, difficulty: quizDifficulty }
            });
        }
        // Sanitize quiz content
        const sanitizedQuestions = quizContent.questions.map((q) => ({
            question: sanitizeInput(q.question, 1000),
            type: q.type,
            options: q.options.map((option) => sanitizeInput(option, 500)),
            correctAnswer: sanitizeInput(q.correctAnswer, 500),
            explanation: q.explanation ? sanitizeInput(q.explanation, 1500) : null
        }));
        // Create quiz in database
        const quiz = await context.entities.Quiz.create({
            data: {
                topicId,
                userId: user.id,
                title: sanitizeInput(quizContent.title, 200),
                completed: false,
                questions: {
                    create: sanitizedQuestions
                }
            },
            include: {
                questions: true
            }
        });
        return quiz;
    }, 'GENERATE_QUIZ', { userId: user.id, topicId });
};
export const submitQuizAnswer = async (args, context) => {
    if (!context.user) {
        throw createAuthenticationError('Authentication required to submit quiz answers');
    }
    // Assert user is defined after authentication check
    const user = context.user;
    const quizId = validateInput(args.quizId, (input) => {
        if (!input || typeof input !== 'string') {
            throw new Error('Quiz ID is required');
        }
        return input;
    }, 'quizId', { userId: user.id });
    const questionId = validateInput(args.questionId, (input) => {
        if (!input || typeof input !== 'string') {
            throw new Error('Question ID is required');
        }
        return input;
    }, 'questionId', { userId: user.id, quizId });
    const userAnswer = validateInput(args.userAnswer, (input) => {
        if (input === undefined || input === null) {
            throw new Error('User answer is required');
        }
        if (typeof input !== 'string') {
            throw new Error('User answer must be a string');
        }
        return sanitizeInput(input, 500);
    }, 'userAnswer', { userId: user.id, quizId, questionId });
    return withDatabaseErrorHandling(async () => {
        // Get quiz and verify ownership
        const quiz = await context.entities.Quiz.findUnique({
            where: { id: quizId },
            include: {
                questions: true
            }
        });
        if (!quiz) {
            throw createValidationError('quizId', 'Quiz not found');
        }
        if (quiz.userId !== user.id) {
            throw createLearningError(ErrorType.AUTHORIZATION_ERROR, ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS, 'Access denied to quiz', {
                userMessage: 'You do not have permission to access this quiz.',
                context: { quizId, userId: user.id, quizOwnerId: quiz.userId }
            });
        }
        if (quiz.completed) {
            throw createValidationError('quizId', 'Quiz is already completed');
        }
        // Find the specific question
        const question = quiz.questions.find(q => q.id === questionId);
        if (!question) {
            throw createValidationError('questionId', 'Question not found in this quiz');
        }
        if (question.userAnswer !== null) {
            throw createValidationError('questionId', 'Question has already been answered');
        }
        // Check if answer is correct (case-insensitive comparison)
        const isCorrect = userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
        // Update question with user's answer
        await context.entities.QuizQuestion.update({
            where: { id: questionId },
            data: {
                userAnswer: userAnswer.trim(),
                isCorrect
            }
        });
        // Calculate current score and check if quiz is completed
        const updatedQuiz = await context.entities.Quiz.findUnique({
            where: { id: quizId },
            include: {
                questions: true
            }
        });
        if (!updatedQuiz) {
            throw createLearningError(ErrorType.DATABASE_QUERY_ERROR, ERROR_CODES.DB_QUERY_FAILED, 'Failed to retrieve updated quiz', {
                userMessage: 'Failed to update quiz. Please try again.',
                context: { quizId, questionId }
            });
        }
        const answeredQuestions = updatedQuiz.questions.filter(q => q.userAnswer !== null);
        const correctAnswers = answeredQuestions.filter(q => q.isCorrect === true).length;
        const totalQuestions = updatedQuiz.questions.length;
        const currentScore = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        // Check if all questions are answered
        const isQuizCompleted = answeredQuestions.length === totalQuestions;
        // If quiz is completed, update the quiz record
        if (isQuizCompleted) {
            await context.entities.Quiz.update({
                where: { id: quizId },
                data: {
                    completed: true,
                    completedAt: new Date(),
                    score: currentScore
                }
            });
            // Update user's topic progress to reflect quiz completion (non-critical)
            await withRetry(async () => {
                const userProgress = await context.entities.UserTopicProgress.findUnique({
                    where: {
                        userId_topicId: {
                            userId: user.id,
                            topicId: quiz.topicId
                        }
                    }
                });
                if (userProgress) {
                    const preferences = userProgress.preferences || {};
                    preferences.lastQuizScore = currentScore;
                    preferences.quizzesTaken = (preferences.quizzesTaken || 0) + 1;
                    // Update knowledge level based on performance
                    if (currentScore >= 90) {
                        preferences.knowledgeLevel = 'advanced';
                    }
                    else if (currentScore >= 70) {
                        preferences.knowledgeLevel = 'intermediate';
                    }
                    else {
                        preferences.knowledgeLevel = 'beginner';
                    }
                    await context.entities.UserTopicProgress.update({
                        where: {
                            userId_topicId: {
                                userId: user.id,
                                topicId: quiz.topicId
                            }
                        },
                        data: {
                            preferences,
                            lastAccessed: new Date()
                        }
                    });
                }
            }, 2, 1000, 'UPDATE_QUIZ_PROGRESS').catch((error) => {
                // Log but don't fail the operation
                console.warn('Failed to update user progress after quiz completion:', error);
            });
        }
        return {
            isCorrect,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation || '',
            currentScore: Math.round(currentScore * 100) / 100,
            totalQuestions,
            isQuizCompleted
        };
    }, 'SUBMIT_QUIZ_ANSWER', { userId: user.id, quizId, questionId });
};
export const getUserQuizzes = async (args, context) => {
    if (!context.user) {
        throw createAuthenticationError('Authentication required to retrieve user quizzes');
    }
    // Assert user is defined after authentication check
    const user = context.user;
    const { topicId, completed, limit = 10, offset = 0 } = args;
    return withDatabaseErrorHandling(async () => {
        const whereClause = {
            userId: user.id
        };
        if (topicId) {
            whereClause.topicId = topicId;
        }
        if (completed !== undefined) {
            whereClause.completed = completed;
        }
        // Get total count
        const total = await context.entities.Quiz.count({
            where: whereClause
        });
        // Get quizzes with pagination
        const quizzes = await context.entities.Quiz.findMany({
            where: whereClause,
            include: {
                topic: {
                    select: {
                        id: true,
                        title: true,
                        slug: true
                    }
                },
                _count: {
                    select: {
                        questions: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: offset
        });
        const hasMore = offset + limit < total;
        return {
            quizzes,
            total,
            hasMore
        };
    }, 'GET_USER_QUIZZES', { userId: user.id });
};
export const getQuiz = async (args, context) => {
    if (!context.user) {
        throw createAuthenticationError('Authentication required to retrieve quiz');
    }
    // Assert user is defined after authentication check
    const user = context.user;
    const quizId = validateInput(args.quizId, (input) => {
        if (!input || typeof input !== 'string') {
            throw new Error('Quiz ID is required');
        }
        return input;
    }, 'quizId', { userId: user.id });
    return withDatabaseErrorHandling(async () => {
        const quiz = await context.entities.Quiz.findUnique({
            where: { id: quizId },
            include: {
                questions: true,
                topic: {
                    select: {
                        id: true,
                        title: true,
                        slug: true
                    }
                }
            }
        });
        if (!quiz) {
            throw createValidationError('quizId', 'Quiz not found');
        }
        if (quiz.userId !== user.id) {
            throw createLearningError(ErrorType.AUTHORIZATION_ERROR, ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS, 'Access denied to quiz', {
                userMessage: 'You do not have permission to access this quiz.',
                context: { quizId, userId: user.id, quizOwnerId: quiz.userId }
            });
        }
        return quiz;
    }, 'GET_QUIZ', { userId: user.id, quizId });
};
//# sourceMappingURL=operations.js.map