import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { GeneratedContent, ContentSection, SynthesisResult, ContentStructureSchema } from "./types";

/**
 * Content Generation Module
 * Handles comprehensive content generation with progressive learning structure
 */
export class ContentGenerationModule {
  private model = openai("gpt-5-mini");

  /**
   * Generate comprehensive content using AI with progressive learning structure
   * 
   * ENHANCED FOR PROGRESSIVE LEARNING (Task 4):
   * - Organizes information in logical learning sequence (Requirement 3.2)
   * - Breaks down complex topics into digestible components (Requirement 3.3) 
   * - Ensures each section builds upon previous knowledge clearly (Requirement 3.4)
   * - Focuses on practical understanding over academic theory (Requirement 1.5)
   * 
   * Content structure follows: Foundation → Building Blocks → Applications
   * Each section includes learning objectives and complexity indicators
   */
  async generateContent(
    topic: string,
    synthesis: SynthesisResult,
  ): Promise<GeneratedContent> {
    const prompt = `You are an educational content creator specializing in clear, practical explanations. Create comprehensive learning content about "${topic}" using the insights provided below.

AVAILABLE INSIGHTS:
${synthesis.keyInsights?.join("\n- ") || ""}

KEY THEMES:
${synthesis.contentThemes?.join("\n- ") || ""}

CONTENT REQUIREMENTS:
1. CLEAR STRUCTURE - Organize information from basic concepts to practical applications
2. ACCESSIBLE LANGUAGE - Use simple, everyday language with clear explanations
3. PRACTICAL FOCUS - Emphasize real-world applications and examples
4. PROGRESSIVE FLOW - Each section naturally builds understanding

SECTION STRUCTURE:
Create 4-6 sections that flow logically:
- Start with foundational concepts and definitions
- Progress through key components and how things work
- Conclude with practical applications and getting started

WRITING GUIDELINES:
- Use conversational, clear language
- Explain technical terms simply when first used
- Include concrete examples and analogies
- Focus on practical understanding over theory
- Break complex ideas into digestible parts
- Use numbered steps for processes

CONTENT FOCUS:
- What the topic actually is and why it matters
- Key components and how they work together
- Real-world examples and applications
- Practical steps readers can take
- Concrete benefits and use cases

FORMATTING REQUIREMENTS:
- keyTakeaways: array of clear, practical summary points
- nextSteps: array of specific, actionable recommendations
- Each section should have clear, descriptive titles
- Include practical examples throughout

Create content that helps readers truly understand ${topic} and how to apply it in practice.`;

    let result;
    try {
      result = await (generateObject as any)({
        model: this.model,
        prompt,
        schema: ContentStructureSchema,
        temperature: 0.7,
      });
    } catch (error) {
      console.error(
        "Structured generation failed, attempting enhanced fallback:",
        error,
      );

      // Enhanced fallback mechanism (Requirements 3.5, 4.4, 4.5)
      try {
        // First attempt: text generation with structured parsing
        const textResult = await generateText({
          model: this.model,
          prompt:
            prompt +
            "\n\nGenerate the response in a structured format that can be parsed as JSON.",
          temperature: 0.7,
        });

        // Try to parse the fallback response
        result = { object: this.parseContentFallback(textResult.text, topic) };
        console.log("✅ Text generation fallback succeeded");
        
      } catch (fallbackError) {
        console.error("Text generation fallback also failed:", fallbackError);
        
        // Final fallback: create structured content using synthesis data
        const fallbackContent = this.createBasicFallbackContent(topic, synthesis, error as Error);
        return fallbackContent;
      }
    }

    // Convert structured result to our content format
    const content = result.object;

    // Ensure arrays contain only strings and validate progressive structure
    const cleanKeyTakeaways = this.ensureStringArray(content.keyTakeaways);
    const cleanNextSteps = this.ensureStringArray(content.nextSteps);
    const cleanSections = content.sections.map((section: any, index: number) => ({
      ...section,
      sources: this.ensureStringArray(section.sources || []),
      // Ensure progressive learning structure is maintained
      complexity: section.complexity || this.inferSectionComplexity(index, content.sections.length),
      learningObjective: section.learningObjective || `Understand ${section.title.toLowerCase()}`,
    }));

    // Validate progressive learning structure
    this.validateProgressiveLearningStructure(cleanSections);

    const estimatedReadTime = this.estimateReadTime(
      cleanSections.reduce(
        (total: number, section: any) => total + section.content.length,
        0,
      ),
    );

    const generatedContent: GeneratedContent = {
      title: content.title,
      content: this.formatAsMDX({
        title: content.title,
        sections: cleanSections,
        keyTakeaways: cleanKeyTakeaways,
        nextSteps: cleanNextSteps,
      }),
      sections: cleanSections,
      keyTakeaways: cleanKeyTakeaways,
      nextSteps: cleanNextSteps,
      estimatedReadTime,
    };

    return generatedContent;
  }

  /**
   * Format content as MDX
   */
  formatAsMDX(content: {
    title: string;
    sections: ContentSection[];
    keyTakeaways: string[];
    nextSteps: string[];
  }): string {
    let mdx = `# ${content.title}\n\n`;

    content.sections.forEach((section, index) => {
      mdx += `## ${section.title}\n\n`;
      mdx += `${section.content}\n\n`;
      
      // Add section separator for non-final sections
      if (index < content.sections.length - 1) {
        mdx += `---\n\n`;
      }
    });

    if (content.keyTakeaways.length > 0) {
      mdx += `## Key Takeaways\n\n`;
      content.keyTakeaways.forEach((takeaway) => {
        mdx += `- ${takeaway}\n`;
      });
      mdx += "\n";
    }

    if (content.nextSteps.length > 0) {
      mdx += `## Next Steps\n\n`;
      content.nextSteps.forEach((step, index) => {
        mdx += `${index + 1}. ${step}\n`;
      });
      mdx += "\n";
    }

    return mdx;
  }

  /**
   * Estimate reading time based on content length
   */
  private estimateReadTime(contentLength: number): number {
    const wordsPerMinute = 200;
    const wordCount = contentLength / 5; // Rough estimate: 5 chars per word
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  /**
   * Infer section complexity based on position in learning sequence
   * Requirements 3.2, 3.3: Organize information in logical learning sequence and break down complex topics
   */
  private inferSectionComplexity(index: number, totalSections: number): "foundation" | "building" | "application" {
    const position = index / (totalSections - 1); // 0 to 1
    
    if (position <= 0.33) {
      return "foundation"; // First third - foundational concepts
    } else if (position <= 0.66) {
      return "building"; // Middle third - building concepts
    } else {
      return "application"; // Final third - practical applications
    }
  }

  /**
   * Validate that content follows progressive learning structure
   * Requirements 3.2, 3.3, 3.4: Logical sequence, digestible components, clear knowledge building
   */
  private validateProgressiveLearningStructure(sections: ContentSection[]): void {
    if (sections.length < 3) {
      console.warn("⚠️ Progressive learning: Content should have at least 3 sections for proper progression");
      return;
    }

    // Check for foundational content in early sections
    const earlyTitles = sections.slice(0, Math.ceil(sections.length / 3))
      .map(s => s.title.toLowerCase());
    
    const hasFoundationalStart = earlyTitles.some(title =>
      title.includes('basic') ||
      title.includes('foundation') ||
      title.includes('introduction') ||
      title.includes('what is') ||
      title.includes('overview') ||
      title.includes('fundamental')
    );

    // Check for practical applications in later sections
    const lateTitles = sections.slice(Math.floor(sections.length * 2/3))
      .map(s => s.title.toLowerCase());
    
    const hasPracticalEnd = lateTitles.some(title =>
      title.includes('application') ||
      title.includes('practical') ||
      title.includes('example') ||
      title.includes('use') ||
      title.includes('getting started') ||
      title.includes('implement')
    );

    // Check for logical complexity progression
    const complexityProgression = sections.map(s => s.complexity);
    const hasLogicalProgression = this.validateComplexityProgression(complexityProgression);

    // Log validation results
    if (!hasFoundationalStart) {
      console.warn("⚠️ Progressive learning: Missing foundational concepts in early sections");
    }
    
    if (!hasPracticalEnd) {
      console.warn("⚠️ Progressive learning: Missing practical applications in later sections");
    }
    
    if (!hasLogicalProgression) {
      console.warn("⚠️ Progressive learning: Complexity progression may not be optimal");
    }

    if (hasFoundationalStart && hasPracticalEnd && hasLogicalProgression) {
      console.log("✅ Progressive learning structure validated: foundation → building → application");
    }
  }

  /**
   * Validate that complexity progresses logically through sections
   * Requirement 3.4: Each section builds upon previous knowledge clearly
   */
  private validateComplexityProgression(complexities: (string | undefined)[]): boolean {
    const complexityOrder = { "foundation": 1, "building": 2, "application": 3 };
    
    let previousLevel = 0;
    let hasProgression = true;
    
    for (const complexity of complexities) {
      if (!complexity) continue;
      
      const currentLevel = complexityOrder[complexity as keyof typeof complexityOrder] || 2;
      
      // Allow same level or progression, but not regression
      if (currentLevel < previousLevel - 1) {
        hasProgression = false;
        break;
      }
      
      previousLevel = Math.max(previousLevel, currentLevel);
    }
    
    return hasProgression;
  }

  // Helper methods for content generation fallback
  private ensureStringArray(arr: any): string[] {
    if (!Array.isArray(arr)) return [];

    return arr
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          // If it's an object, try to extract a string value
          return (
            item.text ||
            item.content ||
            item.title ||
            item.description ||
            JSON.stringify(item)
          );
        }
        return String(item);
      })
      .filter((item) => item && item.trim().length > 0);
  }

  private parseContentFallback(text: string, topic: string): any {
    // Fallback parsing if structured generation fails
    // This is a simple implementation - in production you might want more sophisticated parsing

    try {
      // Try to find JSON-like structure in the text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      // JSON parsing failed, create manual structure
    }

    // Manual fallback structure
    const sections = [
      {
        title: "Overview",
        content: text.length > 500 ? text.substring(0, 500) + "..." : text,
        sources: [],
      },
    ];

    const keyTakeaways = text
      .split("\n")
      .filter(
        (line) => line.trim().startsWith("-") || line.trim().startsWith("•"),
      )
      .map((line) => line.replace(/^[-•]\s*/, "").trim())
      .slice(0, 5);

    const nextSteps = [
      "Research specific subtopics in more detail",
      "Explore practical applications",
      "Review additional sources and examples",
    ];

    return {
      title: topic,
      sections,
      keyTakeaways:
        keyTakeaways.length > 0
          ? keyTakeaways
          : ["Key concepts identified from research"],
      nextSteps,
    };
  }

  /**
   * Create basic fallback content for serious generation failures
   */
  private createBasicFallbackContent(
    topic: string, 
    synthesis: SynthesisResult, 
    error: Error
  ): GeneratedContent {
    console.warn(`🔧 Creating basic fallback content for "${topic}" due to generation failure:`, error.message);

    // Extract available insights and themes
    const insights = synthesis?.keyInsights || [];
    const themes = synthesis?.contentThemes || [];
    
    // Create basic progressive structure
    const sections: ContentSection[] = [
      {
        title: `Understanding ${topic} - Foundation`,
        content: this.createFoundationContent(topic, insights.slice(0, 2)),
        sources: [],
        complexity: "foundation",
        learningObjective: `Understand the basic concepts of ${topic}`
      },
      {
        title: `Key Components of ${topic}`,
        content: this.createBuildingContent(topic, insights.slice(2, 4), themes.slice(0, 2)),
        sources: [],
        complexity: "building", 
        learningObjective: `Identify the main elements and components of ${topic}`
      },
      {
        title: `Practical Applications of ${topic}`,
        content: this.createApplicationContent(topic, insights.slice(4), themes.slice(2)),
        sources: [],
        complexity: "application",
        learningObjective: `Apply ${topic} concepts in practical situations`
      }
    ];

    // Create fallback takeaways and next steps
    const keyTakeaways = [
      `${topic} involves multiple interconnected concepts that build upon each other`,
      `Understanding the foundations is essential before exploring advanced applications`,
      `Practical applications help bridge theoretical knowledge with real-world usage`
    ];
    
    const nextSteps = [
      `Explore specific aspects of ${topic} that interest you most`,
      `Practice applying ${topic} concepts in simple, real-world scenarios`,
      `Seek out additional resources and examples to deepen understanding`
    ];

    return {
      title: `Understanding ${topic}`,
      content: this.formatAsMDX({
        title: `Understanding ${topic}`,
        sections,
        keyTakeaways,
        nextSteps
      }),
      sections,
      keyTakeaways,
      nextSteps,
      estimatedReadTime: this.estimateReadTime(
        sections.reduce((total, section) => total + section.content.length, 0)
      )
    };
  }

  private createFoundationContent(topic: string, insights: string[]): string {
    const baseContent = `${topic} is a concept that requires understanding from multiple perspectives. `;
    
    if (insights.length > 0) {
      return baseContent + `Based on research findings:\n\n${insights.map(insight => `- ${insight}`).join('\n')}\n\nThese foundational insights help us understand what ${topic} involves and why it's important to study.`;
    }
    
    return baseContent + `To understand ${topic} effectively, we need to start with the basic concepts and build our knowledge progressively. This foundation will help us explore more complex aspects in the following sections.`;
  }

  private createBuildingContent(topic: string, insights: string[], themes: string[]): string {
    let content = `Building on our foundational understanding of ${topic}, we can now explore its key components and characteristics.\n\n`;
    
    if (insights.length > 0) {
      content += `Key insights from research include:\n${insights.map(insight => `- ${insight}`).join('\n')}\n\n`;
    }
    
    if (themes.length > 0) {
      content += `Important themes that emerge include:\n${themes.map(theme => `- ${theme}`).join('\n')}\n\n`;
    }
    
    content += `These elements work together to form a comprehensive understanding of ${topic} and prepare us for practical applications.`;
    
    return content;
  }

  private createApplicationContent(topic: string, insights: string[], themes: string[]): string {
    let content = `Now that we understand the foundations and key components of ${topic}, we can explore how these concepts apply in practical situations.\n\n`;
    
    if (insights.length > 0) {
      content += `Practical insights include:\n${insights.map(insight => `- ${insight}`).join('\n')}\n\n`;
    }
    
    if (themes.length > 0) {
      content += `Real-world applications involve:\n${themes.map(theme => `- ${theme}`).join('\n')}\n\n`;
    }
    
    content += `These applications demonstrate how ${topic} can be used effectively in various contexts and situations.`;
    
    return content;
  }
}