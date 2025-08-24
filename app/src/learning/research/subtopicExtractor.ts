import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { type ResearchResult, type SearchResult } from "./agents";
import { type SynthesisResult } from "./synthesis";

export interface SubtopicExtractionConfig {
  maxSubtopics: number;
  hierarchyLevels: 1 | 2 | 3;
  minConfidence: number;
  includePrerequisites: boolean;
  includeDifficulty: boolean;
  includeEstimatedTime: boolean;
  semanticGrouping: boolean;
}

export interface ExtractedSubtopic {
  id: string;
  title: string;
  description: string;
  level: number; // 1-3 (1 = main topic, 2 = subtopic, 3 = sub-subtopic)
  parentId?: string;
  children?: ExtractedSubtopic[];
  metadata: {
    confidence: number;
    difficulty: "beginner" | "intermediate" | "advanced";
    estimatedTimeMinutes: number;
    prerequisites: string[];
    relatedConcepts: string[];
    sourceAgents: string[];
    keyTerms: string[];
    practicalApplications: string[];
  };
}

export interface SubtopicExtractionResult {
  hierarchicalTopics: ExtractedSubtopic[];
  flatTopics: ExtractedSubtopic[];
  metadata: {
    totalTopics: number;
    topicsByLevel: Record<number, number>;
    avgConfidence: number;
    coverage: {
      academic: number;
      practical: number;
      foundational: number;
      advanced: number;
    };
    processingTime: number;
  };
}

export interface TopicRelationship {
  parentTopic: string;
  childTopic: string;
  relationshipType: "prerequisite" | "component" | "related" | "application";
  strength: number; // 0-1
}

const DEFAULT_CONFIG: SubtopicExtractionConfig = {
  maxSubtopics: 24, // 8 main topics, 16 sub-topics max
  hierarchyLevels: 3,
  minConfidence: 0.6,
  includePrerequisites: true,
  includeDifficulty: true,
  includeEstimatedTime: true,
  semanticGrouping: true,
};

export class SubtopicExtractor {
  private config: SubtopicExtractionConfig;

  constructor(config: Partial<SubtopicExtractionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Extract hierarchical subtopics from research results and synthesis
   */
  async extractSubtopics(
    researchResults: ResearchResult[],
    synthesisResult: SynthesisResult,
    mainTopic: string,
    context?: {
      userLevel?: "beginner" | "intermediate" | "advanced";
      focusAreas?: string[];
      excludeAreas?: string[];
      domainSpecific?: boolean;
    },
  ): Promise<SubtopicExtractionResult> {
    const startTime = Date.now();

    try {
      // Step 1: Extract candidate subtopics from all sources
      const candidateTopics = await this.extractCandidateTopics(
        researchResults,
        synthesisResult,
        mainTopic,
        context,
      );

      // Step 2: Build hierarchical relationships
      const relationships = await this.buildTopicRelationships(
        candidateTopics,
        mainTopic,
      );

      // Step 3: Create hierarchical structure
      const hierarchicalTopics = this.buildHierarchicalStructure(
        candidateTopics,
        relationships,
        mainTopic,
      );

      // Step 4: Enhance with metadata
      const enhancedTopics = await this.enhanceTopicsWithMetadata(
        hierarchicalTopics,
        researchResults,
        context,
      );

      // Step 5: Filter and validate
      const finalTopics = this.filterAndValidateTopics(enhancedTopics, context);

      const processingTime = Date.now() - startTime;

      // Create flat view for easy access
      const flatTopics = this.flattenHierarchy(finalTopics);

      return {
        hierarchicalTopics: finalTopics,
        flatTopics,
        metadata: {
          totalTopics: flatTopics.length,
          topicsByLevel: this.countTopicsByLevel(flatTopics),
          avgConfidence: this.calculateAverageConfidence(flatTopics),
          coverage: this.calculateCoverageMetrics(flatTopics, researchResults),
          processingTime,
        },
      };
    } catch (error) {
      console.error("Subtopic extraction failed:", error);
      throw new Error(
        `Subtopic extraction failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Extract candidate subtopics from research and synthesis results
   */
  private async extractCandidateTopics(
    researchResults: ResearchResult[],
    synthesisResult: SynthesisResult,
    mainTopic: string,
    context?: any,
  ): Promise<ExtractedSubtopic[]> {
    const extractionPrompt = this.createExtractionPrompt(
      researchResults,
      synthesisResult,
      mainTopic,
      context,
    );

    const result = await generateText({
      model: openai("gpt-5-mini"),
      system: this.getExtractionSystemPrompt(),
      prompt: extractionPrompt,
      temperature: 0.2,
    });

    const response = JSON.parse(result.text || "{}");

    return this.parseExtractedTopics(response.topics || []);
  }

  /**
   * Create extraction prompt for AI
   */
  private createExtractionPrompt(
    researchResults: ResearchResult[],
    synthesisResult: SynthesisResult,
    mainTopic: string,
    context?: any,
  ): string {
    let prompt = `Please extract comprehensive subtopics for learning about "${mainTopic}".\n\n`;

    // Add synthesis insights
    prompt += "## Synthesized Content:\n";
    prompt += `Summary: ${synthesisResult.synthesizedContent.summary}\n\n`;

    if (synthesisResult.synthesizedContent.keyPoints.length > 0) {
      prompt += "Key Points:\n";
      synthesisResult.synthesizedContent.keyPoints.forEach((point) => {
        prompt += `- ${point}\n`;
      });
      prompt += "\n";
    }

    // Add agent-specific insights
    prompt += "## Agent Research Insights:\n";
    researchResults.forEach((result) => {
      if (result.status === "success" && result.results.length > 0) {
        prompt += `**${result.agent}**: ${
          result.summary || "Found " + result.results.length + " results"
        }\n`;

        // Add a few top result snippets
        const topSnippets = result.results
          .slice(0, 3)
          .map((r) => r.snippet)
          .join(" ");
        if (topSnippets.length > 100) {
          prompt += `Key content: ${topSnippets.substring(0, 300)}...\n`;
        }
        prompt += "\n";
      }
    });

    // Add context
    if (context) {
      prompt += "## Context:\n";
      if (context.userLevel) {
        prompt += `Target Level: ${context.userLevel}\n`;
      }
      if (context.focusAreas) {
        prompt += `Focus Areas: ${context.focusAreas.join(", ")}\n`;
      }
      if (context.excludeAreas) {
        prompt += `Exclude Areas: ${context.excludeAreas.join(", ")}\n`;
      }
      prompt += "\n";
    }

    prompt += this.getExtractionInstructions();

    return prompt;
  }

  /**
   * Get system prompt for subtopic extraction
   */
  private getExtractionSystemPrompt(): string {
    return `You are an expert educational content strategist who creates comprehensive learning hierarchies. Your task is to:

1. Extract 6-8 main subtopics that provide complete coverage of the subject
2. For each main subtopic, identify 2-3 specific sub-subtopics
3. Ensure logical learning progression from foundational to advanced concepts
4. Consider practical applications alongside theoretical knowledge
5. Adapt content difficulty to the specified user level
6. Provide detailed metadata for each topic

Focus on creating a learner-centered hierarchy that enables systematic skill building.`;
  }

  /**
   * Get extraction instructions
   */
  private getExtractionInstructions(): string {
    return `## Extraction Instructions:

Please provide a JSON response with the following structure:

{
  "topics": [
    {
      "title": "Main Topic Title",
      "description": "2-3 sentence description of what this topic covers",
      "level": 1,
      "confidence": 0.95,
      "difficulty": "beginner|intermediate|advanced",
      "estimatedTimeMinutes": 45,
      "prerequisites": ["Prerequisite topic names"],
      "keyTerms": ["Key terms and concepts"],
      "practicalApplications": ["Real-world applications"],
      "subtopics": [
        {
          "title": "Subtopic Title",
          "description": "Detailed description",
          "level": 2,
          "confidence": 0.85,
          "difficulty": "beginner|intermediate|advanced",
          "estimatedTimeMinutes": 20,
          "prerequisites": ["Prerequisites"],
          "keyTerms": ["Key terms"],
          "practicalApplications": ["Applications"],
          "subtopics": [
            {
              "title": "Sub-subtopic",
              "description": "Specific learning outcome",
              "level": 3,
              "confidence": 0.8,
              "difficulty": "beginner|intermediate|advanced",
              "estimatedTimeMinutes": 10,
              "prerequisites": [],
              "keyTerms": ["Specific terms"],
              "practicalApplications": ["Specific applications"]
            }
          ]
        }
      ]
    }
  ]
}

Requirements:
- Create 6-8 main topics (level 1) that comprehensively cover the subject
- Each main topic should have 2-3 subtopics (level 2)
- Select subtopics should have 1-2 sub-subtopics (level 3) when appropriate
- Ensure logical progression from basic to advanced concepts
- Include practical applications and real-world relevance
- Provide accurate time estimates for learning each topic
- Maintain high confidence scores (>0.7) for all extracted topics`;
  }

  /**
   * Parse extracted topics from AI response
   */
  private parseExtractedTopics(topics: any[]): ExtractedSubtopic[] {
    const parsed: ExtractedSubtopic[] = [];
    let idCounter = 1;

    const processTopicLevel = (
      topic: any,
      level: number,
      parentId?: string,
    ): ExtractedSubtopic => {
      const topicId = `topic_${idCounter++}`;

      const extractedTopic: ExtractedSubtopic = {
        id: topicId,
        title: topic.title || "Untitled Topic",
        description: topic.description || "",
        level,
        parentId,
        children: [],
        metadata: {
          confidence: topic.confidence || 0.7,
          difficulty: topic.difficulty || "intermediate",
          estimatedTimeMinutes: topic.estimatedTimeMinutes || 30,
          prerequisites: topic.prerequisites || [],
          relatedConcepts: topic.relatedConcepts || [],
          sourceAgents: [], // Will be filled later
          keyTerms: topic.keyTerms || [],
          practicalApplications: topic.practicalApplications || [],
        },
      };

      // Process subtopics recursively
      if (topic.subtopics && Array.isArray(topic.subtopics)) {
        extractedTopic.children = topic.subtopics.map((subtopic: any) =>
          processTopicLevel(subtopic, level + 1, topicId),
        );
      }

      return extractedTopic;
    };

    topics.forEach((topic) => {
      parsed.push(processTopicLevel(topic, 1));
    });

    return parsed;
  }

  /**
   * Build topic relationships using semantic analysis
   */
  private async buildTopicRelationships(
    topics: ExtractedSubtopic[],
    mainTopic: string,
  ): Promise<TopicRelationship[]> {
    const relationships: TopicRelationship[] = [];
    const flatTopics = this.flattenHierarchy(topics);

    // Use semantic analysis to identify relationships
    for (let i = 0; i < flatTopics.length; i++) {
      for (let j = i + 1; j < flatTopics.length; j++) {
        const relationship = await this.analyzeTopicRelationship(
          flatTopics[i],
          flatTopics[j],
          mainTopic,
        );

        if (relationship.strength > 0.3) {
          relationships.push(relationship);
        }
      }
    }

    return relationships;
  }

  /**
   * Analyze relationship between two topics
   */
  private async analyzeTopicRelationship(
    topic1: ExtractedSubtopic,
    topic2: ExtractedSubtopic,
    mainTopic: string,
  ): Promise<TopicRelationship> {
    // Simplified relationship analysis
    // In a real implementation, this would use more sophisticated NLP

    const text1 = `${topic1.title} ${topic1.description}`.toLowerCase();
    const text2 = `${topic2.title} ${topic2.description}`.toLowerCase();

    // Check for prerequisite relationships
    if (
      topic1.metadata.prerequisites.some((prereq) =>
        text2.includes(prereq.toLowerCase()),
      )
    ) {
      return {
        parentTopic: topic2.title,
        childTopic: topic1.title,
        relationshipType: "prerequisite",
        strength: 0.8,
      };
    }

    if (
      topic2.metadata.prerequisites.some((prereq) =>
        text1.includes(prereq.toLowerCase()),
      )
    ) {
      return {
        parentTopic: topic1.title,
        childTopic: topic2.title,
        relationshipType: "prerequisite",
        strength: 0.8,
      };
    }

    // Check for component relationships
    const commonTerms = topic1.metadata.keyTerms.filter((term) =>
      topic2.metadata.keyTerms.some(
        (otherTerm) =>
          term.toLowerCase().includes(otherTerm.toLowerCase()) ||
          otherTerm.toLowerCase().includes(term.toLowerCase()),
      ),
    );

    if (commonTerms.length > 0) {
      return {
        parentTopic: topic1.title,
        childTopic: topic2.title,
        relationshipType: "related",
        strength: Math.min(0.7, commonTerms.length * 0.2),
      };
    }

    // Default relationship
    return {
      parentTopic: topic1.title,
      childTopic: topic2.title,
      relationshipType: "related",
      strength: 0.1,
    };
  }

  /**
   * Build hierarchical structure from topics and relationships
   */
  private buildHierarchicalStructure(
    topics: ExtractedSubtopic[],
    relationships: TopicRelationship[],
    mainTopic: string,
  ): ExtractedSubtopic[] {
    // For now, maintain the AI-generated hierarchy
    // In a more advanced implementation, this would rebuild based on relationships
    return topics;
  }

  /**
   * Enhance topics with metadata from research results
   */
  private async enhanceTopicsWithMetadata(
    topics: ExtractedSubtopic[],
    researchResults: ResearchResult[],
    context?: any,
  ): Promise<ExtractedSubtopic[]> {
    const enhanceRecursively = (
      topic: ExtractedSubtopic,
    ): ExtractedSubtopic => {
      // Find which agents contributed content related to this topic
      const sourceAgents = this.findRelevantAgents(topic, researchResults);

      // Enhance metadata
      topic.metadata.sourceAgents = sourceAgents;
      topic.metadata.relatedConcepts = this.extractRelatedConcepts(
        topic,
        researchResults,
      );

      // Adjust difficulty based on context
      if (context?.userLevel) {
        topic.metadata.difficulty = this.adjustDifficultyForUser(
          topic.metadata.difficulty,
          context.userLevel,
        );
      }

      // Enhance children recursively
      if (topic.children) {
        topic.children = topic.children.map(enhanceRecursively);
      }

      return topic;
    };

    return topics.map(enhanceRecursively);
  }

  /**
   * Find agents that contributed relevant content for a topic
   */
  private findRelevantAgents(
    topic: ExtractedSubtopic,
    researchResults: ResearchResult[],
  ): string[] {
    const topicTerms = [
      topic.title.toLowerCase(),
      ...topic.metadata.keyTerms.map((term) => term.toLowerCase()),
    ];

    const relevantAgents: string[] = [];

    researchResults.forEach((result) => {
      if (result.status !== "success") return;

      const hasRelevantContent = result.results.some((searchResult) => {
        const content =
          `${searchResult.title} ${searchResult.snippet}`.toLowerCase();
        return topicTerms.some((term) => content.includes(term));
      });

      if (hasRelevantContent) {
        relevantAgents.push(result.agent);
      }
    });

    return relevantAgents;
  }

  /**
   * Extract related concepts from research results
   */
  private extractRelatedConcepts(
    topic: ExtractedSubtopic,
    researchResults: ResearchResult[],
  ): string[] {
    const concepts = new Set<string>();
    const topicTerms = topic.metadata.keyTerms.map((term) =>
      term.toLowerCase(),
    );

    researchResults.forEach((result) => {
      if (result.status !== "success") return;

      result.results.forEach((searchResult) => {
        const content =
          `${searchResult.title} ${searchResult.snippet}`.toLowerCase();

        // Simple concept extraction - look for capitalized terms near topic terms
        const words = content.split(/\s+/);
        words.forEach((word, index) => {
          if (word.length > 4 && word[0] === word[0].toUpperCase()) {
            // Check if this word appears near any topic terms
            const nearbyWords = words.slice(Math.max(0, index - 5), index + 5);
            if (
              topicTerms.some((term) =>
                nearbyWords.some((nearby) => nearby.includes(term)),
              )
            ) {
              concepts.add(word);
            }
          }
        });
      });
    });

    return Array.from(concepts).slice(0, 5); // Limit to 5 related concepts
  }

  /**
   * Adjust difficulty based on user level
   */
  private adjustDifficultyForUser(
    originalDifficulty: "beginner" | "intermediate" | "advanced",
    userLevel: "beginner" | "intermediate" | "advanced",
  ): "beginner" | "intermediate" | "advanced" {
    const difficultyMap = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
    };

    const userLevelNum = difficultyMap[userLevel];
    const originalNum = difficultyMap[originalDifficulty];

    // Adjust difficulty to be appropriate for user level
    if (originalNum > userLevelNum + 1) {
      // Too advanced, bring it down
      return userLevel === "beginner" ? "beginner" : "intermediate";
    }

    if (originalNum < userLevelNum - 1) {
      // Too basic, bring it up slightly
      return userLevel === "advanced" ? "intermediate" : originalDifficulty;
    }

    return originalDifficulty;
  }

  /**
   * Filter and validate topics based on configuration and context
   */
  private filterAndValidateTopics(
    topics: ExtractedSubtopic[],
    context?: any,
  ): ExtractedSubtopic[] {
    const filterRecursively = (
      topic: ExtractedSubtopic,
    ): ExtractedSubtopic | null => {
      // Check confidence threshold
      if (topic.metadata.confidence < this.config.minConfidence) {
        return null;
      }

      // Filter focus areas if specified
      if (context?.focusAreas && context.focusAreas.length > 0) {
        const topicContent =
          `${topic.title} ${topic.description}`.toLowerCase();
        const hasFocus = context.focusAreas.some((area: string) =>
          topicContent.includes(area.toLowerCase()),
        );

        if (!hasFocus && topic.level === 1) {
          return null; // Remove main topics that don't match focus areas
        }
      }

      // Filter exclude areas
      if (context?.excludeAreas && context.excludeAreas.length > 0) {
        const topicContent =
          `${topic.title} ${topic.description}`.toLowerCase();
        const shouldExclude = context.excludeAreas.some((area: string) =>
          topicContent.includes(area.toLowerCase()),
        );

        if (shouldExclude) {
          return null;
        }
      }

      // Filter children recursively
      if (topic.children) {
        topic.children = topic.children
          .map(filterRecursively)
          .filter((child) => child !== null) as ExtractedSubtopic[];
      }

      return topic;
    };

    const filtered = topics
      .map(filterRecursively)
      .filter((topic) => topic !== null) as ExtractedSubtopic[];

    // Ensure we don't exceed maxSubtopics
    return this.enforceMaxTopics(filtered);
  }

  /**
   * Enforce maximum topic limits
   */
  private enforceMaxTopics(topics: ExtractedSubtopic[]): ExtractedSubtopic[] {
    const flatCount = this.flattenHierarchy(topics).length;

    if (flatCount <= this.config.maxSubtopics) {
      return topics;
    }

    // Sort by confidence and keep the best ones
    const flatSorted = this.flattenHierarchy(topics).sort(
      (a, b) => b.metadata.confidence - a.metadata.confidence,
    );

    const keepIds = new Set(
      flatSorted.slice(0, this.config.maxSubtopics).map((t) => t.id),
    );

    const filterByIds = (
      topic: ExtractedSubtopic,
    ): ExtractedSubtopic | null => {
      if (!keepIds.has(topic.id)) return null;

      if (topic.children) {
        topic.children = topic.children
          .map(filterByIds)
          .filter((child) => child !== null) as ExtractedSubtopic[];
      }

      return topic;
    };

    return topics
      .map(filterByIds)
      .filter((topic) => topic !== null) as ExtractedSubtopic[];
  }

  // Helper methods

  private flattenHierarchy(topics: ExtractedSubtopic[]): ExtractedSubtopic[] {
    const flattened: ExtractedSubtopic[] = [];

    const flattenRecursively = (topic: ExtractedSubtopic) => {
      flattened.push(topic);
      if (topic.children) {
        topic.children.forEach(flattenRecursively);
      }
    };

    topics.forEach(flattenRecursively);
    return flattened;
  }

  private countTopicsByLevel(
    topics: ExtractedSubtopic[],
  ): Record<number, number> {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };

    topics.forEach((topic) => {
      counts[topic.level] = (counts[topic.level] || 0) + 1;
    });

    return counts;
  }

  private calculateAverageConfidence(topics: ExtractedSubtopic[]): number {
    if (topics.length === 0) return 0;

    const totalConfidence = topics.reduce(
      (sum, topic) => sum + topic.metadata.confidence,
      0,
    );
    return totalConfidence / topics.length;
  }

  private calculateCoverageMetrics(
    topics: ExtractedSubtopic[],
    researchResults: ResearchResult[],
  ) {
    const academic =
      topics.filter((t) =>
        t.metadata.sourceAgents.some((agent) =>
          agent.toLowerCase().includes("academic"),
        ),
      ).length / Math.max(1, topics.length);

    const practical =
      topics.filter((t) => t.metadata.practicalApplications.length > 0).length /
      Math.max(1, topics.length);

    const foundational =
      topics.filter((t) => t.metadata.difficulty === "beginner").length /
      Math.max(1, topics.length);

    const advanced =
      topics.filter((t) => t.metadata.difficulty === "advanced").length /
      Math.max(1, topics.length);

    return { academic, practical, foundational, advanced };
  }

  // Configuration methods
  updateConfig(config: Partial<SubtopicExtractionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SubtopicExtractionConfig {
    return { ...this.config };
  }
}

// Export default instance
export const defaultSubtopicExtractor = new SubtopicExtractor();
