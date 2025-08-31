import type { SearchResult } from "../../research/agents";
import { SearchResultWithEngine, SourceAttribution, ContentSection, GeneratedContent } from "./types";

/**
 * Utils Module
 * Contains helper methods and utilities used across the learning agent
 */
export class UtilsModule {

  /**
   * Build source attributions from research results and content sections
   */
  buildSourceAttributions(
    researchResults: SearchResultWithEngine[],
    sections: ContentSection[],
  ): SourceAttribution[] {
    return researchResults.map((result, index) => ({
      id: `source-${index + 1}`,
      title: result.title,
      url: result.url,
      source: result.source || result.engine,
      engine: result.engine,
      relevanceScore: result.relevanceScore || 0.5,
      credibilityScore: this.calculateCredibilityScore(result),
      contentType: this.classifyContentType(result),
      usedInSections: this.findUsageInSections(result, sections),
    }));
  }

  /**
   * Calculate credibility score for a search result
   */
  private calculateCredibilityScore(result: SearchResult): number {
    let score = 0.5;

    // URL-based credibility
    if (result.url.includes(".edu") || result.url.includes(".gov"))
      score += 0.3;
    else if (result.url.includes("wikipedia.org")) score += 0.2;
    else if (result.url.includes("arxiv.org") || result.url.includes("pubmed"))
      score += 0.4;

    // Title-based indicators
    const title = result.title.toLowerCase();
    if (title.includes("research") || title.includes("study")) score += 0.1;
    if (title.includes("peer-reviewed")) score += 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Classify content type based on URL and title patterns
   */
  private classifyContentType(
    result: SearchResult,
  ): SourceAttribution["contentType"] {
    const url = result.url.toLowerCase();
    const title = result.title.toLowerCase();

    if (url.includes("youtube.com") || url.includes("video")) return "video";
    if (
      url.includes("arxiv") ||
      url.includes("pubmed") ||
      title.includes("research")
    )
      return "academic";
    if (url.includes("reddit.com") || url.includes("forum"))
      return "discussion";
    if (url.includes("docs") || title.includes("documentation"))
      return "documentation";

    return "article";
  }

  /**
   * Find which sections reference a particular source
   */
  private findUsageInSections(
    result: SearchResult,
    sections: ContentSection[],
  ): string[] {
    // Simplified - in practice you'd track which sources were used in which sections
    return sections
      .filter((section) =>
        section.sources.some((sourceRef) =>
          sourceRef.includes(result.title.slice(0, 20)),
        ),
      )
      .map((section) => section.title);
  }

  /**
   * Calculate confidence score based on research quality and content depth
   */
  calculateConfidenceScore(
    researchResults: SearchResult[],
    content: GeneratedContent,
  ): number {
    const sourceQuality =
      researchResults.reduce((sum, r) => sum + (r.relevanceScore || 0.5), 0) /
      researchResults.length;
    const contentDepth = Math.min(content.sections.length / 5, 1); // Expect ~5 sections for full score
    const sourceCount = Math.min(researchResults.length / 15, 1); // Expect ~15 sources for full score

    return sourceQuality * 0.4 + contentDepth * 0.3 + sourceCount * 0.3;
  }

  /**
   * Generate cache key for a topic and user context
   */
  generateCacheKey(topic: string, userContext?: any): string {
    const baseKey = topic.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const contextKey = userContext?.level || "general";
    return `${baseKey}-${contextKey}`;
  }

  /**
   * Estimate reading time based on content length
   */
  estimateReadTime(contentLength: number): number {
    const wordsPerMinute = 200;
    const wordCount = contentLength / 5; // Rough estimate: 5 chars per word
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  /**
   * Estimate reading time for subtopics based on complexity
   */
  estimateSubtopicReadTime(complexity: string): number {
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
   * Ensure an array contains only string values
   */
  ensureStringArray(arr: any): string[] {
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
   * Parse content from text when structured generation fails
   */
  parseContentFallback(text: string, topic: string): any {
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
   * Deduplicate results based on title and URL
   */
  deduplicateResults<T extends { title: string; url: string }>(
    results: T[],
  ): T[] {
    const seen = new Set<string>();
    return results.filter((result) => {
      const key = `${result.title.toLowerCase()}-${result.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Infer section complexity based on position in learning sequence
   */
  inferSectionComplexity(index: number, totalSections: number): "foundation" | "building" | "application" {
    const position = index / (totalSections - 1); // 0 to 1
    
    if (position <= 0.33) {
      return "foundation"; // First third - foundational concepts
    } else if (position <= 0.66) {
      return "building"; // Middle third - building concepts
    } else {
      return "application"; // Final third - practical applications
    }
  }
}