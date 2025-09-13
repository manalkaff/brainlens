// import { getTopic, getUserTopicProgress } from '@src/learning/operations';
/**
 * Simple SSE endpoint for adaptive content streaming
 */
export async function streamAdaptiveContent(req, res) {
    const { userId, topicId, sessionId } = req.params;
    // Set up SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
    });
    try {
        // Send initial connection confirmation
        res.write(`data: ${JSON.stringify({
            type: 'connection',
            sessionId: sessionId || 'demo-session',
            message: 'Adaptive content streaming initialized'
        })}\n\n`);
        // Send demo content
        let chunkCount = 0;
        const maxChunks = 5;
        const interval = setInterval(() => {
            if (chunkCount >= maxChunks) {
                clearInterval(interval);
                res.write(`data: ${JSON.stringify({
                    type: 'complete',
                    message: 'Demo content streaming completed',
                    totalChunks: chunkCount
                })}\n\n`);
                res.end();
                return;
            }
            res.write(`data: ${JSON.stringify({
                type: 'content',
                chunk: {
                    id: `demo-chunk-${chunkCount}`,
                    type: 'explanation',
                    content: `This is demo adaptive content chunk ${chunkCount + 1}. The system would normally analyze your learning patterns and adapt content accordingly.`,
                    metadata: {
                        difficulty: 0.5,
                        estimatedReadTime: 30,
                        concepts: [`concept-${chunkCount}`],
                        adaptationReason: 'Demo content for testing'
                    }
                }
            })}\n\n`);
            chunkCount++;
        }, 2000);
        // Handle client disconnect
        req.on('close', () => {
            clearInterval(interval);
        });
    }
    catch (error) {
        console.error('Error in streaming:', error);
        res.write(`data: ${JSON.stringify({
            type: 'error',
            message: 'Streaming error',
            error: error.message
        })}\n\n`);
        res.end();
    }
}
/**
 * Simple SSE endpoint for learning analytics
 */
export async function streamLearningAnalytics(req, res) {
    const { userId, topicId } = req.params;
    // Set up SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
    });
    try {
        let updateCount = 0;
        const maxUpdates = 3;
        res.write(`data: ${JSON.stringify({
            type: 'analytics_start',
            message: 'Demo analytics streaming started'
        })}\n\n`);
        const analyticsInterval = setInterval(() => {
            if (updateCount >= maxUpdates) {
                clearInterval(analyticsInterval);
                res.write(`data: ${JSON.stringify({
                    type: 'analytics_complete',
                    message: 'Demo analytics completed'
                })}\n\n`);
                res.end();
                return;
            }
            res.write(`data: ${JSON.stringify({
                type: 'analytics_update',
                metrics: {
                    learningVelocity: 0.5 + Math.random() * 0.3,
                    engagementTrend: 'stable',
                    retentionRate: 0.7 + Math.random() * 0.2,
                    sessionTime: 15 + updateCount * 5
                },
                insights: [
                    {
                        type: 'positive_trend',
                        title: 'Demo Insight',
                        description: `Analytics update ${updateCount + 1} - This is simulated learning analytics.`,
                        confidence: 0.8
                    }
                ]
            })}\n\n`);
            updateCount++;
        }, 5000);
        req.on('close', () => {
            clearInterval(analyticsInterval);
        });
    }
    catch (error) {
        console.error('Error in analytics streaming:', error);
        res.write(`data: ${JSON.stringify({
            type: 'error',
            message: 'Analytics streaming error',
            error: error.message
        })}\n\n`);
        res.end();
    }
}
//# sourceMappingURL=streaming.js.map