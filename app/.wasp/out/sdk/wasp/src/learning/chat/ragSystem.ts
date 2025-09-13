import OpenAI from "openai";
import {
  extractRAGContext,
  searchTopicContent,
} from "../research/vectorOperations";
import type { SearchResult } from "../research/vectorStore";

// OpenAI client for chat completions
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ConversationContext {
  topicId: string;
  topicTitle: string;
  userKnowledgeLevel?: "beginner" | "intermediate" | "advanced";
  learningStyle?: "visual" | "auditory" | "kinesthetic" | "reading";
  conversationHistory: ConversationMessage[];
  maxContextTokens?: number;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
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
    queryExpansion?: string[];
    intentClassification?: string;
    fallbackUsed?: boolean;
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
    private temperature: number = 0.7,
  ) {
    this.defaultMaxTokens = maxTokens;
    this.defaultTemperature = temperature;
  }

  /**
   * Generate a contextual response using RAG with advanced features
   */
  async generateResponse(
    query: string,
    context: ConversationContext,
  ): Promise<RAGResponse> {
    const startTime = Date.now();
    let fallbackUsed = false;

    try {
      // Step 1: Query preprocessing and intent classification
      const { expandedQuery, intent, queryTerms } = await this.preprocessQuery(
        query,
        context,
      );

      // Step 2: Multi-stage retrieval with query expansion
      let ragContext;
      try {
        ragContext = await this.performEnhancedRetrieval(
          expandedQuery,
          context.topicId,
          {
            maxTokens: Math.floor(this.defaultMaxTokens * 0.6),
            includeMetadata: true,
            intent: intent,
            originalQuery: query,
          },
        );
      } catch (retrievalError) {
        console.warn(
          "Enhanced retrieval failed, falling back to basic retrieval:",
          retrievalError,
        );
        ragContext = await extractRAGContext(query, context.topicId, {
          maxTokens: Math.floor(this.defaultMaxTokens * 0.6),
          includeMetadata: true,
        });
        fallbackUsed = true;
      }

      // Step 3: Build conversation history context with intelligent summarization
      const conversationContext = await this.buildEnhancedConversationContext(
        context.conversationHistory,
        Math.floor(this.defaultMaxTokens * 0.2),
        query,
      );

      // Step 4: Create adaptive prompt template
      const promptTemplate = this.createAdaptivePromptTemplate(
        context,
        intent,
        ragContext.sources,
      );

      // Step 5: Generate AI response with enhanced context
      const aiResponse = await this.generateEnhancedAIResponse(
        query,
        expandedQuery,
        ragContext.context,
        conversationContext,
        promptTemplate,
        context,
        intent,
      );

      // Step 6: Generate intelligent follow-up questions
      const suggestedQuestions =
        await this.generateIntelligentFollowUpQuestions(
          query,
          aiResponse,
          context,
          ragContext.sources,
          intent,
        );

      // Step 7: Calculate enhanced confidence score
      const confidence = this.calculateEnhancedConfidence(
        ragContext.sources,
        ragContext.totalTokens,
        aiResponse.length,
        intent,
        conversationContext.relevance,
      );

      const processingTime = Date.now() - startTime;

      return {
        content: aiResponse,
        sources: ragContext.sources,
        confidence,
        suggestedQuestions,
        metadata: {
          contextTokens: ragContext.totalTokens + conversationContext.tokens,
          responseTokens: Math.ceil(aiResponse.length / 4),
          retrievedDocuments: ragContext.sources.length,
          processingTime,
          queryExpansion: queryTerms,
          intentClassification: intent,
          fallbackUsed,
        },
      };
    } catch (error) {
      console.error("RAG response generation failed:", error);
      return await this.generateFallbackResponse(
        query,
        context,
        Date.now() - startTime,
      );
    }
  }

  /**
   * Build enhanced conversation history context with intelligent summarization
   */
  private async buildEnhancedConversationContext(
    history: ConversationMessage[],
    maxTokens: number,
    currentQuery: string,
  ): Promise<{ context: string; tokens: number; relevance: number }> {
    if (history.length === 0) {
      return { context: "", tokens: 0, relevance: 0 };
    }

    // Step 1: Calculate relevance scores for messages
    const relevantMessages = await this.scoreMessageRelevance(
      history,
      currentQuery,
    );

    // Step 2: Build context prioritizing relevant messages
    let context = "";
    let tokens = 0;
    let totalRelevance = 0;
    let messageCount = 0;

    // Sort by relevance and recency
    const sortedMessages = relevantMessages.sort((a, b) => {
      const relevanceWeight = 0.7;
      const recencyWeight = 0.3;
      const aScore = a.relevance * relevanceWeight + a.recency * recencyWeight;
      const bScore = b.relevance * relevanceWeight + b.recency * recencyWeight;
      return bScore - aScore;
    });

    for (const item of sortedMessages) {
      const messageText = `${item.message.role}: ${item.message.content}\n`;
      const messageTokens = Math.ceil(messageText.length / 4);

      if (tokens + messageTokens > maxTokens) {
        break;
      }

      context += messageText;
      tokens += messageTokens;
      totalRelevance += item.relevance;
      messageCount++;
    }

    const averageRelevance =
      messageCount > 0 ? totalRelevance / messageCount : 0;

    return {
      context: context.trim(),
      tokens,
      relevance: averageRelevance,
    };
  }

  /**
   * Create adaptive prompt template based on context, preferences, and intent
   */
  private createAdaptivePromptTemplate(
    context: ConversationContext,
    intent?: string,
    sources?: SearchResult[],
  ): PromptTemplate {
    const knowledgeLevel = context.userKnowledgeLevel || "intermediate";
    const learningStyle = context.learningStyle || "reading";

    const intentInstructions = this.getIntentSpecificInstructions(intent);
    const sourceQuality = sources ? this.assessSourceQuality(sources) : "mixed";
    const qualityInstructions =
      this.getQualitySpecificInstructions(sourceQuality);

    const systemPrompt = `You are an expert learning assistant helping a user understand "${
      context.topicTitle
    }".

User Profile:
- Knowledge Level: ${knowledgeLevel}
- Learning Style: ${learningStyle}
- Query Intent: ${intent || "general"}

Instructions:
- Provide clear, accurate, and helpful explanations
- Adapt your language complexity to the user's knowledge level
- ${this.getLearningStyleInstructions(learningStyle)}
- ${intentInstructions}
- ${qualityInstructions}
- Use the provided context to give specific, relevant answers
- If the context doesn't contain enough information, acknowledge this limitation
- Always cite sources when referencing specific information
- For code-related questions, provide executable examples when appropriate
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
      userPrompt,
    };
  }

  /**
   * Get learning style specific instructions
   */
  private getLearningStyleInstructions(style: string): string {
    switch (style) {
      case "visual":
        return "Use visual metaphors, describe diagrams, and suggest visual aids when possible";
      case "auditory":
        return "Use conversational tone, include mnemonics, and suggest discussion points";
      case "kinesthetic":
        return "Include hands-on examples, practical applications, and interactive elements";
      case "reading":
      default:
        return "Provide detailed written explanations with clear structure and bullet points";
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
    context: ConversationContext,
  ): Promise<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: promptTemplate.systemPrompt,
      },
    ];

    // Add context if available
    if (ragContext || conversationContext.context) {
      const contextContent = promptTemplate.contextPrompt
        .replace("{context}", ragContext || "No specific content available.")
        .replace(
          "{conversation_history}",
          conversationContext.context || "No previous conversation.",
        );

      messages.push({
        role: "system",
        content: contextContent,
      });
    }

    // Add user query
    messages.push({
      role: "user",
      content: promptTemplate.userPrompt.replace("{query}", query),
    });

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages,
      max_completion_tokens: this.maxResponseTokens,
    });

    return (
      response.choices[0]?.message?.content ||
      "I apologize, but I was unable to generate a response. Please try again."
    );
  }

  /**
   * Generate intelligent follow-up questions based on context and intent
   */
  private async generateIntelligentFollowUpQuestions(
    originalQuery: string,
    response: string,
    context: ConversationContext,
    sources: SearchResult[],
    intent?: string,
  ): Promise<string[]> {
    try {
      const sourceTopics = sources
        .map((s) => s.metadata?.title || "topic")
        .slice(0, 3);
      const intentContext = intent
        ? `The user's intent appears to be: ${intent}`
        : "";

      const prompt = `Based on this learning conversation about "${
        context.topicTitle
      }":

Original Question: ${originalQuery}
Response: ${response.substring(0, 500)}...
${intentContext}
Available source topics: ${sourceTopics.join(", ")}

Generate 3 thoughtful follow-up questions that would help the user deepen their understanding. The questions should:
1. Build on the current topic naturally
2. Be appropriate for a ${
        context.userKnowledgeLevel || "intermediate"
      } level learner
3. Encourage exploration of related concepts from the available sources
4. Be specific and actionable
5. Match the user's learning intent: ${intent || "general understanding"}

Format as a simple numbered list:
1. [Question 1]
2. [Question 2]
3. [Question 3]`;

      const suggestionsResponse = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 200,
      });

      const suggestionsText =
        suggestionsResponse.choices[0]?.message?.content || "";

      // Parse numbered list
      const questions = suggestionsText
        .split("\n")
        .filter((line) => /^\d+\./.test(line.trim()))
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((q) => q.length > 0)
        .slice(0, 3);

      return questions.length > 0
        ? questions
        : [
            "Can you explain this concept in more detail?",
            "What are some practical applications of this?",
            "How does this relate to other topics we've discussed?",
          ];
    } catch (error) {
      console.error("Failed to generate suggested questions:", error);
      return [
        "Can you explain this concept in more detail?",
        "What are some practical applications of this?",
        "How does this relate to other topics we've discussed?",
      ];
    }
  }

  /**
   * Calculate enhanced confidence score with multiple factors
   */
  private calculateEnhancedConfidence(
    sources: SearchResult[],
    contextTokens: number,
    responseLength: number,
    intent?: string,
    conversationRelevance: number = 0,
  ): number {
    let confidence = 0;

    // Source quantity factor (0-0.3)
    const sourceCount = Math.min(sources.length, 10);
    confidence += (sourceCount / 10) * 0.3;

    // Source quality factor (0-0.25)
    if (sources.length > 0) {
      const avgScore =
        sources.reduce((sum, s) => sum + s.score, 0) / sources.length;
      confidence += avgScore * 0.25;
    }

    // Context richness factor (0-0.15)
    const contextRichness = Math.min(contextTokens / 1000, 1);
    confidence += contextRichness * 0.15;

    // Response completeness factor (0-0.1)
    const responseCompleteness = Math.min(responseLength / 500, 1);
    confidence += responseCompleteness * 0.1;

    // Conversation relevance factor (0-0.1)
    confidence += Math.min(conversationRelevance, 1) * 0.1;

    // Intent matching factor (0-0.1)
    const intentBonus =
      intent === "specific" ? 0.1 : intent === "explanation" ? 0.08 : 0.05;
    confidence += intentBonus;

    return Math.round(confidence * 100) / 100;
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
      contentTypes?: Array<"summary" | "subtopic" | "research" | "generated">;
    } = {},
  ): Promise<SearchResult[]> {
    const { limit = 10, includeRelated = true, contentTypes } = options;

    try {
      // Primary search
      const primaryResults = await searchTopicContent(query, topicId, {
        limit: Math.ceil(limit * 0.7),
        scoreThreshold: 0.6,
        contentTypes,
      });

      // If we want related content and don't have enough results, expand search
      if (includeRelated && primaryResults.length < limit) {
        const expandedQuery = await this.expandQuery(query);
        const expandedResults = await searchTopicContent(
          expandedQuery,
          topicId,
          {
            limit: limit - primaryResults.length,
            scoreThreshold: 0.5,
            contentTypes,
          },
        );

        // Combine and deduplicate
        const allResults = [...primaryResults];
        for (const result of expandedResults) {
          if (!allResults.some((r) => r.id === result.id)) {
            allResults.push(result);
          }
        }

        return allResults.slice(0, limit);
      }

      return primaryResults;
    } catch (error) {
      console.error("Failed to search relevant content:", error);
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
        model: "gpt-5-mini",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 50,
      });

      const expandedTerms = response.choices[0]?.message?.content?.trim() || "";
      return `${originalQuery} ${expandedTerms}`.trim();
    } catch (error) {
      console.error("Failed to expand query:", error);
      return originalQuery;
    }
  }

  // ===============================
  // ENHANCED RAG METHODS
  // ===============================

  /**
   * Preprocess query with intent classification and expansion
   */
  private async preprocessQuery(
    query: string,
    context: ConversationContext,
  ): Promise<{
    expandedQuery: string;
    intent: string;
    queryTerms: string[];
  }> {
    try {
      const [expandedQuery, intent] = await Promise.all([
        this.expandQuery(query),
        this.classifyIntent(query, context),
      ]);

      const queryTerms = expandedQuery
        .split(" ")
        .filter((term) => term.length > 2);

      return {
        expandedQuery,
        intent,
        queryTerms,
      };
    } catch (error) {
      console.warn("Query preprocessing failed:", error);
      return {
        expandedQuery: query,
        intent: "general",
        queryTerms: query.split(" "),
      };
    }
  }

  /**
   * Classify user intent for adaptive responses
   */
  private async classifyIntent(
    query: string,
    context: ConversationContext,
  ): Promise<string> {
    try {
      const prompt = `Classify the intent of this question about "${context.topicTitle}":

Question: "${query}"

Choose the most appropriate intent category:
1. "explanation" - User wants concepts explained
2. "specific" - User asks for specific facts or details
3. "comparison" - User wants to compare concepts
4. "example" - User wants practical examples
5. "troubleshooting" - User has a problem to solve
6. "implementation" - User wants to know how to do something
7. "general" - General discussion or unclear intent

Respond with just the category name:`;

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 20,
      });

      const intent =
        response.choices[0]?.message?.content?.trim().toLowerCase() ||
        "general";
      return [
        "explanation",
        "specific",
        "comparison",
        "example",
        "troubleshooting",
        "implementation",
        "general",
      ].includes(intent)
        ? intent
        : "general";
    } catch (error) {
      console.warn("Intent classification failed:", error);
      return "general";
    }
  }

  /**
   * Perform enhanced retrieval with multiple strategies
   */
  private async performEnhancedRetrieval(
    query: string,
    topicId: string,
    options: any,
  ): Promise<any> {
    // Primary retrieval
    const primaryResults = await extractRAGContext(query, topicId, {
      maxTokens: Math.floor(options.maxTokens * 0.7),
      includeMetadata: options.includeMetadata,
    });

    // If low results, try expanded query
    if (primaryResults.sources.length < 3) {
      const expandedResults = await extractRAGContext(
        options.originalQuery,
        topicId,
        {
          maxTokens: Math.floor(options.maxTokens * 0.3),
          includeMetadata: options.includeMetadata,
        },
      );

      // Merge results, avoiding duplicates
      const allSources = [...primaryResults.sources];
      for (const source of expandedResults.sources) {
        if (!allSources.some((existing) => existing.id === source.id)) {
          allSources.push(source);
        }
      }

      return {
        context: primaryResults.context + "\n" + expandedResults.context,
        sources: allSources,
        totalTokens: primaryResults.totalTokens + expandedResults.totalTokens,
      };
    }

    return primaryResults;
  }

  /**
   * Generate enhanced AI response with intent-specific handling
   */
  private async generateEnhancedAIResponse(
    originalQuery: string,
    expandedQuery: string,
    ragContext: string,
    conversationContext: any,
    promptTemplate: PromptTemplate,
    context: ConversationContext,
    intent: string,
  ): Promise<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: promptTemplate.systemPrompt,
      },
    ];

    // Add context with intent-specific framing
    if (ragContext || conversationContext.context) {
      let contextContent = promptTemplate.contextPrompt
        .replace("{context}", ragContext || "No specific content available.")
        .replace(
          "{conversation_history}",
          conversationContext.context || "No previous conversation.",
        );

      // Add intent-specific context framing
      if (intent === "example") {
        contextContent +=
          "\n\nFocus on providing concrete, practical examples.";
      } else if (intent === "implementation") {
        contextContent +=
          "\n\nProvide step-by-step implementation guidance with code examples if applicable.";
      } else if (intent === "comparison") {
        contextContent +=
          "\n\nStructure your response to clearly compare and contrast the relevant concepts.";
      }

      messages.push({
        role: "system",
        content: contextContent,
      });
    }

    // Enhanced user prompt with query expansion info
    let userPrompt = promptTemplate.userPrompt.replace(
      "{query}",
      originalQuery,
    );
    if (expandedQuery !== originalQuery) {
      userPrompt += `\n\nNote: I've expanded your query to include related terms: ${expandedQuery}`;
    }

    messages.push({
      role: "user",
      content: userPrompt,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages,
      max_completion_tokens: this.maxResponseTokens,
    });

    return (
      response.choices[0]?.message?.content ||
      "I apologize, but I was unable to generate a response. Please try again."
    );
  }

  /**
   * Generate fallback response when main RAG fails
   */
  private async generateFallbackResponse(
    query: string,
    context: ConversationContext,
    processingTime: number,
  ): Promise<RAGResponse> {
    return {
      content: `I apologize, but I'm experiencing technical difficulties accessing the relevant information for "${context.topicTitle}". \n\nCould you please try rephrasing your question or asking about a specific aspect you'd like to explore? I'm here to help you learn, even if I need to work with limited context.`,
      sources: [],
      confidence: 0.1,
      suggestedQuestions: [
        `What are the key concepts in ${context.topicTitle}?`,
        "Can you break this down into simpler terms?",
        "What should I know first before diving deeper?",
      ],
      metadata: {
        contextTokens: 0,
        responseTokens: 150,
        retrievedDocuments: 0,
        processingTime,
        fallbackUsed: true,
      },
    };
  }

  /**
   * Score message relevance to current query
   */
  private async scoreMessageRelevance(
    history: ConversationMessage[],
    currentQuery: string,
  ): Promise<
    Array<{ message: ConversationMessage; relevance: number; recency: number }>
  > {
    return history.map((message, index) => {
      // Simple relevance scoring (could be enhanced with embeddings)
      const queryWords = currentQuery.toLowerCase().split(/\W+/);
      const messageWords = message.content.toLowerCase().split(/\W+/);
      const overlap = queryWords.filter((word) =>
        messageWords.includes(word),
      ).length;
      const relevance = overlap / Math.max(queryWords.length, 1);

      // Recency score (more recent = higher score)
      const recency = index / Math.max(history.length - 1, 1);

      return { message, relevance, recency };
    });
  }

  /**
   * Get intent-specific instructions
   */
  private getIntentSpecificInstructions(intent?: string): string {
    switch (intent) {
      case "explanation":
        return "Focus on clear explanations of concepts and principles.";
      case "specific":
        return "Provide precise, factual information with specific details.";
      case "comparison":
        return "Structure your response to clearly compare and contrast concepts.";
      case "example":
        return "Include concrete, practical examples and use cases.";
      case "troubleshooting":
        return "Provide systematic problem-solving approaches and solutions.";
      case "implementation":
        return "Give step-by-step implementation guidance with practical details.";
      default:
        return "Provide comprehensive, well-structured information.";
    }
  }

  /**
   * Assess source quality
   */
  private assessSourceQuality(
    sources: SearchResult[],
  ): "high" | "medium" | "low" | "mixed" {
    if (sources.length === 0) return "low";

    const avgScore =
      sources.reduce((sum, s) => sum + s.score, 0) / sources.length;
    const scoreVariance =
      sources.reduce((sum, s) => sum + Math.pow(s.score - avgScore, 2), 0) /
      sources.length;

    if (avgScore > 0.8) return "high";
    if (avgScore > 0.6) return scoreVariance < 0.1 ? "medium" : "mixed";
    return "low";
  }

  /**
   * Get quality-specific instructions
   */
  private getQualitySpecificInstructions(quality: string): string {
    switch (quality) {
      case "high":
        return "The provided sources are highly relevant and authoritative.";
      case "medium":
        return "The sources provide good coverage, verify key points across multiple sources.";
      case "mixed":
        return "Source quality varies, prioritize information from higher-scoring sources.";
      case "low":
        return "Limited relevant sources available, acknowledge uncertainty where appropriate.";
      default:
        return "Use the available sources judiciously.";
    }
  }

  /**
   * Optimize conversation context by summarizing older messages
   */
  async optimizeConversationHistory(
    history: ConversationMessage[],
    maxMessages: number = 10,
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
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      const summaryPrompt = `Summarize this conversation history in 2-3 sentences, focusing on key topics discussed and important context that would be relevant for future questions:

${conversationText}

Summary:`;

      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [{ role: "user", content: summaryPrompt }],
        max_completion_tokens: 150,
      });

      const summary =
        summaryResponse.choices[0]?.message?.content ||
        "Previous conversation covered various topics.";

      // Create summary message
      const summaryMessage: ConversationMessage = {
        role: "system",
        content: `[Conversation Summary] ${summary}`,
        timestamp: olderMessages[0].timestamp,
        metadata: {
          confidence: 0.8,
        },
      };

      return [summaryMessage, ...recentMessages];
    } catch (error) {
      console.error("Failed to optimize conversation history:", error);
      // Fallback: just return recent messages
      return history.slice(-maxMessages);
    }
  }
}

// Export singleton instance
export const ragSystem = new RAGSystem();

// Export additional interfaces for enhanced functionality
export interface QueryAnalysis {
  expandedQuery: string;
  intent: string;
  queryTerms: string[];
}

export interface EnhancedConversationContext {
  context: string;
  tokens: number;
  relevance: number;
}

export interface ConversationSummary {
  summary: string;
  keyTopics: string[];
  messageCount: number;
  duration: number;
}
