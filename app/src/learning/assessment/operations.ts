import { HttpError } from 'wasp/server';
import type { Topic, UserTopicProgress } from 'wasp/entities';
import { assessmentContentGenerator, type EnhancedAssessmentResult } from './assessmentContentGenerator';
import { streamingContentService } from '../api/streamingService';
import { 
  withDatabaseErrorHandling,
  validateInput
} from '../errors/errorHandler';
import {
  createAuthenticationError,
  createValidationError
} from '../errors/errorTypes';

// Input types for operations
type GenerateAssessmentContentInput = {
  topicId: string;
  assessment: {
    knowledgeLevel: number;
    learningStyles: string[];
    startingPoint: 'basics' | 'intermediate' | 'advanced';
    preferences: {
      difficultyPreference: 'gentle' | 'moderate' | 'challenging';
      contentDepth: 'overview' | 'detailed' | 'comprehensive';
      pacePreference: 'slow' | 'moderate' | 'fast';
    };
  };
};

type GeneratePersonalizedPathInput = {
  topicId: string;
  assessment: GenerateAssessmentContentInput['assessment'];
  includeContent?: boolean;
};

type GenerateStartingPointInput = {
  topicId: string;
  assessment: GenerateAssessmentContentInput['assessment'];
};

type StreamAssessmentContentInput = {
  topicId: string;
  assessment: GenerateAssessmentContentInput['assessment'];
  streamId?: string;
};

// Output types
type AssessmentContentOutput = {
  content: string;
  startingPoint: string;
  recommendedPath: string[];
  estimatedDuration: number;
  adaptations: string[];
  learningObjectives: string[];
  metadata: {
    generatedAt: string;
    tokensUsed: number;
    personalizedFor: string;
  };
};

type PersonalizedPathOutput = {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  sections?: Array<{
    id: string;
    title: string;
    content?: string;
    estimatedTime: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    prerequisites?: string[];
  }>;
  resources: Array<{
    title: string;
    type: 'article' | 'video' | 'interactive' | 'documentation';
    description: string;
  }>;
  nextSteps: string[];
  metadata: {
    generatedAt: string;
    tokensUsed: number;
    personalizedFor: string;
  };
};

type StartingPointOutput = {
  title: string;
  description: string;
  rationale: string;
  content: string;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  keyTopics: string[];
  learningObjectives: string[];
  adaptedFor: {
    knowledgeLevel: number;
    learningStyles: string[];
    preferences: GenerateAssessmentContentInput['assessment']['preferences'];
  };
};

type StreamAssessmentContentOutput = {
  streamId: string;
  status: 'started' | 'error';
  message: string;
};

/**
 * Generate personalized assessment content based on user's knowledge assessment
 */
export const generateAssessmentContent = async (args: GenerateAssessmentContentInput, context: any): Promise<AssessmentContentOutput> => {
  if (!context.user) {
    throw createAuthenticationError('Authentication required to generate assessment content');
  }

  const user = context.user;
  const { topicId, assessment } = args;

  // Validate inputs
  const validatedTopicId = validateInput(
    topicId,
    (input) => {
      if (!input || typeof input !== 'string') {
        throw new Error('Topic ID is required');
      }
      return input;
    },
    'topicId',
    { userId: user.id }
  );

  if (!assessment || typeof assessment !== 'object') {
    throw createValidationError('assessment', 'Assessment data is required');
  }

  if (typeof assessment.knowledgeLevel !== 'number' || assessment.knowledgeLevel < 1 || assessment.knowledgeLevel > 5) {
    throw createValidationError('knowledgeLevel', 'Knowledge level must be between 1 and 5');
  }

  if (!Array.isArray(assessment.learningStyles) || assessment.learningStyles.length === 0) {
    throw createValidationError('learningStyles', 'At least one learning style must be selected');
  }

  return withDatabaseErrorHandling(async () => {
    // Get topic
    const topic = await context.entities.Topic.findUnique({
      where: { id: validatedTopicId }
    });

    if (!topic) {
      throw createValidationError('topicId', 'Topic not found');
    }

    // Generate starting point recommendation
    const startingPoint = await assessmentContentGenerator.generateStartingPointRecommendation(
      topic,
      assessment
    );

    // Generate adaptive content
    const adaptiveContent = await assessmentContentGenerator.generateAdaptiveContent(
      topic,
      assessment,
      'introduction'
    );

    // Generate learning objectives
    const learningObjectives = assessmentContentGenerator.generateLearningObjectives(
      topic,
      assessment
    );

    // Update user progress with assessment preferences
    await context.entities.UserTopicProgress.upsert({
      where: {
        userId_topicId: {
          userId: user.id,
          topicId: validatedTopicId
        }
      },
      update: {
        preferences: {
          assessment,
          generatedAt: new Date().toISOString()
        },
        lastAccessed: new Date()
      },
      create: {
        userId: user.id,
        topicId: validatedTopicId,
        completed: false,
        timeSpent: 0,
        preferences: {
          assessment,
          generatedAt: new Date().toISOString()
        },
        bookmarks: []
      }
    });

    return {
      content: adaptiveContent.content,
      startingPoint: startingPoint.title,
      recommendedPath: startingPoint.keyTopics,
      estimatedDuration: startingPoint.estimatedDuration,
      adaptations: adaptiveContent.adaptations,
      learningObjectives,
      metadata: {
        generatedAt: new Date().toISOString(),
        tokensUsed: 0, // Would be populated by actual AI service
        personalizedFor: user.id
      }
    };
  }, 'GENERATE_ASSESSMENT_CONTENT', { userId: user.id, topicId: validatedTopicId });
};

/**
 * Generate a complete personalized learning path
 */
export const generatePersonalizedPath = async (args: GeneratePersonalizedPathInput, context: any): Promise<PersonalizedPathOutput> => {
  if (!context.user) {
    throw createAuthenticationError('Authentication required to generate personalized path');
  }

  const user = context.user;
  const { topicId, assessment, includeContent = false } = args;

  // Validate inputs
  const validatedTopicId = validateInput(
    topicId,
    (input) => {
      if (!input || typeof input !== 'string') {
        throw new Error('Topic ID is required');
      }
      return input;
    },
    'topicId',
    { userId: user.id }
  );

  return withDatabaseErrorHandling(async () => {
    // Get topic
    const topic = await context.entities.Topic.findUnique({
      where: { id: validatedTopicId }
    });

    if (!topic) {
      throw createValidationError('topicId', 'Topic not found');
    }

    // Generate personalized learning path
    const learningPath = await assessmentContentGenerator.generatePersonalizedLearningPath(
      topic,
      assessment
    );

    // Optionally exclude detailed content to reduce response size
    const sections = includeContent 
      ? learningPath.content.sections
      : learningPath.content.sections.map(section => ({
          ...section,
          content: undefined // Remove content if not requested
        }));

    return {
      id: learningPath.id,
      title: learningPath.title,
      description: learningPath.description,
      estimatedTime: learningPath.estimatedTime,
      difficulty: learningPath.difficulty,
      topics: learningPath.topics,
      sections,
      resources: learningPath.content.resources,
      nextSteps: learningPath.content.nextSteps,
      metadata: {
        generatedAt: learningPath.metadata.generatedAt.toISOString(),
        tokensUsed: learningPath.metadata.tokensUsed,
        personalizedFor: learningPath.metadata.personalizedFor
      }
    };
  }, 'GENERATE_PERSONALIZED_PATH', { userId: user.id, topicId: validatedTopicId });
};

/**
 * Generate detailed starting point recommendation
 */
export const generateStartingPoint = async (args: GenerateStartingPointInput, context: any): Promise<StartingPointOutput> => {
  if (!context.user) {
    throw createAuthenticationError('Authentication required to generate starting point');
  }

  const user = context.user;
  const { topicId, assessment } = args;

  // Validate inputs
  const validatedTopicId = validateInput(
    topicId,
    (input) => {
      if (!input || typeof input !== 'string') {
        throw new Error('Topic ID is required');
      }
      return input;
    },
    'topicId',
    { userId: user.id }
  );

  return withDatabaseErrorHandling(async () => {
    // Get topic
    const topic = await context.entities.Topic.findUnique({
      where: { id: validatedTopicId }
    });

    if (!topic) {
      throw createValidationError('topicId', 'Topic not found');
    }

    // Generate starting point recommendation
    const startingPoint = await assessmentContentGenerator.generateStartingPointRecommendation(
      topic,
      assessment
    );

    return startingPoint;
  }, 'GENERATE_STARTING_POINT', { userId: user.id, topicId: validatedTopicId });
};

/**
 * Stream assessment content generation for real-time display
 */
export const streamAssessmentContent = async (args: StreamAssessmentContentInput, context: any): Promise<StreamAssessmentContentOutput> => {
  if (!context.user) {
    throw createAuthenticationError('Authentication required to stream assessment content');
  }

  const user = context.user;
  const { topicId, assessment, streamId } = args;

  // Validate inputs
  const validatedTopicId = validateInput(
    topicId,
    (input) => {
      if (!input || typeof input !== 'string') {
        throw new Error('Topic ID is required');
      }
      return input;
    },
    'topicId',
    { userId: user.id }
  );

  return withDatabaseErrorHandling(async () => {
    // Get topic
    const topic = await context.entities.Topic.findUnique({
      where: { id: validatedTopicId }
    });

    if (!topic) {
      throw createValidationError('topicId', 'Topic not found');
    }

    // Use provided streamId or generate new one
    const activeStreamId = streamId || `assessment_${Date.now()}_${user.id}`;

    try {
      // Start streaming assessment content (non-blocking)
      assessmentContentGenerator.streamPersonalizedContent(
        activeStreamId,
        topic,
        assessment
      ).catch(error => {
        console.error('Assessment content streaming error:', error);
      });

      return {
        streamId: activeStreamId,
        status: 'started' as const,
        message: 'Assessment content streaming started successfully'
      };
    } catch (error) {
      console.error('Failed to start assessment content streaming:', error);
      
      return {
        streamId: activeStreamId,
        status: 'error' as const,
        message: error instanceof Error ? error.message : 'Failed to start streaming'
      };
    }
  }, 'STREAM_ASSESSMENT_CONTENT', { userId: user.id, topicId: validatedTopicId });
};