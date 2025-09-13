import type { Topic } from "wasp/entities";
import type { AssessmentResult } from "../components/ui/KnowledgeAssessment";
import type { LearningPath } from "../components/ui/StartingPointRecommendation";
export interface DetailedLearningPath extends LearningPath {
    sections: LearningSection[];
    prerequisites: string[];
    learningObjectives: string[];
    assessmentCriteria: string[];
    resources: LearningResource[];
    milestones: Milestone[];
    adaptationRules: AdaptationRule[];
}
export interface LearningSection {
    id: string;
    title: string;
    description: string;
    content?: string;
    estimatedTime: number;
    difficulty: "beginner" | "intermediate" | "advanced";
    prerequisites: string[];
    learningObjectives: string[];
    interactiveElements: InteractiveElement[];
    assessmentQuestions: AssessmentQuestion[];
    completionCriteria: CompletionCriteria;
    adaptationTriggers: string[];
}
export interface InteractiveElement {
    type: "example" | "exercise" | "reflection" | "practical" | "simulation";
    title: string;
    description: string;
    instructions: string;
    estimatedTime: number;
    difficultyLevel: number;
    learningStyle: string[];
}
export interface LearningResource {
    type: "article" | "video" | "interactive" | "documentation" | "tool" | "community";
    title: string;
    description: string;
    url?: string;
    estimatedTime?: number;
    difficulty: "beginner" | "intermediate" | "advanced";
    learningStyles: string[];
    priority: "required" | "recommended" | "optional";
}
export interface Milestone {
    id: string;
    title: string;
    description: string;
    position: number;
    requirements: string[];
    rewards: string[];
    assessmentType: "self_reflection" | "quiz" | "practical_application" | "peer_review";
}
export interface AdaptationRule {
    trigger: string;
    action: "increase_difficulty" | "decrease_difficulty" | "add_practice" | "skip_section" | "add_resources";
    parameters: Record<string, any>;
    description: string;
}
export interface AssessmentQuestion {
    id: string;
    type: "multiple_choice" | "true_false" | "short_answer" | "practical";
    question: string;
    options?: string[];
    correctAnswer: any;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
    concept: string;
}
export interface CompletionCriteria {
    minimumTimeSpent: number;
    requiredInteractions: string[];
    assessmentThreshold: number;
    practicalRequirements: string[];
}
export interface PathGenerationOptions {
    includeContent: boolean;
    maxSections: number;
    focusAreas: string[];
    timeConstraint?: number;
    emphasize: "theory" | "practice" | "balanced";
    includeAssessments: boolean;
}
/**
 * Learning Path Generator
 * Creates detailed, personalized learning paths based on assessment results
 */
export declare class LearningPathGenerator {
    private model;
    private pathTemplates;
    /**
     * Generate a complete personalized learning path
     */
    generateDetailedPath(topic: Topic, assessment: AssessmentResult, options?: PathGenerationOptions): Promise<DetailedLearningPath>;
    /**
     * Generate multiple path alternatives for user to choose from
     */
    generatePathAlternatives(topic: Topic, assessment: AssessmentResult): Promise<DetailedLearningPath[]>;
    /**
     * Customize path based on specific learning goals
     */
    customizePath(basePath: DetailedLearningPath, customizationOptions: {
        timeAvailable?: number;
        specificGoals?: string[];
        skipBasics?: boolean;
        emphasizeAreas?: string[];
        learningDeadline?: Date;
    }): Promise<DetailedLearningPath>;
    private generatePathStructure;
    private generatePathSections;
    private generateSection;
    private generateLearningResources;
    private generateMilestones;
    private generateAdaptationRules;
    private generateInteractiveElements;
    private generateSectionAssessment;
    private generateSectionObjectives;
    private generateMilestoneRewards;
    private extractPrerequisites;
    private generateLearningObjectives;
    private generateAssessmentCriteria;
    private calculateSectionTime;
    private generateFallbackPath;
    private adjustSectionsForTime;
    private emphasizeAreas;
    private adjustSectionsForDeadline;
}
export declare const learningPathGenerator: LearningPathGenerator;
//# sourceMappingURL=pathGenerator.d.ts.map