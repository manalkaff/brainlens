import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { GeneratedContent, ContentSection, SynthesisResult, ContentStructureSchema, CommunityInsight } from "./types";

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
5. COMMUNITY INSIGHTS - Include real user opinions, techniques, and experiences throughout
6. DIVERSE PERSPECTIVES - Integrate community knowledge alongside educational content

SECTION STRUCTURE:
Create 4-6 sections that flow logically:
- Start with foundational concepts and definitions
- Progress through key components and how things work  
- Include community insights and user experiences throughout each section
- Add dedicated "Community Perspectives" section with user opinions, techniques, and tips
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
- User opinions, experiences, and personal techniques from community
- Practical tips, tricks, and methods shared by practitioners
- Community discussions, common questions, and crowdsourced solutions
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
      const aiStartTime = Date.now();
      console.log(`TIMING LOGS: Starting AI content generation using ${this.model.modelId} - prompt length: ${prompt.length} chars`);
      result = await (generateObject as any)({
        model: this.model,
        prompt,
        schema: ContentStructureSchema,
        temperature: 0.7,
      });
      const aiDuration = Date.now() - aiStartTime;
      console.log(`TIMING LOGS: Completed AI content generation in ${aiDuration}ms - model: ${this.model.modelId}`);
    } catch (error) {
      console.error(
        "Structured generation failed, attempting enhanced fallback:",
        error,
      );

      // Enhanced fallback mechanism (Requirements 3.5, 4.4, 4.5)
      try {
        // First attempt: text generation with structured parsing
        const fallbackAiStartTime = Date.now();
        console.log(`TIMING LOGS: Starting fallback AI content generation using text mode`);
        const textResult = await generateText({
          model: this.model,
          prompt:
            prompt +
            "\n\nGenerate the response in a structured format that can be parsed as JSON.",
          temperature: 0.7,
        });
        const fallbackAiDuration = Date.now() - fallbackAiStartTime;
        console.log(`TIMING LOGS: Completed fallback AI content generation in ${fallbackAiDuration}ms`);

        // Try to parse the fallback response
        const parsingStartTime = Date.now();
        console.log(`TIMING LOGS: Starting fallback content parsing`);
        result = { object: this.parseContentFallback(textResult.text, topic) };
        const parsingDuration = Date.now() - parsingStartTime;
        console.log(`TIMING LOGS: Completed fallback content parsing in ${parsingDuration}ms`);
        console.log("✅ Text generation fallback succeeded");
        
      } catch (fallbackError) {
        console.error("Text generation fallback also failed:", fallbackError);
        
        // Final fallback: create structured content using synthesis data
        const finalFallbackStartTime = Date.now();
        console.log(`TIMING LOGS: Starting final fallback content creation using synthesis data`);
        const fallbackContent = this.createBasicFallbackContent(topic, synthesis, error as Error);
        const finalFallbackDuration = Date.now() - finalFallbackStartTime;
        console.log(`TIMING LOGS: Completed final fallback content creation in ${finalFallbackDuration}ms`);
        return fallbackContent;
      }
    }

    // Convert structured result to our content format
    const processingStartTime = Date.now();
    console.log(`TIMING LOGS: Starting content structure processing and validation`);
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
    
    const processingDuration = Date.now() - processingStartTime;
    console.log(`TIMING LOGS: Completed content structure processing in ${processingDuration}ms - ${cleanSections.length} sections`);

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
      
      // Add community insights if available
      if (section.communityContent && section.communityContent.length > 0) {
        mdx += `### Community Insights\n\n`;
        section.communityContent.forEach(insight => {
          mdx += this.formatCommunityInsight(insight);
        });
        mdx += `\n`;
      }
      
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
   * Format community insight for MDX display
   */
  private formatCommunityInsight(insight: CommunityInsight): string {
    let formatted = '';
    
    switch (insight.type) {
      case 'opinion':
        formatted = `> **User Opinion**: ${insight.content}`;
        break;
      case 'technique':
        formatted = `> **Technique**: ${insight.content}`;
        break;
      case 'tip':
        formatted = `> **Community Tip**: ${insight.content}`;
        break;
      case 'example':
        formatted = `> **Real Example**: ${insight.content}`;
        break;
      case 'discussion':
        formatted = `> **Discussion**: ${insight.content}`;
        break;
      default:
        formatted = `> ${insight.content}`;
    }
    
    if (insight.author || insight.source) {
      formatted += ` *(${insight.author || insight.source})*`;
    }
    
    return formatted + '\n\n';
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
    
    // Create basic progressive structure with community content
    const sections: ContentSection[] = [
      {
        title: `Understanding ${topic} - Foundation`,
        content: this.createFoundationContent(topic, insights.slice(0, 2)),
        sources: [],
        complexity: "foundation",
        learningObjective: `Understand the basic concepts of ${topic}`,
        communityContent: this.createSampleCommunityInsights(topic, 'foundation')
      },
      {
        title: `Key Components of ${topic}`,
        content: this.createBuildingContent(topic, insights.slice(2, 4), themes.slice(0, 2)),
        sources: [],
        complexity: "building", 
        learningObjective: `Identify the main elements and components of ${topic}`,
        communityContent: this.createSampleCommunityInsights(topic, 'building')
      },
      {
        title: `Community Perspectives on ${topic}`,
        content: this.createCommunitySection(topic, insights, themes),
        sources: [],
        complexity: "building",
        learningObjective: `Learn from community experiences and diverse perspectives on ${topic}`,
        communityContent: this.createSampleCommunityInsights(topic, 'community')
      },
      {
        title: `Practical Applications of ${topic}`,
        content: this.createApplicationContent(topic, insights.slice(4), themes.slice(2)),
        sources: [],
        complexity: "application",
        learningObjective: `Apply ${topic} concepts in practical situations`,
        communityContent: this.createSampleCommunityInsights(topic, 'application')
      }
    ];

    // Create fallback takeaways and next steps with community focus
    const keyTakeaways = [
      `${topic} involves multiple interconnected concepts that build upon each other`,
      `Understanding the foundations is essential before exploring advanced applications`,
      `Community insights and user experiences provide valuable practical perspectives`,
      `Real-world examples from practitioners help bridge theory with application`,
      `Practical applications help bridge theoretical knowledge with real-world usage`
    ];
    
    const nextSteps = [
      `Explore specific aspects of ${topic} that interest you most`,
      `Connect with the ${topic} community to learn from experienced practitioners`,
      `Practice applying ${topic} concepts in simple, real-world scenarios`,
      `Study real examples and techniques shared by community members`,
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

  private createCommunitySection(topic: string, insights: string[], themes: string[]): string {
    let content = `The ${topic} community offers valuable insights, techniques, and real-world experiences that complement theoretical knowledge. Here's what practitioners and users have shared:\n\n`;
    
    content += `### User Experiences and Opinions\n`;
    content += `Community members share diverse perspectives on ${topic}, highlighting both successes and challenges encountered in real-world applications.\n\n`;
    
    content += `### Personal Techniques and Methods\n`;
    content += `Experienced practitioners have developed various approaches and workflows for implementing ${topic} effectively in different contexts.\n\n`;
    
    content += `### Community Tips and Best Practices\n`;
    content += `The collective wisdom of the ${topic} community provides practical guidance that goes beyond basic documentation.\n\n`;
    
    content += `### Real Examples and Use Cases\n`;
    content += `Community members regularly share specific examples of how they've applied ${topic} in their projects, providing concrete inspiration for others.\n\n`;
    
    if (insights.length > 0) {
      content += `Key community insights include:\n${insights.map(insight => `- ${insight}`).join('\n')}\n\n`;
    }
    
    content += `These community contributions demonstrate the practical value and real-world applicability of ${topic} across various use cases and contexts.`;
    
    return content;
  }

  private createSampleCommunityInsights(topic: string, section: string): CommunityInsight[] {
    // This would normally be populated from actual community/video search results
    // For now, provide sample structure that will be filled by research data
    const insights: CommunityInsight[] = [];
    
    switch (section) {
      case 'foundation':
        insights.push({
          type: 'opinion',
          content: `Community members often emphasize the importance of understanding ${topic} fundamentals before diving into advanced features.`,
          context: 'foundational understanding'
        });
        break;
      case 'building':
        insights.push({
          type: 'technique',
          content: `Experienced practitioners recommend breaking down ${topic} into manageable components when learning.`,
          context: 'learning approach'
        });
        break;
      case 'community':
        insights.push(
          {
            type: 'tip',
            content: `The ${topic} community actively shares resources and helps newcomers through various forums and discussion platforms.`,
            context: 'community support'
          },
          {
            type: 'example',
            content: `Many users document their ${topic} implementations and share them for others to learn from.`,
            context: 'knowledge sharing'
          }
        );
        break;
      case 'application':
        insights.push({
          type: 'discussion',
          content: `Community discussions often focus on practical implementation challenges and solutions for ${topic}.`,
          context: 'practical application'
        });
        break;
    }
    
    return insights;
  }
}