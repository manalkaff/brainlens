import { HttpError } from 'wasp/server';
import type { 
  GenerateQuiz, 
  SubmitQuizAnswer,
  GetUserQuizzes
} from 'wasp/server/operations';
import type { Quiz, QuizQuestion, Topic, UserTopicProgress, VectorDocument } from 'wasp/entities';
import { QuestionType } from '@prisma/client';
import { 
  generateQuizWithAI, 
  adjustDifficultyBasedOnPerformance, 
  getQuestionTypeDistribution,
  type QuizGenerationOptions 
} from './generator';
import { consumeCredits } from '../subscription/operations';

// Determine difficulty based on user's demonstrated knowledge level
function determineDifficulty(userProgress: UserTopicProgress | null, topic: Topic): 'beginner' | 'intermediate' | 'advanced' {
  if (!userProgress) {
    return 'beginner';
  }

  const preferences = userProgress.preferences as any;
  const knowledgeLevel = preferences?.knowledgeLevel;
  
  if (knowledgeLevel) {
    return knowledgeLevel;
  }

  // Determine based on time spent and completion status
  const timeSpent = userProgress.timeSpent;
  const completed = userProgress.completed;

  if (completed && timeSpent > 3600) { // More than 1 hour and completed
    return 'advanced';
  } else if (timeSpent > 1800) { // More than 30 minutes
    return 'intermediate';
  } else {
    return 'beginner';
  }
}

type GenerateQuizInput = {
  topicId: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
};

export const generateQuiz: GenerateQuiz<GenerateQuizInput, Quiz> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { topicId, difficulty } = args;

  if (!topicId) {
    throw new HttpError(400, 'Topic ID is required');
  }

  try {
    // Get topic and user progress
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      throw new HttpError(404, 'Topic not found');
    }

    const userProgress = await context.entities.UserTopicProgress.findUnique({
      where: {
        userId_topicId: {
          userId: context.user.id,
          topicId
        }
      }
    });

    // Determine difficulty level
    const quizDifficulty = difficulty || determineDifficulty(userProgress, topic);

    // Get vector documents for context
    const vectorDocuments = await context.entities.VectorDocument.findMany({
      where: { topicId },
      take: 10, // Limit to most relevant documents
      orderBy: { createdAt: 'desc' }
    });

    // Get question type distribution based on difficulty
    const questionTypes = getQuestionTypeDistribution(quizDifficulty);
    const questionCount = questionTypes.length;

    // Consume credits for quiz generation
    await consumeCredits(context.user.id, 'QUIZ_GENERATION', context, {
      topicId,
      difficulty: quizDifficulty,
      questionCount
    });

    // Generate quiz content using AI
    const quizGenerationOptions: QuizGenerationOptions = {
      difficulty: quizDifficulty,
      questionCount,
      questionTypes
    };

    const quizContent = await generateQuizWithAI(topic, userProgress, vectorDocuments, quizGenerationOptions);

    // Create quiz in database
    const quiz = await context.entities.Quiz.create({
      data: {
        topicId,
        userId: context.user.id,
        title: quizContent.title,
        completed: false,
        questions: {
          create: quizContent.questions.map((q, index) => ({
            question: q.question,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation
          }))
        }
      },
      include: {
        questions: true
      }
    });

    return quiz;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Failed to generate quiz:', error);
    throw new HttpError(500, 'Failed to generate quiz');
  }
};

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

export const submitQuizAnswer: SubmitQuizAnswer<SubmitQuizAnswerInput, SubmitQuizAnswerOutput> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { quizId, questionId, userAnswer } = args;

  if (!quizId || !questionId || userAnswer === undefined) {
    throw new HttpError(400, 'Quiz ID, question ID, and user answer are required');
  }

  try {
    // Get quiz and verify ownership
    const quiz = await context.entities.Quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true
      }
    });

    if (!quiz) {
      throw new HttpError(404, 'Quiz not found');
    }

    if (quiz.userId !== context.user.id) {
      throw new HttpError(403, 'Access denied');
    }

    if (quiz.completed) {
      throw new HttpError(400, 'Quiz is already completed');
    }

    // Find the specific question
    const question = quiz.questions.find(q => q.id === questionId);
    if (!question) {
      throw new HttpError(404, 'Question not found');
    }

    if (question.userAnswer !== null) {
      throw new HttpError(400, 'Question has already been answered');
    }

    // Check if answer is correct
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
      throw new HttpError(500, 'Failed to retrieve updated quiz');
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

      // Update user's topic progress to reflect quiz completion
      const userProgress = await context.entities.UserTopicProgress.findUnique({
        where: {
          userId_topicId: {
            userId: context.user.id,
            topicId: quiz.topicId
          }
        }
      });

      if (userProgress) {
        const preferences = (userProgress.preferences as any) || {};
        preferences.lastQuizScore = currentScore;
        preferences.quizzesTaken = (preferences.quizzesTaken || 0) + 1;
        
        // Update knowledge level based on performance
        if (currentScore >= 90) {
          preferences.knowledgeLevel = 'advanced';
        } else if (currentScore >= 70) {
          preferences.knowledgeLevel = 'intermediate';
        } else {
          preferences.knowledgeLevel = 'beginner';
        }

        await context.entities.UserTopicProgress.update({
          where: {
            userId_topicId: {
              userId: context.user.id,
              topicId: quiz.topicId
            }
          },
          data: {
            preferences,
            lastAccessed: new Date()
          }
        });
      }
    }

    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
      currentScore: Math.round(currentScore * 100) / 100,
      totalQuestions,
      isQuizCompleted
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Failed to submit quiz answer:', error);
    throw new HttpError(500, 'Failed to submit quiz answer');
  }
};

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

export const getUserQuizzes: GetUserQuizzes<GetUserQuizzesInput, GetUserQuizzesOutput> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const { topicId, completed, limit = 10, offset = 0 } = args;

  try {
    const whereClause: any = {
      userId: context.user.id
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
  } catch (error) {
    console.error('Failed to get user quizzes:', error);
    throw new HttpError(500, 'Failed to retrieve user quizzes');
  }
};