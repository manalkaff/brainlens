import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { Request, Response } from "express";
import type { Topic } from "wasp/entities";
import {
  aiContentGenerator,
  type ContentGenerationOptions,
  type ResearchResult,
} from "./contentGenerator";

// Streaming status interface
export interface StreamingStatus {
  phase:
    | "initializing"
    | "researching"
    | "generating"
    | "streaming"
    | "completed"
    | "error";
  progress: number; // 0-100
  message: string;
  currentSection?: string;
  estimatedCompletion?: Date;
  error?: string;
}

// Content streaming options
export interface ContentStreamingOptions extends ContentGenerationOptions {
  includeProgress?: boolean;
  chunkSize?: number;
  delayBetweenChunks?: number;
}

// Stream connection manager
class StreamConnectionManager {
  private connections = new Map<string, Response>();
  private streamStatus = new Map<string, StreamingStatus>();

  createStream(streamId: string, res: Response): void {
    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    // Send initial connection event
    this.sendEvent(res, "connected", {
      streamId,
      timestamp: new Date().toISOString(),
    });

    // Store connection
    this.connections.set(streamId, res);
    this.streamStatus.set(streamId, {
      phase: "initializing",
      progress: 0,
      message: "Initializing content generation...",
    });

    // Handle client disconnect
    res.on("close", () => {
      this.connections.delete(streamId);
      this.streamStatus.delete(streamId);
    });
  }

  sendEvent(res: Response, event: string, data: any): void {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  sendToStream(streamId: string, event: string, data: any): boolean {
    const res = this.connections.get(streamId);
    if (res) {
      this.sendEvent(res, event, data);
      return true;
    }
    return false;
  }

  updateStatus(streamId: string, status: Partial<StreamingStatus>): void {
    const currentStatus = this.streamStatus.get(streamId);
    if (currentStatus) {
      const updatedStatus = { ...currentStatus, ...status };
      this.streamStatus.set(streamId, updatedStatus);
      this.sendToStream(streamId, "status", updatedStatus);
    }
  }

  closeStream(streamId: string): void {
    const res = this.connections.get(streamId);
    if (res) {
      this.sendEvent(res, "close", {
        streamId,
        timestamp: new Date().toISOString(),
      });
      res.end();
      this.connections.delete(streamId);
      this.streamStatus.delete(streamId);
    }
  }

  getStatus(streamId: string): StreamingStatus | undefined {
    return this.streamStatus.get(streamId);
  }

  isStreamActive(streamId: string): boolean {
    return this.connections.has(streamId);
  }
}

/**
 * Streaming Content Service
 * Handles real-time content delivery with progress tracking
 */
export class StreamingContentService {
  private connectionManager = new StreamConnectionManager();
  private model = openai("gpt-5-mini");

  /**
   * Create a new streaming connection
   */
  createStream(req: Request, res: Response): string {
    const streamId = this.generateStreamId();
    this.connectionManager.createStream(streamId, res);
    return streamId;
  }

  /**
   * Stream learning content generation with progress updates
   */
  async streamLearningContent(
    streamId: string,
    topic: Topic,
    researchResults: ResearchResult[],
    options: ContentStreamingOptions,
  ): Promise<void> {
    try {
      if (!this.connectionManager.isStreamActive(streamId)) {
        throw new Error("Stream connection not found");
      }

      // Update status to researching
      this.connectionManager.updateStatus(streamId, {
        phase: "researching",
        progress: 10,
        message: "Analyzing research results...",
      });

      // Simulate research processing delay
      await this.delay(1000);

      // Update status to generating
      this.connectionManager.updateStatus(streamId, {
        phase: "generating",
        progress: 25,
        message: "Generating content structure...",
      });

      // Build prompt for content generation
      const prompt = this.buildStreamingPrompt(topic, researchResults, options);

      // Update status to streaming
      this.connectionManager.updateStatus(streamId, {
        phase: "streaming",
        progress: 30,
        message: "Streaming content...",
        estimatedCompletion: new Date(Date.now() + 60000), // 1 minute estimate
      });

      // Stream content generation
      const result = await streamText({
        model: this.model,
        prompt,
        temperature: options.temperature || 0.7,
      });

      let accumulatedContent = "";
      let progress = 30;
      const progressIncrement = 65 / 100; // Remaining 65% for streaming

      for await (const chunk of result.textStream) {
        if (!this.connectionManager.isStreamActive(streamId)) {
          break; // Client disconnected
        }

        accumulatedContent += chunk;
        progress = Math.min(95, progress + progressIncrement);

        // Send content chunk
        this.connectionManager.sendToStream(streamId, "content", {
          chunk,
          accumulatedContent:
            accumulatedContent.length > 1000
              ? accumulatedContent.slice(-1000) + "..."
              : accumulatedContent,
          progress: Math.round(progress),
        });

        // Update status periodically
        if (Math.random() < 0.1) {
          // 10% chance to update status
          this.connectionManager.updateStatus(streamId, {
            progress: Math.round(progress),
            message: "Generating content...",
            currentSection: this.extractCurrentSection(accumulatedContent),
          });
        }

        // Add delay between chunks if specified
        if (options.delayBetweenChunks) {
          await this.delay(options.delayBetweenChunks);
        }
      }

      // Final status update
      this.connectionManager.updateStatus(streamId, {
        phase: "completed",
        progress: 100,
        message: "Content generation completed successfully!",
      });

      // Send completion event with final content
      this.connectionManager.sendToStream(streamId, "completed", {
        content: accumulatedContent,
        metadata: {
          tokensUsed: 0, // Usage info not available in this version
          generatedAt: new Date().toISOString(),
          contentType: options.contentType,
          userLevel: options.userLevel,
          learningStyle: options.learningStyle,
        },
      });

      // Close stream after a short delay
      setTimeout(() => {
        this.connectionManager.closeStream(streamId);
      }, 2000);
    } catch (error) {
      console.error("Streaming content generation error:", error);

      this.connectionManager.updateStatus(streamId, {
        phase: "error",
        progress: 0,
        message: "Content generation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      this.connectionManager.sendToStream(streamId, "error", {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });

      // Close stream on error
      setTimeout(() => {
        this.connectionManager.closeStream(streamId);
      }, 1000);
    }
  }

  /**
   * Stream research progress updates
   */
  async streamResearchProgress(
    streamId: string,
    topicId: string,
    agentNames: string[],
  ): Promise<void> {
    try {
      if (!this.connectionManager.isStreamActive(streamId)) {
        throw new Error("Stream connection not found");
      }

      const totalAgents = agentNames.length;
      let completedAgents = 0;

      // Send initial research status
      this.connectionManager.updateStatus(streamId, {
        phase: "researching",
        progress: 0,
        message: "Starting multi-agent research...",
      });

      // Simulate agent progress
      for (const agentName of agentNames) {
        if (!this.connectionManager.isStreamActive(streamId)) {
          break;
        }

        // Agent starting
        this.connectionManager.sendToStream(streamId, "agent_status", {
          agent: agentName,
          status: "starting",
          message: `${agentName} agent starting research...`,
        });

        await this.delay(500);

        // Agent working
        this.connectionManager.sendToStream(streamId, "agent_status", {
          agent: agentName,
          status: "working",
          message: `${agentName} agent searching for information...`,
        });

        // Simulate work time
        await this.delay(2000 + Math.random() * 3000);

        // Agent completed
        completedAgents++;
        const progress = Math.round((completedAgents / totalAgents) * 80); // 80% for research

        this.connectionManager.sendToStream(streamId, "agent_status", {
          agent: agentName,
          status: "completed",
          message: `${agentName} agent completed research`,
        });

        this.connectionManager.updateStatus(streamId, {
          progress,
          message: `Research progress: ${completedAgents}/${totalAgents} agents completed`,
        });
      }

      // Research aggregation phase
      this.connectionManager.updateStatus(streamId, {
        phase: "generating",
        progress: 85,
        message: "Aggregating research results...",
      });

      await this.delay(2000);

      // Research completed
      this.connectionManager.updateStatus(streamId, {
        phase: "completed",
        progress: 100,
        message: "Research completed successfully!",
      });

      this.connectionManager.sendToStream(streamId, "research_completed", {
        topicId,
        completedAgents: agentNames,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Streaming research progress error:", error);

      this.connectionManager.updateStatus(streamId, {
        phase: "error",
        progress: 0,
        message: "Research failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Stream assessment content generation
   */
  async streamAssessmentContent(
    streamId: string,
    topic: Topic,
    userPreferences: any,
    options: ContentStreamingOptions,
  ): Promise<void> {
    try {
      if (!this.connectionManager.isStreamActive(streamId)) {
        throw new Error("Stream connection not found");
      }

      // Update status
      this.connectionManager.updateStatus(streamId, {
        phase: "generating",
        progress: 20,
        message: "Analyzing your learning preferences...",
      });

      await this.delay(1000);

      // Generate learning path using the content generator
      const learningPath = await aiContentGenerator.generateAssessmentContent(
        topic,
        userPreferences,
      );

      // Stream the generated content
      const content = learningPath.content.content;
      const chunks = this.chunkContent(content, options.chunkSize || 50);

      let progress = 30;
      const progressIncrement = 65 / chunks.length;

      for (const chunk of chunks) {
        if (!this.connectionManager.isStreamActive(streamId)) {
          break;
        }

        progress += progressIncrement;

        this.connectionManager.sendToStream(streamId, "content", {
          chunk,
          progress: Math.round(progress),
        });

        this.connectionManager.updateStatus(streamId, {
          phase: "streaming",
          progress: Math.round(progress),
          message: "Generating personalized learning path...",
        });

        await this.delay(options.delayBetweenChunks || 100);
      }

      // Send learning path metadata
      this.connectionManager.sendToStream(streamId, "learning_path", {
        startingPoint: learningPath.startingPoint,
        recommendedPath: learningPath.recommendedPath,
        estimatedDuration: learningPath.estimatedDuration,
      });

      // Complete
      this.connectionManager.updateStatus(streamId, {
        phase: "completed",
        progress: 100,
        message: "Personalized learning path generated!",
      });
    } catch (error) {
      console.error("Streaming assessment content error:", error);

      this.connectionManager.updateStatus(streamId, {
        phase: "error",
        progress: 0,
        message: "Assessment content generation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get current stream status
   */
  getStreamStatus(streamId: string): StreamingStatus | undefined {
    return this.connectionManager.getStatus(streamId);
  }

  /**
   * Close a stream connection
   */
  closeStream(streamId: string): void {
    this.connectionManager.closeStream(streamId);
  }

  /**
   * Check if stream is active
   */
  isStreamActive(streamId: string): boolean {
    return this.connectionManager.isStreamActive(streamId);
  }

  // Private helper methods

  private generateStreamId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private buildStreamingPrompt(
    topic: Topic,
    researchResults: ResearchResult[],
    options: ContentStreamingOptions,
  ): string {
    const researchContext = researchResults
      .slice(0, 8) // Limit for streaming
      .map((result) => `${result.title}: ${result.content.slice(0, 300)}...`)
      .join("\n\n");

    return `Create comprehensive ${options.contentType} content about "${topic.title}" for a ${options.userLevel} learner with ${options.learningStyle} learning style.

Research Context:
${researchContext}

Generate well-structured, engaging content with clear sections and practical examples. Focus on progressive learning and real-world applications.`;
  }

  private extractCurrentSection(content: string): string {
    const lines = content.split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.match(/^#+\s+(.+)$/)) {
        return line.replace(/^#+\s+/, "");
      }
    }
    return "Introduction";
  }

  private chunkContent(content: string, chunkSize: number): string[] {
    const words = content.split(" ");
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(" "));
    }

    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const streamingContentService = new StreamingContentService();

// Express handler for creating streaming connections
export async function createStreamHandler(
  req: Request,
  res: Response,
  context: any,
) {
  try {
    const streamId = streamingContentService.createStream(req, res);
    console.log(`Created streaming connection: ${streamId}`);
  } catch (error) {
    console.error("Failed to create stream:", error);
    res.status(500).json({ error: "Failed to create streaming connection" });
  }
}

// Express handler for streaming content
export async function streamContentHandler(
  req: Request,
  res: Response,
  context: any,
) {
  try {
    const { streamId, topic, researchResults, options } = req.body;

    if (!streamId || !topic) {
      return res.status(400).json({ error: "streamId and topic are required" });
    }

    if (!streamingContentService.isStreamActive(streamId)) {
      return res.status(404).json({ error: "Stream not found or inactive" });
    }

    // Start streaming content generation (non-blocking)
    streamingContentService
      .streamLearningContent(
        streamId,
        topic,
        researchResults || [],
        options || {},
      )
      .catch((error) => {
        console.error("Streaming content error:", error);
      });

    res.json({ success: true, message: "Content streaming started" });
  } catch (error) {
    console.error("Stream content handler error:", error);
    res.status(500).json({ error: "Failed to start content streaming" });
  }
}
