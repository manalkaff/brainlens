import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { SearchResultWithEngine, SynthesisResult } from "./types";

/**
 * Synthesis Module
 * Handles research synthesis and analysis with practical focus
 */
export class SynthesisModule {
  private model = openai("gpt-5-mini");

  /**
   * Synthesize research results using AI with enhanced weighting for practical understanding
   * 
   * ENHANCED FOR PRACTICAL UNDERSTANDING (Task 5):
   * - Weights general sources appropriately for balanced perspective (Requirement 2.4)
   * - Focuses on practical applications over academic theory (Requirement 4.1, 4.2)
   * - Balances academic credibility with accessibility (Requirement 4.3)
   */
  async synthesizeResearch(
    topic: string,
    researchResults: SearchResultWithEngine[],
  ): Promise<SynthesisResult> {
    // Enhanced source weighting: prioritize general sources for practical understanding
    const weightedResults = this.weightSourcesForPracticalUnderstanding(researchResults);
    
    // Build research context with balanced representation
    const researchContext = weightedResults
      .slice(0, 20) // Use top 20 weighted sources for synthesis
      .map(
        (result, index) =>
          `[${index + 1}] ${result.engine.toUpperCase()}: "${result.title}"\n${
            result.snippet
          }\nURL: ${result.url}\nRelevance: ${result.relevanceScore?.toFixed(
            2,
          )} | Practical Weight: ${result.practicalWeight?.toFixed(2)}\n`,
      )
      .join("\n");

    const prompt = `You are a knowledge analyst synthesizing information about "${topic}". Extract key insights and themes from the sources provided below, focusing on practical understanding and real-world applications.

INFORMATION SOURCES:
${researchContext}

ANALYSIS GOALS:
1. PRACTICAL FOCUS - Identify how this topic is used in real-world situations
2. ACCESSIBLE INSIGHTS - Extract information that is understandable and actionable
3. REAL-WORLD RELEVANCE - Focus on benefits, applications, and practical considerations

EXTRACT:
1. KEY INSIGHTS about practical applications and real-world uses
2. MAIN THEMES focusing on:
   - How this topic works in practice
   - What problems it solves or benefits it provides
   - Real-world examples and applications
   - Practical considerations and limitations

SYNTHESIS APPROACH:
- Focus on actionable insights that can be understood and applied
- Emphasize practical value over theoretical complexity
- Highlight concrete examples and use cases
- Extract clear, useful information about the topic

Provide insights and themes that help explain what ${topic} is, how it works, and why it's useful in practical terms.`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.6,
    });

    // Parse the AI response with enhanced focus on practical insights
    const insights = this.extractPracticalInsights(result.text);
    const themes = this.extractPracticalThemes(result.text);
    const quality = this.assessBalancedSourceQuality(researchResults);
    const comprehensiveness = this.calculatePracticalComprehensiveness(researchResults);

    return {
      keyInsights: insights,
      contentThemes: themes,
      sourceQuality: quality,
      comprehensivenesss: comprehensiveness,
      practicalFocus: this.assessPracticalFocus(researchResults), // New: track practical understanding emphasis
    };
  }

  /**
   * Weight sources to prioritize practical understanding while maintaining academic credibility
   * Requirement 2.4: prioritize practical understanding over theoretical complexity
   * Requirement 4.3: balance academic credibility with accessibility
   */
  private weightSourcesForPracticalUnderstanding(
    results: SearchResultWithEngine[]
  ): SearchResultWithEngine[] {
    return results.map(result => {
      let practicalWeight = result.relevanceScore || 0.5;
      
      // Enhanced weighting for general sources (Requirement 2.4)
      if (result.engine === "general") {
        practicalWeight *= 1.3; // Boost general sources for practical understanding
      }
      
      // Moderate boost for community sources (practical experiences)
      if (result.engine === "community") {
        practicalWeight *= 1.2;
      }
      
      // Maintain academic credibility but don't over-prioritize
      if (result.engine === "academic") {
        practicalWeight *= 1.1; // Slight boost for credibility
      }
      
      // Boost sources with practical indicators in title/content
      const practicalIndicators = [
        'practical', 'application', 'example', 'use', 'how to', 'guide', 
        'tutorial', 'real world', 'implementation', 'benefits', 'advantages'
      ];
      
      const titleAndSnippet = `${result.title} ${result.snippet}`.toLowerCase();
      const practicalMatches = practicalIndicators.filter(indicator => 
        titleAndSnippet.includes(indicator)
      ).length;
      
      if (practicalMatches > 0) {
        practicalWeight *= (1 + practicalMatches * 0.1); // Boost based on practical indicators
      }
      
      return {
        ...result,
        practicalWeight: Math.min(practicalWeight, 1.0) // Cap at 1.0
      };
    }).sort((a, b) => (b.practicalWeight || 0) - (a.practicalWeight || 0));
  }

  // Enhanced text parsing helpers focused on practical understanding
  private extractPracticalInsights(text: string): string[] {
    // Extract bullet points or numbered items as insights, prioritizing practical ones
    const insights = text.match(/[•\-\*]\s*([^\n]+)/g) || [];
    const practicalInsights = insights
      .map((item) => item.replace(/^[•\-\*]\s*/, "").trim())
      .filter(insight => {
        const practicalKeywords = [
          'practical', 'application', 'use', 'example', 'real world', 
          'implementation', 'benefit', 'advantage', 'how', 'when', 'where'
        ];
        const lowerInsight = insight.toLowerCase();
        return practicalKeywords.some(keyword => lowerInsight.includes(keyword));
      });
    
    // If we have practical insights, prioritize them; otherwise use general insights
    const finalInsights = practicalInsights.length > 0 ? practicalInsights : 
      insights.map((item) => item.replace(/^[•\-\*]\s*/, "").trim());
    
    return finalInsights.slice(0, 5);
  }

  private extractPracticalThemes(text: string): string[] {
    // Enhanced keyword extraction focusing on practical themes
    const commonWords = [
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"
    ];
    
    // Prioritize practical terms
    const practicalTerms = [
      'application', 'practical', 'example', 'implementation', 'benefit', 
      'advantage', 'solution', 'method', 'approach', 'technique', 'strategy'
    ];
    
    const words = text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 4 && !commonWords.includes(word));

    // Count word frequency with boost for practical terms
    const frequency: Record<string, number> = {};
    words.forEach((word) => {
      const baseCount = (frequency[word] || 0) + 1;
      const practicalBoost = practicalTerms.includes(word) ? 2 : 1;
      frequency[word] = baseCount * practicalBoost;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Assess source quality with balance between academic credibility and practical accessibility
   * Requirement 4.3: balance academic credibility with accessibility
   */
  private assessBalancedSourceQuality(
    results: SearchResultWithEngine[]
  ): "high" | "medium" | "low" {
    const avgRelevance =
      results.reduce((sum, r) => sum + (r.relevanceScore || 0.5), 0) /
      results.length;
    
    // Count both academic credibility and practical accessibility sources
    const credibleSources = results.filter(
      (r) =>
        r.url.includes(".edu") ||
        r.url.includes(".gov") ||
        r.url.includes("arxiv")
    ).length;
    
    const generalSources = results.filter(r => r.engine === "general").length;
    const practicalSources = results.filter(r => 
      r.engine === "community" || r.engine === "general"
    ).length;
    
    // Balance academic credibility with practical accessibility
    const credibilityScore = credibleSources / results.length;
    const accessibilityScore = practicalSources / results.length;
    const balanceScore = (credibilityScore + accessibilityScore) / 2;

    if (avgRelevance > 0.7 && balanceScore > 0.4) return "high";
    if (avgRelevance > 0.5 && balanceScore > 0.25) return "medium";
    return "low";
  }

  /**
   * Calculate comprehensiveness with emphasis on practical understanding
   * Requirement 2.4: weight general sources appropriately
   */
  private calculatePracticalComprehensiveness(
    results: SearchResultWithEngine[]
  ): number {
    // Enhanced heuristic that values both source diversity and practical coverage
    const engines = new Set(results.map((r) => r.engine));
    const engineDiversity = engines.size / 5; // Expect up to 5 different engines
    const sourceCount = Math.min(results.length / 20, 1); // Expect ~20 sources for full score
    
    // Bonus for having good general source coverage (practical understanding)
    const generalSources = results.filter(r => r.engine === "general").length;
    const generalCoverage = Math.min(generalSources / 5, 1); // Expect at least 5 general sources
    
    // Weight: 40% engine diversity, 40% source count, 20% general coverage
    return engineDiversity * 0.4 + sourceCount * 0.4 + generalCoverage * 0.2;
  }

  /**
   * Assess how well the research focuses on practical understanding
   * New metric to track practical understanding emphasis
   */
  private assessPracticalFocus(
    results: SearchResultWithEngine[]
  ): "high" | "medium" | "low" {
    const generalRatio = results.filter(r => r.engine === "general").length / results.length;
    const practicalRatio = results.filter(r => 
      r.engine === "general" || r.engine === "community"
    ).length / results.length;
    
    // Check for practical keywords in titles/snippets
    const practicalKeywords = [
      'practical', 'application', 'example', 'tutorial', 'guide', 'how to',
      'real world', 'implementation', 'benefits', 'use case'
    ];
    
    const practicalContentRatio = results.filter(result => {
      const content = `${result.title} ${result.snippet}`.toLowerCase();
      return practicalKeywords.some(keyword => content.includes(keyword));
    }).length / results.length;
    
    const overallPracticalScore = (practicalRatio + practicalContentRatio) / 2;
    
    if (overallPracticalScore > 0.6) return "high";
    if (overallPracticalScore > 0.3) return "medium";
    return "low";
  }
}