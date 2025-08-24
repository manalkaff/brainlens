// Core learning types for the BrainLens platform

export interface AssessmentResult {
  id?: string;
  overallScore: number;
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced';
  sectionScores?: Record<string, number>;
  strengths?: string[];
  weaknesses?: string[];
  recommendedPath?: string;
  personalizedFor?: string;
  completedAt?: Date;
  
  // Assessment-specific data
  interests?: string[];
  priorKnowledge?: string[];
  goals?: string[];
  topicSpecificQuestions?: Record<string, any>;
}

export interface UserTopicProgress {
  id: string;
  userId: string;
  topicId: string;
  completed: boolean;
  timeSpent: number; // in minutes
  lastAccessed: Date;
  preferences: any; // JsonValue from Prisma
  bookmarks: string[];
  
  // Extended progress data
  progress?: number; // 0-1 completion percentage
  sectionProgress?: Record<string, number>;
  createdAt?: Date;
  learningPath?: any;
  assessmentResult?: AssessmentResult;
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  subtopics?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration?: number;
  prerequisites?: string[];
  learningObjectives?: string[];
}

export interface DetailedProgressMetrics {
  // Performance metrics
  averageScore: number;
  recentScore: number;
  scoreImprovement: number;
  consistencyScore: number;
  
  // Learning velocity and pace
  learningVelocity: number; // concepts per hour
  paceConsistency: number;
  adaptationRate: number;
  
  // Engagement and attention
  engagementTrend: 'increasing' | 'decreasing' | 'stable';
  averageEngagement: number;
  peakEngagement: number;
  attentionSpan: number; // average session duration
  
  // Retention and comprehension
  retentionRate: number;
  comprehensionDepth: number;
  transferAbility: number;
  
  // Time and session metrics
  timeMetrics: {
    totalTimeSpent: number;
    activeTime: number;
    averageSessionLength: number;
    sessionFrequency: number;
    peakActivityHours: number[];
  };
  
  // Performance breakdown
  performanceMetrics: {
    quickWins: number;
    strugglingAreas: number;
    masteredConcepts: number;
    reviewNeeded: number;
  };
  
  // Question and interaction patterns
  questionTypeBreakdown?: Record<string, {
    accuracy: number;
    averageTime: number;
    attempts: number;
  }>;
  
  // Behavioral patterns
  behavioralPatterns: {
    preferredLearningTimes: string[];
    sessionLengthPreference: 'short' | 'medium' | 'long';
    interactionFrequency: number;
    helpSeekingBehavior: number;
  };
}

export interface LearningInsight {
  id: string;
  type: 'strength' | 'improvement' | 'recommendation' | 'achievement' | 'concern';
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  
  // Context and data
  relatedConcepts?: string[];
  supportingData?: Record<string, any>;
  recommendations?: string[];
  priority?: number;
  
  // Timing and relevance
  generatedAt: Date;
  expiresAt?: Date;
  relevanceScore?: number;
}

// Interactive elements for learning content
export interface InteractiveElement {
  type: 'example' | 'exercise' | 'reflection' | 'practical' | 'simulation';
  title: string;
  description: string;
  instructions: string;
  estimatedTime: number;
  difficultyLevel: number;
  learningStyle: string[];
}

// Learning section structure
export interface LearningSection {
  id: string;
  title: string;
  description: string;
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  learningObjectives: string[];
  interactiveElements: InteractiveElement[];
  assessmentQuestions: any[];
  completionCriteria: {
    minAccuracy: number;
    requiredTime?: number;
    masteryLevel: number;
  };
  adaptationTriggers: string[];
}

// Re-export commonly used types
export type { Topic as TopicEntity } from 'wasp/entities';
export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing' | 'multimodal';