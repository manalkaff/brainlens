import type { DetailedProgressMetrics, LearningInsight } from '../analytics/progressTracker';
import type { ConceptMap, ConceptNode } from '../content/conceptNetwork';
import type { AssessmentResult } from '../components/ui/KnowledgeAssessment';
import { conceptNetworkManager } from '../content/conceptNetwork';
import { learningPathOptimizer } from '../assessment/pathOptimizer';

// Next step recommendation
export interface NextStepRecommendation {
  id: string;
  type: 'concept' | 'practice' | 'review' | 'assessment' | 'break' | 'project' | 'help';
  title: string;
  description: string;
  reasoning: string;
  estimatedTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'low' | 'medium' | 'high' | 'critical';
  prerequisites: string[];
  expectedOutcome: string;
  resources?: RecommendedResource[];
  actionData?: any; // Specific data for the recommendation type
}

// Resource recommendation
export interface RecommendedResource {
  title: string;
  type: 'article' | 'video' | 'interactive' | 'practice' | 'documentation';
  url?: string;
  description: string;
  estimatedTime?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Learning context for recommendations
export interface LearningContext {
  userId: string;
  topicId: string;
  currentSession: {
    timeSpent: number;
    conceptsExplored: string[];
    lastActivity: Date;
    performance: number; // 0-1
    engagement: number; // 0-1
  };
  recentHistory: {
    sessionsCompleted: number;
    averageScore: number;
    strugglingAreas: string[];
    strongAreas: string[];
    preferredLearningTimes: number[];
  };
  goals: {
    timeAvailable: number; // minutes
    targetCompletion?: Date;
    focusAreas: string[];
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
  };
  preferences: {
    learningStyle: string[];
    difficultyPreference: 'adaptive' | 'challenging' | 'comfortable';
    contentTypes: string[];
    sessionLength: 'short' | 'medium' | 'long';
  };
}

// Recommendation strategies
export interface RecommendationStrategy {
  name: string;
  description: string;
  weight: number;
  conditions: (context: LearningContext, metrics: DetailedProgressMetrics) => boolean;
  generateRecommendations: (context: LearningContext, metrics: DetailedProgressMetrics) => NextStepRecommendation[];
}

/**
 * Next Steps Recommendation Engine
 * Provides intelligent, personalized learning recommendations
 */
class NextStepsEngine {
  private strategies: RecommendationStrategy[] = [];
  private conceptMaps: Map<string, ConceptMap> = new Map();
  private userContexts: Map<string, LearningContext> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Generate personalized next step recommendations
   */
  async generateRecommendations(
    context: LearningContext,
    metrics: DetailedProgressMetrics,
    insights: LearningInsight[],
    maxRecommendations: number = 5
  ): Promise<{
    primary: NextStepRecommendation;
    alternatives: NextStepRecommendation[];
    reasoning: string;
  }> {
    
    // Store context for future use
    this.userContexts.set(context.userId, context);

    // Get applicable strategies
    const applicableStrategies = this.strategies.filter(strategy =>
      strategy.conditions(context, metrics)
    );

    // Generate recommendations from all applicable strategies
    const allRecommendations: NextStepRecommendation[] = [];
    
    for (const strategy of applicableStrategies) {
      const recommendations = strategy.generateRecommendations(context, metrics);
      // Weight recommendations based on strategy weight
      recommendations.forEach(rec => {
        (rec as any).strategyWeight = strategy.weight;
      });
      allRecommendations.push(...recommendations);
    }

    // Score and rank recommendations
    const scoredRecommendations = this.scoreRecommendations(
      allRecommendations,
      context,
      metrics,
      insights
    );

    // Apply diversity and balance
    const balancedRecommendations = this.applyRecommendationBalance(
      scoredRecommendations,
      maxRecommendations
    );

    const primary = balancedRecommendations[0];
    const alternatives = balancedRecommendations.slice(1);

    const reasoning = this.generateRecommendationReasoning(
      primary,
      alternatives,
      context,
      metrics
    );

    return {
      primary,
      alternatives,
      reasoning
    };
  }

  /**
   * Get adaptive recommendations based on real-time performance
   */
  async getAdaptiveRecommendations(
    context: LearningContext,
    currentPerformance: {
      conceptId: string;
      score: number;
      timeSpent: number;
      attempts: number;
      hintsUsed: number;
    }
  ): Promise<NextStepRecommendation[]> {
    
    const recommendations: NextStepRecommendation[] = [];

    // Performance-based adaptations
    if (currentPerformance.score < 0.6) {
      // Struggling - provide support
      recommendations.push({
        id: 'remedial_support',
        type: 'review',
        title: 'Review and Strengthen',
        description: `Let's revisit ${currentPerformance.conceptId} with additional support`,
        reasoning: 'Low performance indicates need for concept reinforcement',
        estimatedTime: 20,
        difficulty: 'easy',
        priority: 'high',
        prerequisites: [],
        expectedOutcome: 'Improved understanding and confidence',
        resources: await this.getRemedialResources(currentPerformance.conceptId),
        actionData: {
          conceptId: currentPerformance.conceptId,
          supportLevel: 'high',
          includeBasics: true
        }
      });
    } else if (currentPerformance.score > 0.9 && currentPerformance.timeSpent < 10) {
      // Excelling quickly - provide challenge
      recommendations.push({
        id: 'advanced_challenge',
        type: 'concept',
        title: 'Take on Advanced Concepts',
        description: 'You\'re ready for more challenging material',
        reasoning: 'High performance with quick completion suggests readiness for advancement',
        estimatedTime: 25,
        difficulty: 'hard',
        priority: 'medium',
        prerequisites: [currentPerformance.conceptId],
        expectedOutcome: 'Deeper mastery and advanced skills',
        actionData: {
          skipBasics: true,
          focusOnAdvanced: true
        }
      });
    }

    // Time-based adaptations
    if (currentPerformance.timeSpent > 30) {
      // Taking too long - suggest break or different approach
      recommendations.push({
        id: 'strategic_break',
        type: 'break',
        title: 'Take a Strategic Break',
        description: 'A short break might help you approach this with fresh perspective',
        reasoning: 'Extended time on concept suggests mental fatigue',
        estimatedTime: 10,
        difficulty: 'easy',
        priority: 'high',
        prerequisites: [],
        expectedOutcome: 'Refreshed focus and improved performance',
        actionData: {
          breakType: 'active',
          returnStrategy: 'different_approach'
        }
      });
    }

    return recommendations;
  }

  /**
   * Generate learning path recommendations
   */
  async generatePathRecommendations(
    context: LearningContext,
    currentPath: string[],
    completedConcepts: string[],
    metrics: DetailedProgressMetrics
  ): Promise<{
    optimizedPath: string[];
    alternatives: string[][];
    reasoning: string[];
  }> {
    
    try {
      // Get concept map for the topic
      let conceptMap = this.conceptMaps.get(context.topicId);
      if (!conceptMap) {
        // This would normally get the actual topic entity
        const mockTopic = { id: context.topicId, title: 'Learning Topic' } as any;
        conceptMap = await conceptNetworkManager.initializeNetwork(mockTopic);
        this.conceptMaps.set(context.topicId, conceptMap);
      }

      // Get remaining concepts
      const remainingConcepts = currentPath.filter(c => !completedConcepts.includes(c));
      
      // Calculate user mastery for optimization
      const userMastery: Record<string, number> = {};
      completedConcepts.forEach(concept => {
        userMastery[concept] = metrics.conceptual.masteryDistribution[concept] || 0.8;
      });
      
      remainingConcepts.forEach(concept => {
        userMastery[concept] = metrics.conceptual.masteryDistribution[concept] || 0.0;
      });

      // Optimize the remaining path
      const optimizedResult = conceptNetworkManager.optimizeConceptOrdering(
        context.topicId,
        remainingConcepts,
        userMastery
      );

      return {
        optimizedPath: [...completedConcepts, ...optimizedResult.optimizedOrder],
        alternatives: optimizedResult.alternatives,
        reasoning: optimizedResult.reasoning
      };
    } catch (error) {
      console.error('Failed to generate path recommendations:', error);
      
      // Fallback recommendation
      return {
        optimizedPath: currentPath,
        alternatives: [currentPath],
        reasoning: ['Continue with current learning sequence']
      };
    }
  }

  /**
   * Get contextual help recommendations
   */
  generateHelpRecommendations(
    context: LearningContext,
    strugglingConcept: string,
    metrics: DetailedProgressMetrics
  ): NextStepRecommendation[] {
    const recommendations: NextStepRecommendation[] = [];

    // Prerequisites check
    recommendations.push({
      id: 'check_prerequisites',
      type: 'review',
      title: 'Review Prerequisites',
      description: `Check if you have the background knowledge needed for ${strugglingConcept}`,
      reasoning: 'Difficulty may be due to missing foundational concepts',
      estimatedTime: 15,
      difficulty: 'medium',
      priority: 'high',
      prerequisites: [],
      expectedOutcome: 'Identified and addressed knowledge gaps',
      actionData: {
        conceptId: strugglingConcept,
        checkPrerequisites: true
      }
    });

    // Alternative explanation
    recommendations.push({
      id: 'alternative_explanation',
      type: 'concept',
      title: 'Try a Different Approach',
      description: 'Learn this concept through a different learning style or format',
      reasoning: 'Different explanations can clarify confusing concepts',
      estimatedTime: 20,
      difficulty: 'medium',
      priority: 'medium',
      prerequisites: [],
      expectedOutcome: 'Clearer understanding through alternative perspective',
      resources: this.getAlternativeResources(strugglingConcept, context.preferences.learningStyle),
      actionData: {
        conceptId: strugglingConcept,
        alternativeFormat: true
      }
    });

    // Practice recommendation
    recommendations.push({
      id: 'additional_practice',
      type: 'practice',
      title: 'Practice with Examples',
      description: 'Work through more examples to solidify understanding',
      reasoning: 'Additional practice helps reinforce concept mastery',
      estimatedTime: 25,
      difficulty: 'medium',
      priority: 'medium',
      prerequisites: [],
      expectedOutcome: 'Stronger grasp through repetition and application',
      actionData: {
        conceptId: strugglingConcept,
        practiceType: 'guided_examples'
      }
    });

    // Human help
    if (metrics.engagement.helpSeekingBehavior < 2) {
      recommendations.push({
        id: 'seek_human_help',
        type: 'help',
        title: 'Ask for Help',
        description: 'Connect with tutors, mentors, or learning community',
        reasoning: 'Human guidance can provide personalized clarification',
        estimatedTime: 30,
        difficulty: 'easy',
        priority: 'low',
        prerequisites: [],
        expectedOutcome: 'Personalized guidance and support',
        actionData: {
          helpType: 'human_tutor',
          conceptId: strugglingConcept
        }
      });
    }

    return recommendations;
  }

  // Private helper methods

  private initializeStrategies(): void {
    this.strategies = [
      // Performance-based strategy
      {
        name: 'Performance Adaptive',
        description: 'Adapts recommendations based on current performance',
        weight: 0.8,
        conditions: (context, metrics) => true, // Always applicable
        generateRecommendations: (context, metrics) => this.generatePerformanceBasedRecommendations(context, metrics)
      },

      // Time-based strategy
      {
        name: 'Time Optimizer',
        description: 'Optimizes for available time',
        weight: 0.6,
        conditions: (context, metrics) => context.goals.timeAvailable > 0,
        generateRecommendations: (context, metrics) => this.generateTimeBasedRecommendations(context, metrics)
      },

      // Engagement strategy
      {
        name: 'Engagement Booster',
        description: 'Focuses on maintaining high engagement',
        weight: 0.7,
        conditions: (context, metrics) => metrics.engagement.motivationLevel < 0.6,
        generateRecommendations: (context, metrics) => this.generateEngagementRecommendations(context, metrics)
      },

      // Mastery strategy
      {
        name: 'Mastery Builder',
        description: 'Builds deep conceptual mastery',
        weight: 0.9,
        conditions: (context, metrics) => context.goals.skillLevel === 'advanced' || metrics.conceptual.depthOfUnderstanding < 0.7,
        generateRecommendations: (context, metrics) => this.generateMasteryRecommendations(context, metrics)
      },

      // Recovery strategy
      {
        name: 'Learning Recovery',
        description: 'Helps recover from learning difficulties',
        weight: 1.0,
        conditions: (context, metrics) => metrics.performance.assessmentScores.trend === 'declining' || metrics.engagement.motivationLevel < 0.4,
        generateRecommendations: (context, metrics) => this.generateRecoveryRecommendations(context, metrics)
      }
    ];
  }

  private generatePerformanceBasedRecommendations(
    context: LearningContext,
    metrics: DetailedProgressMetrics
  ): NextStepRecommendation[] {
    const recommendations: NextStepRecommendation[] = [];
    const currentScore = metrics.performance.assessmentScores.current;

    if (currentScore < 0.6) {
      // Low performance - focus on fundamentals
      recommendations.push({
        id: 'strengthen_fundamentals',
        type: 'review',
        title: 'Strengthen Fundamentals',
        description: 'Review core concepts to build a stronger foundation',
        reasoning: 'Current performance suggests gaps in fundamental understanding',
        estimatedTime: 30,
        difficulty: 'easy',
        priority: 'high',
        prerequisites: [],
        expectedOutcome: 'Improved foundation and confidence'
      });
    } else if (currentScore > 0.85) {
      // High performance - ready for challenges
      recommendations.push({
        id: 'advanced_concepts',
        type: 'concept',
        title: 'Explore Advanced Concepts',
        description: 'You\'re ready to tackle more challenging material',
        reasoning: 'Strong performance indicates readiness for advanced learning',
        estimatedTime: 35,
        difficulty: 'hard',
        priority: 'medium',
        prerequisites: [],
        expectedOutcome: 'Deeper knowledge and advanced skills'
      });
    } else {
      // Moderate performance - continue with current approach
      recommendations.push({
        id: 'continue_learning',
        type: 'concept',
        title: 'Continue Current Learning',
        description: 'You\'re making good progress - keep going!',
        reasoning: 'Steady performance suggests effective learning approach',
        estimatedTime: 25,
        difficulty: 'medium',
        priority: 'medium',
        prerequisites: [],
        expectedOutcome: 'Continued steady progress'
      });
    }

    return recommendations;
  }

  private generateTimeBasedRecommendations(
    context: LearningContext,
    metrics: DetailedProgressMetrics
  ): NextStepRecommendation[] {
    const recommendations: NextStepRecommendation[] = [];
    const availableTime = context.goals.timeAvailable;

    if (availableTime < 15) {
      // Short time - quick review or practice
      recommendations.push({
        id: 'quick_review',
        type: 'review',
        title: 'Quick Review Session',
        description: 'Quick review of recent concepts to reinforce learning',
        reasoning: 'Limited time is perfect for reinforcement activities',
        estimatedTime: 10,
        difficulty: 'easy',
        priority: 'high',
        prerequisites: [],
        expectedOutcome: 'Reinforced understanding in short time'
      });
    } else if (availableTime > 60) {
      // Long time - deep learning session
      recommendations.push({
        id: 'deep_learning',
        type: 'project',
        title: 'Deep Learning Project',
        description: 'Work on a comprehensive project that applies multiple concepts',
        reasoning: 'Extended time allows for meaningful project work',
        estimatedTime: 60,
        difficulty: 'hard',
        priority: 'medium',
        prerequisites: [],
        expectedOutcome: 'Integrated understanding and practical application'
      });
    }

    return recommendations;
  }

  private generateEngagementRecommendations(
    context: LearningContext,
    metrics: DetailedProgressMetrics
  ): NextStepRecommendation[] {
    const recommendations: NextStepRecommendation[] = [];

    // Interactive content for low engagement
    recommendations.push({
      id: 'interactive_learning',
      type: 'practice',
      title: 'Interactive Learning Activities',
      description: 'Engage with interactive content and hands-on exercises',
      reasoning: 'Interactive activities can boost motivation and engagement',
      estimatedTime: 20,
      difficulty: 'medium',
      priority: 'high',
      prerequisites: [],
      expectedOutcome: 'Increased engagement and active learning',
      resources: this.getInteractiveResources(context.preferences.learningStyle)
    });

    // Social learning
    recommendations.push({
      id: 'social_learning',
      type: 'help',
      title: 'Connect with Other Learners',
      description: 'Join study groups or discussion forums',
      reasoning: 'Social interaction can revitalize learning motivation',
      estimatedTime: 30,
      difficulty: 'easy',
      priority: 'medium',
      prerequisites: [],
      expectedOutcome: 'Renewed motivation through community connection'
    });

    return recommendations;
  }

  private generateMasteryRecommendations(
    context: LearningContext,
    metrics: DetailedProgressMetrics
  ): NextStepRecommendation[] {
    const recommendations: NextStepRecommendation[] = [];

    // Deep practice for mastery
    recommendations.push({
      id: 'mastery_practice',
      type: 'practice',
      title: 'Mastery-Level Practice',
      description: 'Work on challenging problems that require deep understanding',
      reasoning: 'Complex practice builds true mastery',
      estimatedTime: 40,
      difficulty: 'hard',
      priority: 'high',
      prerequisites: [],
      expectedOutcome: 'Deep, transferable understanding'
    });

    // Teaching others
    recommendations.push({
      id: 'teach_others',
      type: 'project',
      title: 'Teach What You\'ve Learned',
      description: 'Explain concepts to others or create learning materials',
      reasoning: 'Teaching demonstrates and deepens mastery',
      estimatedTime: 45,
      difficulty: 'hard',
      priority: 'medium',
      prerequisites: [],
      expectedOutcome: 'Mastery through teaching and explanation'
    });

    return recommendations;
  }

  private generateRecoveryRecommendations(
    context: LearningContext,
    metrics: DetailedProgressMetrics
  ): NextStepRecommendation[] {
    const recommendations: NextStepRecommendation[] = [];

    // Break recommendation
    recommendations.push({
      id: 'recovery_break',
      type: 'break',
      title: 'Take a Restorative Break',
      description: 'Step away from learning to recharge and reset',
      reasoning: 'Declining performance often indicates need for rest',
      estimatedTime: 15,
      difficulty: 'easy',
      priority: 'critical',
      prerequisites: [],
      expectedOutcome: 'Restored energy and motivation'
    });

    // Easier content
    recommendations.push({
      id: 'easier_content',
      type: 'review',
      title: 'Review Easier Concepts',
      description: 'Build confidence by reviewing concepts you\'ve mastered',
      reasoning: 'Success with familiar material can restore confidence',
      estimatedTime: 20,
      difficulty: 'easy',
      priority: 'high',
      prerequisites: [],
      expectedOutcome: 'Restored confidence and positive momentum'
    });

    return recommendations;
  }

  private scoreRecommendations(
    recommendations: NextStepRecommendation[],
    context: LearningContext,
    metrics: DetailedProgressMetrics,
    insights: LearningInsight[]
  ): NextStepRecommendation[] {
    return recommendations.map(rec => {
      let score = 0;

      // Base score from strategy weight
      score += (rec as any).strategyWeight || 0.5;

      // Priority weighting
      const priorityWeights = { critical: 1.0, high: 0.8, medium: 0.6, low: 0.4 };
      score += priorityWeights[rec.priority];

      // Time fit
      if (rec.estimatedTime <= context.goals.timeAvailable) {
        score += 0.3;
      } else if (rec.estimatedTime > context.goals.timeAvailable * 1.5) {
        score -= 0.4;
      }

      // Difficulty preference
      if (context.preferences.difficultyPreference === 'challenging' && rec.difficulty === 'hard') {
        score += 0.2;
      } else if (context.preferences.difficultyPreference === 'comfortable' && rec.difficulty === 'easy') {
        score += 0.2;
      }

      // Learning style alignment
      if (rec.resources && context.preferences.learningStyle) {
        const styleMatch = rec.resources.some(resource =>
          context.preferences.learningStyle.includes(resource.type)
        );
        if (styleMatch) score += 0.15;
      }

      return { ...rec, score };
    }).sort((a, b) => (b as any).score - (a as any).score);
  }

  private applyRecommendationBalance(
    recommendations: NextStepRecommendation[],
    maxCount: number
  ): NextStepRecommendation[] {
    const balanced: NextStepRecommendation[] = [];
    const typesSeen = new Set<string>();

    // Ensure diversity of recommendation types
    for (const rec of recommendations) {
      if (balanced.length >= maxCount) break;
      
      if (!typesSeen.has(rec.type) || balanced.length === 0) {
        balanced.push(rec);
        typesSeen.add(rec.type);
      }
    }

    // Fill remaining slots with highest scoring
    for (const rec of recommendations) {
      if (balanced.length >= maxCount) break;
      if (!balanced.includes(rec)) {
        balanced.push(rec);
      }
    }

    return balanced;
  }

  private generateRecommendationReasoning(
    primary: NextStepRecommendation,
    alternatives: NextStepRecommendation[],
    context: LearningContext,
    metrics: DetailedProgressMetrics
  ): string {
    const reasons: string[] = [];
    
    reasons.push(`Based on your ${primary.reasoning.toLowerCase()}, we recommend: ${primary.title}.`);
    
    if (context.goals.timeAvailable < primary.estimatedTime + 10) {
      reasons.push(`This fits well within your available ${context.goals.timeAvailable} minutes.`);
    }
    
    if (alternatives.length > 0) {
      reasons.push(`Alternative options include ${alternatives.slice(0, 2).map(a => a.title).join(' and ')}.`);
    }

    return reasons.join(' ');
  }

  private async getRemedialResources(conceptId: string): Promise<RecommendedResource[]> {
    return [
      {
        title: `${conceptId} - Simplified Explanation`,
        type: 'article',
        description: 'A simplified, step-by-step explanation',
        estimatedTime: 10,
        difficulty: 'beginner'
      },
      {
        title: `${conceptId} - Visual Guide`,
        type: 'video',
        description: 'Visual demonstration with examples',
        estimatedTime: 15,
        difficulty: 'beginner'
      }
    ];
  }

  private getAlternativeResources(conceptId: string, learningStyles: string[]): RecommendedResource[] {
    const resources: RecommendedResource[] = [];
    
    if (learningStyles.includes('visual')) {
      resources.push({
        title: `${conceptId} - Infographic`,
        type: 'article',
        description: 'Visual representation of key concepts',
        estimatedTime: 8,
        difficulty: 'intermediate'
      });
    }
    
    if (learningStyles.includes('interactive')) {
      resources.push({
        title: `${conceptId} - Interactive Tutorial`,
        type: 'interactive',
        description: 'Hands-on exploration of the concept',
        estimatedTime: 20,
        difficulty: 'intermediate'
      });
    }
    
    return resources;
  }

  private getInteractiveResources(learningStyles: string[]): RecommendedResource[] {
    return [
      {
        title: 'Interactive Learning Lab',
        type: 'interactive',
        description: 'Hands-on experiments and simulations',
        estimatedTime: 25,
        difficulty: 'intermediate'
      },
      {
        title: 'Practice Challenges',
        type: 'practice',
        description: 'Gamified practice problems',
        estimatedTime: 20,
        difficulty: 'intermediate'
      }
    ];
  }
}

// Export both class and singleton instance
export { NextStepsEngine };
export const nextStepsEngine = new NextStepsEngine();
export default NextStepsEngine;