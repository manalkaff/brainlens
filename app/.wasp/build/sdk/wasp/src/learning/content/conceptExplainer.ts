import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { Topic } from "wasp/entities";
import type { AssessmentResult } from "../components/ui/KnowledgeAssessment";

// Concept explanation interface
export interface ConceptExplanation {
  concept: string;
  definition: string;
  simpleExplanation: string;
  detailedExplanation: string;
  examples: string[];
  analogies: string[];
  visualDescriptions: string[];
  commonMisconceptions: string[];
  relatedConcepts: RelatedConcept[];
  applications: string[];
  difficulty: "basic" | "intermediate" | "advanced";
  estimatedReadTime: number;
  tags: string[];
}

// Related concept interface
export interface RelatedConcept {
  name: string;
  relationship:
    | "prerequisite"
    | "builds_on"
    | "similar_to"
    | "contrasts_with"
    | "applies_to";
  description: string;
  importance: "high" | "medium" | "low";
}

// Concept network node
export interface ConceptNode {
  id: string;
  name: string;
  definition: string;
  level: number; // Depth in concept hierarchy
  connections: ConceptConnection[];
  mastery: number; // User's mastery level 0-1
  prerequisites: string[]; // IDs of prerequisite concepts
  unlocks: string[]; // IDs of concepts this unlocks
}

// Connection between concepts
export interface ConceptConnection {
  targetConceptId: string;
  relationship: RelatedConcept["relationship"];
  strength: number; // 0-1, how strong the connection is
  description: string;
}

// Concept mapping for navigation
export interface ConceptMap {
  topicId: string;
  concepts: ConceptNode[];
  learningPaths: string[][]; // Different sequences through concepts
  criticalPath: string[]; // Most important sequence
  userProgress: Record<string, number>; // concept_id -> mastery_level
}

// Personalized explanation options
export interface ExplanationOptions {
  userLevel: "beginner" | "intermediate" | "advanced";
  learningStyle: string[];
  previousKnowledge: string[];
  preferredDepth: "brief" | "detailed" | "comprehensive";
  includeExamples: boolean;
  includeAnalogies: boolean;
  includeVisuals: boolean;
}

/**
 * Concept Explainer Service
 * Generates intelligent explanations for concepts based on user context
 */
export class ConceptExplainer {
  private model = openai("gpt-5-mini");
  private conceptCache: Map<string, ConceptExplanation> = new Map();
  private conceptMaps: Map<string, ConceptMap> = new Map();

  /**
   * Generate personalized explanation for a concept
   */
  async explainConcept(
    concept: string,
    topicContext: Topic,
    userAssessment: AssessmentResult,
    options: Partial<ExplanationOptions> = {},
  ): Promise<ConceptExplanation> {
    const cacheKey = this.generateCacheKey(
      concept,
      topicContext.id,
      userAssessment,
      options,
    );

    // Check cache first
    if (this.conceptCache.has(cacheKey)) {
      return this.conceptCache.get(cacheKey)!;
    }

    // Generate fresh explanation
    const explanation = await this.generateConceptExplanation(
      concept,
      topicContext,
      userAssessment,
      options,
    );

    // Cache the result
    this.conceptCache.set(cacheKey, explanation);

    return explanation;
  }

  /**
   * Generate explanation with context from surrounding content
   */
  async explainConceptInContext(
    concept: string,
    surroundingContent: string,
    topicContext: Topic,
    userAssessment: AssessmentResult,
  ): Promise<ConceptExplanation> {
    const prompt = this.buildContextualExplanationPrompt(
      concept,
      surroundingContent,
      topicContext,
      userAssessment,
    );

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.6,
    });

    return this.parseExplanationResponse(
      result.text,
      concept,
      userAssessment.knowledgeLevel,
    );
  }

  /**
   * Build concept map for a topic showing relationships
   */
  async buildConceptMap(
    topic: Topic,
    researchResults: any[] = [],
    userAssessment?: AssessmentResult,
  ): Promise<ConceptMap> {
    if (this.conceptMaps.has(topic.id)) {
      return this.conceptMaps.get(topic.id)!;
    }

    const concepts = await this.extractTopicConcepts(topic, researchResults);
    const conceptNodes = await this.buildConceptNodes(concepts, topic);
    const learningPaths = this.generateLearningPaths(conceptNodes);
    const criticalPath = this.identifyCriticalPath(conceptNodes);

    const conceptMap: ConceptMap = {
      topicId: topic.id,
      concepts: conceptNodes,
      learningPaths,
      criticalPath,
      userProgress: {},
    };

    this.conceptMaps.set(topic.id, conceptMap);
    return conceptMap;
  }

  /**
   * Get related concepts for exploration
   */
  async getRelatedConcepts(
    concept: string,
    topicContext: Topic,
    relationshipTypes: RelatedConcept["relationship"][] = [
      "builds_on",
      "similar_to",
      "applies_to",
    ],
  ): Promise<RelatedConcept[]> {
    const prompt = `Identify concepts related to "${concept}" in the context of ${
      topicContext.title
    }.

Find concepts that are:
${relationshipTypes.map((type) => `- ${type.replace(/_/g, " ")}`).join("\n")}

For each related concept, provide:
1. Name of the concept
2. Relationship type
3. Brief description of the relationship
4. Importance level (high/medium/low)

Format as JSON array of objects with properties: name, relationship, description, importance.`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.5,
    });

    try {
      const relatedConcepts = JSON.parse(result.text);
      return Array.isArray(relatedConcepts) ? relatedConcepts : [];
    } catch (error) {
      console.error("Failed to parse related concepts:", error);
      return this.generateFallbackRelatedConcepts(concept);
    }
  }

  /**
   * Check prerequisites for understanding a concept
   */
  async checkPrerequisites(
    concept: string,
    topicContext: Topic,
    userKnowledge: string[] = [],
  ): Promise<{
    prerequisites: string[];
    missing: string[];
    readyToLearn: boolean;
    recommendations: string[];
  }> {
    const prompt = `Analyze the prerequisites needed to understand "${concept}" in ${
      topicContext.title
    }.

User's known concepts: ${userKnowledge.join(", ") || "None specified"}

Identify:
1. Essential prerequisites (concepts that MUST be understood first)
2. Helpful background (concepts that would help but aren't strictly required)
3. Which prerequisites the user might be missing
4. Recommendations for filling gaps

Format as JSON:
{
  "essential_prerequisites": ["concept1", "concept2"],
  "helpful_background": ["concept3", "concept4"],
  "assessment": "ready|needs_prerequisites|needs_background",
  "recommendations": ["action1", "action2"]
}`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.4,
    });

    try {
      const analysis = JSON.parse(result.text);

      const allPrerequisites = [
        ...analysis.essential_prerequisites,
        ...analysis.helpful_background,
      ];

      const missing = allPrerequisites.filter(
        (prereq) =>
          !userKnowledge.some((known) =>
            known.toLowerCase().includes(prereq.toLowerCase()),
          ),
      );

      return {
        prerequisites: allPrerequisites,
        missing,
        readyToLearn: analysis.assessment === "ready",
        recommendations: analysis.recommendations || [],
      };
    } catch (error) {
      console.error("Failed to parse prerequisite analysis:", error);
      return {
        prerequisites: [],
        missing: [],
        readyToLearn: true,
        recommendations: [
          `Review fundamental concepts before learning ${concept}`,
        ],
      };
    }
  }

  /**
   * Generate progressive explanations (basic -> advanced)
   */
  async generateProgressiveExplanations(
    concept: string,
    topicContext: Topic,
    levels: ("basic" | "intermediate" | "advanced")[] = [
      "basic",
      "intermediate",
      "advanced",
    ],
  ): Promise<Record<string, ConceptExplanation>> {
    const explanations: Record<string, ConceptExplanation> = {};

    for (const level of levels) {
      const mockAssessment: AssessmentResult = {
        knowledgeLevel:
          level === "basic" ? 1 : level === "intermediate" ? 3 : 5,
        learningStyles: ["textual"],
        startingPoint: "basics",
        preferences: {
          difficultyPreference: "moderate",
          contentDepth: "detailed",
          pacePreference: "moderate",
        },
      };

      explanations[level] = await this.explainConcept(
        concept,
        topicContext,
        mockAssessment,
        {
          userLevel: level as "beginner" | "intermediate" | "advanced",
          preferredDepth: "detailed",
        },
      );
    }

    return explanations;
  }

  // Private helper methods

  private async generateConceptExplanation(
    concept: string,
    topicContext: Topic,
    userAssessment: AssessmentResult,
    options: Partial<ExplanationOptions>,
  ): Promise<ConceptExplanation> {
    const userLevel = this.mapKnowledgeLevel(userAssessment.knowledgeLevel);
    const effectiveOptions: ExplanationOptions = {
      userLevel,
      learningStyle: userAssessment.learningStyles,
      previousKnowledge: [],
      preferredDepth: options.preferredDepth || "detailed",
      includeExamples: options.includeExamples ?? true,
      includeAnalogies:
        options.includeAnalogies ??
        userAssessment.learningStyles.includes("conversational"),
      includeVisuals:
        options.includeVisuals ??
        userAssessment.learningStyles.includes("visual"),
    };

    const prompt = this.buildExplanationPrompt(
      concept,
      topicContext,
      effectiveOptions,
    );

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.7,
    });

    return this.parseExplanationResponse(
      result.text,
      concept,
      userAssessment.knowledgeLevel,
    );
  }

  private buildExplanationPrompt(
    concept: string,
    topicContext: Topic,
    options: ExplanationOptions,
  ): string {
    const levelInstructions = {
      beginner:
        "Use simple language, avoid jargon, include step-by-step explanations",
      intermediate:
        "Use moderate technical language, provide context, include practical applications",
      advanced:
        "Use technical precision, focus on nuances, include advanced applications",
    };

    const styleInstructions = options.learningStyle
      .map((style) => {
        switch (style) {
          case "visual":
            return "Include descriptions of diagrams, visual metaphors, and spatial relationships";
          case "conversational":
            return "Use a friendly, conversational tone with rhetorical questions";
          case "interactive":
            return 'Include thought exercises and "try this" suggestions';
          default:
            return "Provide clear, structured written explanations";
        }
      })
      .join(". ");

    return `You are an expert educator explaining the concept "${concept}" in the context of ${
      topicContext.title
    }.

User Profile:
- Knowledge Level: ${options.userLevel}
- Learning Styles: ${options.learningStyle.join(", ")}
- Preferred Depth: ${options.preferredDepth}

Instructions:
- ${levelInstructions[options.userLevel]}
- ${styleInstructions}
- Provide a ${options.preferredDepth} explanation

Create a comprehensive explanation that includes:

1. DEFINITION: Clear, precise definition
2. SIMPLE_EXPLANATION: Explain in simple terms anyone can understand
3. DETAILED_EXPLANATION: ${
      options.preferredDepth === "comprehensive" ? "Thorough" : "Moderate"
    } technical depth
4. EXAMPLES: ${
      options.includeExamples
        ? "3-5 concrete examples"
        : "Brief example if essential"
    }
5. ANALOGIES: ${
      options.includeAnalogies
        ? "Helpful analogies and metaphors"
        : "Skip unless crucial for understanding"
    }
6. VISUAL_DESCRIPTIONS: ${
      options.includeVisuals
        ? "Describe visual representations"
        : "Skip visual elements"
    }
7. MISCONCEPTIONS: Common mistakes or misunderstandings
8. RELATED_CONCEPTS: Connected concepts with relationship types
9. APPLICATIONS: Real-world uses and applications
10. TAGS: Relevant tags for categorization

Format as JSON with these exact property names (lowercase with underscores).`;
  }

  private buildContextualExplanationPrompt(
    concept: string,
    surroundingContent: string,
    topicContext: Topic,
    userAssessment: AssessmentResult,
  ): string {
    const userLevel = this.mapKnowledgeLevel(userAssessment.knowledgeLevel);

    return `Explain the concept "${concept}" as it appears in this content about ${
      topicContext.title
    }.

Surrounding Content:
${surroundingContent.slice(0, 1000)}...

User Level: ${userLevel}
Learning Styles: ${userAssessment.learningStyles.join(", ")}

Provide a contextual explanation that:
1. Defines the concept as used in this specific context
2. Explains how it relates to the surrounding discussion
3. Clarifies any specific meaning or application mentioned
4. Adapts to the user's knowledge level and learning preferences

Keep the explanation focused on how this concept functions within this particular context.`;
  }

  private async extractTopicConcepts(
    topic: Topic,
    researchResults: any[],
  ): Promise<string[]> {
    // Extract key concepts from topic and research results
    const prompt = `Extract the key concepts that should be understood to master "${
      topic.title
    }".

Topic Description: ${topic.summary || topic.description || ""}

Research Context:
${researchResults
  .slice(0, 5)
  .map((r) => r.title || r.content?.slice(0, 200))
  .join("\n")}

List 15-25 important concepts, from basic to advanced, that form the conceptual foundation of this topic.
Include both fundamental concepts and advanced applications.

Format as a JSON array of concept names.`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.5,
    });

    try {
      const concepts = JSON.parse(result.text);
      return Array.isArray(concepts) ? concepts : [];
    } catch (error) {
      console.error("Failed to extract concepts:", error);
      return this.generateFallbackConcepts(topic.title);
    }
  }

  private async buildConceptNodes(
    concepts: string[],
    topic: Topic,
  ): Promise<ConceptNode[]> {
    const nodes: ConceptNode[] = [];

    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i];

      // Determine level based on position and complexity
      const level = Math.floor(i / Math.ceil(concepts.length / 4)) + 1;

      // Generate basic definition
      const definition = await this.generateQuickDefinition(concept, topic);

      // Identify prerequisites (concepts that should be learned before this one)
      const prerequisites = concepts
        .slice(0, i)
        .filter((_, index) => Math.random() < 0.3) // Simplified prerequisite detection
        .slice(-2); // Max 2 prerequisites

      // Identify what this concept unlocks
      const unlocks = concepts
        .slice(i + 1)
        .filter((_, index) => Math.random() < 0.2) // Simplified unlock detection
        .slice(0, 3); // Max 3 unlocks

      nodes.push({
        id: `concept_${i + 1}`,
        name: concept,
        definition,
        level,
        connections: [], // Will be populated later
        mastery: 0,
        prerequisites: prerequisites.map(
          (_, idx) => `concept_${concepts.indexOf(concepts[idx]) + 1}`,
        ),
        unlocks: unlocks.map(
          (_, idx) => `concept_${concepts.indexOf(concepts[idx + i + 1]) + 1}`,
        ),
      });
    }

    // Build connections between nodes
    this.buildConceptConnections(nodes);

    return nodes;
  }

  private async generateQuickDefinition(
    concept: string,
    topic: Topic,
  ): Promise<string> {
    const prompt = `Provide a brief, clear definition of "${concept}" in the context of ${topic.title}.
Keep it to 1-2 sentences, focusing on the essential meaning.`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.3,
    });

    return result.text.trim();
  }

  private buildConceptConnections(nodes: ConceptNode[]): void {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Add connections to prerequisites
      for (const prereqId of node.prerequisites) {
        node.connections.push({
          targetConceptId: prereqId,
          relationship: "prerequisite",
          strength: 0.8,
          description: "Required background knowledge",
        });
      }

      // Add connections to unlocked concepts
      for (const unlockId of node.unlocks) {
        node.connections.push({
          targetConceptId: unlockId,
          relationship: "builds_on",
          strength: 0.7,
          description: "Enables understanding of this concept",
        });
      }

      // Add connections to related concepts at similar level
      const similarLevelNodes = nodes.filter(
        (n) => Math.abs(n.level - node.level) <= 1 && n.id !== node.id,
      );

      for (const related of similarLevelNodes.slice(0, 2)) {
        node.connections.push({
          targetConceptId: related.id,
          relationship: "similar_to",
          strength: 0.5,
          description: "Related concept at similar level",
        });
      }
    }
  }

  private generateLearningPaths(nodes: ConceptNode[]): string[][] {
    const paths: string[][] = [];

    // Generate primary path (following prerequisites)
    const primaryPath = this.generatePrimaryPath(nodes);
    paths.push(primaryPath);

    // Generate alternative paths for different learning styles
    const practicalPath = this.generatePracticalPath(nodes);
    const theoreticalPath = this.generateTheoreticalPath(nodes);

    paths.push(practicalPath);
    paths.push(theoreticalPath);

    return paths;
  }

  private generatePrimaryPath(nodes: ConceptNode[]): string[] {
    // Sort by level and prerequisites to create logical progression
    return nodes
      .sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.prerequisites.length - b.prerequisites.length;
      })
      .map((node) => node.id);
  }

  private generatePracticalPath(nodes: ConceptNode[]): string[] {
    // Prioritize concepts with practical applications
    return nodes
      .filter(
        (node) =>
          node.name.toLowerCase().includes("application") ||
          node.name.toLowerCase().includes("use") ||
          node.name.toLowerCase().includes("practice"),
      )
      .map((node) => node.id);
  }

  private generateTheoreticalPath(nodes: ConceptNode[]): string[] {
    // Prioritize foundational and theoretical concepts
    return nodes
      .filter(
        (node) =>
          node.name.toLowerCase().includes("theory") ||
          node.name.toLowerCase().includes("principle") ||
          node.name.toLowerCase().includes("foundation"),
      )
      .map((node) => node.id);
  }

  private identifyCriticalPath(nodes: ConceptNode[]): string[] {
    // Identify the most important sequence through the concept network
    const criticalConcepts = nodes
      .filter(
        (node) =>
          node.unlocks.length > 2 || // Unlocks many other concepts
          node.prerequisites.length === 0, // Foundational concepts
      )
      .sort(
        (a, b) =>
          b.unlocks.length +
          b.connections.length -
          (a.unlocks.length + a.connections.length),
      )
      .slice(0, Math.ceil(nodes.length / 3)); // Top third

    return criticalConcepts.map((node) => node.id);
  }

  private parseExplanationResponse(
    response: string,
    concept: string,
    knowledgeLevel: number,
  ): ConceptExplanation {
    try {
      const parsed = JSON.parse(response);

      return {
        concept,
        definition: parsed.definition || `Definition of ${concept}`,
        simpleExplanation:
          parsed.simple_explanation ||
          parsed.simple ||
          `Simple explanation of ${concept}`,
        detailedExplanation:
          parsed.detailed_explanation ||
          parsed.detailed ||
          `Detailed explanation of ${concept}`,
        examples: Array.isArray(parsed.examples)
          ? parsed.examples
          : [`Example of ${concept}`],
        analogies: Array.isArray(parsed.analogies)
          ? parsed.analogies
          : [`Analogy for ${concept}`],
        visualDescriptions: Array.isArray(parsed.visual_descriptions)
          ? parsed.visual_descriptions
          : [],
        commonMisconceptions: Array.isArray(parsed.misconceptions)
          ? parsed.misconceptions
          : [],
        relatedConcepts: Array.isArray(parsed.related_concepts)
          ? parsed.related_concepts
          : [],
        applications: Array.isArray(parsed.applications)
          ? parsed.applications
          : [],
        difficulty:
          knowledgeLevel <= 2
            ? "basic"
            : knowledgeLevel <= 3
              ? "intermediate"
              : "advanced",
        estimatedReadTime: Math.ceil(
          (parsed.detailed_explanation?.length || 500) / 200,
        ), // ~200 words per minute
        tags: Array.isArray(parsed.tags)
          ? parsed.tags
          : [concept.toLowerCase()],
      };
    } catch (error) {
      console.error("Failed to parse explanation response:", error);
      return this.generateFallbackExplanation(concept, knowledgeLevel);
    }
  }

  private generateFallbackExplanation(
    concept: string,
    knowledgeLevel: number,
  ): ConceptExplanation {
    return {
      concept,
      definition: `${concept} is an important concept in this field of study.`,
      simpleExplanation: `${concept} refers to a key idea or principle that helps us understand the topic better.`,
      detailedExplanation: `${concept} is a fundamental concept that plays a significant role in understanding this subject matter. It involves various aspects and applications that contribute to the overall comprehension of the topic.`,
      examples: [
        `Basic example of ${concept}`,
        `Practical application of ${concept}`,
      ],
      analogies: [`Think of ${concept} like a building block in construction`],
      visualDescriptions: [
        `Imagine ${concept} as a diagram showing relationships`,
      ],
      commonMisconceptions: [
        `A common mistake is confusing ${concept} with similar terms`,
      ],
      relatedConcepts: [
        {
          name: "Related concept",
          relationship: "similar_to",
          description: "A concept that shares similarities",
          importance: "medium",
        },
      ],
      applications: [`${concept} is used in practical applications`],
      difficulty:
        knowledgeLevel <= 2
          ? "basic"
          : knowledgeLevel <= 3
            ? "intermediate"
            : "advanced",
      estimatedReadTime: 2,
      tags: [concept.toLowerCase(), "concept", "explanation"],
    };
  }

  private generateFallbackRelatedConcepts(concept: string): RelatedConcept[] {
    return [
      {
        name: `Advanced ${concept}`,
        relationship: "builds_on",
        description: "More advanced aspects of this concept",
        importance: "medium",
      },
      {
        name: `${concept} Applications`,
        relationship: "applies_to",
        description: "Practical applications and uses",
        importance: "high",
      },
    ];
  }

  private generateFallbackConcepts(topicTitle: string): string[] {
    return [
      `Introduction to ${topicTitle}`,
      "Basic principles",
      "Core concepts",
      "Practical applications",
      "Advanced topics",
      "Best practices",
      "Common challenges",
      "Future developments",
    ];
  }

  private mapKnowledgeLevel(
    level: number,
  ): "beginner" | "intermediate" | "advanced" {
    if (level <= 2) return "beginner";
    if (level <= 3) return "intermediate";
    return "advanced";
  }

  private generateCacheKey(
    concept: string,
    topicId: string,
    assessment: AssessmentResult,
    options: Partial<ExplanationOptions>,
  ): string {
    return `${concept}_${topicId}_${assessment.knowledgeLevel}_${JSON.stringify(
      options,
    )}`;
  }
}

// Export singleton instance
export const conceptExplainer = new ConceptExplainer();
