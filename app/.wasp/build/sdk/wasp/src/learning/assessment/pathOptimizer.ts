import type { AssessmentResult } from '../components/ui/KnowledgeAssessment';
import type { DetailedLearningPath, LearningSection, AdaptationRule } from './pathGenerator';
import { learningPathGenerator } from './pathGenerator';

// Path optimization metrics
export interface OptimizationMetrics {
  engagement: number; // 0-1 scale
  completion_rate: number; // 0-1 scale
  time_efficiency: number; // actual time vs estimated time
  knowledge_retention: number; // 0-1 scale
  user_satisfaction: number; // 0-1 scale
}

// User progress data for optimization
export interface UserProgressData {
  sectionsCompleted: string[];
  timeSpentPerSection: Record<string, number>; // section_id -> minutes
  assessmentScores: Record<string, number>; // section_id -> score (0-1)
  interactionCounts: Record<string, number>; // element_id -> count
  skipRequests: string[]; // section_ids user wanted to skip
  strugglingIndicators: string[]; // areas where user is struggling
  fastCompletionAreas: string[]; // areas completed much faster than expected
  learningStyleEffectiveness: Record<string, number>; // style -> effectiveness score
  lastActivity: Date;
  totalTimeSpent: number;
}

// Optimization recommendations
export interface OptimizationRecommendation {
  type: 'add_section' | 'remove_section' | 'modify_section' | 'reorder_sections' | 'add_resources' | 'change_pace';
  priority: 'high' | 'medium' | 'low';
  description: string;
  rationale: string;
  implementation: any; // Specific changes to make
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
}

// Real-time adaptation context
export interface AdaptationContext {
  currentSection: string;
  recentPerformance: number[]; // Recent assessment scores
  engagementTrend: 'increasing' | 'decreasing' | 'stable';
  timeSpentTrend: 'faster' | 'slower' | 'on_track';
  strugglingAreas: string[];
  masteringAreas: string[];
  preferredInteractionTypes: string[];
  currentMood?: 'motivated' | 'frustrated' | 'neutral' | 'tired';
}

/**
 * Learning Path Optimizer
 * Optimizes learning paths in real-time based on user progress and performance
 */
export class LearningPathOptimizer {
  private optimizationHistory: Map<string, OptimizationRecommendation[]> = new Map();
  private pathPerformance: Map<string, OptimizationMetrics> = new Map();

  /**
   * Analyze current path performance and suggest optimizations
   */
  async optimizePath(
    currentPath: DetailedLearningPath,
    progressData: UserProgressData,
    assessment: AssessmentResult
  ): Promise<{
    optimizedPath: DetailedLearningPath;
    recommendations: OptimizationRecommendation[];
    metrics: OptimizationMetrics;
  }> {
    
    // Calculate current performance metrics
    const metrics = this.calculateOptimizationMetrics(progressData, currentPath);
    
    // Generate optimization recommendations
    const recommendations = await this.generateOptimizationRecommendations(
      currentPath,
      progressData,
      assessment,
      metrics
    );
    
    // Apply high-priority optimizations
    const optimizedPath = await this.applyOptimizations(
      currentPath,
      recommendations.filter(r => r.priority === 'high'),
      assessment
    );
    
    // Store optimization history
    this.optimizationHistory.set(currentPath.id, recommendations);
    this.pathPerformance.set(currentPath.id, metrics);
    
    return {
      optimizedPath,
      recommendations,
      metrics
    };
  }

  /**
   * Real-time path adaptation based on current user context
   */
  async adaptPathRealTime(
    currentPath: DetailedLearningPath,
    adaptationContext: AdaptationContext,
    assessment: AssessmentResult
  ): Promise<{
    immediateActions: OptimizationRecommendation[];
    pathAdjustments: Partial<DetailedLearningPath>;
    nextSectionRecommendations: string[];
  }> {
    
    const immediateActions = await this.generateImmediateActions(
      adaptationContext,
      currentPath
    );
    
    const pathAdjustments = this.generatePathAdjustments(
      adaptationContext,
      currentPath,
      assessment
    );
    
    const nextSectionRecommendations = this.generateNextSectionRecommendations(
      adaptationContext,
      currentPath
    );
    
    return {
      immediateActions,
      pathAdjustments,
      nextSectionRecommendations
    };
  }

  /**
   * Optimize section difficulty based on user performance
   */
  optimizeSectionDifficulty(
    section: LearningSection,
    progressData: UserProgressData,
    adaptationContext: AdaptationContext
  ): LearningSection {
    const sectionId = section.id;
    const timeSpent = progressData.timeSpentPerSection[sectionId];
    const assessmentScore = progressData.assessmentScores[sectionId];
    const estimatedTime = section.estimatedTime;
    
    let newDifficulty = section.difficulty;
    let adjustedTime = section.estimatedTime;
    
    // Analyze performance indicators
    const isStruggling = assessmentScore < 0.6 || timeSpent > estimatedTime * 1.5;
    const isMastering = assessmentScore > 0.9 && timeSpent < estimatedTime * 0.7;
    const hasRepeatedAttempts = progressData.strugglingIndicators.includes(sectionId);
    
    if (isMastering && !hasRepeatedAttempts) {
      // User is mastering - can increase difficulty
      if (section.difficulty === 'beginner') {
        newDifficulty = 'intermediate';
      } else if (section.difficulty === 'intermediate') {
        newDifficulty = 'advanced';
      }
      adjustedTime = Math.round(section.estimatedTime * 0.8);
      
    } else if (isStruggling) {
      // User is struggling - decrease difficulty
      if (section.difficulty === 'advanced') {
        newDifficulty = 'intermediate';
      } else if (section.difficulty === 'intermediate') {
        newDifficulty = 'beginner';
      }
      adjustedTime = Math.round(section.estimatedTime * 1.3);
    }
    
    // Adjust interactive elements based on effectiveness
    const effectiveInteractions = section.interactiveElements.filter(element =>
      progressData.learningStyleEffectiveness[element.learningStyle[0]] > 0.7
    );
    
    const optimizedElements = this.optimizeInteractiveElements(
      section.interactiveElements,
      progressData,
      newDifficulty
    );
    
    return {
      ...section,
      difficulty: newDifficulty,
      estimatedTime: adjustedTime,
      interactiveElements: optimizedElements,
      adaptationTriggers: [
        ...section.adaptationTriggers,
        `optimized_for_${isStruggling ? 'struggling' : isMastering ? 'mastery' : 'performance'}`
      ]
    };
  }

  /**
   * Identify prerequisite gaps and suggest remediation
   */
  identifyPrerequisiteGaps(
    progressData: UserProgressData,
    currentPath: DetailedLearningPath
  ): {
    gaps: string[];
    recommendations: OptimizationRecommendation[];
  } {
    const gaps: string[] = [];
    const recommendations: OptimizationRecommendation[] = [];
    
    // Analyze performance patterns to identify knowledge gaps
    const lowPerformanceSections = Object.entries(progressData.assessmentScores)
      .filter(([_, score]) => score < 0.5)
      .map(([sectionId]) => sectionId);
    
    for (const sectionId of lowPerformanceSections) {
      const section = currentPath.sections.find(s => s.id === sectionId);
      if (!section) continue;
      
      // Check if prerequisites were properly mastered
      for (const prerequisiteId of section.prerequisites) {
        const prerequisiteScore = progressData.assessmentScores[prerequisiteId];
        if (!prerequisiteScore || prerequisiteScore < 0.7) {
          gaps.push(prerequisiteId);
          
          recommendations.push({
            type: 'add_section',
            priority: 'high',
            description: `Review prerequisite: ${prerequisiteId}`,
            rationale: `Low performance in ${sectionId} indicates gaps in prerequisite knowledge`,
            implementation: {
              action: 'insert_review_section',
              position: 'before',
              target: sectionId,
              content: 'prerequisite_review'
            },
            expectedImpact: 'Improved understanding and performance in subsequent sections',
            effort: 'medium'
          });
        }
      }
    }
    
    return { gaps, recommendations };
  }

  /**
   * Generate personalized resource recommendations
   */
  generateResourceRecommendations(
    progressData: UserProgressData,
    assessment: AssessmentResult,
    currentPath: DetailedLearningPath
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Analyze learning style effectiveness
    const ineffectiveStyles = Object.entries(progressData.learningStyleEffectiveness)
      .filter(([_, effectiveness]) => effectiveness < 0.5)
      .map(([style]) => style);
    
    const effectiveStyles = Object.entries(progressData.learningStyleEffectiveness)
      .filter(([_, effectiveness]) => effectiveness > 0.8)
      .map(([style]) => style);
    
    // Recommend more resources for effective learning styles
    for (const style of effectiveStyles) {
      recommendations.push({
        type: 'add_resources',
        priority: 'medium',
        description: `Add more ${style} learning resources`,
        rationale: `User shows high effectiveness with ${style} learning`,
        implementation: {
          resourceType: style,
          quantity: 2,
          placement: 'throughout_path'
        },
        expectedImpact: 'Increased engagement and learning effectiveness',
        effort: 'low'
      });
    }
    
    // Identify struggling areas and recommend additional support
    for (const area of progressData.strugglingIndicators) {
      recommendations.push({
        type: 'add_resources',
        priority: 'high',
        description: `Additional support materials for ${area}`,
        rationale: `User shows difficulty with this area`,
        implementation: {
          resourceType: 'remedial',
          targetArea: area,
          types: ['simplified_explanations', 'additional_examples', 'practice_exercises']
        },
        expectedImpact: 'Improved understanding in struggling areas',
        effort: 'medium'
      });
    }
    
    return recommendations;
  }

  // Private helper methods

  private calculateOptimizationMetrics(
    progressData: UserProgressData,
    path: DetailedLearningPath
  ): OptimizationMetrics {
    const completedSections = progressData.sectionsCompleted.length;
    const totalSections = path.sections.length;
    const completionRate = completedSections / totalSections;
    
    // Calculate engagement based on interaction counts and time spent
    const avgInteractionsPerSection = Object.values(progressData.interactionCounts)
      .reduce((sum, count) => sum + count, 0) / completedSections || 0;
    const engagement = Math.min(1, avgInteractionsPerSection / 5); // Normalize to 0-1
    
    // Calculate time efficiency
    const totalEstimatedTime = path.sections
      .slice(0, completedSections)
      .reduce((sum, section) => sum + section.estimatedTime, 0);
    const timeEfficiency = totalEstimatedTime > 0 
      ? Math.min(1, totalEstimatedTime / progressData.totalTimeSpent)
      : 0;
    
    // Calculate knowledge retention based on assessment scores
    const assessmentScores = Object.values(progressData.assessmentScores);
    const knowledgeRetention = assessmentScores.length > 0
      ? assessmentScores.reduce((sum, score) => sum + score, 0) / assessmentScores.length
      : 0;
    
    // Estimate user satisfaction based on various factors
    const satisfactionFactors = [
      engagement,
      completionRate,
      timeEfficiency,
      knowledgeRetention,
      1 - (progressData.skipRequests.length / totalSections) // Lower satisfaction if many skip requests
    ];
    const userSatisfaction = satisfactionFactors.reduce((sum, factor) => sum + factor, 0) / satisfactionFactors.length;
    
    return {
      engagement,
      completion_rate: completionRate,
      time_efficiency: timeEfficiency,
      knowledge_retention: knowledgeRetention,
      user_satisfaction: userSatisfaction
    };
  }

  private async generateOptimizationRecommendations(
    path: DetailedLearningPath,
    progressData: UserProgressData,
    assessment: AssessmentResult,
    metrics: OptimizationMetrics
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Low engagement recommendations
    if (metrics.engagement < 0.4) {
      recommendations.push({
        type: 'modify_section',
        priority: 'high',
        description: 'Increase interactive elements to boost engagement',
        rationale: 'Current engagement score is below 40%',
        implementation: {
          action: 'add_interactivity',
          sections: progressData.sectionsCompleted.slice(-3) // Last 3 sections
        },
        expectedImpact: 'Improved user engagement and participation',
        effort: 'medium'
      });
    }
    
    // Poor time efficiency recommendations
    if (metrics.time_efficiency < 0.6) {
      recommendations.push({
        type: 'change_pace',
        priority: 'medium',
        description: 'Adjust pacing to improve time efficiency',
        rationale: 'User is taking significantly longer than estimated',
        implementation: {
          action: 'reduce_content_density',
          target_efficiency: 0.8
        },
        expectedImpact: 'Better alignment between estimated and actual learning time',
        effort: 'low'
      });
    }
    
    // Knowledge retention recommendations
    if (metrics.knowledge_retention < 0.6) {
      recommendations.push({
        type: 'add_section',
        priority: 'high',
        description: 'Add spaced repetition and review sessions',
        rationale: 'Low assessment scores indicate retention issues',
        implementation: {
          action: 'insert_review_sessions',
          frequency: 'every_3_sections',
          type: 'spaced_repetition'
        },
        expectedImpact: 'Improved long-term knowledge retention',
        effort: 'medium'
      });
    }
    
    // Add prerequisite gap recommendations
    const gapAnalysis = this.identifyPrerequisiteGaps(progressData, path);
    recommendations.push(...gapAnalysis.recommendations);
    
    // Add resource recommendations
    const resourceRecommendations = this.generateResourceRecommendations(
      progressData,
      assessment,
      path
    );
    recommendations.push(...resourceRecommendations);
    
    return recommendations;
  }

  private async generateImmediateActions(
    context: AdaptationContext,
    path: DetailedLearningPath
  ): Promise<OptimizationRecommendation[]> {
    const actions: OptimizationRecommendation[] = [];
    
    // Handle frustration
    if (context.currentMood === 'frustrated') {
      actions.push({
        type: 'modify_section',
        priority: 'high',
        description: 'Provide immediate support and encouragement',
        rationale: 'User is showing signs of frustration',
        implementation: {
          action: 'show_support_message',
          offer_help: true,
          suggest_break: true
        },
        expectedImpact: 'Reduced frustration and improved learning experience',
        effort: 'low'
      });
    }
    
    // Handle declining engagement
    if (context.engagementTrend === 'decreasing') {
      actions.push({
        type: 'add_resources',
        priority: 'medium',
        description: 'Add engaging interactive element',
        rationale: 'Engagement is declining',
        implementation: {
          action: 'inject_interactive_break',
          type: context.preferredInteractionTypes[0] || 'quiz'
        },
        expectedImpact: 'Re-engagement and renewed interest',
        effort: 'low'
      });
    }
    
    // Handle time pressure (going too fast or too slow)
    if (context.timeSpentTrend === 'faster' && context.recentPerformance.slice(-2).every(score => score > 0.8)) {
      actions.push({
        type: 'modify_section',
        priority: 'medium',
        description: 'Offer advanced challenges',
        rationale: 'User is completing sections quickly with high accuracy',
        implementation: {
          action: 'unlock_advanced_content',
          currentSection: context.currentSection
        },
        expectedImpact: 'Maintained challenge level and continued engagement',
        effort: 'medium'
      });
    }
    
    return actions;
  }

  private generatePathAdjustments(
    context: AdaptationContext,
    path: DetailedLearningPath,
    assessment: AssessmentResult
  ): Partial<DetailedLearningPath> {
    const adjustments: Partial<DetailedLearningPath> = {};
    
    // Adjust sections based on mastering/struggling areas
    if (path.sections) {
      const adjustedSections = path.sections.map(section => {
        if (context.masteringAreas.includes(section.id)) {
          return {
            ...section,
            estimatedTime: Math.round(section.estimatedTime * 0.8),
            difficulty: this.increaseDifficulty(section.difficulty)
          };
        }
        
        if (context.strugglingAreas.includes(section.id)) {
          return {
            ...section,
            estimatedTime: Math.round(section.estimatedTime * 1.3),
            difficulty: this.decreaseDifficulty(section.difficulty),
            interactiveElements: [
              ...section.interactiveElements,
              {
                type: 'example' as const,
                title: `Additional ${section.title} Example`,
                description: 'Extra example to reinforce understanding',
                instructions: 'Review this additional example carefully',
                estimatedTime: 15,
                difficultyLevel: 2,
                learningStyle: assessment.learningStyles
              }
            ]
          };
        }
        
        return section;
      });
      
      adjustments.sections = adjustedSections as any;
    }
    
    return adjustments;
  }

  private generateNextSectionRecommendations(
    context: AdaptationContext,
    path: DetailedLearningPath
  ): string[] {
    const currentSectionIndex = path.sections.findIndex(s => s.id === context.currentSection);
    const upcomingSections = path.sections.slice(currentSectionIndex + 1, currentSectionIndex + 4);
    
    const recommendations: string[] = [];
    
    for (const section of upcomingSections) {
      if (context.masteringAreas.length > context.strugglingAreas.length) {
        recommendations.push(`Consider accelerating through ${section.title} - you're showing strong mastery`);
      } else if (context.strugglingAreas.length > 0) {
        recommendations.push(`Take extra time with ${section.title} - build on your foundation`);
      } else {
        recommendations.push(`Continue at current pace for ${section.title}`);
      }
    }
    
    return recommendations;
  }

  private async applyOptimizations(
    path: DetailedLearningPath,
    recommendations: OptimizationRecommendation[],
    assessment: AssessmentResult
  ): Promise<DetailedLearningPath> {
    let optimizedPath = { ...path };
    
    for (const recommendation of recommendations) {
      switch (recommendation.type) {
        case 'modify_section':
          optimizedPath = await this.applyModifySection(optimizedPath, recommendation);
          break;
        case 'add_section':
          optimizedPath = await this.applyAddSection(optimizedPath, recommendation, assessment);
          break;
        case 'add_resources':
          optimizedPath = this.applyAddResources(optimizedPath, recommendation);
          break;
        case 'change_pace':
          optimizedPath = this.applyChangePace(optimizedPath, recommendation);
          break;
        default:
          console.log(`Optimization type ${recommendation.type} not implemented`);
      }
    }
    
    return optimizedPath;
  }

  private async applyModifySection(
    path: DetailedLearningPath,
    recommendation: OptimizationRecommendation
  ): Promise<DetailedLearningPath> {
    const modifiedSections = path.sections.map(section => {
      if (recommendation.implementation.sections?.includes(section.id) ||
          recommendation.implementation.currentSection === section.id) {
        
        if (recommendation.implementation.action === 'add_interactivity') {
          return {
            ...section,
            interactiveElements: [
              ...section.interactiveElements,
              {
                type: 'exercise',
                title: `Interactive ${section.title} Exercise`,
                description: 'Hands-on practice to boost engagement',
                instructions: 'Complete this exercise to reinforce your learning',
                estimatedTime: 20,
                difficultyLevel: 3,
                learningStyle: ['interactive']
              }
            ]
          };
        }
      }
      return section;
    });
    
    return { ...path, sections: modifiedSections as any };
  }

  private async applyAddSection(
    path: DetailedLearningPath,
    recommendation: OptimizationRecommendation,
    assessment: AssessmentResult
  ): Promise<DetailedLearningPath> {
    if (recommendation.implementation.action === 'insert_review_sessions') {
      // Add review sections every N sections
      const frequency = recommendation.implementation.frequency === 'every_3_sections' ? 3 : 5;
      const newSections: any[] = [];
      
      for (let i = 0; i < path.sections.length; i++) {
        newSections.push(path.sections[i]);
        
        if ((i + 1) % frequency === 0) {
          newSections.push({
            id: `review_${i + 1}`,
            title: 'Review and Reinforcement',
            description: 'Review key concepts from recent sections',
            estimatedTime: 30,
            difficulty: 'intermediate' as const,
            prerequisites: path.sections.slice(Math.max(0, i - frequency + 1), i + 1).map(s => s.id),
            learningObjectives: ['Reinforce recent learning', 'Identify knowledge gaps'],
            interactiveElements: [{
              type: 'reflection' as const,
              title: 'Learning Reflection',
              description: 'Reflect on what you\'ve learned',
              instructions: 'Think about key concepts and how they connect',
              estimatedTime: 15,
              difficultyLevel: 2,
              learningStyle: ['conversational']
            }],
            assessmentQuestions: [],
            completionCriteria: {
              minimumTimeSpent: 20,
              requiredInteractions: ['Learning Reflection'],
              assessmentThreshold: 0.7,
              practicalRequirements: []
            },
            adaptationTriggers: ['review_completion']
          });
        }
      }
      
      return { ...path, sections: newSections };
    }
    
    return path;
  }

  private applyAddResources(
    path: DetailedLearningPath,
    recommendation: OptimizationRecommendation
  ): DetailedLearningPath {
    const newResources = [...path.resources];
    
    if (recommendation.implementation.resourceType) {
      newResources.push({
        type: 'interactive',
        title: `Additional ${recommendation.implementation.resourceType} Resource`,
        description: `Extra resource to support ${recommendation.implementation.resourceType} learning`,
        difficulty: 'intermediate',
        learningStyles: [recommendation.implementation.resourceType],
        priority: 'recommended'
      });
    }
    
    return { ...path, resources: newResources };
  }

  private applyChangePace(
    path: DetailedLearningPath,
    recommendation: OptimizationRecommendation
  ): DetailedLearningPath {
    const targetEfficiency = recommendation.implementation.target_efficiency || 0.8;
    const adjustmentFactor = targetEfficiency; // Simplistic approach
    
    const adjustedSections = path.sections.map(section => ({
      ...section,
      estimatedTime: Math.round(section.estimatedTime * adjustmentFactor)
    }));
    
    return { ...path, sections: adjustedSections };
  }

  private optimizeInteractiveElements(
    elements: any[],
    progressData: UserProgressData,
    difficulty: string
  ): any[] {
    // Filter to most effective interaction types
    const effectiveTypes = Object.entries(progressData.learningStyleEffectiveness)
      .filter(([_, effectiveness]) => effectiveness > 0.6)
      .map(([style]) => style);
    
    return elements.filter(element =>
      element.learningStyle.some((style: string) => effectiveTypes.includes(style))
    );
  }

  private increaseDifficulty(
    current: 'beginner' | 'intermediate' | 'advanced'
  ): 'beginner' | 'intermediate' | 'advanced' {
    const progression: Record<string, 'beginner' | 'intermediate' | 'advanced'> = { beginner: 'intermediate', intermediate: 'advanced', advanced: 'advanced' };
    return progression[current];
  }

  private decreaseDifficulty(
    current: 'beginner' | 'intermediate' | 'advanced'
  ): 'beginner' | 'intermediate' | 'advanced' {
    const regression: Record<string, 'beginner' | 'intermediate' | 'advanced'> = { advanced: 'intermediate', intermediate: 'beginner', beginner: 'beginner' };
    return regression[current];
  }
}

// Export singleton instance
export const learningPathOptimizer = new LearningPathOptimizer();