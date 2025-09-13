import { aiContentGenerator, type ContentGenerationOptions, type AssessmentResult as AIAssessmentResult } from '../api/contentGenerator';
import { streamingContentService } from '../api/streamingService';
import type { Topic } from 'wasp/entities';
import type { AssessmentResult } from '../components/ui/KnowledgeAssessment';
import type { LearningPath } from '../components/ui/StartingPointRecommendation';

// Enhanced assessment result for content generation
export interface EnhancedAssessmentResult extends AssessmentResult {
  interests: string[];
  priorKnowledge: string[];
  goals: string[];
  topicSpecificQuestions?: Record<string, any>;
}

// Learning path with generated content
export interface GeneratedLearningPath extends LearningPath {
  content: {
    introduction: string;
    sections: Array<{
      id: string;
      title: string;
      content: string;
      estimatedTime: number;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      prerequisites?: string[];
    }>;
    nextSteps: string[];
    resources: Array<{
      title: string;
      type: 'article' | 'video' | 'interactive' | 'documentation';
      url?: string;
      description: string;
    }>;
  };
  metadata: {
    generatedAt: Date;
    tokensUsed: number;
    personalizedFor: string;
  };
}

// Starting point recommendation with content
export interface StartingPointRecommendation {
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
    preferences: AssessmentResult['preferences'];
  };
}

/**
 * Assessment Content Generator
 * Generates personalized learning content based on knowledge assessment results
 */
export class AssessmentContentGenerator {
  /**
   * Generate personalized learning path based on assessment results
   */
  async generatePersonalizedLearningPath(
    topic: Topic,
    assessment: AssessmentResult
  ): Promise<GeneratedLearningPath> {
    // Convert assessment to AI-compatible format
    const aiAssessment = this.convertAssessmentForAI(topic, assessment);
    
    // Generate learning path using AI content generator
    const learningPath = await aiContentGenerator.generateAssessmentContent(topic, aiAssessment);
    
    // Generate detailed content for each section
    const sections = await this.generateSectionContent(topic, assessment, learningPath.recommendedPath);
    
    // Generate resources and next steps
    const resources = await this.generateLearningResources(topic, assessment);
    const nextSteps = await this.generateNextSteps(topic, assessment);
    
    return {
      id: `path_${Date.now()}`,
      title: this.generatePathTitle(topic, assessment),
      description: this.generatePathDescription(topic, assessment),
      estimatedTime: `${learningPath.estimatedDuration} hours`,
      difficulty: this.mapKnowledgeLevelToDifficulty(assessment.knowledgeLevel),
      topics: learningPath.recommendedPath,
      recommended: true,
      content: {
        introduction: learningPath.content.content,
        sections,
        nextSteps,
        resources
      },
      metadata: {
        generatedAt: new Date(),
        tokensUsed: learningPath.content.metadata.tokensUsed,
        personalizedFor: topic.id
      }
    };
  }

  /**
   * Generate starting point recommendation with detailed content
   */
  async generateStartingPointRecommendation(
    topic: Topic,
    assessment: AssessmentResult
  ): Promise<StartingPointRecommendation> {
    const options: ContentGenerationOptions = {
      userLevel: this.mapKnowledgeLevelToUserLevel(assessment.knowledgeLevel),
      learningStyle: assessment.learningStyles[0] as any || 'textual',
      contentType: 'assessment',
      maxTokens: 2000
    };

    // Generate starting point content
    const content = await aiContentGenerator.generateLearningContent(
      topic,
      [], // No research results for starting point
      options
    );

    return {
      title: this.generateStartingPointTitle(topic, assessment),
      description: this.generateStartingPointDescription(assessment),
      rationale: this.generateStartingPointRationale(topic, assessment),
      content: content.content,
      estimatedDuration: this.calculateEstimatedDuration(assessment),
      difficulty: this.mapKnowledgeLevelToDifficulty(assessment.knowledgeLevel),
      keyTopics: this.generateKeyTopics(topic, assessment),
      learningObjectives: this.generateLearningObjectives(topic, assessment),
      adaptedFor: {
        knowledgeLevel: assessment.knowledgeLevel,
        learningStyles: assessment.learningStyles,
        preferences: assessment.preferences
      }
    };
  }

  /**
   * Stream personalized content generation
   */
  async streamPersonalizedContent(
    streamId: string,
    topic: Topic,
    assessment: AssessmentResult
  ): Promise<void> {
    const options = {
      userLevel: this.mapKnowledgeLevelToUserLevel(assessment.knowledgeLevel),
      learningStyle: assessment.learningStyles[0] as any || 'textual',
      contentType: 'assessment' as const,
      includeProgress: true,
      chunkSize: 30,
      delayBetweenChunks: 150
    };

    // Convert assessment for streaming
    const aiAssessment = this.convertAssessmentForAI(topic, assessment);

    await streamingContentService.streamAssessmentContent(
      streamId,
      topic,
      aiAssessment,
      options
    );
  }

  /**
   * Generate adaptive content that adjusts to user's knowledge level
   */
  async generateAdaptiveContent(
    topic: Topic,
    assessment: AssessmentResult,
    contentType: 'introduction' | 'overview' | 'deep-dive' | 'practical'
  ): Promise<{
    content: string;
    adaptations: string[];
    difficulty: string;
    estimatedReadTime: number;
  }> {
    const options: ContentGenerationOptions = {
      userLevel: this.mapKnowledgeLevelToUserLevel(assessment.knowledgeLevel),
      learningStyle: assessment.learningStyles[0] as any || 'textual',
      contentType: 'learning',
      maxTokens: this.getTokensForContentType(contentType),
      temperature: 0.7
    };

    const generatedContent = await aiContentGenerator.generateLearningContent(
      topic,
      [], // Research results would be provided in real implementation
      options
    );

    const adaptations = this.generateContentAdaptations(assessment);
    const estimatedReadTime = this.calculateReadTime(generatedContent.content);

    return {
      content: generatedContent.content,
      adaptations,
      difficulty: this.mapKnowledgeLevelToDifficulty(assessment.knowledgeLevel),
      estimatedReadTime
    };
  }

  /**
   * Generate learning objectives based on assessment
   */
  generateLearningObjectives(topic: Topic, assessment: AssessmentResult): string[] {
    const baseObjectives = [
      `Understand the fundamental concepts of ${topic.title}`,
      `Apply key principles in practical scenarios`,
      `Analyze different approaches and methodologies`,
      `Evaluate the effectiveness of various solutions`
    ];

    // Customize based on knowledge level
    if (assessment.knowledgeLevel <= 2) {
      return [
        `Define basic terminology related to ${topic.title}`,
        `Identify key components and their relationships`,
        `Explain fundamental principles in simple terms`,
        `Recognize common applications and use cases`
      ];
    } else if (assessment.knowledgeLevel >= 4) {
      return [
        `Synthesize advanced concepts and theories`,
        `Design innovative solutions using ${topic.title}`,
        `Critically evaluate current research and developments`,
        `Lead implementation of complex projects`
      ];
    }

    return baseObjectives;
  }

  // Private helper methods

  private convertAssessmentForAI(topic: Topic, assessment: AssessmentResult): AIAssessmentResult {
    return {
      userLevel: this.mapKnowledgeLevelToUserLevel(assessment.knowledgeLevel),
      learningStyle: assessment.learningStyles[0] as any || 'textual',
      interests: this.inferInterests(topic, assessment),
      priorKnowledge: this.inferPriorKnowledge(topic, assessment),
      goals: this.inferLearningGoals(topic, assessment)
    };
  }

  private mapKnowledgeLevelToUserLevel(level: number): 'beginner' | 'intermediate' | 'advanced' {
    if (level <= 2) return 'beginner';
    if (level <= 3) return 'intermediate';
    return 'advanced';
  }

  private mapKnowledgeLevelToDifficulty(level: number): 'beginner' | 'intermediate' | 'advanced' {
    return this.mapKnowledgeLevelToUserLevel(level);
  }

  private generatePathTitle(topic: Topic, assessment: AssessmentResult): string {
    const level = this.mapKnowledgeLevelToUserLevel(assessment.knowledgeLevel);
    const style = assessment.learningStyles[0] || 'comprehensive';
    
    const titleTemplates = {
      beginner: `${topic.title} Fundamentals`,
      intermediate: `Practical ${topic.title}`,
      advanced: `Advanced ${topic.title} Mastery`
    };

    return titleTemplates[level];
  }

  private generatePathDescription(topic: Topic, assessment: AssessmentResult): string {
    const level = this.mapKnowledgeLevelToUserLevel(assessment.knowledgeLevel);
    const pace = assessment.preferences.pacePreference;
    
    const descriptions = {
      beginner: `A gentle introduction to ${topic.title} designed for beginners. Start with the basics and build your understanding step by step.`,
      intermediate: `A practical approach to ${topic.title} that balances theory with real-world applications. Perfect for those with some background knowledge.`,
      advanced: `An in-depth exploration of ${topic.title} covering advanced concepts, latest research, and expert-level applications.`
    };

    return descriptions[level] + ` Optimized for ${pace}-paced learning.`;
  }

  private generateStartingPointTitle(topic: Topic, assessment: AssessmentResult): string {
    const level = this.mapKnowledgeLevelToUserLevel(assessment.knowledgeLevel);
    
    const titles = {
      beginner: `Getting Started with ${topic.title}`,
      intermediate: `${topic.title} Essentials`,
      advanced: `Advanced ${topic.title} Concepts`
    };

    return titles[level];
  }

  private generateStartingPointDescription(assessment: AssessmentResult): string {
    const level = this.mapKnowledgeLevelToUserLevel(assessment.knowledgeLevel);
    const style = assessment.learningStyles.join(', ');
    
    return `Personalized starting point based on your ${level} knowledge level and preference for ${style} learning.`;
  }

  private generateStartingPointRationale(topic: Topic, assessment: AssessmentResult): string {
    const level = assessment.knowledgeLevel;
    const styles = assessment.learningStyles;
    const pace = assessment.preferences.pacePreference;
    
    let rationale = `Based on your assessment, we recommend starting here because:\n\n`;
    
    if (level <= 2) {
      rationale += `• Your knowledge level indicates you're new to ${topic.title}, so we'll start with fundamentals\n`;
    } else if (level >= 4) {
      rationale += `• Your advanced knowledge allows us to skip basics and focus on complex concepts\n`;
    } else {
      rationale += `• Your intermediate knowledge means we can build on existing understanding\n`;
    }
    
    if (styles.includes('visual')) {
      rationale += `• We'll include plenty of diagrams and visual aids to match your visual learning preference\n`;
    }
    
    if (styles.includes('interactive')) {
      rationale += `• Interactive examples and hands-on exercises will be emphasized\n`;
    }
    
    rationale += `• The ${pace} pace aligns with your preferred learning speed`;
    
    return rationale;
  }

  private calculateEstimatedDuration(assessment: AssessmentResult): number {
    const baseHours = 2;
    const levelMultiplier = assessment.knowledgeLevel <= 2 ? 1.5 : assessment.knowledgeLevel >= 4 ? 0.8 : 1;
    const paceMultiplier = assessment.preferences.pacePreference === 'slow' ? 1.3 : 
                          assessment.preferences.pacePreference === 'fast' ? 0.7 : 1;
    
    return Math.round(baseHours * levelMultiplier * paceMultiplier * 10) / 10;
  }

  private generateKeyTopics(topic: Topic, assessment: AssessmentResult): string[] {
    const level = this.mapKnowledgeLevelToUserLevel(assessment.knowledgeLevel);
    
    const topicTemplates = {
      beginner: [
        `Introduction to ${topic.title}`,
        'Basic terminology and concepts',
        'Common applications',
        'Getting started guide'
      ],
      intermediate: [
        `Core principles of ${topic.title}`,
        'Practical implementation',
        'Best practices',
        'Common challenges and solutions'
      ],
      advanced: [
        `Advanced ${topic.title} techniques`,
        'Latest research and developments',
        'Expert-level applications',
        'Future trends and innovations'
      ]
    };

    return topicTemplates[level];
  }

  private async generateSectionContent(
    topic: Topic,
    assessment: AssessmentResult,
    recommendedPath: string[]
  ): Promise<Array<{
    id: string;
    title: string;
    content: string;
    estimatedTime: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    prerequisites?: string[];
  }>> {
    const sections: Array<{
      id: string;
      title: string;
      content: string;
      estimatedTime: number;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      prerequisites?: string[];
    }> = [];
    const difficulty = this.mapKnowledgeLevelToDifficulty(assessment.knowledgeLevel);
    
    for (let i = 0; i < Math.min(recommendedPath.length, 5); i++) {
      const sectionTitle = recommendedPath[i];
      const options: ContentGenerationOptions = {
        userLevel: this.mapKnowledgeLevelToUserLevel(assessment.knowledgeLevel),
        learningStyle: assessment.learningStyles[0] as any || 'textual',
        contentType: 'learning',
        maxTokens: 1500
      };

      // Create a mock topic for section content generation
      const sectionTopic = {
        ...topic,
        title: sectionTitle,
        description: `Section covering ${sectionTitle} in the context of ${topic.title}`
      };

      const content = await aiContentGenerator.generateLearningContent(
        sectionTopic,
        [],
        options
      );

      sections.push({
        id: `section_${i + 1}`,
        title: sectionTitle,
        content: content.content,
        estimatedTime: Math.round(20 + Math.random() * 40), // 20-60 minutes
        difficulty,
        prerequisites: i > 0 ? [recommendedPath[i - 1]] : undefined
      });
    }

    return sections;
  }

  private async generateLearningResources(
    topic: Topic,
    assessment: AssessmentResult
  ): Promise<Array<{
    title: string;
    type: 'article' | 'video' | 'interactive' | 'documentation';
    url?: string;
    description: string;
  }>> {
    const resources: Array<{
      title: string;
      type: 'article' | 'video' | 'interactive' | 'documentation';
      url?: string;
      description: string;
    }> = [];
    const styles = assessment.learningStyles;

    if (styles.includes('visual') || styles.includes('video')) {
      resources.push({
        title: `${topic.title} Video Tutorial Series`,
        type: 'video' as const,
        description: 'Comprehensive video tutorials covering key concepts with visual demonstrations'
      });
    }

    if (styles.includes('textual')) {
      resources.push({
        title: `Complete Guide to ${topic.title}`,
        type: 'article' as const,
        description: 'In-depth written guide with detailed explanations and examples'
      });
    }

    if (styles.includes('interactive')) {
      resources.push({
        title: `Interactive ${topic.title} Playground`,
        type: 'interactive' as const,
        description: 'Hands-on exercises and interactive examples to practice concepts'
      });
    }

    resources.push({
      title: `${topic.title} Reference Documentation`,
      type: 'documentation' as const,
      description: 'Official documentation and technical references'
    });

    return resources;
  }

  private async generateNextSteps(
    topic: Topic,
    assessment: AssessmentResult
  ): Promise<string[]> {
    const level = this.mapKnowledgeLevelToUserLevel(assessment.knowledgeLevel);
    
    const nextStepsTemplates = {
      beginner: [
        'Practice with simple examples and exercises',
        'Join beginner-friendly communities and forums',
        'Work on a small project to apply what you\'ve learned',
        'Review and reinforce fundamental concepts'
      ],
      intermediate: [
        'Tackle more complex real-world projects',
        'Explore advanced features and techniques',
        'Connect with other practitioners in the field',
        'Consider specializing in a particular area'
      ],
      advanced: [
        'Contribute to open-source projects or research',
        'Mentor others and share your expertise',
        'Stay updated with latest developments and trends',
        'Lead implementation of enterprise-level solutions'
      ]
    };

    return nextStepsTemplates[level];
  }

  private inferInterests(topic: Topic, assessment: AssessmentResult): string[] {
    // Infer interests based on learning styles and preferences
    const interests = [topic.title];
    
    if (assessment.learningStyles.includes('visual')) {
      interests.push('data visualization', 'infographics', 'diagrams');
    }
    
    if (assessment.learningStyles.includes('interactive')) {
      interests.push('hands-on learning', 'practical applications', 'experimentation');
    }
    
    if (assessment.preferences.contentDepth === 'comprehensive') {
      interests.push('research', 'technical details', 'in-depth analysis');
    }

    return interests;
  }

  private inferPriorKnowledge(topic: Topic, assessment: AssessmentResult): string[] {
    const level = assessment.knowledgeLevel;
    
    if (level <= 2) {
      return ['basic computer literacy', 'general problem-solving'];
    } else if (level <= 3) {
      return ['fundamental concepts', 'basic terminology', 'some practical experience'];
    } else {
      return ['advanced concepts', 'extensive practical experience', 'related technologies'];
    }
  }

  private inferLearningGoals(topic: Topic, assessment: AssessmentResult): string[] {
    const level = this.mapKnowledgeLevelToUserLevel(assessment.knowledgeLevel);
    
    const goalTemplates = {
      beginner: [
        `Understand the basics of ${topic.title}`,
        'Build a solid foundation',
        'Complete first practical project'
      ],
      intermediate: [
        `Apply ${topic.title} in real-world scenarios`,
        'Develop professional competency',
        'Solve complex problems'
      ],
      advanced: [
        `Master advanced ${topic.title} techniques`,
        'Lead technical initiatives',
        'Contribute to the field'
      ]
    };

    return goalTemplates[level];
  }

  private generateContentAdaptations(assessment: AssessmentResult): string[] {
    const adaptations: string[] = [];
    
    if (assessment.learningStyles.includes('visual')) {
      adaptations.push('Enhanced with visual diagrams and charts');
    }
    
    if (assessment.preferences.pacePreference === 'slow') {
      adaptations.push('Includes additional explanations and examples');
    }
    
    if (assessment.preferences.contentDepth === 'comprehensive') {
      adaptations.push('Provides in-depth technical details');
    }
    
    if (assessment.knowledgeLevel <= 2) {
      adaptations.push('Uses simplified language and basic examples');
    }

    return adaptations;
  }

  private getTokensForContentType(contentType: string): number {
    const tokenMap: Record<string, number> = {
      'introduction': 1500,
      'overview': 2500,
      'deep-dive': 4000,
      'practical': 3000
    };
    
    return tokenMap[contentType] || 2000;
  }

  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }
}

// Export singleton instance
export const assessmentContentGenerator = new AssessmentContentGenerator();