# Learning Research Platform Implementation Spec

## Overview
This spec details the implementation of the missing components to complete the AI-Powered Learning Research Platform as defined in the PRD. The focus is on connecting the existing infrastructure with real SearXNG integration and content generation.

## 1. SearXNG Integration Implementation

### 1.1 Core SearXNG Service

**File: `app/src/learning/research/searxng.ts`**

```typescript
import axios from 'axios';

interface SearxngSearchOptions {
  categories?: string[];
  engines?: string[];
  language?: string;
  pageno?: number;
  time_range?: string;
  safesearch?: number;
}

interface SearxngSearchResult {
  title: string;
  url: string;
  img_src?: string;
  thumbnail_src?: string;
  thumbnail?: string;
  content?: string;
  author?: string;
  iframe_src?: string;
  publishedDate?: string;
  engine?: string;
  score?: number;
}

interface SearxngResponse {
  results: SearxngSearchResult[];
  suggestions: string[];
  number_of_results: number;
  query: string;
}

export class SearxngService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = process.env.SEARXNG_URL || 'http://localhost:8080';
    this.timeout = 30000; // 30 seconds
  }

  async search(query: string, options?: SearxngSearchOptions): Promise<SearxngResponse> {
    const url = new URL(`${this.baseUrl}/search`);
    url.searchParams.append('format', 'json');
    url.searchParams.append('q', query);

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          url.searchParams.append(key, value.join(','));
        } else if (value !== undefined) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    try {
      const response = await axios.get(url.toString(), {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Learning-Research-Platform/1.0',
          'Accept': 'application/json'
        }
      });

      return {
        results: response.data.results || [],
        suggestions: response.data.suggestions || [],
        number_of_results: response.data.number_of_results || 0,
        query: response.data.query || query
      };
    } catch (error) {
      console.error('SearXNG search failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/stats`, { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export const searxngService = new SearxngService();
```

### 1.2 Agent-Specific Search Implementations

**File: `app/src/learning/research/agentSearch.ts`**

```typescript
import { searxngService, SearxngSearchResult } from './searxng';
import { SearchResult } from './agents';

export interface AgentSearchConfig {
  engines?: string[];
  categories?: string[];
  maxResults?: number;
  timeRange?: string;
}

export const AGENT_SEARCH_CONFIGS: Record<string, AgentSearchConfig> = {
  general: {
    maxResults: 15,
    timeRange: 'year'
  },
  academic: {
    engines: ['arxiv', 'google scholar', 'pubmed', 'semantic scholar'],
    maxResults: 10,
    timeRange: 'year'
  },
  computational: {
    engines: ['wolframalpha', 'stackoverflow'],
    maxResults: 8,
    timeRange: 'year'
  },
  video: {
    engines: ['youtube', 'vimeo'],
    categories: ['videos'],
    maxResults: 12,
    timeRange: 'year'
  },
  social: {
    engines: ['reddit', 'hackernews'],
    categories: ['social media'],
    maxResults: 10,
    timeRange: 'month'
  }
};

export class AgentSearchService {
  async searchForAgent(
    agentName: string,
    query: string,
    context?: any
  ): Promise<SearchResult[]> {
    const config = AGENT_SEARCH_CONFIGS[agentName];
    if (!config) {
      throw new Error(`Unknown agent: ${agentName}`);
    }

    try {
      const searchOptions = {
        engines: config.engines,
        categories: config.categories,
        time_range: config.timeRange,
        language: context?.language || 'en',
        safesearch: 1
      };

      const response = await searxngService.search(query, searchOptions);

      return this.transformResults(response.results, agentName, query)
        .slice(0, config.maxResults);
    } catch (error) {
      console.error(`Search failed for agent ${agentName}:`, error);
      return [];
    }
  }

  private transformResults(
    results: SearxngSearchResult[],
    agentName: string,
    query: string
  ): SearchResult[] {
    return results.map((result, index) => ({
      title: result.title || 'Untitled',
      url: result.url,
      snippet: result.content || '',
      source: result.engine || agentName,
      relevanceScore: this.calculateRelevanceScore(result, query, index),
      metadata: {
        agent: agentName,
        publishedDate: result.publishedDate,
        author: result.author,
        thumbnail: result.thumbnail_src || result.img_src,
        iframe_src: result.iframe_src
      }
    }));
  }

  private calculateRelevanceScore(
    result: SearxngSearchResult,
    query: string,
    position: number
  ): number {
    let score = 1.0 - (position * 0.05); // Position-based scoring

    // Boost score based on title relevance
    const titleWords = result.title?.toLowerCase().split(/\s+/) || [];
    const queryWords = query.toLowerCase().split(/\s+/);
    const titleMatches = queryWords.filter(word =>
      titleWords.some(titleWord => titleWord.includes(word))
    ).length;

    score += (titleMatches / queryWords.length) * 0.3;

    // Boost score based on content relevance
    if (result.content) {
      const contentWords = result.content.toLowerCase().split(/\s+/);
      const contentMatches = queryWords.filter(word =>
        contentWords.some(contentWord => contentWord.includes(word))
      ).length;

      score += (contentMatches / queryWords.length) * 0.2;
    }

    return Math.min(Math.max(score, 0), 1);
  }
}

export const agentSearchService = new AgentSearchService();
```

## 2. Real Research Agent Implementation

### 2.1 Updated Research Agents with SearXNG

**File: `app/src/learning/research/realAgents.ts`**

```typescript
import { ResearchAgent, ResearchResult, SearchResult } from './agents';
import { agentSearchService } from './agentSearch';
import { getOptimizedQueries, getEnhancedContext } from './prompts';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class RealGeneralResearchAgent implements ResearchAgent {
  name = 'General Research Agent';
  description = 'Provides comprehensive information using broad web search';
  engines: string[] = [];
  prompt = 'Research comprehensive information about {topic} including definitions, key concepts, applications, and current developments';

  async execute(topic: string, context?: any): Promise<ResearchResult> {
    try {
      const enhancedContext = getEnhancedContext(this.name, topic, context);
      const optimizedQueries = getOptimizedQueries(this.name, topic, enhancedContext);

      // Execute multiple optimized queries
      const allResults: SearchResult[] = [];
      for (const query of optimizedQueries.slice(0, 5)) {
        const results = await agentSearchService.searchForAgent('general', query, enhancedContext);
        allResults.push(...results);
      }

      // Remove duplicates and sort by relevance
      const uniqueResults = this.deduplicateResults(allResults);
      const topResults = uniqueResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)).slice(0, 15);

      const summary = await this.generateAISummary(topResults, topic);
      const subtopics = await this.identifySubtopics(topResults, topic);

      return {
        agent: this.name,
        topic,
        results: topResults,
        summary,
        subtopics,
        status: 'success',
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`${this.name} execution failed:`, error);
      return {
        agent: this.name,
        topic,
        results: [],
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  private async generateAISummary(results: SearchResult[], topic: string): Promise<string> {
    if (results.length === 0) return `No results found for ${topic}`;

    const content = results.slice(0, 10).map(r =>
      `Title: ${r.title}\nContent: ${r.snippet}`
    ).join('\n\n');

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [{
          role: 'user',
          content: `Based on the following search results about "${topic}", create a comprehensive summary that covers the key concepts, applications, and current developments. Keep it informative but concise (300-500 words):\n\n${content}`
        }],
        max_tokens: 600,
        temperature: 0.3
      });

      return response.choices[0]?.message?.content || `Summary for ${topic} based on ${results.length} sources.`;
    } catch (error) {
      console.error('AI summary generation failed:', error);
      return `Found ${results.length} results about ${topic}. Key information includes definitions, applications, and current developments in the field.`;
    }
  }

  private async identifySubtopics(results: SearchResult[], topic: string): Promise<string[]> {
    if (results.length === 0) return [];

    const content = results.slice(0, 8).map(r => r.title + ' ' + r.snippet).join(' ');

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [{
          role: 'user',
          content: `Based on the following content about "${topic}", identify 5-8 important subtopics that someone learning about ${topic} should explore. Return only the subtopic names, one per line:\n\n${content.substring(0, 3000)}`
        }],
        max_tokens: 200,
        temperature: 0.5
      });

      const subtopics = response.choices[0]?.message?.content
        ?.split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0 && line.length < 100)
        .slice(0, 8) || [];

      return subtopics;
    } catch (error) {
      console.error('AI subtopic identification failed:', error);
      // Fallback to simple keyword extraction
      return this.extractKeywordsAsSubtopics(content, topic);
    }
  }

  private extractKeywordsAsSubtopics(content: string, topic: string): string[] {
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const frequency: Record<string, number> = {};

    words.forEach(word => {
      if (!word.includes(topic.toLowerCase()) && word.length > 3) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.title}-${result.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// Similar implementations for other agents...
export class RealAcademicResearchAgent implements ResearchAgent {
  name = 'Academic Research Agent';
  description = 'Finds peer-reviewed research using academic search engines';
  engines = ['arxiv', 'google scholar', 'pubmed'];
  prompt = 'Find peer-reviewed research and scholarly articles about {topic}';

  async execute(topic: string, context?: any): Promise<ResearchResult> {
    // Similar implementation but using academic-specific search
    const results = await agentSearchService.searchForAgent('academic', topic, context);
    const summary = await this.generateAcademicSummary(results, topic);
    const subtopics = await this.identifyAcademicSubtopics(results, topic);

    return {
      agent: this.name,
      topic,
      results,
      summary,
      subtopics,
      status: 'success',
      timestamp: new Date()
    };
  }

  private async generateAcademicSummary(results: SearchResult[], topic: string): Promise<string> {
    // Academic-focused summary generation
    const academicContent = results.map(r => `${r.title}: ${r.snippet}`).join('\n');

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [{
          role: 'user',
          content: `Based on these academic sources about "${topic}", create a scholarly summary focusing on research findings, methodologies, and theoretical frameworks:\n\n${academicContent}`
        }],
        max_tokens: 500,
        temperature: 0.2
      });

      return response.choices[0]?.message?.content || `Academic research summary for ${topic}`;
    } catch (error) {
      return `Academic research findings for ${topic} from ${results.length} scholarly sources.`;
    }
  }

  private async identifyAcademicSubtopics(results: SearchResult[], topic: string): Promise<string[]> {
    // Academic subtopic identification
    return [`${topic} Research Methods`, `${topic} Applications`, `${topic} Theory`];
  }
}

// Export factory with real agents
export class RealResearchAgentFactory {
  private static agents: Map<string, ResearchAgent> = new Map();

  static {
    const agentInstances = [
      new RealGeneralResearchAgent(),
      new RealAcademicResearchAgent(),
      // Add other real agent implementations...
    ];

    agentInstances.forEach(agent => {
      this.agents.set(agent.name, agent);
    });
  }

  static getAllAgents(): ResearchAgent[] {
    return Array.from(this.agents.values());
  }

  static async executeAllAgents(topic: string, context?: any): Promise<ResearchResult[]> {
    const agents = this.getAllAgents();
    const promises = agents.map(agent => agent.execute(topic, context));

    const results = await Promise.allSettled(promises);
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          agent: agents[index].name,
          topic,
          results: [],
          status: 'error' as const,
          error: result.reason?.message || 'Unknown error',
          timestamp: new Date()
        };
      }
    });
  }
}
```

## 3. Content Generation Implementation

### 3.1 Assessment Content Generator

**File: `app/src/learning/content/assessmentGenerator.ts`**

```typescript
import OpenAI from 'openai';
import { AssessmentResult } from '../components/ui/KnowledgeAssessment';
import { LearningPath } from '../components/ui/StartingPointRecommendation';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedAssessmentContent {
  learningPaths: LearningPath[];
  personalizedContent: string;
  suggestedStartingPoints: string[];
  estimatedDuration: string;
}

export class AssessmentContentGenerator {
  async generatePersonalizedContent(
    topic: string,
    assessment: AssessmentResult,
    topicSummary?: string
  ): Promise<GeneratedAssessmentContent> {
    try {
      const prompt = this.createAssessmentPrompt(topic, assessment, topicSummary);

      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.7
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseGeneratedContent(content, topic, assessment);
    } catch (error) {
      console.error('Assessment content generation failed:', error);
      return this.getFallbackContent(topic, assessment);
    }
  }

  private createAssessmentPrompt(
    topic: string,
    assessment: AssessmentResult,
    topicSummary?: string
  ): string {
    const knowledgeLevel = assessment.knowledgeLevel <= 2 ? 'beginner' :
                          assessment.knowledgeLevel <= 3 ? 'intermediate' : 'advanced';

    return `
Create a personalized learning plan for someone wanting to learn about "${topic}".

User Profile:
- Knowledge Level: ${knowledgeLevel} (${assessment.knowledgeLevel}/5)
- Learning Styles: ${assessment.learningStyles.join(', ')}
- Preferred Difficulty: ${assessment.preferences.difficultyPreference}
- Content Depth: ${assessment.preferences.contentDepth}
- Learning Pace: ${assessment.preferences.pacePreference}

${topicSummary ? `Topic Context: ${topicSummary}` : ''}

Please provide:
1. 3-4 different learning paths tailored to their profile
2. Personalized introduction explaining why this approach works for them
3. 5-6 specific starting points they should explore first
4. Estimated time commitment

Format as JSON:
{
  "learningPaths": [
    {
      "id": "path1",
      "title": "Path Title",
      "description": "Why this path works for them",
      "duration": "estimated time",
      "difficulty": "beginner|intermediate|advanced",
      "approach": "hands-on|theoretical|mixed",
      "steps": ["step1", "step2", "step3"]
    }
  ],
  "personalizedContent": "Personalized introduction and explanation",
  "suggestedStartingPoints": ["point1", "point2"],
  "estimatedDuration": "overall time estimate"
}
`;
  }

  private parseGeneratedContent(
    content: string,
    topic: string,
    assessment: AssessmentResult
  ): GeneratedAssessmentContent {
    try {
      const parsed = JSON.parse(content);
      return {
        learningPaths: parsed.learningPaths || [],
        personalizedContent: parsed.personalizedContent || '',
        suggestedStartingPoints: parsed.suggestedStartingPoints || [],
        estimatedDuration: parsed.estimatedDuration || ''
      };
    } catch (error) {
      console.error('Failed to parse generated content:', error);
      return this.getFallbackContent(topic, assessment);
    }
  }

  private getFallbackContent(topic: string, assessment: AssessmentResult): GeneratedAssessmentContent {
    const knowledgeLevel = assessment.knowledgeLevel <= 2 ? 'beginner' :
                          assessment.knowledgeLevel <= 3 ? 'intermediate' : 'advanced';

    return {
      learningPaths: [
        {
          id: 'structured',
          title: 'Structured Learning Path',
          description: `A step-by-step approach to learning ${topic} at ${knowledgeLevel} level`,
          duration: '2-4 weeks',
          difficulty: knowledgeLevel as any,
          approach: 'mixed',
          steps: [
            `Understand ${topic} fundamentals`,
            `Explore key concepts and principles`,
            `Practice with examples`,
            `Apply knowledge to real scenarios`
          ]
        }
      ],
      personalizedContent: `Based on your ${knowledgeLevel} level and preference for ${assessment.learningStyles.join(' and ')} learning, we've created a personalized approach to help you master ${topic}.`,
      suggestedStartingPoints: [
        `What is ${topic}?`,
        `${topic} basics and fundamentals`,
        `Key concepts in ${topic}`,
        `${topic} applications and examples`
      ],
      estimatedDuration: '2-4 weeks depending on your pace'
    };
  }
}

export const assessmentContentGenerator = new AssessmentContentGenerator();
```

### 3.2 Streaming Content Generator

**File: `app/src/learning/content/streamingGenerator.ts`**

```typescript
import OpenAI from 'openai';
import { AssessmentResult } from '../components/ui/KnowledgeAssessment';
import { LearningPath } from '../components/ui/StartingPointRecommendation';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface StreamingContentOptions {
  topic: string;
  assessment: AssessmentResult;
  selectedPath: LearningPath;
  currentSection?: string;
  userProgress?: number;
}

export class StreamingContentGenerator {
  async *generateStreamingContent(options: StreamingContentOptions): AsyncGenerator<string, void, unknown> {
    const { topic, assessment, selectedPath } = options;

    try {
      const prompt = this.createStreamingPrompt(options);

      const stream = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('Streaming content generation failed:', error);
      yield* this.getFallbackStreamingContent(options);
    }
  }

  private createStreamingPrompt(options: StreamingContentOptions): string {
    const { topic, assessment, selectedPath } = options;
    const knowledgeLevel = assessment.knowledgeLevel <= 2 ? 'beginner' :
                          assessment.knowledgeLevel <= 3 ? 'intermediate' : 'advanced';

    return `
Create engaging, interactive learning content about "${topic}" for a ${knowledgeLevel} learner.

Learning Context:
- Selected Path: ${selectedPath.title}
- Learning Styles: ${assessment.learningStyles.join(', ')}
- Approach: ${selectedPath.approach}
- Difficulty: ${selectedPath.difficulty}

Content Requirements:
1. Start with a compelling introduction
2. Break content into digestible sections with clear headers
3. Include interactive elements like "🤔 Think about this..." or "💡 Key insight:"
4. Add practical examples relevant to their level
5. Include clickable concept expansions marked with [EXPAND: concept name]
6. End each section with a progress check or reflection question

Make it conversational, engaging, and tailored to their learning preferences.
Write in markdown format with clear section headers.
`;
  }

  private async *getFallbackStreamingContent(options: StreamingContentOptions): AsyncGenerator<string, void, unknown> {
    const { topic, selectedPath } = options;

    const fallbackContent = `
# Welcome to Your ${topic} Learning Journey

Let's start your personalized exploration of **${topic}** using the ${selectedPath.title} approach.

## 🎯 What You'll Learn

By following this path, you'll gain a solid understanding of:

- Core concepts and principles
- Practical applications
- Real-world examples
- Best practices and common pitfalls

## 📚 Getting Started

${topic} is a fascinating subject that touches many aspects of our daily lives...

[EXPAND: ${topic} fundamentals]

Let's dive deeper into the key concepts...
`;

    // Simulate streaming by yielding chunks
    const chunks = fallbackContent.split(' ');
    for (const chunk of chunks) {
      yield chunk + ' ';
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

export const streamingContentGenerator = new StreamingContentGenerator();
```

## 4. API Endpoints Implementation

### 4.1 Content Generation API

**File: `app/src/learning/api/generateContent.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { assessmentContentGenerator } from '../content/assessmentGenerator';
import { streamingContentGenerator } from '../content/streamingGenerator';

export async function generateContentHandler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { type, topic, assessment, selectedPath } = await req.json();

    switch (type) {
      case 'assessment':
        const assessmentContent = await assessmentContentGenerator.generatePersonalizedContent(
          topic,
          assessment
        );
        return NextResponse.json(assessmentContent);

      case 'streaming':
        // Set up Server-Sent Events for streaming
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              const generator = streamingContentGenerator.generateStreamingContent({
                topic,
                assessment,
                selectedPath
              });

              for await (const chunk of generator) {
                const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }

              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });

      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Content generation API error:', error);
    return NextResponse.json(
      { error: 'Content generation failed' },
      { status: 500 }
    );
  }
}
```

### 4.2 Research Trigger API

**File: `app/src/learning/api/triggerResearch.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getResearchManager } from '../research/integration';

export async function triggerResearchHandler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { topicId, userContext } = await req.json();

    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID required' }, { status: 400 });
    }

    // Mock context for API call - in real implementation, get from auth
    const mockContext = {
      user: { id: 'user-id' },
      entities: {
        Topic: {
          findUnique: async () => ({ id: topicId, title: 'Topic', status: 'PENDING' }),
          update: async () => ({ id: topicId })
        },
        VectorDocument: {
          create: async () => ({ id: 'doc-id' })
        }
      }
    };

    const researchManager = getResearchManager();
    await researchManager.startTopicResearch(topicId, mockContext, userContext);

    return NextResponse.json({ success: true, message: 'Research started' });
  } catch (error) {
    console.error('Research trigger API error:', error);
    return NextResponse.json(
      { error: 'Failed to start research' },
      { status: 500 }
    );
  }
}
```

## 5. Environment Configuration

### 5.1 Required Environment Variables

**File: `app/.env.server.example` (additions)**

```bash
# SearXNG Configuration
SEARXNG_URL=http://localhost:8080
SEARXNG_API_KEY=

# OpenAI Configuration (required for content generation)
OPENAI_API_KEY=sk-...

# Qdrant Configuration (required for vector storage)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Research Pipeline Configuration
RESEARCH_MAX_CONCURRENT=3
RESEARCH_TIMEOUT_MS=30000
RESEARCH_MAX_DEPTH=3
```

### 5.2 Docker Compose for Development

**File: `app/docker-compose.dev.yml`**

```yaml
version: '3.8'
services:
  searxng:
    image: searxng/searxng:latest
    ports:
      - "8080:8080"
    environment:
      - SEARXNG_SECRET=your-secret-key
    volumes:
      - ./searxng-settings.yml:/etc/searxng/settings.yml:ro

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_storage:/qdrant/storage

volumes:
  qdrant_storage:
```

## 6. Integration Points

### 6.1 Topic Creation Auto-Research

**Update: `app/src/learning/operations.ts`**

```typescript
// Add to createTopic operation after topic creation:

// Auto-start research for root topics
if (depth === 0) {
  try {
    const researchManager = getResearchManager();
    // Start research in background (non-blocking)
    researchManager.startTopicResearch(topic.id, context, {
      userLevel: 'intermediate',
      learningStyle: 'mixed'
    }).catch(error => {
      console.error('Auto-research failed:', error);
    });
  } catch (error) {
    console.error('Failed to start auto-research:', error);
  }
}
```

### 6.2 Assessment Content Integration

**Update: `app/src/learning/components/tabs/LearnTab.tsx`**

```typescript
// Add content generation after assessment completion:

const handleAssessmentComplete = async (result: AssessmentResult) => {
  if (!topic || !user) return;

  setIsSaving(true);
  try {
    // Generate personalized content
    const response = await fetch('/api/learning/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'assessment',
        topic: topic.title,
        assessment: result
      })
    });

    const generatedContent = await response.json();

    // Store assessment and generated content
    const preferences = {
      assessment: result,
      generatedContent,
      completedAt: new Date().toISOString(),
      // ... rest of preferences
    };

    await updateTopicProgress({
      topicId: topic.id,
      preferences
    });

    setAssessment(result);
    setCurrentPhase('recommendation');
    refreshTopic();
  } catch (error) {
    console.error('Failed to generate assessment content:', error);
  } finally {
    setIsSaving(false);
  }
};
```

## 7. Testing Strategy

### 7.1 SearXNG Integration Tests

```typescript
// Test SearXNG connectivity and agent searches
describe('SearXNG Integration', () => {
  test('should connect to SearXNG service', async () => {
    const isHealthy = await searxngService.healthCheck();
    expect(isHealthy).toBe(true);
  });

  test('should perform agent-specific searches', async () => {
    const results = await agentSearchService.searchForAgent('general', 'machine learning');
    expect(results).toHaveLength(greaterThan(0));
    expect(results[0]).toHaveProperty('title');
    expect(results[0]).toHaveProperty('url');
  });
});
```

### 7.2 Content Generation Tests

```typescript
// Test content generation pipeline
describe('Content Generation', () => {
  test('should generate assessment content', async () => {
    const mockAssessment = {
      knowledgeLevel: 2,
      learningStyles: ['visual', 'textual'],
      startingPoint: 'basics',
      preferences: {
        difficultyPreference: 'moderate',
        contentDepth: 'detailed',
        pacePreference: 'moderate'
      }
    };

    const content = await assessmentContentGenerator.generatePersonalizedContent(
      'machine learning',
      mockAssessment
    );

    expect(content.learningPaths).toHaveLength(greaterThan(0));
    expect(content.personalizedContent).toBeTruthy();
  });
});
```

## 8. Deployment Checklist

### 8.1 Production Requirements

1. **SearXNG Instance**: Deploy SearXNG with proper configuration
2. **Qdrant Database**: Set up managed Qdrant or self-hosted instance
3. **OpenAI API**: Configure API key with sufficient quota
4. **Environment Variables**: Set all required environment variables
5. **Health Checks**: Implement health checks for all external services
6. **Monitoring**: Set up monitoring for research pipeline and content generation
7. **Rate Limiting**: Implement rate limiting for API endpoints
8. **Caching**: Configure Redis for caching search results and generated content

### 8.2 Performance Optimization

1. **Search Result Caching**: Cache SearXNG results for common queries
2. **Content Generation Caching**: Cache generated content for reuse
3. **Vector Database Optimization**: Optimize Qdrant collections and indexing
4. **Streaming Optimization**: Implement efficient streaming for real-time content
5. **Background Processing**: Use job queues for research pipeline
6. **CDN Integration**: Use CDN for static assets and cached content

This implementation spec provides the complete foundation for connecting your existing infrastructure with real SearXNG integration and content generation capabilities.
