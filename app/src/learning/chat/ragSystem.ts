import OpenAI from 'openai';
import { extractRAGContext, searchTopicContent } from '../research/vectorOperations';
import type { SearchResult } from '../research/vectorStore';

// OpenAI client for chat completions
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ConversationContext {
  topicId: string;
  topicTitle: string;
  userKnowledgeLevel?: 'beginner' | 'intermediate' | 'advanced';
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  conversationHistory: ConversationMessage[];
  maxContextTokens?: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    sources?: SearchResult[];
    confidence?: number;
    relevantContent?: string[];
  };
}

export interface RAGResponse {
  content: string;
  sources: SearchResult[];
  confidence: number;
  suggestedQuestions: string[];
  metadata: {
    contextTokens: number;
    responseTokens: number;
    retrievedDocuments: number;
    processingTime: number;
  };
}

export interface PromptTemplate {
  systemPrompt: string;
  userPrompt: string;
  contextPrompt: string;
}

export class RAGSystem {
  private defaultMaxTokens: number = 4000;
  private defaultTemperature: number = 0.7;
  private maxResponseTokens: number = 1000;

  constructor(
    private maxTokens: number = 4000,
    private temperature: number = 0.7
  ) {
    this.defaultMaxTokens = maxTokens;
    this.defaultTemperature = temperature;
  }

  /**
   * Generate a contextual response using RAG
   */
  async generateResponse(
    query: string,
    context: ConversationContext
  ): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Retrieve relevant context from vector database
      const ragContext = await extractRAGContext(query, context.topicId, {
        maxTokens: Math.floor(this.defaultMaxTokens * 0.6), // 60% for context
        includeMetadata: true
      });

      // Step 2: Build conversation history context
      const conversationContext = this.buildConversationContext(
        context.conversationHistory,
        Math.floor(this.defaultMaxTokens * 0.2) // 20% for conversation history
      );

      // Step 3: Create prompt template based on user preferences
      const promptTemplate = this.createPromptTemplate(context);

      // Step 4: Generate AI response
      const aiResponse = await this.generateAIResponse(
        query,
        ragContext.context,
        conversationContext,
        promptTemplate,
        context
      );

      // Step 5: Generate suggested follow-up questions
      const suggestedQuestions = await this.generateSuggestedQuestions(
        query,
        aiResponse,
        context
      );

      // Step 6: Calculate confidence score
      const confidence = this.calculateConfidence(
        ragContext.sources,
        ragContext.totalTokens,
        aiResponse.length
      );

      const processingTime = Date.now() - startTime;

      return {
        content: aiResponse,
        sources: ragContext.sources,
        confidence,
        suggestedQuestions,
        metadata: {
          contextTokens: ragContext.totalTokens + conversationContext.tokens,
          responseTokens: Math.ceil(aiResponse.length / 4), // Rough token estimation
          retrievedDocuments: ragContext.sources.length,
          processingTime
        }
      };

    } catch (error) {
      console.error('RAG response generation failed:', error);
      throw new Error(`Failed to generate RAG response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build conversation history context with token limits
   */
  private buildConversationContext(
    history: ConversationMessage[],
    maxTokens: number
  ): { context: string; tokens: number } {
    if (history.length === 0) {
      return { context: '', tokens: 0 };
    }

    // Take recent messages first, respecting token limit
    let context = '';
    let tokens = 0;
    
    // Reverse to get most recent messages first
    const recentHistory = [...history].reverse();
    
    for (const message of recentHistory) {
      const messageText = `${message.role}: ${message.content}\n`;
      const messageTokens = Math.ceil(messageText.length / 4);
      
      if (tokens + messageTokens > maxTokens) {
        break;
      }
      
      context = messageText + context; // Prepend to maintain chronological order
      tokens += messageTokens;
    }

    return { context: context.trim(), tokens };
  }

  /**
   * Create prompt template based on user context and preferences
   */
  private createPromptTemplate(context: ConversationContext): PromptTemplate {
    const knowledgeLevel = context.userKnowledgeLevel || 'intermediate';
    const learningStyle = context.learningStyle || 'reading';

    const systemPrompt = `You are an expert learning assistant helping a user understand "${context.topicTitle}". 

User Profile:
- Knowledge Level: ${knowledgeLevel}
- Learning Style: ${learningStyle}

Instructions:
- Provide clear, accurate, and helpful explanations
- Adapt your language complexity to the user's knowledge level
- ${this.getLearningStyleInstructions(learningStyle)}
- Use the provided context to give specific, relevant answers
- If the context doesn't contain enough information, acknowledge this limitation
- Always cite sources when referencing specific information
- Encourage further learning with thoughtful follow-up suggestions

Remember: Your goal is to facilitate understanding and learning, not just provide information.`;

    const contextPrompt = `Based on the following relevant content about "${context.topicTitle}", please answer the user's question:

RELEVANT CONTENT:
{context}

CONVERSATION HISTORY:
{conversation_history}`;

    const userPrompt = `USER QUESTION: {query}

Please provide a comprehensive answer that:
1. Directly addresses the user's question
2. Uses the relevant content provided above
3. Is appropriate for a ${knowledgeLevel} level learner
4. Includes specific examples when helpful
5. Cites sources from the provided content`;

    return {
      systemPrompt,
      contextPrompt,
      userPrompt
    };
  }

  /**
   * Get learning style specific instructions
   */
  private getLearningStyleInstructions(style: string): string {
    switch (style) {
      case 'visual':
        return 'Use visual metaphors, describe diagrams, and suggest visual aids when possible';
      case 'auditory':
        return 'Use conversational tone, include mnemonics, and suggest discussion points';
      case 'kinesthetic':
        return 'Include hands-on examples, practical applications, and interactive elements';
      case 'reading':
      default:
        return 'Provide detailed written explanations with clear structure and bullet points';
    }
  }

  /**
   * Generate AI response using OpenAI
   */
  private async generateAIResponse(
    query: string,
    ragContext: string,
    conversationContext: { context: string; tokens: number },
    promptTemplate: PromptTemplate,
    context: ConversationContext
  ): Promise<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: promptTemplate.systemPrompt
      }
    ];

    // Add context if available
    if (ragContext || conversationContext.context) {
      const contextContent = promptTemplate.contextPrompt
        .replace('{context}', ragContext || 'No specific content available.')
        .replace('{conversation_history}', conversationContext.context || 'No previous conversation.');
      
      messages.push({
        role: 'system',
        content: contextContent
      });
    }

    // Add user query
    messages.push({
      role: 'user',
      content: promptTemplate.userPrompt.replace('{query}', query)
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: this.maxResponseTokens,
      temperature: this.defaultTemperature,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    return response.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';
  }

  /**
   * Generate suggested follow-up questions
   */
  private async generateSuggestedQuestions(
    originalQuery: string,
    response: string,
    context: ConversationContext
  ): Promise<string[]> {
    try {
      const prompt = `Based on this learning conversation about "${context.topicTitle}":

Original Question: ${originalQuery}
Response: ${response.substring(0, 500)}...

Generate 3 thoughtful follow-up questions that would help the user deepen their understanding. The questions should:
1. Build on the current topic naturally
2. Be appropriate for a ${context.userKnowledgeLevel || 'intermediate'} level learner
3. Encourage exploration of related concepts
4. Be specific and actionable

Format as a simple numbered list:
1. [Question 1]
2. [Question 2]
3. [Question 3]`;

      const suggestionsResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.8
      });

      const suggestionsText = suggestionsResponse.choices[0]?.message?.content || '';
      
      // Parse numbered list
      const questions = suggestionsText
        .split('\n')
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(q => q.length > 0)
        .slice(0, 3);

      return questions.length > 0 ? questions : [
        'Can you explain this concept in more detail?',
        'What are some practical applications of this?',
        'How does this relate to other topics we\'ve discussed?'
      ];

    } catch (error) {
      console.error('Failed to generate suggested questions:', error);
      return [
        'Can you explain this concept in more detail?',
        'What are some practical applications of this?',
        'How does this relate to other topics we\'ve discussed?'
      ];
    }
  }

  /**
   * Calculate confidence score based on available context and sources
   */
  private calculateConfidence(
    sources: SearchResult[],
    contextTokens: number,
    responseLength: number
  ): number {
    // Base confidence on source quality and quantity
    let confidence = 0;

    // Source quantity factor (0-0.4)
    const sourceCount = Math.min(sources.length, 10);
    confidence += (sourceCount / 10) * 0.4;

    // Source quality factor (0-0.3)
    if (sources.length > 0) {
      const avgScore = sources.reduce((sum, s) => sum + s.score, 0) / sources.length;
      confidence += avgScore * 0.3;
    }

    // Context richness factor (0-0.2)
    const contextRichness = Math.min(contextTokens / 1000, 1);
    confidence += contextRichness * 0.2;

    // Response completeness factor (0-0.1)
    const responseCompleteness = Math.min(responseLength / 500, 1);
    confidence += responseCompleteness * 0.1;

    return Math.round(confidence * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Search for relevant content with query expansion
   */
  async searchRelevantContent(
    query: string,
    topicId: string,
    options: {
      limit?: number;
      includeRelated?: boolean;
      contentTypes?: Array<'summary' | 'subtopic' | 'research' | 'generated'>;
    } = {}
  ): Promise<SearchResult[]> {
    const { limit = 10, includeRelated = true, contentTypes } = options;

    try {
      // Primary search
      const primaryResults = await searchTopicContent(query, topicId, {
        limit: Math.ceil(limit * 0.7),
        scoreThreshold: 0.6,
        contentTypes
      });

      // If we want related content and don't have enough results, expand search
      if (includeRelated && primaryResults.length < limit) {
        const expandedQuery = await this.expandQuery(query);
        const expandedResults = await searchTopicContent(expandedQuery, topicId, {
          limit: limit - primaryResults.length,
          scoreThreshold: 0.5,
          contentTypes
        });

        // Combine and deduplicate
        const allResults = [...primaryResults];
        for (const result of expandedResults) {
          if (!allResults.some(r => r.id === result.id)) {
            allResults.push(result);
          }
        }

        return allResults.slice(0, limit);
      }

      return primaryResults;

    } catch (error) {
      console.error('Failed to search relevant content:', error);
      return [];
    }
  }

  /**
   * Expand query with related terms for better retrieval
   */
  private async expandQuery(originalQuery: string): Promise<string> {
    try {
      const prompt = `Given this search query: "${originalQuery}"

Generate 2-3 related search terms or synonyms that would help find relevant educational content. Focus on:
- Alternative terminology for the same concepts
- Broader or narrower terms that are closely related
- Common variations or technical terms

Return only the expanded terms separated by spaces, without explanations:`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
        temperature: 0.3
      });

      const expandedTerms = response.choices[0]?.message?.content?.trim() || '';
      return `${originalQuery} ${expandedTerms}`.trim();

    } catch (error) {
      console.error('Failed to expand query:', error);
      return originalQuery;
    }
  }

  /**
   * Optimize conversation context by summarizing older messages
   */
  async optimizeConversationHistory(
    history: ConversationMessage[],
    maxMessages: number = 10
  ): Promise<ConversationMessage[]> {
    if (history.length <= maxMessages) {
      return history;
    }

    try {
      // Keep recent messages as-is
      const recentMessages = history.slice(-maxMessages);
      const olderMessages = history.slice(0, -maxMessages);

      if (olderMessages.length === 0) {
        return recentMessages;
      }

      // Summarize older conversation
      const conversationText = olderMessages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const summaryPrompt = `Summarize this conversation history in 2-3 sentences, focusing on key topics discussed and important context that would be relevant for future questions:

${conversationText}

Summary:`;

      const summaryResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: summaryPrompt }],
        max_tokens: 150,
        temperature: 0.3
      });

      const summary = summaryResponse.choices[0]?.message?.content || 'Previous conversation covered various topics.';

      // Create summary message
      const summaryMessage: ConversationMessage = {
        role: 'system',
        content: `[Conversation Summary] ${summary}`,
        timestamp: olderMessages[0].timestamp,
        metadata: {
          confidence: 0.8
        }
      };

      return [summaryMessage, ...recentMessages];

    } catch (error) {
      console.error('Failed to optimize conversation history:', error);
      // Fallback: just return recent messages
      return history.slice(-maxMessages);
    }
  }
}

// Export singleton instance
export const ragSystem = new RAGSystem();