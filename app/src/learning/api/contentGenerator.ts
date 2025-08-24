import { openai } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";
import type { Topic, UserTopicProgress } from "wasp/entities";
import { TopicStatus } from "@prisma/client";

// Content generation options interface
export interface ContentGenerationOptions {
  userLevel: "beginner" | "intermediate" | "advanced";
  learningStyle:
    | "visual"
    | "textual"
    | "interactive"
    | "video"
    | "conversational";
  contentType: "assessment" | "learning" | "exploration" | "quiz";
  maxTokens?: number;
  temperature?: number;
}

// Generated content interface
export interface GeneratedContent {
  content: string;
  metadata: {
    contentType: string;
    userLevel: string;
    learningStyle: string;
    tokensUsed: number;
    generatedAt: Date;
    sections?: string[];
  };
}

// Learning path interface for assessment results
export interface LearningPath {
  startingPoint: string;
  recommendedPath: string[];
  estimatedDuration: number;
  content: GeneratedContent;
}

// Assessment result interface
export interface AssessmentResult {
  userLevel: "beginner" | "intermediate" | "advanced";
  learningStyle:
    | "visual"
    | "textual"
    | "interactive"
    | "video"
    | "conversational";
  interests: string[];
  priorKnowledge: string[];
  goals: string[];
}

// Research result interface for content generation
export interface ResearchResult {
  title: string;
  content: string;
  url?: string;
  source: string;
  relevanceScore: number;
  contentType:
    | "article"
    | "video"
    | "academic"
    | "discussion"
    | "documentation";
}

// MDX content interface
export interface MDXContent {
  content: string;
  frontmatter: {
    title: string;
    description?: string;
    tags?: string[];
    difficulty: string;
    estimatedReadTime: number;
  };
  sections: {
    id: string;
    title: string;
    content: string;
    subsections?: Array<{
      id: string;
      title: string;
      content: string;
    }>;
  }[];
}

/**
 * AI Content Generator Service
 * Handles all content generation using OpenAI with proper prompt engineering
 */
export class AIContentGenerator {
  private model = openai("gpt-5-mini");
  private defaultMaxTokens = 4000;
  private defaultTemperature = 0.7;

  /**
   * Generate learning content based on topic and research results
   */
  async generateLearningContent(
    topic: Topic,
    researchResults: ResearchResult[],
    options: ContentGenerationOptions,
  ): Promise<GeneratedContent> {
    const prompt = this.buildLearningContentPrompt(
      topic,
      researchResults,
      options,
    );

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: options.temperature || this.defaultTemperature,
    });

    return {
      content: result.text,
      metadata: {
        contentType: options.contentType,
        userLevel: options.userLevel,
        learningStyle: options.learningStyle,
        tokensUsed: 0, // Usage info not available in this version
        generatedAt: new Date(),
        sections: this.extractSections(result.text),
      },
    };
  }

  /**
   * Generate personalized learning path based on assessment results
   */
  async generateAssessmentContent(
    topic: Topic,
    userPreferences: AssessmentResult,
  ): Promise<LearningPath> {
    const prompt = this.buildAssessmentContentPrompt(topic, userPreferences);

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.6, // Lower temperature for more structured output
    });

    const content = this.parseAssessmentResponse(result.text);

    return {
      startingPoint: content.startingPoint,
      recommendedPath: content.recommendedPath,
      estimatedDuration: content.estimatedDuration,
      content: {
        content: result.text,
        metadata: {
          contentType: "assessment",
          userLevel: userPreferences.userLevel,
          learningStyle: userPreferences.learningStyle,
          tokensUsed: 0, // Usage info not available in this version
          generatedAt: new Date(),
          sections: this.extractSections(result.text),
        },
      },
    };
  }

  /**
   * Generate exploration content with MDX formatting
   */
  async generateExplorationContent(
    topic: Topic,
    subtopics: string[],
  ): Promise<MDXContent> {
    const prompt = this.buildExplorationContentPrompt(topic, subtopics);

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: this.defaultTemperature,
    });

    return this.parseMDXContent(result.text, topic);
  }

  /**
   * Generate quiz questions based on content
   */
  async generateQuizContent(
    topic: Topic,
    content: string,
    options: ContentGenerationOptions,
  ): Promise<GeneratedContent> {
    const prompt = this.buildQuizContentPrompt(topic, content, options);

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.5, // Lower temperature for consistent quiz format
    });

    return {
      content: result.text,
      metadata: {
        contentType: "quiz",
        userLevel: options.userLevel,
        learningStyle: options.learningStyle,
        tokensUsed: 0, // Usage info not available in this version
        generatedAt: new Date(),
        sections: ["questions", "answers", "explanations"],
      },
    };
  }

  /**
   * Stream content generation for real-time display
   */
  async *streamContentGeneration(
    topic: Topic,
    researchResults: ResearchResult[],
    options: ContentGenerationOptions,
  ): AsyncGenerator<string, void, unknown> {
    const prompt = this.buildLearningContentPrompt(
      topic,
      researchResults,
      options,
    );

    const result = await streamText({
      model: this.model,
      prompt,
      temperature: options.temperature || this.defaultTemperature,
    });

    for await (const chunk of result.textStream) {
      yield chunk;
    }
  }

  /**
   * Build prompt for learning content generation
   */
  private buildLearningContentPrompt(
    topic: Topic,
    researchResults: ResearchResult[],
    options: ContentGenerationOptions,
  ): string {
    const researchContext = researchResults
      .slice(0, 10) // Limit to top 10 results
      .map(
        (result) =>
          `Source: ${result.source}\nTitle: ${
            result.title
          }\nContent: ${result.content.slice(0, 500)}...`,
      )
      .join("\n\n");

    const levelInstructions = {
      beginner:
        "Use simple language, provide basic definitions, include many examples, and avoid technical jargon.",
      intermediate:
        "Use moderate technical language, provide some background context, and include practical examples.",
      advanced:
        "Use technical language appropriately, assume prior knowledge, focus on complex concepts and edge cases.",
    };

    const styleInstructions = {
      visual:
        "Include descriptions of diagrams, charts, and visual aids. Use bullet points and structured layouts.",
      textual:
        "Focus on detailed explanations, use clear paragraphs, and provide comprehensive written content.",
      interactive:
        "Include exercises, thought experiments, and interactive elements. Encourage active participation.",
      video:
        "Structure content as if explaining in a video format. Use conversational tone and clear transitions.",
      conversational:
        "Use a friendly, conversational tone. Ask rhetorical questions and use analogies.",
    };

    return `You are an expert educator creating ${
      options.contentType
    } content about "${topic.title}".

User Profile:
- Knowledge Level: ${options.userLevel}
- Learning Style: ${options.learningStyle}

Instructions:
- ${levelInstructions[options.userLevel]}
- ${styleInstructions[options.learningStyle]}
- Create comprehensive, engaging content that builds understanding progressively
- Use the research context below to ensure accuracy and depth
- Structure content with clear headings and sections
- Include practical examples and real-world applications

Topic Information:
Title: ${topic.title}
${topic.summary ? `Summary: ${topic.summary}` : ""}
${topic.description ? `Description: ${topic.description}` : ""}

Research Context:
${researchContext}

Generate comprehensive ${
      options.contentType
    } content that helps the user understand "${
      topic.title
    }" according to their learning preferences.`;
  }

  /**
   * Build prompt for assessment-based content generation
   */
  private buildAssessmentContentPrompt(
    topic: Topic,
    userPreferences: AssessmentResult,
  ): string {
    return `You are an expert learning path designer creating a personalized learning journey for "${
      topic.title
    }".

User Assessment Results:
- Knowledge Level: ${userPreferences.userLevel}
- Learning Style: ${userPreferences.learningStyle}
- Interests: ${userPreferences.interests.join(", ")}
- Prior Knowledge: ${userPreferences.priorKnowledge.join(", ")}
- Learning Goals: ${userPreferences.goals.join(", ")}

Create a personalized learning path that includes:

1. STARTING_POINT: A specific, actionable starting point based on their current knowledge
2. RECOMMENDED_PATH: A step-by-step learning sequence (5-8 steps)
3. ESTIMATED_DURATION: Total estimated learning time in hours
4. PERSONALIZED_CONTENT: Detailed content for the first learning step

Format your response as:
STARTING_POINT: [specific starting point]
RECOMMENDED_PATH: [step 1] → [step 2] → [step 3] → ...
ESTIMATED_DURATION: [number] hours
PERSONALIZED_CONTENT:
[detailed content for the first step]

Ensure the path is tailored to their specific interests, prior knowledge, and learning goals.`;
  }

  /**
   * Build prompt for exploration content with MDX structure
   */
  private buildExplorationContentPrompt(
    topic: Topic,
    subtopics: string[],
  ): string {
    return `You are creating comprehensive exploration content about "${
      topic.title
    }" in MDX format.

Subtopics to cover:
${subtopics.map((subtopic) => `- ${subtopic}`).join("\n")}

Create structured MDX content with:
1. Frontmatter with title, description, tags, difficulty, and estimated read time
2. Main sections covering each subtopic
3. Subsections with detailed explanations
4. Code examples where relevant
5. Practical applications and examples
6. Key takeaways and next steps

Format as valid MDX with proper headings, code blocks, and markdown formatting.
Include interactive elements like callouts, tips, and warnings where appropriate.
Make the content comprehensive but accessible, with clear progression from basic to advanced concepts.`;
  }

  /**
   * Build prompt for quiz content generation
   */
  private buildQuizContentPrompt(
    topic: Topic,
    content: string,
    options: ContentGenerationOptions,
  ): string {
    const difficultyInstructions = {
      beginner:
        "Create basic questions testing fundamental understanding and recall.",
      intermediate:
        "Create questions testing application and analysis of concepts.",
      advanced:
        "Create challenging questions testing synthesis, evaluation, and complex problem-solving.",
    };

    return `Create a comprehensive quiz about "${
      topic.title
    }" based on the following content.

Content to base quiz on:
${content.slice(0, 2000)}...

Requirements:
- Generate 8-12 questions of varying types
- ${difficultyInstructions[options.userLevel]}
- Include multiple choice, true/false, and fill-in-the-blank questions
- Provide correct answers and detailed explanations
- Ensure questions test different aspects of the topic

Format as JSON with this structure:
{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Detailed explanation"
    }
  ]
}`;
  }

  /**
   * Extract sections from generated content
   */
  private extractSections(content: string): string[] {
    const headingRegex = /^#+\s+(.+)$/gm;
    const sections: string[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      sections.push(match[1].trim());
    }

    return sections;
  }

  /**
   * Parse assessment response into structured format
   */
  private parseAssessmentResponse(response: string): {
    startingPoint: string;
    recommendedPath: string[];
    estimatedDuration: number;
  } {
    const startingPointMatch = response.match(/STARTING_POINT:\s*(.+)/);
    const pathMatch = response.match(/RECOMMENDED_PATH:\s*(.+)/);
    const durationMatch = response.match(/ESTIMATED_DURATION:\s*(\d+)/);

    const startingPoint =
      startingPointMatch?.[1]?.trim() || "Begin with fundamental concepts";

    const pathString = pathMatch?.[1]?.trim() || "";
    const recommendedPath = pathString
      .split(/→|->|,/)
      .map((step) => step.trim())
      .filter((step) => step.length > 0);

    const estimatedDuration = durationMatch ? parseInt(durationMatch[1]) : 10;

    return {
      startingPoint,
      recommendedPath,
      estimatedDuration,
    };
  }

  /**
   * Parse MDX content into structured format
   */
  private parseMDXContent(content: string, topic: Topic): MDXContent {
    // Extract frontmatter if present
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    let frontmatter: any = {
      title: topic.title,
      difficulty: "intermediate",
      estimatedReadTime: 15,
    };
    let mainContent = content;

    if (frontmatterMatch) {
      try {
        // Simple frontmatter parsing
        const frontmatterText = frontmatterMatch[1];
        const lines = frontmatterText.split("\n");
        for (const line of lines) {
          const [key, ...valueParts] = line.split(":");
          if (key && valueParts.length > 0) {
            const value = valueParts.join(":").trim();
            frontmatter[key.trim()] = value.replace(/^["']|["']$/g, "");
          }
        }
        mainContent = frontmatterMatch[2];
      } catch (error) {
        console.warn("Failed to parse frontmatter:", error);
      }
    }

    // Extract sections
    const sections = this.extractSectionsWithContent(mainContent);

    return {
      content: mainContent,
      frontmatter,
      sections,
    };
  }

  /**
   * Extract sections with their content
   */
  private extractSectionsWithContent(content: string): MDXContent["sections"] {
    const sections: MDXContent["sections"] = [];
    const lines = content.split("\n");
    let currentSection: any = null;
    let currentSubsection: any = null;

    for (const line of lines) {
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);

      if (h2Match) {
        // Save previous section
        if (currentSection) {
          sections.push(currentSection);
        }
        // Start new section
        currentSection = {
          id: this.generateId(h2Match[1]),
          title: h2Match[1].trim(),
          content: "",
          subsections: [],
        };
        currentSubsection = null;
      } else if (h3Match && currentSection) {
        // Save previous subsection content
        if (currentSubsection) {
          currentSection.subsections.push(currentSubsection);
        }
        // Start new subsection
        currentSubsection = {
          id: this.generateId(h3Match[1]),
          title: h3Match[1].trim(),
          content: "",
        };
      } else {
        // Add content to current section or subsection
        if (currentSubsection) {
          currentSubsection.content += line + "\n";
        } else if (currentSection) {
          currentSection.content += line + "\n";
        }
      }
    }

    // Save final section
    if (currentSection) {
      if (currentSubsection) {
        currentSection.subsections.push(currentSubsection);
      }
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Generate URL-friendly ID from title
   */
  private generateId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

// Export singleton instance
export const aiContentGenerator = new AIContentGenerator();
