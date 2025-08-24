import type { Topic } from 'wasp/entities';
import type { ConceptMap, ConceptNode, ConceptConnection, RelatedConcept } from './conceptExplainer';
import { conceptExplainer } from './conceptExplainer';

// Re-export types for external use
export type { ConceptMap, ConceptNode, ConceptConnection, RelatedConcept };

// Network traversal options
export interface TraversalOptions {
  maxDepth: number;
  relationshipTypes: RelatedConcept['relationship'][];
  includeWeakConnections: boolean;
  userMasteryFilter?: 'all' | 'mastered' | 'unmastered' | 'ready_to_learn';
}

// Learning sequence recommendation
export interface LearningSequence {
  id: string;
  name: string;
  description: string;
  concepts: string[];
  estimatedTime: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  learningObjectives: string[];
  rationale: string;
}

// Concept mastery tracking
export interface MasteryProgress {
  conceptId: string;
  conceptName: string;
  currentLevel: number; // 0-1
  targetLevel: number; // 0-1
  timeSpent: number; // minutes
  assessmentScores: number[];
  lastAccessed: Date;
  strengthAreas: string[];
  improvementAreas: string[];
  nextSteps: string[];
}

// Knowledge gap analysis
export interface KnowledgeGap {
  conceptId: string;
  conceptName: string;
  gapType: 'missing_prerequisite' | 'weak_understanding' | 'no_exposure' | 'misconception';
  severity: 'critical' | 'important' | 'minor';
  prerequisites: string[];
  recommendations: string[];
  estimatedTimeToFill: number; // minutes
}

// Concept recommendation context
export interface RecommendationContext {
  currentConcept?: string;
  userMastery: Record<string, number>; // conceptId -> mastery level
  learningGoals: string[];
  timeAvailable?: number; // minutes
  preferredDifficulty?: 'easier' | 'same' | 'harder';
  avoidConcepts?: string[]; // Concepts to avoid recommending
}

/**
 * Concept Network Manager
 * Manages the network of concepts and their relationships for intelligent navigation
 */
export class ConceptNetworkManager {
  private conceptMaps: Map<string, ConceptMap> = new Map();
  private masteryTracking: Map<string, Record<string, MasteryProgress>> = new Map(); // topicId -> conceptId -> progress
  private learningSequences: Map<string, LearningSequence[]> = new Map(); // topicId -> sequences

  /**
   * Initialize concept network for a topic
   */
  async initializeNetwork(
    topic: Topic,
    researchResults: any[] = [],
    userMastery: Record<string, number> = {}
  ): Promise<ConceptMap> {
    
    // Build the concept map if not exists
    let conceptMap = this.conceptMaps.get(topic.id);
    if (!conceptMap) {
      conceptMap = await conceptExplainer.buildConceptMap(topic, researchResults);
      this.conceptMaps.set(topic.id, conceptMap);
    }

    // Initialize user progress if provided
    if (Object.keys(userMastery).length > 0) {
      conceptMap.userProgress = userMastery;
      this.updateMasteryTracking(topic.id, userMastery);
    }

    // Generate learning sequences
    await this.generateLearningSequences(topic.id, conceptMap);

    return conceptMap;
  }

  /**
   * Find optimal next concepts to learn
   */
  findNextConcepts(
    topicId: string,
    context: RecommendationContext,
    maxRecommendations: number = 3
  ): {
    recommendations: ConceptNode[];
    rationale: Record<string, string>;
    alternatives: ConceptNode[];
  } {
    
    const conceptMap = this.conceptMaps.get(topicId);
    if (!conceptMap) {
      throw new Error(`Concept map not found for topic ${topicId}`);
    }

    const candidates = this.identifyLearningCandidates(conceptMap, context);
    const scored = this.scoreConceptCandidates(candidates, context, conceptMap);
    const recommendations = scored.slice(0, maxRecommendations);
    const alternatives = scored.slice(maxRecommendations, maxRecommendations + 3);

    const rationale: Record<string, string> = {};
    recommendations.forEach(concept => {
      rationale[concept.id] = this.generateRecommendationRationale(concept, context, conceptMap);
    });

    return {
      recommendations,
      rationale,
      alternatives
    };
  }

  /**
   * Analyze knowledge gaps in user's understanding
   */
  analyzeKnowledgeGaps(
    topicId: string,
    userMastery: Record<string, number>,
    targetConcepts: string[] = []
  ): {
    gaps: KnowledgeGap[];
    criticalPath: string[];
    recommendations: string[];
  } {
    
    const conceptMap = this.conceptMaps.get(topicId);
    if (!conceptMap) {
      throw new Error(`Concept map not found for topic ${topicId}`);
    }

    const gaps: KnowledgeGap[] = [];
    const analysisTargets = targetConcepts.length > 0 ? targetConcepts : conceptMap.criticalPath;

    for (const conceptId of analysisTargets) {
      const concept = conceptMap.concepts.find(c => c.id === conceptId);
      if (!concept) continue;

      const masteryLevel = userMastery[conceptId] || 0;
      const prerequisiteGaps = this.findPrerequisiteGaps(concept, userMastery, conceptMap);

      // Identify different types of gaps
      if (masteryLevel < 0.3) {
        gaps.push({
          conceptId,
          conceptName: concept.name,
          gapType: 'no_exposure',
          severity: concept.unlocks.length > 2 ? 'critical' : 'important',
          prerequisites: prerequisiteGaps,
          recommendations: [
            `Start with basic introduction to ${concept.name}`,
            'Focus on fundamental understanding before advancing'
          ],
          estimatedTimeToFill: this.estimateTimeToLearn(concept, 0, 0.7)
        });
      } else if (masteryLevel < 0.6) {
        gaps.push({
          conceptId,
          conceptName: concept.name,
          gapType: 'weak_understanding',
          severity: 'important',
          prerequisites: prerequisiteGaps,
          recommendations: [
            `Review and strengthen understanding of ${concept.name}`,
            'Practice with additional examples and exercises'
          ],
          estimatedTimeToFill: this.estimateTimeToLearn(concept, masteryLevel, 0.8)
        });
      }

      // Check for missing prerequisites
      for (const prereqId of prerequisiteGaps) {
        const prereqConcept = conceptMap.concepts.find(c => c.id === prereqId);
        if (!prereqConcept) continue;

        gaps.push({
          conceptId: prereqId,
          conceptName: prereqConcept.name,
          gapType: 'missing_prerequisite',
          severity: 'critical',
          prerequisites: [],
          recommendations: [
            `Master ${prereqConcept.name} before proceeding to ${concept.name}`,
            'This is essential background knowledge'
          ],
          estimatedTimeToFill: this.estimateTimeToLearn(prereqConcept, 0, 0.7)
        });
      }
    }

    // Remove duplicates and sort by severity
    const uniqueGaps = this.deduplicateGaps(gaps);
    const sortedGaps = uniqueGaps.sort((a, b) => {
      const severityOrder = { critical: 3, important: 2, minor: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    const criticalPath = this.generateCriticalLearningPath(sortedGaps, conceptMap);
    const recommendations = this.generateGapRecommendations(sortedGaps);

    return {
      gaps: sortedGaps,
      criticalPath,
      recommendations
    };
  }

  /**
   * Generate personalized learning sequences
   */
  async generateLearningSequences(
    topicId: string,
    conceptMap: ConceptMap
  ): Promise<LearningSequence[]> {
    
    if (this.learningSequences.has(topicId)) {
      return this.learningSequences.get(topicId)!;
    }

    const sequences: LearningSequence[] = [];

    // Generate foundation-first sequence
    sequences.push(this.generateFoundationFirstSequence(conceptMap));

    // Generate application-driven sequence
    sequences.push(this.generateApplicationDrivenSequence(conceptMap));

    // Generate spiral learning sequence
    sequences.push(this.generateSpiralSequence(conceptMap));

    // Generate mastery-based sequence
    sequences.push(this.generateMasteryBasedSequence(conceptMap));

    this.learningSequences.set(topicId, sequences);
    return sequences;
  }

  /**
   * Track concept mastery progress
   */
  updateConceptMastery(
    topicId: string,
    conceptId: string,
    assessmentScore: number,
    timeSpent: number,
    strengthAreas: string[] = [],
    improvementAreas: string[] = []
  ): MasteryProgress {
    
    let topicMastery = this.masteryTracking.get(topicId);
    if (!topicMastery) {
      topicMastery = {};
      this.masteryTracking.set(topicId, topicMastery);
    }

    let progress = topicMastery[conceptId];
    if (!progress) {
      progress = {
        conceptId,
        conceptName: conceptId, // Would be populated from concept map
        currentLevel: 0,
        targetLevel: 0.8,
        timeSpent: 0,
        assessmentScores: [],
        lastAccessed: new Date(),
        strengthAreas: [],
        improvementAreas: [],
        nextSteps: []
      };
    }

    // Update progress
    progress.assessmentScores.push(assessmentScore);
    progress.timeSpent += timeSpent;
    progress.lastAccessed = new Date();
    progress.strengthAreas = [...new Set([...progress.strengthAreas, ...strengthAreas])];
    progress.improvementAreas = [...new Set([...progress.improvementAreas, ...improvementAreas])];

    // Calculate new mastery level (weighted average favoring recent performance)
    const recentScores = progress.assessmentScores.slice(-3);
    const weights = [0.5, 0.3, 0.2]; // Most recent gets highest weight
    let weightedSum = 0;
    let totalWeight = 0;

    recentScores.reverse().forEach((score, index) => {
      const weight = weights[index] || 0.1;
      weightedSum += score * weight;
      totalWeight += weight;
    });

    progress.currentLevel = weightedSum / totalWeight;

    // Generate next steps
    progress.nextSteps = this.generateNextSteps(progress, topicId);

    topicMastery[conceptId] = progress;
    return progress;
  }

  /**
   * Find concepts related to current focus
   */
  findRelatedConcepts(
    topicId: string,
    conceptId: string,
    options: TraversalOptions = {
      maxDepth: 2,
      relationshipTypes: ['similar_to', 'builds_on', 'applies_to'],
      includeWeakConnections: false
    }
  ): {
    related: ConceptNode[];
    path: string[][];
    relationships: Record<string, string>;
  } {
    
    const conceptMap = this.conceptMaps.get(topicId);
    if (!conceptMap) {
      throw new Error(`Concept map not found for topic ${topicId}`);
    }

    const startConcept = conceptMap.concepts.find(c => c.id === conceptId);
    if (!startConcept) {
      throw new Error(`Concept ${conceptId} not found`);
    }

    const visited = new Set<string>();
    const related: ConceptNode[] = [];
    const paths: string[][] = [];
    const relationships: Record<string, string> = {};

    this.traverseConceptNetwork(
      startConcept,
      conceptMap,
      options,
      0,
      [conceptId],
      visited,
      related,
      paths,
      relationships
    );

    return {
      related,
      path: paths,
      relationships
    };
  }

  /**
   * Get optimal concept ordering for learning
   */
  optimizeConceptOrdering(
    topicId: string,
    concepts: string[],
    userMastery: Record<string, number>
  ): {
    optimizedOrder: string[];
    reasoning: string[];
    alternatives: string[][];
  } {
    
    const conceptMap = this.conceptMaps.get(topicId);
    if (!conceptMap) {
      throw new Error(`Concept map not found for topic ${topicId}`);
    }

    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(concepts, conceptMap);
    
    // Topological sort considering prerequisites
    const topologicalOrder = this.topologicalSort(dependencyGraph);
    
    // Optimize based on user mastery and learning efficiency
    const optimizedOrder = this.optimizeForLearning(topologicalOrder, userMastery, conceptMap);
    
    // Generate reasoning
    const reasoning = this.explainOrdering(optimizedOrder, conceptMap, userMastery);
    
    // Generate alternative orderings
    const alternatives = [
      this.generateDifficultyBasedOrder(concepts, conceptMap),
      this.generateInterestBasedOrder(concepts, conceptMap),
      topologicalOrder // Pure dependency-based order
    ];

    return {
      optimizedOrder,
      reasoning,
      alternatives
    };
  }

  // Private helper methods

  private identifyLearningCandidates(
    conceptMap: ConceptMap,
    context: RecommendationContext
  ): ConceptNode[] {
    return conceptMap.concepts.filter(concept => {
      // Skip avoided concepts
      if (context.avoidConcepts?.includes(concept.id)) return false;
      
      // Skip already mastered concepts (unless reviewing)
      const masteryLevel = context.userMastery[concept.id] || 0;
      if (masteryLevel > 0.9) return false;
      
      // Check if prerequisites are met
      const prerequisitesMet = concept.prerequisites.every(prereqId => {
        const prereqMastery = context.userMastery[prereqId] || 0;
        return prereqMastery >= 0.6; // 60% mastery required for prerequisites
      });
      
      return prerequisitesMet;
    });
  }

  private scoreConceptCandidates(
    candidates: ConceptNode[],
    context: RecommendationContext,
    conceptMap: ConceptMap
  ): ConceptNode[] {
    const scoredCandidates = candidates.map(concept => {
      let score = 0;
      
      // Factor 1: Readiness (prerequisites mastery)
      const prerequisiteReadiness = this.calculatePrerequisiteReadiness(concept, context.userMastery);
      score += prerequisiteReadiness * 30;
      
      // Factor 2: Impact (how many other concepts this unlocks)
      const impact = concept.unlocks.length / Math.max(1, conceptMap.concepts.length / 10);
      score += impact * 25;
      
      // Factor 3: Difficulty match
      const currentMastery = context.userMastery[concept.id] || 0;
      const difficultyFit = this.calculateDifficultyFit(concept, currentMastery, context.preferredDifficulty);
      score += difficultyFit * 20;
      
      // Factor 4: Goal alignment
      const goalAlignment = this.calculateGoalAlignment(concept, context.learningGoals);
      score += goalAlignment * 15;
      
      // Factor 5: Time fit
      if (context.timeAvailable) {
        const timeFit = this.calculateTimeFit(concept, context.timeAvailable);
        score += timeFit * 10;
      }
      
      return { ...concept, score };
    });
    
    return scoredCandidates.sort((a, b) => b.score - a.score);
  }

  private calculatePrerequisiteReadiness(
    concept: ConceptNode,
    userMastery: Record<string, number>
  ): number {
    if (concept.prerequisites.length === 0) return 1.0;
    
    const masteryLevels = concept.prerequisites.map(prereqId => userMastery[prereqId] || 0);
    return masteryLevels.reduce((sum, level) => sum + level, 0) / masteryLevels.length;
  }

  private calculateDifficultyFit(
    concept: ConceptNode,
    currentMastery: number,
    preferredDifficulty?: string
  ): number {
    const conceptDifficulty = concept.level / 4; // Normalize to 0-1
    
    if (!preferredDifficulty) return 0.5;
    
    switch (preferredDifficulty) {
      case 'easier':
        return Math.max(0, 1 - Math.abs(conceptDifficulty - (currentMastery - 0.2)));
      case 'same':
        return Math.max(0, 1 - Math.abs(conceptDifficulty - currentMastery));
      case 'harder':
        return Math.max(0, 1 - Math.abs(conceptDifficulty - (currentMastery + 0.2)));
      default:
        return 0.5;
    }
  }

  private calculateGoalAlignment(concept: ConceptNode, learningGoals: string[]): number {
    if (learningGoals.length === 0) return 0.5;
    
    const conceptName = concept.name.toLowerCase();
    const alignmentScore = learningGoals.reduce((score, goal) => {
      const goalWords = goal.toLowerCase().split(' ');
      const matches = goalWords.filter(word => conceptName.includes(word));
      return score + (matches.length / goalWords.length);
    }, 0) / learningGoals.length;
    
    return Math.min(1.0, alignmentScore);
  }

  private calculateTimeFit(concept: ConceptNode, timeAvailable: number): number {
    const estimatedTime = this.estimateConceptTime(concept);
    if (estimatedTime <= timeAvailable) return 1.0;
    if (estimatedTime <= timeAvailable * 1.5) return 0.5;
    return 0.0;
  }

  private estimateConceptTime(concept: ConceptNode): number {
    // Estimate time based on concept level and connections
    const baseTime = 30; // 30 minutes base
    const levelMultiplier = 1 + (concept.level - 1) * 0.5;
    const complexityMultiplier = 1 + (concept.connections.length * 0.1);
    
    return baseTime * levelMultiplier * complexityMultiplier;
  }

  private generateRecommendationRationale(
    concept: ConceptNode,
    context: RecommendationContext,
    conceptMap: ConceptMap
  ): string {
    const reasons: string[] = [];
    
    // Prerequisite readiness
    const readiness = this.calculatePrerequisiteReadiness(concept, context.userMastery);
    if (readiness > 0.8) {
      reasons.push('All prerequisites are well understood');
    } else if (readiness > 0.6) {
      reasons.push('Prerequisites are adequately prepared');
    }
    
    // Impact
    if (concept.unlocks.length > 2) {
      reasons.push(`Will unlock ${concept.unlocks.length} additional concepts`);
    }
    
    // Goal alignment
    const goalAlignment = this.calculateGoalAlignment(concept, context.learningGoals);
    if (goalAlignment > 0.5) {
      reasons.push('Aligns with your stated learning goals');
    }
    
    // Current progress
    const currentMastery = context.userMastery[concept.id] || 0;
    if (currentMastery > 0 && currentMastery < 0.6) {
      reasons.push('You have some familiarity - good time to strengthen understanding');
    } else if (currentMastery === 0) {
      reasons.push('Fresh concept that builds on your current knowledge');
    }
    
    return reasons.join('. ') || 'Good next step in your learning journey';
  }

  private findPrerequisiteGaps(
    concept: ConceptNode,
    userMastery: Record<string, number>,
    conceptMap: ConceptMap
  ): string[] {
    return concept.prerequisites.filter(prereqId => {
      const masteryLevel = userMastery[prereqId] || 0;
      return masteryLevel < 0.6; // 60% threshold for prerequisite mastery
    });
  }

  private estimateTimeToLearn(concept: ConceptNode, fromLevel: number, toLevel: number): number {
    const baseTime = this.estimateConceptTime(concept);
    const learningDelta = toLevel - fromLevel;
    return Math.round(baseTime * learningDelta * 2); // Rough estimation
  }

  private deduplicateGaps(gaps: KnowledgeGap[]): KnowledgeGap[] {
    const seen = new Set<string>();
    return gaps.filter(gap => {
      if (seen.has(gap.conceptId)) return false;
      seen.add(gap.conceptId);
      return true;
    });
  }

  private generateCriticalLearningPath(gaps: KnowledgeGap[], conceptMap: ConceptMap): string[] {
    // Order gaps by severity and prerequisites
    const criticalGaps = gaps.filter(gap => gap.severity === 'critical');
    const orderedGaps = this.orderByPrerequisites(criticalGaps, conceptMap);
    return orderedGaps.map(gap => gap.conceptId);
  }

  private orderByPrerequisites(gaps: KnowledgeGap[], conceptMap: ConceptMap): KnowledgeGap[] {
    // Simple topological ordering of gaps based on prerequisites
    const ordered: KnowledgeGap[] = [];
    const remaining = [...gaps];
    
    while (remaining.length > 0) {
      const readyGaps = remaining.filter(gap => 
        gap.prerequisites.every(prereq => 
          ordered.some(orderedGap => orderedGap.conceptId === prereq)
        )
      );
      
      if (readyGaps.length === 0) {
        // Circular dependency or missing prerequisites - add first remaining
        ordered.push(remaining.shift()!);
      } else {
        ordered.push(...readyGaps);
        readyGaps.forEach(gap => {
          const index = remaining.indexOf(gap);
          if (index > -1) remaining.splice(index, 1);
        });
      }
    }
    
    return ordered;
  }

  private generateGapRecommendations(gaps: KnowledgeGap[]): string[] {
    const recommendations: string[] = [];
    
    const criticalCount = gaps.filter(g => g.severity === 'critical').length;
    const importantCount = gaps.filter(g => g.severity === 'important').length;
    
    if (criticalCount > 0) {
      recommendations.push(`Address ${criticalCount} critical knowledge gaps first`);
    }
    
    if (importantCount > 0) {
      recommendations.push(`Work on ${importantCount} important areas for better understanding`);
    }
    
    const totalTime = gaps.reduce((sum, gap) => sum + gap.estimatedTimeToFill, 0);
    recommendations.push(`Estimated time to fill gaps: ${Math.round(totalTime / 60)} hours`);
    
    return recommendations;
  }

  private updateMasteryTracking(topicId: string, userMastery: Record<string, number>): void {
    let topicMastery = this.masteryTracking.get(topicId);
    if (!topicMastery) {
      topicMastery = {};
      this.masteryTracking.set(topicId, topicMastery);
    }
    
    Object.entries(userMastery).forEach(([conceptId, mastery]) => {
      if (!topicMastery![conceptId]) {
        topicMastery![conceptId] = {
          conceptId,
          conceptName: conceptId,
          currentLevel: mastery,
          targetLevel: 0.8,
          timeSpent: 0,
          assessmentScores: [mastery],
          lastAccessed: new Date(),
          strengthAreas: [],
          improvementAreas: [],
          nextSteps: []
        };
      } else {
        topicMastery![conceptId].currentLevel = mastery;
      }
    });
  }

  private generateNextSteps(progress: MasteryProgress, topicId: string): string[] {
    const steps: string[] = [];
    
    if (progress.currentLevel < 0.3) {
      steps.push('Review fundamental concepts');
      steps.push('Practice with basic examples');
    } else if (progress.currentLevel < 0.6) {
      steps.push('Work on practical applications');
      steps.push('Take practice assessments');
    } else if (progress.currentLevel < 0.8) {
      steps.push('Explore advanced applications');
      steps.push('Connect to related concepts');
    } else {
      steps.push('Apply knowledge to new domains');
      steps.push('Help others learn this concept');
    }
    
    return steps;
  }

  private traverseConceptNetwork(
    currentConcept: ConceptNode,
    conceptMap: ConceptMap,
    options: TraversalOptions,
    depth: number,
    path: string[],
    visited: Set<string>,
    related: ConceptNode[],
    paths: string[][],
    relationships: Record<string, string>
  ): void {
    
    if (depth >= options.maxDepth || visited.has(currentConcept.id)) {
      return;
    }
    
    visited.add(currentConcept.id);
    
    for (const connection of currentConcept.connections) {
      if (!options.relationshipTypes.includes(connection.relationship)) continue;
      if (!options.includeWeakConnections && connection.strength < 0.5) continue;
      
      const relatedConcept = conceptMap.concepts.find(c => c.id === connection.targetConceptId);
      if (!relatedConcept) continue;
      
      related.push(relatedConcept);
      paths.push([...path, relatedConcept.id]);
      relationships[relatedConcept.id] = connection.description;
      
      // Continue traversal
      this.traverseConceptNetwork(
        relatedConcept,
        conceptMap,
        options,
        depth + 1,
        [...path, relatedConcept.id],
        visited,
        related,
        paths,
        relationships
      );
    }
  }

  // Learning sequence generators

  private generateFoundationFirstSequence(conceptMap: ConceptMap): LearningSequence {
    const orderedConcepts = conceptMap.concepts
      .sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.prerequisites.length - b.prerequisites.length;
      })
      .map(c => c.id);

    return {
      id: 'foundation_first',
      name: 'Foundation First',
      description: 'Start with fundamental concepts and build systematically',
      concepts: orderedConcepts,
      estimatedTime: orderedConcepts.length * 45,
      difficulty: 'beginner',
      prerequisites: [],
      learningObjectives: ['Build strong conceptual foundation', 'Ensure no knowledge gaps'],
      rationale: 'Ensures solid understanding of basics before advancing'
    };
  }

  private generateApplicationDrivenSequence(conceptMap: ConceptMap): LearningSequence {
    // Prioritize concepts with high practical application value
    const practicalConcepts = conceptMap.concepts
      .filter(c => c.name.toLowerCase().includes('application') || 
                   c.name.toLowerCase().includes('practice') ||
                   c.unlocks.length > 2)
      .sort((a, b) => b.unlocks.length - a.unlocks.length)
      .map(c => c.id);

    return {
      id: 'application_driven',
      name: 'Application Driven',
      description: 'Focus on practical applications and real-world uses',
      concepts: practicalConcepts,
      estimatedTime: practicalConcepts.length * 50,
      difficulty: 'intermediate',
      prerequisites: ['basic_understanding'],
      learningObjectives: ['Apply knowledge practically', 'See real-world relevance'],
      rationale: 'Motivates learning through immediate practical value'
    };
  }

  private generateSpiralSequence(conceptMap: ConceptMap): LearningSequence {
    // Spiral approach: visit concepts multiple times at increasing depth
    const coreConceptIds = conceptMap.criticalPath;
    const spiralSequence: string[] = [];
    
    // First pass: basic level
    spiralSequence.push(...coreConceptIds.map(id => `${id}_basic`));
    // Second pass: intermediate level
    spiralSequence.push(...coreConceptIds.map(id => `${id}_intermediate`));
    // Third pass: advanced level
    spiralSequence.push(...coreConceptIds.map(id => `${id}_advanced`));

    return {
      id: 'spiral_learning',
      name: 'Spiral Learning',
      description: 'Revisit concepts at increasing levels of complexity',
      concepts: spiralSequence,
      estimatedTime: spiralSequence.length * 30,
      difficulty: 'intermediate',
      prerequisites: [],
      learningObjectives: ['Deepen understanding gradually', 'Make connections between concepts'],
      rationale: 'Builds understanding through repetition and increasing complexity'
    };
  }

  private generateMasteryBasedSequence(conceptMap: ConceptMap): LearningSequence {
    // Focus on achieving mastery in smaller chunks
    const chunks = this.chunkConcepts(conceptMap.concepts, 3);
    const masterySequence = chunks.flat().map(c => c.id);

    return {
      id: 'mastery_based',
      name: 'Mastery Based',
      description: 'Master small groups of concepts before moving forward',
      concepts: masterySequence,
      estimatedTime: masterySequence.length * 60,
      difficulty: 'advanced',
      prerequisites: ['intermediate_understanding'],
      learningObjectives: ['Achieve deep mastery', 'Ensure retention'],
      rationale: 'Ensures thorough understanding before progression'
    };
  }

  private chunkConcepts(concepts: ConceptNode[], chunkSize: number): ConceptNode[][] {
    const chunks: ConceptNode[][] = [];
    for (let i = 0; i < concepts.length; i += chunkSize) {
      chunks.push(concepts.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Ordering optimization methods

  private buildDependencyGraph(conceptIds: string[], conceptMap: ConceptMap): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    
    conceptIds.forEach(id => {
      const concept = conceptMap.concepts.find(c => c.id === id);
      if (concept) {
        graph[id] = concept.prerequisites.filter(prereq => conceptIds.includes(prereq));
      }
    });
    
    return graph;
  }

  private topologicalSort(dependencyGraph: Record<string, string[]>): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    
    const visit = (node: string) => {
      if (visited.has(node)) return;
      visited.add(node);
      
      const dependencies = dependencyGraph[node] || [];
      dependencies.forEach(dep => visit(dep));
      
      result.push(node);
    };
    
    Object.keys(dependencyGraph).forEach(node => visit(node));
    
    return result;
  }

  private optimizeForLearning(
    baseOrder: string[],
    userMastery: Record<string, number>,
    conceptMap: ConceptMap
  ): string[] {
    // Adjust order based on user mastery and learning efficiency
    return baseOrder.sort((a, b) => {
      const masteryA = userMastery[a] || 0;
      const masteryB = userMastery[b] || 0;
      
      // Prioritize concepts with some familiarity but not mastery
      const scoreA = masteryA > 0 && masteryA < 0.6 ? 1 : 0;
      const scoreB = masteryB > 0 && masteryB < 0.6 ? 1 : 0;
      
      return scoreB - scoreA;
    });
  }

  private explainOrdering(
    order: string[],
    conceptMap: ConceptMap,
    userMastery: Record<string, number>
  ): string[] {
    return order.map((conceptId, index) => {
      const concept = conceptMap.concepts.find(c => c.id === conceptId);
      const mastery = userMastery[conceptId] || 0;
      
      if (index === 0) {
        return `Starting with ${concept?.name} as it has strong foundations`;
      } else if (mastery > 0.3) {
        return `Building on your existing knowledge of ${concept?.name}`;
      } else {
        return `${concept?.name} builds logically on previous concepts`;
      }
    });
  }

  private generateDifficultyBasedOrder(concepts: string[], conceptMap: ConceptMap): string[] {
    return concepts.sort((a, b) => {
      const conceptA = conceptMap.concepts.find(c => c.id === a);
      const conceptB = conceptMap.concepts.find(c => c.id === b);
      return (conceptA?.level || 0) - (conceptB?.level || 0);
    });
  }

  private generateInterestBasedOrder(concepts: string[], conceptMap: ConceptMap): string[] {
    // Simplified interest-based ordering - prioritize concepts with more connections
    return concepts.sort((a, b) => {
      const conceptA = conceptMap.concepts.find(c => c.id === a);
      const conceptB = conceptMap.concepts.find(c => c.id === b);
      return (conceptB?.connections.length || 0) - (conceptA?.connections.length || 0);
    });
  }
}

// Export singleton instance
export const conceptNetworkManager = new ConceptNetworkManager();