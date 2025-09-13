import { GeneratedContent, ContentSection, SynthesisResult } from "./types";

/**
 * Fallback Module
 * Handles fallback mechanisms and error recovery for content generation
 */
export class FallbackModule {

  /**
   * Implement fallback mechanisms for content generation failures
   * Requirements 3.5, 4.4, 4.5: Fallback mechanisms for generation failures
   */
  createFallbackContent(
    topic: string, 
    synthesis: SynthesisResult, 
    error: Error,
    formatAsMDX: (content: any) => string,
    estimateReadTime: (contentLength: number) => number
  ): GeneratedContent {
    console.warn(`🔧 Creating fallback content for "${topic}" due to generation failure:`, error.message);

    // Extract available insights and themes
    const extractionStartTime = Date.now();
    console.log(`TIMING LOGS: Starting fallback content data extraction from synthesis`);
    const insights = synthesis?.keyInsights || [];
    const themes = synthesis?.contentThemes || [];
    const extractionDuration = Date.now() - extractionStartTime;
    console.log(`TIMING LOGS: Completed fallback data extraction in ${extractionDuration}ms - ${insights.length} insights, ${themes.length} themes`);
    
    // Create basic progressive structure
    const structureStartTime = Date.now();
    console.log(`TIMING LOGS: Starting fallback content structure creation`);
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
    const structureDuration = Date.now() - structureStartTime;
    console.log(`TIMING LOGS: Completed fallback content structure creation in ${structureDuration}ms - ${sections.length} sections`);

    // Create fallback takeaways and next steps
    const takeawaysStartTime = Date.now();
    console.log(`TIMING LOGS: Starting fallback takeaways and next steps creation`);
    const keyTakeaways = this.createFallbackTakeaways(topic, insights, themes);
    const nextSteps = this.createFallbackNextSteps(topic);
    const takeawaysDuration = Date.now() - takeawaysStartTime;
    console.log(`TIMING LOGS: Completed fallback takeaways creation in ${takeawaysDuration}ms - ${keyTakeaways.length} takeaways, ${nextSteps.length} next steps`);

    const formattingStartTime = Date.now();
    console.log(`TIMING LOGS: Starting fallback content formatting and finalization`);
    const fallbackContent: GeneratedContent = {
      title: `Understanding ${topic}`,
      content: formatAsMDX({
        title: `Understanding ${topic}`,
        sections,
        keyTakeaways,
        nextSteps
      }),
      sections,
      keyTakeaways,
      nextSteps,
      estimatedReadTime: estimateReadTime(
        sections.reduce((total, section) => total + section.content.length, 0)
      )
    };
    const formattingDuration = Date.now() - formattingStartTime;
    console.log(`TIMING LOGS: Completed fallback content formatting in ${formattingDuration}ms`);

    console.log("✅ Fallback content created with progressive learning structure");
    return fallbackContent;
  }

  /**
   * Helper methods for fallback content creation
   */
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

  private createFallbackTakeaways(topic: string, insights: string[], themes: string[]): string[] {
    const takeaways: string[] = [
      `${topic} involves multiple interconnected concepts that build upon each other`,
      `Understanding the foundations is essential before exploring advanced applications`,
      `Practical applications help bridge theoretical knowledge with real-world usage`
    ];

    // Add insight-based takeaways if available
    if (insights.length > 0) {
      takeaways.push(`Research reveals key insights about ${topic} that inform practical understanding`);
    }

    if (themes.length > 0) {
      takeaways.push(`Multiple themes and perspectives contribute to comprehensive ${topic} knowledge`);
    }

    return takeaways.slice(0, 5); // Limit to 5 takeaways
  }

  private createFallbackNextSteps(topic: string): string[] {
    return [
      `Explore specific aspects of ${topic} that interest you most`,
      `Practice applying ${topic} concepts in simple, real-world scenarios`,
      `Seek out additional resources and examples to deepen understanding`,
      `Connect with others who have experience with ${topic}`,
      `Start with small, manageable projects to build practical skills`
    ].slice(0, 4); // Limit to 4 next steps
  }
}