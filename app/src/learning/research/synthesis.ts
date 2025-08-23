import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { type ResearchResult, type SearchResult } from './agents';
import { type DeduplicationResult } from './aggregation/deduplication';
import { type ScoredResult } from './scoring';

export interface SynthesisConfig {
  maxTokens: number;
  temperature: number;
  summaryLength: 'brief' | 'moderate' | 'detailed';
  includeSourceAttribution: boolean;
  emphasizePerspectives: boolean;
  factCheckingEnabled: boolean;
  biasDetection: boolean;
  learningStyleAdaptation: boolean;
}

export interface SynthesisResult {
  synthesizedContent: {
    summary: string;
    keyPoints: string[];
    perspectives: Perspective[];
    factualHighlights: FactualHighlight[];
  };
  metadata: {
    sourceCount: number;
    agentContributions: AgentContribution[];
    confidenceScore: number;
    biasAssessment: BiasAssessment;
    factualityScore: number;
    processingTime: number;
  };
  adaptedContent?: {
    userLevel?: AdaptedContent;
    learningStyle?: AdaptedContent;
  };
}

export interface Perspective {
  viewpoint: string;
  description: string;
  sources: string[];
  confidence: number;
  supportingEvidence: string[];
}

export interface FactualHighlight {
  fact: string;
  confidence: number;
  sources: string[];
  category: 'statistic' | 'definition' | 'process' | 'relationship' | 'example';
}

export interface AgentContribution {
  agentName: string;
  contributionPercentage: number;
  uniqueInsights: string[];
  overlap: number;
}

export interface BiasAssessment {
  overallScore: number; // 0-1, 0 = unbiased
  detectedBiases: DetectedBias[];
  balanceScore: number; // How well different perspectives are represented
}

export interface DetectedBias {
  type: 'political' | 'commercial' | 'cultural' | 'confirmation' | 'availability';
  severity: 'low' | 'medium' | 'high';
  evidence: string[];
  sources: string[];
}

export interface AdaptedContent {
  summary: string;
  explanation: string;
  examples: string[];
  recommendations: string[];
}

const DEFAULT_CONFIG: SynthesisConfig = {
  maxTokens: 2000,
  temperature: 0.3,
  summaryLength: 'moderate',
  includeSourceAttribution: true,
  emphasizePerspectives: true,
  factCheckingEnabled: true,
  biasDetection: true,
  learningStyleAdaptation: true
};

export class ContentSynthesisEngine {
  private config: SynthesisConfig;

  constructor(config: Partial<SynthesisConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Synthesize content from multiple research results using AI
   */
  async synthesizeResearchResults(
    researchResults: ResearchResult[],
    deduplicationResult: DeduplicationResult,
    scoredResults: ScoredResult[],
    topic: string,
    context?: {
      userLevel?: 'beginner' | 'intermediate' | 'advanced';
      learningStyle?: 'visual' | 'textual' | 'interactive' | 'video' | 'conversational';
      specificQuestions?: string[];
      focusAreas?: string[];
    }
  ): Promise<SynthesisResult> {
    const startTime = Date.now();

    try {
      // Step 1: Prepare content for synthesis
      const preparedContent = await this.prepareContentForSynthesis(
        researchResults,
        scoredResults,
        topic
      );

      // Step 2: Generate core synthesized content
      const synthesizedContent = await this.generateSynthesizedContent(
        preparedContent,
        topic,
        context
      );

      // Step 3: Analyze agent contributions
      const agentContributions = this.analyzeAgentContributions(researchResults);

      // Step 4: Assess bias and factuality
      const biasAssessment = await this.assessBias(synthesizedContent, researchResults);
      const factualityScore = await this.assessFactuality(synthesizedContent, researchResults);

      // Step 5: Generate adapted content for different contexts
      const adaptedContent = context ? await this.generateAdaptedContent(
        synthesizedContent,
        topic,
        context
      ) : undefined;

      const processingTime = Date.now() - startTime;

      return {
        synthesizedContent,
        metadata: {
          sourceCount: researchResults.reduce((sum, r) => sum + r.results.length, 0),
          agentContributions,
          confidenceScore: this.calculateOverallConfidence(researchResults, scoredResults),
          biasAssessment,
          factualityScore,
          processingTime
        },
        adaptedContent
      };

    } catch (error) {
      console.error('Content synthesis failed:', error);
      throw new Error(`Content synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Prepare content from multiple agents for synthesis
   */
  private async prepareContentForSynthesis(
    researchResults: ResearchResult[],
    scoredResults: ScoredResult[],
    topic: string
  ): Promise<{
    organizedContent: OrganizedContent;
    topResults: SearchResult[];
    agentSummaries: { [agentName: string]: string };
  }> {
    // Get top results based on scoring
    const topResults = scoredResults
      .slice(0, 20) // Take top 20 results
      .map(sr => ({
        title: sr.title,
        snippet: sr.snippet,
        url: sr.url,
        source: sr.sources.join(', '),
        relevanceScore: sr.finalScore,
        metadata: sr.metadata
      }));

    // Organize content by type and perspective
    const organizedContent = this.organizeContentByType(researchResults);

    // Generate agent-specific summaries
    const agentSummaries: { [agentName: string]: string } = {};
    for (const result of researchResults) {
      if (result.status === 'success' && result.results.length > 0) {
        agentSummaries[result.agent] = await this.generateAgentSummary(result, topic);
      }
    }

    return {
      organizedContent,
      topResults,
      agentSummaries
    };
  }

  /**
   * Generate comprehensive synthesized content using AI
   */
  private async generateSynthesizedContent(
    preparedContent: {
      organizedContent: OrganizedContent;
      topResults: SearchResult[];
      agentSummaries: { [agentName: string]: string };
    },
    topic: string,
    context?: any
  ): Promise<{
    summary: string;
    keyPoints: string[];
    perspectives: Perspective[];
    factualHighlights: FactualHighlight[];
  }> {
    // Create synthesis prompt
    const synthesisPrompt = this.createSynthesisPrompt(
      preparedContent,
      topic,
      context
    );

    // Call OpenAI for synthesis using AI SDK
    const result = await generateText({
      model: openai('gpt-4-turbo-preview'),
      system: this.getSynthesisSystemPrompt(),
      prompt: synthesisPrompt,
      temperature: this.config.temperature,
    });

    const synthesisResponse = JSON.parse(result.text || '{}');

    // Extract and validate the synthesized content
    return {
      summary: synthesisResponse.summary || 'No summary generated',
      keyPoints: synthesisResponse.keyPoints || [],
      perspectives: synthesisResponse.perspectives || [],
      factualHighlights: synthesisResponse.factualHighlights || []
    };
  }

  /**
   * Create synthesis prompt for OpenAI
   */
  private createSynthesisPrompt(
    preparedContent: {
      organizedContent: OrganizedContent;
      topResults: SearchResult[];
      agentSummaries: { [agentName: string]: string };
    },
    topic: string,
    context?: any
  ): string {
    const { organizedContent, topResults, agentSummaries } = preparedContent;

    let prompt = `Please synthesize comprehensive information about "${topic}" based on research from multiple specialized agents.\n\n`;

    // Add agent summaries
    prompt += '## Agent Research Summaries:\n';
    Object.entries(agentSummaries).forEach(([agent, summary]) => {
      prompt += `**${agent}**: ${summary}\n\n`;
    });

    // Add organized content
    prompt += '## Organized Research Content:\n';
    
    if (organizedContent.academic.length > 0) {
      prompt += `**Academic Sources**: ${organizedContent.academic.map(r => r.snippet).join(' ')}\n\n`;
    }
    
    if (organizedContent.general.length > 0) {
      prompt += `**General Sources**: ${organizedContent.general.map(r => r.snippet).join(' ')}\n\n`;
    }
    
    if (organizedContent.community.length > 0) {
      prompt += `**Community Insights**: ${organizedContent.community.map(r => r.snippet).join(' ')}\n\n`;
    }
    
    if (organizedContent.computational.length > 0) {
      prompt += `**Technical/Computational**: ${organizedContent.computational.map(r => r.snippet).join(' ')}\n\n`;
    }
    
    if (organizedContent.video.length > 0) {
      prompt += `**Video Content**: ${organizedContent.video.map(r => r.snippet).join(' ')}\n\n`;
    }

    // Add context if provided
    if (context) {
      prompt += '## Context:\n';
      if (context.userLevel) {
        prompt += `User Level: ${context.userLevel}\n`;
      }
      if (context.learningStyle) {
        prompt += `Learning Style: ${context.learningStyle}\n`;
      }
      if (context.specificQuestions) {
        prompt += `Specific Questions: ${context.specificQuestions.join(', ')}\n`;
      }
      if (context.focusAreas) {
        prompt += `Focus Areas: ${context.focusAreas.join(', ')}\n`;
      }
      prompt += '\n';
    }

    // Add synthesis instructions
    prompt += this.getSynthesisInstructions();

    return prompt;
  }

  /**
   * Get system prompt for synthesis
   */
  private getSynthesisSystemPrompt(): string {
    return `You are an expert research synthesizer that creates comprehensive, balanced, and insightful summaries from multiple sources. Your task is to:

1. Synthesize information from multiple research agents (Academic, General, Community, Video, Computational)
2. Create coherent narratives that integrate different perspectives
3. Identify key facts, insights, and practical applications
4. Maintain objectivity while acknowledging different viewpoints
5. Provide proper context and highlight important connections
6. Format your response as valid JSON

Always strive for accuracy, balance, and clarity in your synthesis.`;
  }

  /**
   * Get synthesis instructions
   */
  private getSynthesisInstructions(): string {
    return `## Synthesis Instructions:

Please provide a JSON response with the following structure:

{
  "summary": "A comprehensive 200-400 word summary that integrates insights from all sources",
  "keyPoints": [
    "Key point 1 with supporting evidence",
    "Key point 2 with supporting evidence",
    "..." 
  ],
  "perspectives": [
    {
      "viewpoint": "Academic perspective",
      "description": "Detailed description of the academic viewpoint",
      "sources": ["Academic Research Agent"],
      "confidence": 0.9,
      "supportingEvidence": ["Evidence 1", "Evidence 2"]
    }
  ],
  "factualHighlights": [
    {
      "fact": "Important factual statement",
      "confidence": 0.95,
      "sources": ["Source agent names"],
      "category": "statistic|definition|process|relationship|example"
    }
  ]
}

Focus on:
- Creating a coherent narrative that flows naturally
- Highlighting areas where sources agree or disagree
- Identifying the most reliable and important information
- Providing balanced coverage of different aspects
- Including practical applications and implications
- Noting any limitations or uncertainties`;
  }

  /**
   * Organize content by type/source
   */
  private organizeContentByType(researchResults: ResearchResult[]): OrganizedContent {
    const organized: OrganizedContent = {
      academic: [],
      general: [],
      community: [],
      video: [],
      computational: []
    };

    researchResults.forEach(result => {
      if (result.status !== 'success') return;

      const agentType = this.classifyAgentType(result.agent);
      if (organized[agentType]) {
        organized[agentType].push(...result.results);
      }
    });

    return organized;
  }

  /**
   * Classify agent type for content organization
   */
  private classifyAgentType(agentName: string): keyof OrganizedContent {
    const name = agentName.toLowerCase();
    if (name.includes('academic')) return 'academic';
    if (name.includes('community')) return 'community';
    if (name.includes('video')) return 'video';
    if (name.includes('computational')) return 'computational';
    return 'general';
  }

  /**
   * Generate agent-specific summary
   */
  private async generateAgentSummary(result: ResearchResult, topic: string): Promise<string> {
    if (result.summary && result.summary.length > 50) {
      return result.summary;
    }

    // Generate summary from search results
    const topResults = result.results.slice(0, 5);
    const content = topResults.map(r => `${r.title}: ${r.snippet}`).join('\n');

    try {
      const aiResult = await generateText({
        model: openai('gpt-3.5-turbo'),
        system: `Summarize the key insights about "${topic}" from the ${result.agent} in 2-3 sentences.`,
        prompt: content,
        temperature: 0.3
      });

      return aiResult.text || 'No summary available';
    } catch (error) {
      console.error('Failed to generate agent summary:', error);
      return `${result.agent} found ${result.results.length} results about ${topic}`;
    }
  }

  /**
   * Analyze contributions from each agent
   */
  private analyzeAgentContributions(researchResults: ResearchResult[]): AgentContribution[] {
    const totalResults = researchResults.reduce((sum, r) => sum + r.results.length, 0);
    
    return researchResults.map(result => ({
      agentName: result.agent,
      contributionPercentage: totalResults > 0 ? (result.results.length / totalResults) * 100 : 0,
      uniqueInsights: this.extractUniqueInsights(result),
      overlap: this.calculateOverlapScore(result, researchResults)
    }));
  }

  /**
   * Extract unique insights from an agent's results
   */
  private extractUniqueInsights(result: ResearchResult): string[] {
    if (result.status !== 'success' || result.results.length === 0) return [];

    // Simple heuristic: take distinctive phrases from top results
    const insights: string[] = [];
    const topResults = result.results.slice(0, 3);

    topResults.forEach(searchResult => {
      const snippet = searchResult.snippet || '';
      // Extract sentences that contain domain-specific terms
      const sentences = snippet.split(/[.!?]+/);
      sentences.forEach(sentence => {
        if (this.hasUniqueTerms(sentence, result.agent)) {
          insights.push(sentence.trim());
        }
      });
    });

    return insights.slice(0, 3); // Max 3 insights per agent
  }

  /**
   * Check if sentence contains terms unique to the agent type
   */
  private hasUniqueTerms(sentence: string, agentName: string): boolean {
    const lowerSentence = sentence.toLowerCase();
    const agentType = this.classifyAgentType(agentName);

    const uniqueTerms = {
      academic: ['research', 'study', 'analysis', 'methodology', 'peer-reviewed'],
      computational: ['algorithm', 'calculation', 'formula', 'data', 'compute'],
      video: ['tutorial', 'demonstration', 'visual', 'explanation', 'walkthrough'],
      community: ['discussion', 'experience', 'community', 'practical', 'real-world'],
      general: ['overview', 'introduction', 'guide', 'basics', 'information']
    };

    const terms = uniqueTerms[agentType] || [];
    return terms.some(term => lowerSentence.includes(term)) && sentence.length > 30;
  }

  /**
   * Calculate overlap score between agents
   */
  private calculateOverlapScore(result: ResearchResult, allResults: ResearchResult[]): number {
    if (result.results.length === 0) return 0;

    let overlapCount = 0;
    let totalComparisons = 0;

    result.results.forEach(searchResult => {
      allResults.forEach(otherResult => {
        if (otherResult.agent === result.agent) return;

        otherResult.results.forEach(otherSearchResult => {
          totalComparisons++;
          if (this.areResultsSimilar(searchResult, otherSearchResult)) {
            overlapCount++;
          }
        });
      });
    });

    return totalComparisons > 0 ? overlapCount / totalComparisons : 0;
  }

  /**
   * Check if two search results are similar
   */
  private areResultsSimilar(result1: SearchResult, result2: SearchResult): boolean {
    // Simple similarity check
    const title1 = (result1.title || '').toLowerCase();
    const title2 = (result2.title || '').toLowerCase();
    
    if (title1 === title2) return true;
    
    const words1 = title1.split(/\s+/);
    const words2 = title2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word) && word.length > 3);
    
    return commonWords.length >= Math.min(words1.length, words2.length) * 0.5;
  }

  /**
   * Assess bias in synthesized content
   */
  private async assessBias(
    content: {
      summary: string;
      keyPoints: string[];
      perspectives: Perspective[];
    },
    researchResults: ResearchResult[]
  ): Promise<BiasAssessment> {
    // Simplified bias assessment
    // In a real implementation, this would use more sophisticated NLP techniques

    const allText = [
      content.summary,
      ...content.keyPoints,
      ...content.perspectives.map(p => p.description)
    ].join(' ');

    const biasIndicators = this.detectSimpleBias(allText);
    const balanceScore = this.calculateBalanceScore(content.perspectives, researchResults);

    return {
      overallScore: biasIndicators.length > 0 ? 0.3 : 0.1,
      detectedBiases: biasIndicators,
      balanceScore
    };
  }

  /**
   * Detect simple bias patterns
   */
  private detectSimpleBias(text: string): DetectedBias[] {
    const biases: DetectedBias[] = [];
    const lowerText = text.toLowerCase();

    // Commercial bias
    const commercialTerms = ['buy', 'purchase', 'product', 'sale', 'discount', 'offer'];
    if (commercialTerms.some(term => lowerText.includes(term))) {
      biases.push({
        type: 'commercial',
        severity: 'medium',
        evidence: commercialTerms.filter(term => lowerText.includes(term)),
        sources: ['Content Analysis']
      });
    }

    // Confirmation bias (strong assertions without evidence)
    const strongAssertions = ['obviously', 'clearly', 'definitely', 'without doubt'];
    if (strongAssertions.some(term => lowerText.includes(term))) {
      biases.push({
        type: 'confirmation',
        severity: 'low',
        evidence: strongAssertions.filter(term => lowerText.includes(term)),
        sources: ['Content Analysis']
      });
    }

    return biases;
  }

  /**
   * Calculate balance score based on perspective representation
   */
  private calculateBalanceScore(perspectives: Perspective[], researchResults: ResearchResult[]): number {
    const agentCount = researchResults.filter(r => r.status === 'success').length;
    const perspectiveCount = perspectives.length;
    
    // Good balance if we have perspectives from multiple sources
    const diverseSourceCount = new Set(perspectives.flatMap(p => p.sources)).size;
    
    return Math.min(1, (diverseSourceCount / Math.max(1, agentCount)) * 0.7 + 
                     (perspectiveCount / Math.max(1, agentCount)) * 0.3);
  }

  /**
   * Assess factuality of synthesized content
   */
  private async assessFactuality(
    content: {
      summary: string;
      keyPoints: string[];
      factualHighlights: FactualHighlight[];
    },
    researchResults: ResearchResult[]
  ): Promise<number> {
    // Simplified factuality assessment
    let factualityScore = 0.7; // Base score

    // Boost for academic sources
    const hasAcademicSources = researchResults.some(r => 
      r.agent.toLowerCase().includes('academic') && r.status === 'success'
    );
    if (hasAcademicSources) {
      factualityScore += 0.1;
    }

    // Boost for multiple source confirmation
    if (content.factualHighlights.some(fh => fh.sources.length > 1)) {
      factualityScore += 0.1;
    }

    // Boost for high-confidence factual highlights
    const avgConfidence = content.factualHighlights.length > 0 
      ? content.factualHighlights.reduce((sum, fh) => sum + fh.confidence, 0) / content.factualHighlights.length
      : 0.5;
    
    factualityScore += (avgConfidence - 0.5) * 0.2;

    return Math.max(0, Math.min(1, factualityScore));
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    researchResults: ResearchResult[],
    scoredResults: ScoredResult[]
  ): number {
    const successfulResults = researchResults.filter(r => r.status === 'success');
    const successRate = successfulResults.length / Math.max(1, researchResults.length);
    
    const avgScore = scoredResults.length > 0
      ? scoredResults.slice(0, 10).reduce((sum, r) => sum + r.finalScore, 0) / Math.min(10, scoredResults.length)
      : 0.5;

    return (successRate * 0.4 + avgScore * 0.6);
  }

  /**
   * Generate adapted content for specific contexts
   */
  private async generateAdaptedContent(
    synthesizedContent: {
      summary: string;
      keyPoints: string[];
      perspectives: Perspective[];
    },
    topic: string,
    context: {
      userLevel?: 'beginner' | 'intermediate' | 'advanced';
      learningStyle?: 'visual' | 'textual' | 'interactive' | 'video' | 'conversational';
      specificQuestions?: string[];
      focusAreas?: string[];
    }
  ): Promise<{
    userLevel?: AdaptedContent;
    learningStyle?: AdaptedContent;
  }> {
    const adaptations: {
      userLevel?: AdaptedContent;
      learningStyle?: AdaptedContent;
    } = {};

    // Adapt for user level
    if (context.userLevel) {
      adaptations.userLevel = await this.generateUserLevelAdaptation(
        synthesizedContent,
        topic,
        context.userLevel
      );
    }

    // Adapt for learning style
    if (context.learningStyle) {
      adaptations.learningStyle = await this.generateLearningStyleAdaptation(
        synthesizedContent,
        topic,
        context.learningStyle
      );
    }

    return adaptations;
  }

  /**
   * Generate user level specific adaptation
   */
  private async generateUserLevelAdaptation(
    content: { summary: string; keyPoints: string[] },
    topic: string,
    userLevel: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<AdaptedContent> {
    const adaptationPrompt = this.createUserLevelAdaptationPrompt(content, topic, userLevel);

    try {
      const aiResult = await generateText({
        model: openai('gpt-3.5-turbo'),
        system: `Adapt content about "${topic}" for ${userLevel} level learners. Focus on appropriate complexity and examples.`,
        prompt: adaptationPrompt,
        temperature: 0.4
      });

      const response = JSON.parse(aiResult.text || '{}');
      
      return {
        summary: response.summary || content.summary,
        explanation: response.explanation || '',
        examples: response.examples || [],
        recommendations: response.recommendations || []
      };
    } catch (error) {
      console.error('Failed to generate user level adaptation:', error);
      return {
        summary: content.summary,
        explanation: '',
        examples: [],
        recommendations: []
      };
    }
  }

  /**
   * Generate learning style specific adaptation
   */
  private async generateLearningStyleAdaptation(
    content: { summary: string; keyPoints: string[] },
    topic: string,
    learningStyle: string
  ): Promise<AdaptedContent> {
    // Simplified adaptation based on learning style
    return {
      summary: content.summary,
      explanation: `This content is adapted for ${learningStyle} learning preferences.`,
      examples: [],
      recommendations: [
        `Consider exploring ${learningStyle} resources for deeper understanding`
      ]
    };
  }

  /**
   * Create user level adaptation prompt
   */
  private createUserLevelAdaptationPrompt(
    content: { summary: string; keyPoints: string[] },
    topic: string,
    userLevel: string
  ): string {
    return `Please adapt the following content about "${topic}" for ${userLevel} level learners:

Summary: ${content.summary}

Key Points: ${content.keyPoints.join('\n')}

Provide a JSON response with:
{
  "summary": "Adapted summary at appropriate complexity level",
  "explanation": "Additional explanation as needed for this level",
  "examples": ["Relevant examples for this level"],
  "recommendations": ["Learning recommendations for this level"]
}`;
  }

  // Configuration methods
  updateConfig(config: Partial<SynthesisConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SynthesisConfig {
    return { ...this.config };
  }
}

// Supporting interfaces
interface OrganizedContent {
  academic: SearchResult[];
  general: SearchResult[];
  community: SearchResult[];
  video: SearchResult[];
  computational: SearchResult[];
}

// Export default instance
export const defaultContentSynthesizer = new ContentSynthesisEngine();