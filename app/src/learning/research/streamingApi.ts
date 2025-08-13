import { HttpError } from 'wasp/server';
import type { MiddlewareConfigFn } from 'wasp/server';
import { streamingManager, StreamingUtils } from './streaming';

// Server-Sent Events API handler for research streaming
export const researchStreamingHandler = async (req: any, res: any, context: any) => {
  try {
    // Validate authentication
    if (!context.user) {
      throw new HttpError(401, 'Authentication required');
    }

    const { topicId } = req.query;
    
    if (!topicId) {
      throw new HttpError(400, 'Topic ID is required');
    }

    // Validate topic exists and user has access
    const topic = await context.entities.Topic.findFirst({
      where: { 
        id: topicId,
        OR: [
          { userProgress: { some: { userId: context.user.id } } },
          // Allow access to public topics or topics created by the user
          { metadata: { path: ['isPublic'], equals: true } }
        ]
      }
    });

    if (!topic) {
      throw new HttpError(404, 'Topic not found or access denied');
    }

    // Set up Server-Sent Events headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Generate unique connection ID
    const connectionId = StreamingUtils.generateConnectionId();
    
    // Add connection to streaming manager
    streamingManager.addConnection(topicId, connectionId, res);

    // Send initial heartbeat
    res.write(`data: ${JSON.stringify({
      type: 'heartbeat',
      topicId,
      timestamp: new Date(),
      data: { connectionId, message: 'Stream connected' }
    })}\n\n`);

    // Handle client disconnect
    req.on('close', () => {
      console.log(`Client disconnected from research stream: ${connectionId}`);
      streamingManager.removeConnection(connectionId);
    });

    req.on('error', (error: Error) => {
      console.error(`Research stream error for ${connectionId}:`, error);
      streamingManager.removeConnection(connectionId);
    });

    // Keep connection alive with periodic heartbeats
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({
          type: 'heartbeat',
          topicId,
          timestamp: new Date(),
          data: { connectionId, message: 'Heartbeat' }
        })}\n\n`);
      } catch (error) {
        console.error(`Heartbeat failed for ${connectionId}:`, error);
        clearInterval(heartbeatInterval);
        streamingManager.removeConnection(connectionId);
      }
    }, 30000); // 30 second heartbeat

    // Clean up on connection close
    req.on('close', () => {
      clearInterval(heartbeatInterval);
    });

  } catch (error) {
    console.error('Research streaming API error:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// Middleware configuration for streaming API
export const streamingApiMiddleware: MiddlewareConfigFn = (middlewareConfig) => {
  // Configure middleware for streaming
  return middlewareConfig;
};

// Enhanced research API with streaming support
export const enhancedResearchHandler = async (req: any, res: any, context: any) => {
  try {
    // Validate authentication
    if (!context.user) {
      throw new HttpError(401, 'Authentication required');
    }

    const { topicId, topic, enableStreaming = true } = req.body;
    
    if (!topicId || !topic) {
      throw new HttpError(400, 'Topic ID and topic are required');
    }

    // Validate topic exists
    const topicEntity = await context.entities.Topic.findUnique({
      where: { id: topicId }
    });

    if (!topicEntity) {
      throw new HttpError(404, 'Topic not found');
    }

    // If streaming is enabled, set up real-time updates
    if (enableStreaming) {
      // Import research pipeline with streaming support
      const { RecursiveResearchSystem } = await import('./pipeline');
      
      const researchSystem = new RecursiveResearchSystem({
        enableRealTimeUpdates: true,
        maxDepth: 3,
        maxSubtopicsPerLevel: 5
      });

      // Set up streaming callbacks
      const onStatusUpdate = (status: any) => {
        streamingManager.broadcastStatusUpdate(status);
      };

      const onDepthComplete = (result: any) => {
        streamingManager.broadcastCompleteUpdate(topicId, {
          result,
          totalDuration: Date.now() - startTime,
          nodesGenerated: result.identifiedSubtopics?.length || 0
        });
      };

      const startTime = Date.now();

      // Start research with streaming
      const researchResult = await researchSystem.startRecursiveResearch(
        topic,
        topicId,
        { userId: context.user.id },
        onStatusUpdate,
        onDepthComplete
      );

      // Send final response
      res.json({
        success: true,
        message: 'Research completed with streaming',
        data: {
          researchResult,
          streamingEnabled: true,
          connectionCount: streamingManager.getConnectionCount(topicId)
        }
      });

    } else {
      // Fallback to non-streaming research
      const { researchTopicHandler } = await import('./api');
      return researchTopicHandler(req, res, context);
    }

  } catch (error) {
    console.error('Enhanced research API error:', error);
    
    // Broadcast error to streaming clients
    if (req.body?.topicId) {
      streamingManager.broadcastErrorUpdate(req.body.topicId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        recoverable: false
      });
    }

    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Streaming status API
export const getStreamingStatusHandler = async (req: any, res: any, context: any) => {
  try {
    if (!context.user) {
      throw new HttpError(401, 'Authentication required');
    }

    const { topicId } = req.query;
    
    if (!topicId) {
      throw new HttpError(400, 'Topic ID is required');
    }

    const connectionCount = streamingManager.getConnectionCount(topicId);
    const activeTopics = streamingManager.getActiveTopics();

    res.json({
      success: true,
      data: {
        topicId,
        connectionCount,
        isActive: connectionCount > 0,
        activeTopics: activeTopics.length,
        lastUpdate: new Date()
      }
    });

  } catch (error) {
    console.error('Streaming status API error:', error);
    
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};