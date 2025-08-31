import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { SubtopicInfo, SynthesisResult, SubtopicsSchema } from "./types";

/**
 * Subtopic Identification Module
 * Handles identification of subtopics for further exploration
 */
export class SubtopicIdentificationModule {
  private fastModel = openai("gpt-5-nano");

  /**
   * Identify subtopics for further exploration
   */
  async identifySubtopics(
    topic: string,
    synthesis: SynthesisResult,
    nextDepth: number,
  ): Promise<SubtopicInfo[]> {
    const prompt = `You are analyzing research findings about "${topic}" to discover subtopics for further exploration. You have NO prior knowledge about this topic - use ONLY the research insights provided.

RESEARCH FINDINGS - YOUR ONLY KNOWLEDGE SOURCE:
${synthesis.keyInsights?.join("\n- ") || ""}

THEMES DISCOVERED IN RESEARCH:
${synthesis.contentThemes?.join("\n- ") || ""}

SUBTOPIC IDENTIFICATION INSTRUCTIONS:
Based ONLY on what the research revealed, identify exactly 5 subtopics that:

1. Are MENTIONED or IMPLIED in the research findings above
2. Represent different aspects discovered through research
3. Would benefit from their own dedicated research (not covered in depth by current research)
4. Are substantial enough based on research mentions/themes
5. Logically connect to the main topic based on research findings

ANALYSIS APPROACH:
- Look through the research insights for specific areas mentioned
- Examine the themes for different aspects of the topic
- Identify gaps where research pointed to areas needing deeper exploration
- Consider different angles the research revealed (causes, effects, applications, etc.)
- Select subtopics that would expand knowledge beyond current research

PRIORITY ASSIGNMENT (1=highest, 5=lowest):
- Priority 1: Most frequently mentioned or most fundamental based on research
- Priority 2-5: Decreasing importance based on research emphasis and relevance

COMPLEXITY ASSIGNMENT:
- Use EXACTLY one of these values: "beginner", "intermediate", or "advanced"
- Do NOT use combinations like "beginner-intermediate" or hyphenated values
- Choose based on the language and concepts mentioned in the research:
  * "beginner": Simple concepts, basic terminology, foundational ideas
  * "intermediate": Moderate complexity, some technical terms, building on basics  
  * "advanced": Complex concepts, specialized terminology, expert-level topics

OUTPUT FORMAT REQUIREMENTS:
You MUST provide exactly 5 subtopics in this JSON format:

{
  "subtopics": [
    {
      "title": "Subtopic 1 Name",
      "description": "Brief description of what this covers",
      "priority": 1,
      "complexity": "beginner"
    },
    {
      "title": "Subtopic 2 Name", 
      "description": "Brief description",
      "priority": 2,
      "complexity": "intermediate"
    },
    ... (continue for all 5 subtopics)
  ]
}

CRITICAL REQUIREMENTS:
- MUST include exactly 5 subtopics in the subtopics array
- Each priority must be unique (1, 2, 3, 4, 5)
- Each complexity must be exactly: "beginner", "intermediate", or "advanced"
- Base subtopics ONLY on what the research findings and themes reveal
- Do not add subtopics from your own knowledge - only those that emerged from the research data`;

    try {
      const result = await (generateObject as any)({
        model: this.fastModel, // Use faster model for subtopic identification
        prompt,
        schema: SubtopicsSchema,
        temperature: 0.6, // Lower temperature for more consistent structure
      });

      if (!result.object || !result.object.subtopics || !Array.isArray(result.object.subtopics)) {
        throw new Error('Invalid subtopics structure generated');
      }

      return result.object.subtopics.map((subtopic: any) => ({
        ...subtopic,
        estimatedReadTime: this.estimateSubtopicReadTime(subtopic.complexity),
      }));
      
    } catch (error) {
      console.error('Structured subtopic generation failed, creating fallback subtopics:', error);
      
      // Fallback: Create basic subtopics based on research themes
      return this.createFallbackSubtopics(topic, synthesis);
    }
  }

  /**
   * Estimate reading time for subtopics based on complexity
   */
  private estimateSubtopicReadTime(complexity: string): number {
    switch (complexity) {
      case "beginner":
        return 5;
      case "intermediate":
        return 10;
      case "advanced":
        return 15;
      default:
        return 8;
    }
  }

  /**
   * Create fallback subtopics when structured generation fails
   */
  private createFallbackSubtopics(topic: string, synthesis: SynthesisResult): SubtopicInfo[] {
    const themes = synthesis.contentThemes || [];
    const fallbackSubtopics = themes.slice(0, 5).map((theme: string, index: number) => ({
      title: theme,
      description: `Exploration of ${theme} as mentioned in research findings`,
      priority: index + 1,
      complexity: (index < 2 ? "beginner" : index < 4 ? "intermediate" : "advanced") as "beginner" | "intermediate" | "advanced",
      estimatedReadTime: this.estimateSubtopicReadTime(index < 2 ? "beginner" : index < 4 ? "intermediate" : "advanced")
    }));

    // If we don't have enough themes, pad with generic subtopics
    while (fallbackSubtopics.length < 5) {
      const index = fallbackSubtopics.length;
      fallbackSubtopics.push({
        title: `${topic} - Aspect ${index + 1}`,
        description: `Additional aspect of ${topic} for further exploration`,
        priority: index + 1,
        complexity: "intermediate" as const,
        estimatedReadTime: this.estimateSubtopicReadTime("intermediate")
      });
    }

    return fallbackSubtopics.slice(0, 5); // Ensure exactly 5 subtopics
  }
}