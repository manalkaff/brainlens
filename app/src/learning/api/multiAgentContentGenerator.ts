import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { Topic } from "wasp/entities";
import type { ResearchResult, SearchResult } from "../research/agents";

// Domain classification interface
export interface TopicDomain {
  primary: DomainType;
  secondary: DomainType[];
  confidence: number;
  characteristics: DomainCharacteristics;
}

export enum DomainType {
  TECHNOLOGY = "technology",
  BUSINESS = "business",
  SCIENCE = "science",
  MATHEMATICS = "mathematics",
  ARTS_HUMANITIES = "arts_humanities",
  HEALTH_MEDICINE = "health_medicine",
  EDUCATION = "education",
  SOCIAL_SCIENCES = "social_sciences",
  ENGINEERING = "engineering",
  FINANCE = "finance",
}

export interface DomainCharacteristics {
  requiresCodeExamples: boolean;
  emphasizesTheory: boolean;
  focusesOnPractical: boolean;
  needsVisualExplanations: boolean;
  benefitsFromCommunity: boolean;
  requiresFormulas: boolean;
  includesResearch: boolean;
  hasIndustryApplications: boolean;
}

// Enhanced research result with agent context
export interface EnhancedResearchResult extends ResearchResult {
  processedSources: ProcessedSource[];
  agentWeight: number;
  domainRelevance: number;
}

export interface ProcessedSource {
  id: string;
  title: string;
  url: string;
  content: string;
  agentType: string;
  relevanceScore: number;
  metadata: SourceMetadata;
  contentType:
    | "overview"
    | "detailed"
    | "example"
    | "tutorial"
    | "research"
    | "discussion";
}

export interface SourceMetadata {
  // Academic specific
  citations?: number;
  author?: string;
  venue?: string;
  year?: number;

  // Video specific
  duration?: string;
  views?: string;
  educationalValue?: boolean;
  difficulty?: "beginner" | "intermediate" | "advanced";

  // Community specific
  upvotes?: number;
  comments?: number;
  subreddit?: string;
  sentiment?: "positive" | "negative" | "neutral";
  practicalValue?: "high" | "medium" | "low";

  // Computational specific
  hasFormulas?: boolean;
  hasAlgorithms?: boolean;
  complexity?: "basic" | "intermediate" | "advanced";

  // General
  trustScore?: number;
  recency?: number;
}

// Content generation result
export interface MultiAgentContent {
  content: string;
  metadata: {
    domain: TopicDomain;
    agentContributions: AgentContribution[];
    totalSources: number;
    generationStrategy: string;
    sectionsGenerated: string[];
    estimatedReadTime: number;
  };
}

export interface AgentContribution {
  agentName: string;
  agentType: string;
  sourcesUsed: number;
  sectionsCreated: string[];
  confidenceScore: number;
}

/**
 * Domain Classification System
 * Intelligently classifies topics to determine optimal content structure
 */
export class TopicDomainClassifier {
  private model = openai("gpt-5-nano");

  async classifyTopic(
    topic: Topic,
    researchResults: ResearchResult[],
  ): Promise<TopicDomain> {
    // Analyze topic title and summary
    const topicText = `${topic.title} ${topic.summary || ""} ${
      topic.description || ""
    }`;

    // Analyze research results for additional context
    const researchContext = researchResults
      .filter((r) => r.status === "success")
      .map(
        (r) =>
          `${r.agent}: ${r.summary || ""} ${r.results
            .map((res) => res.title + " " + res.snippet)
            .join(" ")
            .slice(0, 300)}`,
      )
      .join("\n");

    const prompt = `Analyze the following topic and research context to classify the domain:

Topic: "${topic.title}"
${topic.summary ? `Summary: ${topic.summary}` : ""}

Research Context:
${researchContext}

Classify this topic into the most appropriate primary domain and identify secondary domains:
- technology (software, programming, IT, AI, web development)
- business (marketing, entrepreneurship, management, strategy)
- science (physics, chemistry, biology, research)
- mathematics (pure math, statistics, data science)
- arts_humanities (history, literature, philosophy, creative arts)
- health_medicine (medical topics, healthcare, fitness)
- education (teaching, learning methods, academic subjects)
- social_sciences (psychology, sociology, politics)
- engineering (mechanical, civil, electrical engineering)
- finance (economics, investing, accounting, fintech)

Also determine these characteristics:
- requiresCodeExamples: Would code examples be helpful?
- emphasizesTheory: Is this primarily theoretical?
- focusesOnPractical: Does this need practical applications?
- needsVisualExplanations: Would diagrams/visuals help?
- benefitsFromCommunity: Are community insights valuable?
- requiresFormulas: Does this involve mathematical formulas?
- includesResearch: Is academic research important?
- hasIndustryApplications: Are real-world applications key?

IMPORTANT: Respond with ONLY the JSON object, no markdown formatting, no explanation:

{
  "primary": "domain_name",
  "secondary": ["domain1", "domain2"],
  "confidence": 0.95,
  "characteristics": {
    "requiresCodeExamples": true,
    "emphasizesTheory": false,
    "focusesOnPractical": true,
    "needsVisualExplanations": true,
    "benefitsFromCommunity": true,
    "requiresFormulas": false,
    "includesResearch": false,
    "hasIndustryApplications": true
  }
}`;

    try {
      const result = await generateText({
        model: this.model,
        prompt,
        temperature: 0.3,
      });

      // Clean the response to handle markdown formatting
      let jsonText = result.text.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\s*/g, "").replace(/```\s*$/g, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\s*/g, "").replace(/```\s*$/g, "");
      }

      // Remove any leading/trailing whitespace
      jsonText = jsonText.trim();

      // Try to find JSON object in the response
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const classified = JSON.parse(jsonText) as TopicDomain;

      // Validate and return
      return {
        primary: classified.primary,
        secondary: classified.secondary || [],
        confidence: Math.max(0.5, classified.confidence || 0.8),
        characteristics: {
          requiresCodeExamples:
            classified.characteristics?.requiresCodeExamples ?? false,
          emphasizesTheory:
            classified.characteristics?.emphasizesTheory ?? false,
          focusesOnPractical:
            classified.characteristics?.focusesOnPractical ?? true,
          needsVisualExplanations:
            classified.characteristics?.needsVisualExplanations ?? true,
          benefitsFromCommunity:
            classified.characteristics?.benefitsFromCommunity ?? true,
          requiresFormulas:
            classified.characteristics?.requiresFormulas ?? false,
          includesResearch:
            classified.characteristics?.includesResearch ?? false,
          hasIndustryApplications:
            classified.characteristics?.hasIndustryApplications ?? true,
        },
      };
    } catch (error) {
      console.error("Domain classification failed:", error);

      // Fallback classification based on simple keyword analysis
      return this.fallbackClassification(topicText);
    }
  }

  private fallbackClassification(topicText: string): TopicDomain {
    const text = topicText.toLowerCase();

    // Simple keyword-based classification
    if (
      text.includes("programming") ||
      text.includes("software") ||
      text.includes("coding") ||
      text.includes("javascript") ||
      text.includes("python") ||
      text.includes("development")
    ) {
      return {
        primary: DomainType.TECHNOLOGY,
        secondary: [],
        confidence: 0.7,
        characteristics: {
          requiresCodeExamples: true,
          emphasizesTheory: false,
          focusesOnPractical: true,
          needsVisualExplanations: true,
          benefitsFromCommunity: true,
          requiresFormulas: false,
          includesResearch: false,
          hasIndustryApplications: true,
        },
      };
    }

    if (
      text.includes("marketing") ||
      text.includes("business") ||
      text.includes("sales") ||
      text.includes("management") ||
      text.includes("entrepreneur")
    ) {
      return {
        primary: DomainType.BUSINESS,
        secondary: [],
        confidence: 0.7,
        characteristics: {
          requiresCodeExamples: false,
          emphasizesTheory: false,
          focusesOnPractical: true,
          needsVisualExplanations: true,
          benefitsFromCommunity: true,
          requiresFormulas: false,
          includesResearch: false,
          hasIndustryApplications: true,
        },
      };
    }

    if (
      text.includes("math") ||
      text.includes("statistics") ||
      text.includes("formula") ||
      text.includes("equation") ||
      text.includes("calculus")
    ) {
      return {
        primary: DomainType.MATHEMATICS,
        secondary: [],
        confidence: 0.7,
        characteristics: {
          requiresCodeExamples: false,
          emphasizesTheory: true,
          focusesOnPractical: false,
          needsVisualExplanations: true,
          benefitsFromCommunity: false,
          requiresFormulas: true,
          includesResearch: true,
          hasIndustryApplications: false,
        },
      };
    }

    // Default classification
    return {
      primary: DomainType.EDUCATION,
      secondary: [],
      confidence: 0.5,
      characteristics: {
        requiresCodeExamples: false,
        emphasizesTheory: false,
        focusesOnPractical: true,
        needsVisualExplanations: true,
        benefitsFromCommunity: true,
        requiresFormulas: false,
        includesResearch: false,
        hasIndustryApplications: false,
      },
    };
  }
}

/**
 * Research Result Processor
 * Enhances research results with domain-aware processing and source organization
 */
export class ResearchResultProcessor {
  processResearchResults(
    researchResults: ResearchResult[],
    domain: TopicDomain,
  ): EnhancedResearchResult[] {
    return researchResults.map((result) =>
      this.enhanceResearchResult(result, domain),
    );
  }

  private enhanceResearchResult(
    result: ResearchResult,
    domain: TopicDomain,
  ): EnhancedResearchResult {
    // Calculate agent weight based on domain relevance
    const agentWeight = this.calculateAgentWeight(result.agent, domain);
    const domainRelevance = this.calculateDomainRelevance(result, domain);

    // Process sources with enhanced metadata
    const processedSources = result.results.map((source, index) =>
      this.processSource(source, result.agent, index, domain),
    );

    return {
      ...result,
      processedSources,
      agentWeight,
      domainRelevance,
    };
  }

  private calculateAgentWeight(agentName: string, domain: TopicDomain): number {
    const { primary, characteristics } = domain;

    // Base weights for different agent-domain combinations
    const weights: Record<string, Record<string, number>> = {
      "General Research Agent": {
        [DomainType.EDUCATION]: 1.0,
        [DomainType.BUSINESS]: 1.0,
        [DomainType.ARTS_HUMANITIES]: 1.0,
        [DomainType.SOCIAL_SCIENCES]: 1.0,
        default: 0.8,
      },
      "Academic Research Agent": {
        [DomainType.SCIENCE]: 1.0,
        [DomainType.MATHEMATICS]: 1.0,
        [DomainType.HEALTH_MEDICINE]: 1.0,
        [DomainType.ENGINEERING]: 0.9,
        [DomainType.SOCIAL_SCIENCES]: 0.8,
        default: characteristics.includesResearch ? 0.7 : 0.4,
      },
      "Computational Agent": {
        [DomainType.MATHEMATICS]: 1.0,
        [DomainType.TECHNOLOGY]: 0.9,
        [DomainType.ENGINEERING]: 0.9,
        [DomainType.SCIENCE]: 0.8,
        [DomainType.FINANCE]: 0.7,
        default: characteristics.requiresFormulas ? 0.6 : 0.2,
      },
      "Video Learning Agent": {
        [DomainType.TECHNOLOGY]: 1.0,
        [DomainType.EDUCATION]: 0.9,
        [DomainType.ARTS_HUMANITIES]: 0.8,
        [DomainType.BUSINESS]: 0.7,
        default: characteristics.needsVisualExplanations ? 0.7 : 0.5,
      },
      "Community Discussion Agent": {
        [DomainType.TECHNOLOGY]: 1.0,
        [DomainType.BUSINESS]: 0.9,
        [DomainType.EDUCATION]: 0.8,
        default: characteristics.benefitsFromCommunity ? 0.8 : 0.4,
      },
    };

    const agentWeights =
      weights[agentName] || weights["General Research Agent"];
    return agentWeights[primary] || agentWeights.default || 0.5;
  }

  private calculateDomainRelevance(
    result: ResearchResult,
    domain: TopicDomain,
  ): number {
    // Analyze result content for domain-specific keywords and patterns
    const content = `${result.summary || ""} ${result.results
      .map((r) => r.title + " " + r.snippet)
      .join(" ")}`.toLowerCase();

    const domainKeywords: Record<string, string[]> = {
      [DomainType.TECHNOLOGY]: [
        "software",
        "programming",
        "code",
        "development",
        "tech",
        "digital",
        "app",
        "web",
      ],
      [DomainType.BUSINESS]: [
        "business",
        "marketing",
        "sales",
        "strategy",
        "management",
        "revenue",
        "customers",
        "market",
      ],
      [DomainType.SCIENCE]: [
        "research",
        "study",
        "experiment",
        "hypothesis",
        "data",
        "analysis",
        "scientific",
        "theory",
      ],
      [DomainType.MATHEMATICS]: [
        "formula",
        "equation",
        "theorem",
        "proof",
        "calculation",
        "mathematical",
        "number",
        "function",
      ],
      [DomainType.HEALTH_MEDICINE]: [
        "health",
        "medical",
        "doctor",
        "patient",
        "treatment",
        "disease",
        "medicine",
        "clinical",
      ],
      [DomainType.FINANCE]: [
        "money",
        "investment",
        "financial",
        "economy",
        "market",
        "trading",
        "banking",
        "accounting",
      ],
    };

    const keywords = domainKeywords[domain.primary] || [];
    const matchCount = keywords.filter((keyword) =>
      content.includes(keyword),
    ).length;
    const maxPossibleMatches = keywords.length;

    return maxPossibleMatches > 0
      ? Math.min(matchCount / maxPossibleMatches, 1.0)
      : 0.5;
  }

  private processSource(
    source: SearchResult,
    agentType: string,
    index: number,
    domain: TopicDomain,
  ): ProcessedSource {
    // Map legacy source types to proper agent types
    const normalizedAgentType = this.normalizeAgentType(agentType);

    return {
      id: `${normalizedAgentType.toLowerCase().replace(/\s/g, "_")}_${index}`,
      title: source.title,
      url: source.url,
      content: source.snippet,
      agentType: normalizedAgentType,
      relevanceScore: source.relevanceScore || 0.5,
      contentType: this.classifySourceContent(source, normalizedAgentType),
      metadata: this.extractSourceMetadata(source, normalizedAgentType),
    };
  }

  /**
   * Normalize legacy agent types to proper agent names
   */
  private normalizeAgentType(agentType: string): string {
    // Map various source types to our standard agent types
    const agentMap: Record<string, string> = {
      "Research Database": "General Research Agent",
      research_database: "General Research Agent",
      general: "General Research Agent",
      academic: "Academic Research Agent",
      computational: "Computational Agent",
      video: "Video Learning Agent",
      community: "Community Discussion Agent",
      arxiv: "Academic Research Agent",
      "google scholar": "Academic Research Agent",
      pubmed: "Academic Research Agent",
      wolframalpha: "Computational Agent",
      youtube: "Video Learning Agent",
      reddit: "Community Discussion Agent",
    };

    // Return mapped type or original if no mapping exists
    const normalized =
      agentMap[agentType.toLowerCase()] || agentMap[agentType] || agentType;
    console.log(`🔄 Normalized agent type: "${agentType}" → "${normalized}"`);
    return normalized;
  }

  private classifySourceContent(
    source: SearchResult,
    agentType: string,
  ): ProcessedSource["contentType"] {
    const title = source.title.toLowerCase();
    const content = source.snippet.toLowerCase();
    const text = title + " " + content;

    // Agent-specific content type classification
    if (agentType === "Video Learning Agent") {
      if (text.includes("tutorial") || text.includes("how to"))
        return "tutorial";
      if (text.includes("introduction") || text.includes("basics"))
        return "overview";
      return "detailed";
    }

    if (agentType === "Academic Research Agent") {
      return "research";
    }

    if (agentType === "Community Discussion Agent") {
      return "discussion";
    }

    if (agentType === "Computational Agent") {
      if (text.includes("example") || text.includes("calculation"))
        return "example";
      return "detailed";
    }

    // General classification
    if (
      text.includes("overview") ||
      text.includes("introduction") ||
      text.includes("what is")
    )
      return "overview";
    if (text.includes("example") || text.includes("case study"))
      return "example";
    if (
      text.includes("tutorial") ||
      text.includes("guide") ||
      text.includes("how to")
    )
      return "tutorial";
    if (
      text.includes("detailed") ||
      text.includes("deep dive") ||
      text.includes("comprehensive")
    )
      return "detailed";

    return "overview";
  }

  private extractSourceMetadata(
    source: SearchResult,
    agentType: string,
  ): SourceMetadata {
    const metadata: SourceMetadata = {
      trustScore: this.calculateTrustScore(source, agentType),
      recency: this.calculateRecency(source.metadata?.publishedDate),
    };

    // Extract agent-specific metadata
    if (source.metadata) {
      const meta = source.metadata;

      // Academic metadata
      if (meta.citations) metadata.citations = meta.citations;
      if (meta.author) metadata.author = meta.author;
      if (meta.venue) metadata.venue = meta.venue;
      if (meta.year) metadata.year = meta.year;

      // Video metadata
      if (meta.duration) metadata.duration = meta.duration;
      if (meta.views) metadata.views = meta.views;
      if (meta.isEducational !== undefined)
        metadata.educationalValue = meta.isEducational;
      if (meta.difficulty) metadata.difficulty = meta.difficulty;

      // Community metadata
      if (meta.upvotes) metadata.upvotes = meta.upvotes;
      if (meta.comments) metadata.comments = meta.comments;
      if (meta.subreddit) metadata.subreddit = meta.subreddit;
      if (meta.sentiment) metadata.sentiment = meta.sentiment;
      if (meta.practicalValue) metadata.practicalValue = meta.practicalValue;

      // Computational metadata
      if (meta.hasFormulas !== undefined)
        metadata.hasFormulas = meta.hasFormulas;
      if (meta.hasAlgorithms !== undefined)
        metadata.hasAlgorithms = meta.hasAlgorithms;
      if (meta.complexity) metadata.complexity = meta.complexity;
    }

    return metadata;
  }

  private calculateTrustScore(source: SearchResult, agentType: string): number {
    let score = 0.5; // Base score

    // Agent-specific trust scoring
    if (agentType === "Academic Research Agent") {
      score = 0.8; // Academic sources are generally more trustworthy
      if (source.metadata?.citations && source.metadata.citations > 100)
        score += 0.1;
      if (source.url.includes("arxiv") || source.url.includes("pubmed"))
        score += 0.1;
    }

    if (agentType === "Community Discussion Agent") {
      score = 0.6; // Community sources are less formal but can be practical
      if (source.metadata?.upvotes && source.metadata.upvotes > 100)
        score += 0.1;
      if (source.metadata?.comments && source.metadata.comments > 20)
        score += 0.1;
    }

    if (agentType === "Video Learning Agent") {
      score = 0.7; // Video content is generally good for learning
      if (source.metadata?.isEducational) score += 0.1;
      if (
        source.metadata?.views &&
        parseInt(source.metadata.views.replace(/,/g, "")) > 100000
      )
        score += 0.1;
    }

    // URL-based trust scoring
    if (source.url.includes("edu") || source.url.includes("gov")) score += 0.2;
    if (source.url.includes("wikipedia")) score += 0.1;

    return Math.min(score, 1.0);
  }

  private calculateRecency(publishedDate?: string): number {
    if (!publishedDate) return 0.5;

    try {
      const pubDate = new Date(publishedDate);
      const now = new Date();
      const daysDiff = (now.getTime() - pubDate.getTime()) / (1000 * 3600 * 24);

      // Recency score: 1.0 for today, decreasing over time
      if (daysDiff <= 30) return 1.0;
      if (daysDiff <= 90) return 0.9;
      if (daysDiff <= 180) return 0.8;
      if (daysDiff <= 365) return 0.7;
      if (daysDiff <= 730) return 0.6;
      return 0.5;
    } catch {
      return 0.5;
    }
  }
}

/**
 * Base class for specialized content generators
 */
export abstract class BaseContentGenerator {
  protected model = openai("gpt-5-nano");

  abstract generateContent(
    topic: Topic,
    sources: ProcessedSource[],
    domain: TopicDomain,
    context?: any,
  ): Promise<string>;

  protected buildSourceContext(
    sources: ProcessedSource[],
    maxSources: number = 5,
  ): string {
    const topSources = sources
      .sort(
        (a, b) =>
          b.relevanceScore * (b.metadata.trustScore || 0.5) -
          a.relevanceScore * (a.metadata.trustScore || 0.5),
      )
      .slice(0, maxSources);

    return topSources
      .map(
        (source, index) =>
          `[Source ${index + 1}] ${source.agentType} - "${
            source.title
          }"\nURL: ${source.url}\nContent: ${
            source.content
          }\nTrust Score: ${source.metadata.trustScore?.toFixed(
            2,
          )}\nRelevance: ${source.relevanceScore.toFixed(2)}\n`,
      )
      .join("\n");
  }

  protected buildSourceAttribution(sources: ProcessedSource[]): string {
    return sources
      .map(
        (source, index) =>
          `[Source ${index + 1}]: ${source.title} (${source.agentType}) - ${
            source.url
          }`,
      )
      .join("\n");
  }
}

/**
 * Comprehensive Overview Generator
 * Uses General Research Agent results to create foundational content
 */
export class OverviewContentGenerator extends BaseContentGenerator {
  async generateContent(
    topic: Topic,
    sources: ProcessedSource[],
    domain: TopicDomain,
    context?: any,
  ): Promise<string> {
    const sourceContext = this.buildSourceContext(sources, 8);
    const { characteristics } = domain;

    const prompt = `You are a comprehensive overview content generator. Create an engaging, foundational overview section about "${
      topic.title
    }" using the research sources provided.

Topic: ${topic.title}
${topic.summary ? `Summary: ${topic.summary}` : ""}
Domain: ${domain.primary} (confidence: ${domain.confidence})

Domain Characteristics:
- Requires code examples: ${characteristics.requiresCodeExamples}
- Emphasizes theory: ${characteristics.emphasizesTheory}
- Focuses on practical: ${characteristics.focusesOnPractical}
- Needs visual explanations: ${characteristics.needsVisualExplanations}
- Benefits from community: ${characteristics.benefitsFromCommunity}
- Requires formulas: ${characteristics.requiresFormulas}
- Includes research: ${characteristics.includesResearch}
- Has industry applications: ${characteristics.hasIndustryApplications}

Research Sources:
${sourceContext}

Create a comprehensive overview section that includes:

## Overview

### What is [Topic]?
- Clear, accessible definition
- Core concepts and terminology
- Why this topic matters

### Key Components
- Main elements or aspects
- How they relate to each other
- Fundamental principles

### Applications and Use Cases
${
  characteristics.hasIndustryApplications
    ? "- Real-world industry applications\n- Business use cases\n- Market relevance"
    : "- Practical applications\n- Common use scenarios\n- Everyday relevance"
}

${
  characteristics.emphasizesTheory
    ? "### Theoretical Foundation\n- Underlying theories and principles\n- Academic perspective\n- Conceptual framework"
    : ""
}

### Getting Started
- Prerequisites and background knowledge needed
- Learning pathway overview
- Next steps for deeper exploration

IMPORTANT FORMATTING:
- Use proper markdown formatting with ## and ### headers
- Include source references like [Source X] naturally in the content when drawing from research
- Write in clear, engaging prose suitable for the ${domain.primary} domain
- Make the content comprehensive but accessible
- Ensure smooth flow between sections
- Reference multiple sources throughout for credibility

Remember: This is the foundational overview that sets up everything else, so make it comprehensive and engaging.`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.7,
    });

    return result.text;
  }
}

/**
 * Academic Evidence Synthesizer
 * Leverages academic papers with proper citations and credibility
 */
export class AcademicContentGenerator extends BaseContentGenerator {
  async generateContent(
    topic: Topic,
    sources: ProcessedSource[],
    domain: TopicDomain,
    context?: any,
  ): Promise<string> {
    // Filter for academic sources and sort by citations/credibility
    const academicSources = sources
      .filter((source) => source.agentType === "Academic Research Agent")
      .sort((a, b) => {
        const aCitations = a.metadata.citations || 0;
        const bCitations = b.metadata.citations || 0;
        const aYear = a.metadata.year || 0;
        const bYear = b.metadata.year || 0;

        // Prioritize by citations, then by recency
        if (Math.abs(aCitations - bCitations) > 10)
          return bCitations - aCitations;
        return bYear - aYear;
      });

    if (academicSources.length === 0) {
      return ""; // No academic content available
    }

    const sourceContext = this.buildSourceContext(academicSources, 6);
    const { characteristics } = domain;

    const prompt = `You are an academic content synthesizer. Create a scholarly, evidence-based section about "${
      topic.title
    }" using peer-reviewed research and academic sources.

Topic: ${topic.title}
Domain: ${domain.primary}

Academic Research Sources:
${sourceContext}

Create a rigorous academic section that includes:

## Research and Evidence

### Current State of Research
- What does current research tell us about this topic?
- Key findings from recent studies
- Emerging trends and developments
- Research gaps and ongoing investigations

### Academic Perspectives
- How do scholars approach this topic?
- Different theoretical frameworks
- Methodological approaches used in the field
- Competing theories or schools of thought

### Evidence-Based Insights
- What does the data show?
- Statistical findings and patterns
- Experimental results and observations
- Meta-analysis results where available

${
  characteristics.emphasizesTheory
    ? "### Theoretical Foundations\n- Core theoretical principles\n- Mathematical or conceptual models\n- Fundamental assumptions and axioms"
    : ""
}

### Research Applications
- How is this research being applied?
- Practical implications of academic findings
- Translation from research to practice
- Future research directions

IMPORTANT REQUIREMENTS:
- Use formal, academic tone appropriate for scholarly discourse
- Include proper attribution with [Source X] references for all claims
- Emphasize evidence-based information over speculation
- Include citations counts, publication years, and author information when available
- Highlight methodology and research quality
- Address limitations and caveats in the research
- Use precise, technical language where appropriate

The goal is to provide the scholarly foundation and research credibility for the topic.`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.4, // Lower temperature for more precise academic content
    });

    return result.text;
  }
}

/**
 * Technical Deep-Dive Generator
 * Uses computational data for formulas, algorithms, technical specifications
 */
export class TechnicalContentGenerator extends BaseContentGenerator {
  async generateContent(
    topic: Topic,
    sources: ProcessedSource[],
    domain: TopicDomain,
    context?: any,
  ): Promise<string> {
    // Filter for computational/technical sources
    const technicalSources = sources
      .filter(
        (source) =>
          source.agentType === "Computational Agent" ||
          source.metadata.hasFormulas ||
          source.metadata.hasAlgorithms ||
          source.contentType === "example",
      )
      .sort((a, b) => {
        const aScore =
          (a.metadata.hasFormulas ? 0.3 : 0) +
          (a.metadata.hasAlgorithms ? 0.2 : 0) +
          a.relevanceScore * 0.5;
        const bScore =
          (b.metadata.hasFormulas ? 0.3 : 0) +
          (b.metadata.hasAlgorithms ? 0.2 : 0) +
          b.relevanceScore * 0.5;
        return bScore - aScore;
      });

    if (
      technicalSources.length === 0 ||
      (!domain.characteristics.requiresFormulas &&
        !domain.characteristics.requiresCodeExamples)
    ) {
      return ""; // No technical content needed/available
    }

    const sourceContext = this.buildSourceContext(technicalSources, 5);
    const { characteristics } = domain;

    const prompt = `You are a technical content generator. Create detailed, technical content about "${
      topic.title
    }" including formulas, algorithms, and technical specifications.

Topic: ${topic.title}
Domain: ${domain.primary}

Technical Sources:
${sourceContext}

Domain Requirements:
- Requires code examples: ${characteristics.requiresCodeExamples}
- Requires formulas: ${characteristics.requiresFormulas}
- Emphasizes theory: ${characteristics.emphasizesTheory}

Create a comprehensive technical section:

## Technical Deep Dive

${
  characteristics.requiresFormulas
    ? "### Mathematical Foundations\n- Key formulas and equations\n- Mathematical relationships and derivations\n- Proofs and mathematical reasoning\n- Variable definitions and constraints"
    : ""
}

${
  characteristics.requiresCodeExamples
    ? "### Implementation Details\n- Code examples and algorithms\n- Pseudocode and logic flow\n- Best practices and patterns\n- Performance considerations"
    : ""
}

### Technical Specifications
- Detailed parameters and configurations
- Technical requirements and constraints
- System specifications and capabilities
- Compatibility and integration considerations

### Algorithms and Processes
- Step-by-step procedures
- Decision trees and workflows
- Optimization strategies
- Error handling and edge cases

### Practical Examples
- Real-world implementations
- Case studies and applications
- Problem-solving demonstrations
- Common pitfalls and solutions

${
  characteristics.requiresCodeExamples
    ? "### Code Examples\n\n```\n// Provide relevant code examples based on the domain\n// Include comments explaining key concepts\n// Show both basic and advanced implementations\n```"
    : ""
}

FORMATTING REQUIREMENTS:
- Use proper markdown with code blocks for any code
- Include mathematical notation where appropriate
- Use [Source X] references throughout
- Provide clear step-by-step explanations
- Include practical examples and use cases
- Make technical content accessible but precise
- Use diagrams and visual descriptions where helpful

Focus on accuracy, clarity, and practical utility of technical information.`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.3, // Lower temperature for technical precision
    });

    return result.text;
  }
}

/**
 * Visual Learning Creator
 * Integrates video content with educational scaffolding
 */
export class VisualContentGenerator extends BaseContentGenerator {
  async generateContent(
    topic: Topic,
    sources: ProcessedSource[],
    domain: TopicDomain,
    context?: any,
  ): Promise<string> {
    // Filter for video sources and sort by educational value
    const videoSources = sources
      .filter((source) => source.agentType === "Video Learning Agent")
      .sort((a, b) => {
        const aScore =
          (a.metadata.educationalValue ? 0.4 : 0) +
          (a.metadata.difficulty === context?.userLevel ? 0.2 : 0) +
          a.relevanceScore * 0.4;
        const bScore =
          (b.metadata.educationalValue ? 0.4 : 0) +
          (b.metadata.difficulty === context?.userLevel ? 0.2 : 0) +
          b.relevanceScore * 0.4;
        return bScore - aScore;
      });

    if (videoSources.length === 0) {
      return ""; // No video content available
    }

    const sourceContext = this.buildSourceContext(videoSources, 6);
    const userLevel = context?.userLevel || "intermediate";

    const prompt = `You are a visual learning content generator. Create engaging, visual-focused content about "${topic.title}" that incorporates educational videos and visual explanations.

Topic: ${topic.title}
Domain: ${domain.primary}
User Level: ${userLevel}

Video Learning Sources:
${sourceContext}

Create a visual learning section:

## Visual Learning Resources

### Video Tutorials and Explanations
Curate the best video content for understanding this topic:

[For each high-quality video source, create an entry like:]

#### [Video Title] - [Duration]
- **Level**: Beginner/Intermediate/Advanced
- **What you'll learn**: Key takeaways from this video
- **Why watch**: What makes this video particularly valuable
- **Best for**: Who should prioritize this video
- **Watch at**: [URL]
- **Source**: [Source X]

### Visual Concepts and Diagrams
Describe key visual elements that help understand the topic:

- **Key Visualizations**: What diagrams, charts, or visual models are most helpful
- **Mental Models**: Visual frameworks for thinking about this topic
- **Process Flows**: Step-by-step visual representations
- **Comparisons**: Side-by-side visual comparisons of concepts

### Interactive Learning Approach
Structure a visual learning path:

1. **Start with Overview Videos**: Foundation-building content
2. **Deep Dive Tutorials**: Detailed explanations and demonstrations
3. **Practical Examples**: Real-world applications and case studies
4. **Advanced Concepts**: Complex topics for further exploration

### Learning Tips for Visual Learners
- How to get the most out of video content for this topic
- Suggested note-taking strategies
- Recommended viewing order
- Supplementary visual resources

FORMATTING REQUIREMENTS:
- Organize videos by difficulty level and learning objectives
- Include duration, difficulty level, and key learning outcomes
- Use [Source X] references for all video recommendations
- Provide clear learning pathway structure
- Include practical viewing suggestions
- Make recommendations specific to user level: ${userLevel}
- Focus on educational value and accessibility

Goal: Create a structured visual learning experience that maximizes video content effectiveness.`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.6,
    });

    return result.text;
  }
}

/**
 * Real-World Application Builder
 * Uses community insights for practical applications and common questions
 */
export class PracticalContentGenerator extends BaseContentGenerator {
  async generateContent(
    topic: Topic,
    sources: ProcessedSource[],
    domain: TopicDomain,
    context?: any,
  ): Promise<string> {
    // Filter for community sources and sort by practical value
    const communitySources = sources
      .filter((source) => source.agentType === "Community Discussion Agent")
      .sort((a, b) => {
        const aPractical =
          a.metadata.practicalValue === "high"
            ? 2
            : a.metadata.practicalValue === "medium"
              ? 1
              : 0;
        const bPractical =
          b.metadata.practicalValue === "high"
            ? 2
            : b.metadata.practicalValue === "medium"
              ? 1
              : 0;
        const aEngagement =
          (a.metadata.upvotes || 0) + (a.metadata.comments || 0) * 0.1;
        const bEngagement =
          (b.metadata.upvotes || 0) + (b.metadata.comments || 0) * 0.1;

        if (aPractical !== bPractical) return bPractical - aPractical;
        return bEngagement - aEngagement;
      });

    if (communitySources.length === 0) {
      return ""; // No community content available
    }

    const sourceContext = this.buildSourceContext(communitySources, 8);
    const { characteristics } = domain;

    const prompt = `You are a practical application content generator. Create real-world, community-driven content about "${
      topic.title
    }" using insights from actual users and practitioners.

Topic: ${topic.title}
Domain: ${domain.primary}

Community Discussion Sources:
${sourceContext}

Domain Focus:
- Focuses on practical: ${characteristics.focusesOnPractical}
- Has industry applications: ${characteristics.hasIndustryApplications}
- Benefits from community: ${characteristics.benefitsFromCommunity}

Create a practical, community-informed section:

## Real-World Applications and Community Insights

### What Practitioners Are Saying
Key insights from the community:

- **Common Use Cases**: What people are actually using this for
- **Success Stories**: Real examples of successful implementation
- **Practical Tips**: Community-discovered best practices
- **Lessons Learned**: What experienced practitioners wish they knew earlier

### Frequently Asked Questions
Based on community discussions:

[Extract and answer the most common questions from community sources]

### Common Challenges and Solutions
Real problems people face and how they solve them:

- **Challenge**: [Common problem]
  - **Why it happens**: Community understanding of the issue
  - **Solutions**: Crowd-sourced solutions and workarounds
  - **Prevention**: How to avoid this issue
  - **Source**: [Source X]

### Industry Applications
${
  characteristics.hasIndustryApplications
    ? "How this topic is being used in various industries:\n\n- **[Industry]**: Specific applications and use cases\n- **[Industry]**: Different approach and implementation\n- **[Industry]**: Unique challenges and solutions"
    : "Practical applications in daily life and common scenarios"
}

### Getting Started: Community Recommendations
What the community suggests for beginners:

- **Start Here**: Most recommended starting points
- **Essential Resources**: Community-vetted learning materials
- **Tools and Platforms**: What practitioners actually use
- **Communities to Join**: Where to get help and stay updated

### Advanced Tips from Experts
Insights from experienced community members:

- **Pro Tips**: Advanced techniques and optimizations
- **Avoid These Mistakes**: Common pitfalls identified by experts
- **Best Practices**: Community-established standards
- **Future Trends**: What experienced users see coming

FORMATTING REQUIREMENTS:
- Use [Source X] references throughout, especially for community insights
- Include subreddit, upvotes, or discussion context where relevant
- Present information as community-sourced knowledge
- Balance positive and negative experiences
- Focus on actionable, practical advice
- Include specific examples and use cases
- Make recommendations concrete and implementable
- Highlight both beginner and advanced perspectives

Goal: Provide practical, real-world guidance based on actual user experiences and community wisdom.`;

    const result = await generateText({
      model: this.model,
      prompt,
      temperature: 0.7,
    });

    return result.text;
  }
}

/**
 * Multi-Agent Content Orchestrator
 * Coordinates all specialized content generators to create comprehensive exploration content
 */
export class MultiAgentContentOrchestrator {
  private domainClassifier: TopicDomainClassifier;
  private resultProcessor: ResearchResultProcessor;
  private generators: Map<string, BaseContentGenerator>;

  constructor() {
    this.domainClassifier = new TopicDomainClassifier();
    this.resultProcessor = new ResearchResultProcessor();

    // Initialize all content generators
    this.generators = new Map([
      ["overview", new OverviewContentGenerator()],
      ["academic", new AcademicContentGenerator()],
      ["technical", new TechnicalContentGenerator()],
      ["visual", new VisualContentGenerator()],
      ["practical", new PracticalContentGenerator()],
    ]);
  }

  /**
   * Generate comprehensive exploration content using multi-agent approach
   */
  async generateExplorationContent(
    topic: Topic,
    subtopics: string[],
    researchResults: ResearchResult[],
    context?: any,
  ): Promise<MultiAgentContent> {
    try {
      console.log(
        `🤖 Starting multi-agent content generation for: ${topic.title}`,
      );
      console.log(`📊 Research results available: ${researchResults.length}`);
      console.log(`🔍 Subtopics to cover: ${subtopics.length}`);

      // Step 1: Classify the topic domain
      console.log("🎯 Step 1: Classifying topic domain...");
      const domain = await this.domainClassifier.classifyTopic(
        topic,
        researchResults,
      );
      console.log(
        `✅ Domain classified: ${domain.primary} (confidence: ${domain.confidence})`,
      );

      // Step 2: Process and enhance research results
      console.log("🔧 Step 2: Processing research results...");
      const enhancedResults = this.resultProcessor.processResearchResults(
        researchResults,
        domain,
      );
      console.log(
        `✅ Enhanced results: ${enhancedResults.length} agent results processed`,
      );

      // Step 3: Extract all processed sources
      const allSources = enhancedResults.flatMap(
        (result) => result.processedSources,
      );
      console.log(
        `📚 Step 3: Extracted ${allSources.length} processed sources`,
      );

      // Step 4: Generate content sections using specialized generators
      console.log("🏭 Step 4: Generating content sections...");
      const contentSections = await this.generateContentSections(
        topic,
        allSources,
        domain,
        subtopics,
        context,
      );
      console.log(
        `✅ Generated ${contentSections.size} content sections: [${Array.from(
          contentSections.keys(),
        ).join(", ")}]`,
      );

      // Step 5: Synthesize final comprehensive content
      console.log("🔬 Step 5: Synthesizing final content...");
      const finalContent = await this.synthesizeContent(
        contentSections,
        topic,
        domain,
        subtopics,
      );
      console.log(`✅ Final content length: ${finalContent.length} characters`);

      // Step 6: Build metadata and attribution
      const metadata = this.buildContentMetadata(
        domain,
        enhancedResults,
        contentSections,
      );

      console.log("🎉 Multi-agent content generation completed successfully!");
      return {
        content: finalContent,
        metadata,
      };
    } catch (error) {
      console.error("❌ Multi-agent content generation failed:", error);
      console.error(
        "🔍 Error details:",
        error instanceof Error ? error.stack : error,
      );

      // Fallback to a simplified approach
      console.log("🚨 Falling back to simplified content generation...");
      return this.generateFallbackContent(
        topic,
        subtopics,
        researchResults,
        context,
      );
    }
  }

  /**
   * Generate individual content sections using specialized generators
   */
  private async generateContentSections(
    topic: Topic,
    sources: ProcessedSource[],
    domain: TopicDomain,
    subtopics: string[],
    context?: any,
  ): Promise<Map<string, { content: string; sources: ProcessedSource[] }>> {
    const contentSections = new Map<
      string,
      { content: string; sources: ProcessedSource[] }
    >();

    // Determine which generators to use based on domain and available sources
    console.log("🗺️ Creating generator plan...");
    const generatorPlan = this.createGeneratorPlan(domain, sources);
    console.log(
      `📋 Generator plan: ${Array.from(generatorPlan.keys()).join(", ")}`,
    );

    // Log source distribution
    Array.from(generatorPlan.entries()).forEach(
      ([generatorName, sourceGroup]) => {
        console.log(`  - ${generatorName}: ${sourceGroup.length} sources`);
      },
    );

    // Generate content sections in parallel where possible
    const sectionPromises = Array.from(generatorPlan.entries()).map(
      async ([generatorName, sourceGroup]) => {
        const generator = this.generators.get(generatorName);
        if (!generator || sourceGroup.length === 0) {
          console.log(
            `⚠️ Skipping ${generatorName}: ${
              !generator ? "generator not found" : "no sources"
            }`,
          );
          return [generatorName, { content: "", sources: [] }];
        }

        try {
          console.log(
            `🔄 Generating content for ${generatorName} with ${sourceGroup.length} sources...`,
          );
          const content = await generator.generateContent(
            topic,
            sourceGroup,
            domain,
            context,
          );
          console.log(
            `✅ ${generatorName} generated ${content.length} characters`,
          );
          return [generatorName, { content, sources: sourceGroup }];
        } catch (error) {
          console.error(
            `❌ Content generation failed for ${generatorName}:`,
            error,
          );
          return [generatorName, { content: "", sources: [] }];
        }
      },
    );

    const sectionResults = await Promise.all(sectionPromises);
    sectionResults.forEach(([name, data]) => {
      if (typeof data === "object" && data.content && data.content.trim()) {
        console.log(
          `✅ Adding section: ${name} (${data.content.length} chars)`,
        );
        contentSections.set(
          name as string,
          data as { content: string; sources: ProcessedSource[] },
        );
      } else {
        console.log(`⚠️ Skipping empty section: ${name}`);
      }
    });

    console.log(`📝 Total content sections created: ${contentSections.size}`);
    return contentSections;
  }

  /**
   * Create a plan for which generators to use and with which sources
   */
  private createGeneratorPlan(
    domain: TopicDomain,
    sources: ProcessedSource[],
  ): Map<string, ProcessedSource[]> {
    const plan = new Map<string, ProcessedSource[]>();

    console.log(`🔍 Creating generator plan for domain: ${domain.primary}`);
    console.log(`📊 Total sources available: ${sources.length}`);

    // Log all available agent types
    const agentTypes = [...new Set(sources.map((s) => s.agentType))];
    console.log(`🤖 Available agent types: ${agentTypes.join(", ")}`);

    // Always include overview (using general sources or any available sources)
    const generalSources = sources.filter(
      (s) => s.agentType === "General Research Agent",
    );
    console.log(`🔍 General sources found: ${generalSources.length}`);

    if (generalSources.length > 0) {
      plan.set("overview", generalSources);
      console.log(
        `✅ Added overview generator with ${generalSources.length} general sources`,
      );
    } else if (sources.length > 0) {
      // Fallback: use any available sources for overview
      plan.set("overview", sources);
      console.log(
        `✅ Added overview generator with ${sources.length} mixed sources (fallback)`,
      );
    }

    // Include academic content if research is important or academic sources exist
    const academicSources = sources.filter(
      (s) => s.agentType === "Academic Research Agent",
    );
    console.log(
      `🎓 Academic sources found: ${academicSources.length}, includesResearch: ${domain.characteristics.includesResearch}`,
    );

    if (
      domain.characteristics.includesResearch ||
      academicSources.length >= 1
    ) {
      plan.set("academic", academicSources);
      console.log(
        `✅ Added academic generator with ${academicSources.length} sources`,
      );
    }

    // Include technical content for technical domains or when technical sources exist
    const technicalSources = sources.filter(
      (s) =>
        s.agentType === "Computational Agent" ||
        s.metadata.hasFormulas ||
        s.metadata.hasAlgorithms,
    );
    console.log(
      `🔧 Technical sources found: ${technicalSources.length}, requiresCode: ${domain.characteristics.requiresCodeExamples}, requiresFormulas: ${domain.characteristics.requiresFormulas}`,
    );

    if (
      domain.characteristics.requiresCodeExamples ||
      domain.characteristics.requiresFormulas ||
      technicalSources.length >= 1
    ) {
      plan.set("technical", technicalSources);
      console.log(
        `✅ Added technical generator with ${technicalSources.length} sources`,
      );
    }

    // Include visual content if video sources exist and visuals are helpful
    const videoSources = sources.filter(
      (s) => s.agentType === "Video Learning Agent",
    );
    console.log(
      `📺 Video sources found: ${videoSources.length}, needsVisual: ${domain.characteristics.needsVisualExplanations}`,
    );

    if (
      domain.characteristics.needsVisualExplanations &&
      videoSources.length >= 1
    ) {
      plan.set("visual", videoSources);
      console.log(
        `✅ Added visual generator with ${videoSources.length} sources`,
      );
    }

    // Include practical content if community benefits and community sources exist
    const communitySources = sources.filter(
      (s) => s.agentType === "Community Discussion Agent",
    );
    console.log(
      `💬 Community sources found: ${communitySources.length}, benefitsFromCommunity: ${domain.characteristics.benefitsFromCommunity}`,
    );

    if (
      domain.characteristics.benefitsFromCommunity &&
      communitySources.length >= 1
    ) {
      plan.set("practical", communitySources);
      console.log(
        `✅ Added practical generator with ${communitySources.length} sources`,
      );
    }

    console.log(
      `📋 Final generator plan: ${Array.from(plan.keys()).join(", ")}`,
    );
    console.log(`📊 Total generators selected: ${plan.size}`);

    // Safety net: if no generators were selected but we have sources, add overview
    if (plan.size === 0 && sources.length > 0) {
      console.warn(
        `⚠️ No generators selected despite having ${sources.length} sources. Adding overview as fallback.`,
      );
      plan.set("overview", sources);
    }

    return plan;
  }

  /**
   * Synthesize all content sections into final comprehensive content
   */
  private async synthesizeContent(
    contentSections: Map<
      string,
      { content: string; sources: ProcessedSource[] }
    >,
    topic: Topic,
    domain: TopicDomain,
    subtopics: string[],
  ): Promise<string> {
    // Build frontmatter
    const frontmatter = this.buildFrontmatter(
      topic,
      domain,
      contentSections,
      subtopics,
    );

    // Determine content order based on domain characteristics
    const contentOrder = this.determineContentOrder(domain, contentSections);

    // Combine all content sections
    const combinedSections = contentOrder
      .map((sectionName) => contentSections.get(sectionName)?.content)
      .filter((content) => content && content.trim())
      .join("\n\n---\n\n");

    // Add subtopic exploration section
    const subtopicSection = this.buildSubtopicSection(subtopics, domain);

    // Build source attribution section
    const allSources = Array.from(contentSections.values()).flatMap(
      (section) => section.sources,
    );
    const sourceSection = this.buildSourceSection(allSources);

    return `${frontmatter}\n\n${combinedSections}\n\n${subtopicSection}\n\n${sourceSection}`;
  }

  /**
   * Build MDX frontmatter
   */
  private buildFrontmatter(
    topic: Topic,
    domain: TopicDomain,
    contentSections: Map<string, any>,
    subtopics: string[],
  ): string {
    const estimatedReadTime = this.estimateReadTime(contentSections);
    const tags = this.generateTags(domain, subtopics);
    const difficulty = this.determineDifficulty(domain, contentSections);

    return `---
title: "${topic.title}"
description: "${topic.summary || `Comprehensive guide to ${topic.title}`}"
domain: "${domain.primary}"
tags: ${JSON.stringify(tags)}
difficulty: "${difficulty}"
estimatedReadTime: ${estimatedReadTime}
sections: ${JSON.stringify(Array.from(contentSections.keys()))}
generated: "${new Date().toISOString()}"
---`;
  }

  /**
   * Determine optimal content section order based on domain
   */
  private determineContentOrder(
    domain: TopicDomain,
    contentSections: Map<string, any>,
  ): string[] {
    const availableSections = Array.from(contentSections.keys());

    // Base order prioritizes overview first
    let order = ["overview"];

    // Add sections based on domain characteristics
    if (
      domain.characteristics.emphasizesTheory &&
      availableSections.includes("academic")
    ) {
      order.push("academic");
    }

    if (
      domain.characteristics.requiresCodeExamples ||
      domain.characteristics.requiresFormulas
    ) {
      if (availableSections.includes("technical")) {
        order.push("technical");
      }
    }

    if (
      domain.characteristics.needsVisualExplanations &&
      availableSections.includes("visual")
    ) {
      order.push("visual");
    }

    if (
      domain.characteristics.focusesOnPractical &&
      availableSections.includes("practical")
    ) {
      order.push("practical");
    }

    // Add any remaining sections
    const remainingSections = availableSections.filter(
      (section) => !order.includes(section),
    );
    order.push(...remainingSections);

    return order;
  }

  /**
   * Build subtopic exploration section
   */
  private buildSubtopicSection(
    subtopics: string[],
    domain: TopicDomain,
  ): string {
    if (subtopics.length === 0) return "";

    return `## Explore Further

### Related Subtopics

Ready to dive deeper? Explore these related areas:

${subtopics
  .map(
    (subtopic) => `- **${subtopic}**: Click to explore this subtopic in detail`,
  )
  .join("\n")}

### Learning Path Recommendations

Based on the ${domain.primary} domain, consider exploring topics in this order:

${subtopics
  .slice(0, 5)
  .map((subtopic, index) => `${index + 1}. ${subtopic}`)
  .join("\n")}`;
  }

  /**
   * Build comprehensive source attribution section
   */
  private buildSourceSection(sources: ProcessedSource[]): string {
    if (sources.length === 0) return "";

    // Group sources by agent type
    const sourcesByAgent = sources.reduce(
      (acc, source) => {
        if (!acc[source.agentType]) acc[source.agentType] = [];
        acc[source.agentType].push(source);
        return acc;
      },
      {} as Record<string, ProcessedSource[]>,
    );

    const sourceSection = Object.entries(sourcesByAgent)
      .map(([agentType, agentSources]) => {
        const sourceList = agentSources
          .map((source, index) => {
            const trustBadge =
              source.metadata.trustScore && source.metadata.trustScore > 0.8
                ? "🏆 "
                : "";
            const recentBadge =
              source.metadata.recency && source.metadata.recency > 0.8
                ? "🆕 "
                : "";

            return `- ${trustBadge}${recentBadge}[${source.title}](${
              source.url
            }) ${this.buildMetadataBadges(source.metadata)}`;
          })
          .join("\n");

        return `### ${agentType}\n${sourceList}`;
      })
      .join("\n\n");

    return `## Sources and References

This content was synthesized from multiple research agents to provide comprehensive coverage:

${sourceSection}

---

*Content generated using multi-agent research synthesis. Source quality and relevance scores are provided to help evaluate information credibility.*`;
  }

  /**
   * Build metadata badges for source attribution
   */
  private buildMetadataBadges(metadata: SourceMetadata): string {
    const badges: string[] = [];

    if (metadata.citations && metadata.citations > 50) {
      badges.push(`📊 ${metadata.citations} citations`);
    }

    if (metadata.upvotes && metadata.upvotes > 100) {
      badges.push(`👍 ${metadata.upvotes} upvotes`);
    }

    if (metadata.views) {
      badges.push(`👀 ${metadata.views} views`);
    }

    if (metadata.difficulty) {
      badges.push(`🎯 ${metadata.difficulty} level`);
    }

    if (metadata.trustScore && metadata.trustScore > 0.8) {
      badges.push(`✅ High trust`);
    }

    return badges.length > 0 ? `(${badges.join(", ")})` : "";
  }

  /**
   * Build content metadata for the response
   */
  private buildContentMetadata(
    domain: TopicDomain,
    enhancedResults: EnhancedResearchResult[],
    contentSections: Map<string, any>,
  ): MultiAgentContent["metadata"] {
    const agentContributions: AgentContribution[] = enhancedResults.map(
      (result) => ({
        agentName: result.agent,
        agentType: result.agent,
        sourcesUsed: result.processedSources.length,
        sectionsCreated: this.getSectionsForAgent(
          result.agent,
          contentSections,
        ),
        confidenceScore: result.domainRelevance * result.agentWeight,
      }),
    );

    const totalSources = enhancedResults.reduce(
      (sum, result) => sum + result.results.length,
      0,
    );
    const sectionsGenerated = Array.from(contentSections.keys());
    const estimatedReadTime = this.estimateReadTime(contentSections);

    return {
      domain,
      agentContributions,
      totalSources,
      generationStrategy: "multi-agent-synthesis",
      sectionsGenerated,
      estimatedReadTime,
    };
  }

  /**
   * Get sections that each agent contributed to
   */
  private getSectionsForAgent(
    agentName: string,
    contentSections: Map<string, any>,
  ): string[] {
    // This is a simplified version - in practice you'd track which agent contributed to which section
    const agentToSections: Record<string, string[]> = {
      "General Research Agent": ["overview"],
      "Academic Research Agent": ["academic"],
      "Computational Agent": ["technical"],
      "Video Learning Agent": ["visual"],
      "Community Discussion Agent": ["practical"],
    };

    return agentToSections[agentName] || [];
  }

  /**
   * Estimate reading time based on content length
   */
  private estimateReadTime(contentSections: Map<string, any>): number {
    const totalWords = Array.from(contentSections.values()).reduce(
      (sum, section) => sum + (section.content?.split(" ").length || 0),
      0,
    );

    // Average reading speed: 200 words per minute
    return Math.max(5, Math.ceil(totalWords / 200));
  }

  /**
   * Generate relevant tags based on domain and content
   */
  private generateTags(domain: TopicDomain, subtopics: string[]): string[] {
    const tags: string[] = [domain.primary];

    // Add secondary domains
    tags.push(...domain.secondary);

    // Add characteristic-based tags
    if (domain.characteristics.requiresCodeExamples) tags.push("programming");
    if (domain.characteristics.requiresFormulas) tags.push("mathematics");
    if (domain.characteristics.includesResearch) tags.push("research");
    if (domain.characteristics.hasIndustryApplications) tags.push("industry");
    if (domain.characteristics.focusesOnPractical) tags.push("practical");

    // Add first few subtopics as tags (convert to domain types where applicable)
    tags.push(
      ...subtopics.slice(0, 3).map((s) => s.toLowerCase().replace(/\s+/g, "_")),
    );

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Determine content difficulty level
   */
  private determineDifficulty(
    domain: TopicDomain,
    contentSections: Map<string, any>,
  ): string {
    let difficultyScore = 0;

    // Base difficulty on domain characteristics
    if (domain.characteristics.emphasizesTheory) difficultyScore += 1;
    if (domain.characteristics.requiresFormulas) difficultyScore += 2;
    if (domain.characteristics.requiresCodeExamples) difficultyScore += 1;

    // Adjust based on available content sections
    if (contentSections.has("academic")) difficultyScore += 1;
    if (contentSections.has("technical")) difficultyScore += 2;

    if (difficultyScore >= 4) return "advanced";
    if (difficultyScore >= 2) return "intermediate";
    return "beginner";
  }

  /**
   * Fallback content generation if main system fails
   */
  private async generateFallbackContent(
    topic: Topic,
    subtopics: string[],
    researchResults: ResearchResult[],
    context?: any,
  ): Promise<MultiAgentContent> {
    console.warn("🚨 Using fallback content generation");
    console.log(
      `📊 Fallback: Research results available: ${researchResults.length}`,
    );
    console.log(`🔍 Fallback: Subtopics available: ${subtopics.length}`);

    const fallbackDomain: TopicDomain = {
      primary: DomainType.EDUCATION,
      secondary: [],
      confidence: 0.5,
      characteristics: {
        requiresCodeExamples: false,
        emphasizesTheory: false,
        focusesOnPractical: true,
        needsVisualExplanations: true,
        benefitsFromCommunity: true,
        requiresFormulas: false,
        includesResearch: false,
        hasIndustryApplications: false,
      },
    };

    if (researchResults.length === 0) {
      console.warn(
        "⚠️ No research results available, generating minimal content",
      );
      const minimalContent = `# ${topic.title}

## Overview

This topic is currently being researched. Please check back shortly for comprehensive content.

${
  subtopics.length > 0
    ? `## Suggested Topics

${subtopics.map((subtopic) => `- **${subtopic}**`).join("\n")}`
    : ""
}

---

*Content generation in progress. The multi-agent research system is gathering information from various sources to provide comprehensive coverage of this topic.*`;

      return {
        content: minimalContent,
        metadata: {
          domain: fallbackDomain,
          agentContributions: [],
          totalSources: 0,
          generationStrategy: "minimal-fallback",
          sectionsGenerated: ["overview"],
          estimatedReadTime: 2,
        },
      };
    }

    // Use overview generator as fallback
    const overviewGenerator = new OverviewContentGenerator();
    const allSources = researchResults.flatMap((r) =>
      r.results.map((source, index) => ({
        id: `fallback_${index}`,
        title: source.title,
        url: source.url,
        content: source.snippet,
        agentType: r.agent,
        relevanceScore: source.relevanceScore || 0.5,
        contentType: "overview" as const,
        metadata: { trustScore: 0.5, recency: 0.5 },
      })),
    );

    console.log(
      `📚 Fallback: Using ${allSources.length} sources for overview generation`,
    );

    try {
      const content = await overviewGenerator.generateContent(
        topic,
        allSources,
        fallbackDomain,
        context,
      );
      console.log(
        `✅ Fallback content generated: ${content.length} characters`,
      );

      return {
        content,
        metadata: {
          domain: fallbackDomain,
          agentContributions: [],
          totalSources: researchResults.length,
          generationStrategy: "fallback-single-agent",
          sectionsGenerated: ["overview"],
          estimatedReadTime: Math.ceil(content.split(" ").length / 200),
        },
      };
    } catch (error) {
      console.error("❌ Even fallback content generation failed:", error);

      // Absolute fallback with basic content
      const basicContent = `# ${topic.title}

## Overview

We're working on generating comprehensive content for this topic. Our AI research agents are gathering information from multiple sources to provide you with detailed, accurate information.

### What We're Researching

${
  subtopics.length > 0
    ? subtopics.map((subtopic) => `- ${subtopic}`).join("\n")
    : "- Core concepts and principles\n- Practical applications\n- Best practices and guidelines"
}

### Research Sources

Our system searches across:
- General web sources for foundational information
- Academic papers and research
- Educational videos and tutorials
- Community discussions and experiences
- Technical documentation and specifications

---

*Please refresh the page in a few moments to see the complete content.*`;

      return {
        content: basicContent,
        metadata: {
          domain: fallbackDomain,
          agentContributions: [],
          totalSources: 0,
          generationStrategy: "basic-fallback",
          sectionsGenerated: ["overview"],
          estimatedReadTime: 3,
        },
      };
    }
  }
}

// Export singleton instance for easy usage
export const multiAgentContentOrchestrator =
  new MultiAgentContentOrchestrator();
