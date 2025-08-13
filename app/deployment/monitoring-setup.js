// Production Monitoring and Logging Setup
// This file contains monitoring configuration for the learning platform

import { createLogger, format, transports } from 'winston';
import * as Sentry from '@sentry/node';

// Initialize Sentry for error tracking
export function initializeSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'production',
      tracesSampleRate: 0.1, // Adjust based on traffic
      profilesSampleRate: 0.1,
      beforeSend(event) {
        // Filter out sensitive information
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        return event;
      },
      integrations: [
        // Add custom integrations for learning platform
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: true }),
      ],
    });
  }
}

// Configure Winston logger for structured logging
export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        service: 'learning-platform',
        ...meta
      });
    })
  ),
  defaultMeta: {
    service: 'learning-platform',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Console output for development
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    
    // File logging for production
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Custom metrics tracking for learning platform
export class LearningPlatformMetrics {
  constructor() {
    this.metrics = {
      researchRequests: 0,
      researchCompletions: 0,
      researchFailures: 0,
      chatMessages: 0,
      quizGenerations: 0,
      vectorSearches: 0,
      userSessions: 0,
      apiCosts: 0,
    };
    
    this.timers = new Map();
  }

  // Track research pipeline metrics
  trackResearchStart(topicId, userId) {
    this.metrics.researchRequests++;
    this.timers.set(`research_${topicId}`, Date.now());
    
    logger.info('Research started', {
      event: 'research_start',
      topicId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  trackResearchComplete(topicId, userId, agentsUsed, contentGenerated) {
    this.metrics.researchCompletions++;
    const startTime = this.timers.get(`research_${topicId}`);
    const duration = startTime ? Date.now() - startTime : null;
    this.timers.delete(`research_${topicId}`);
    
    logger.info('Research completed', {
      event: 'research_complete',
      topicId,
      userId,
      duration,
      agentsUsed,
      contentGenerated,
      timestamp: new Date().toISOString()
    });
  }

  trackResearchFailure(topicId, userId, error, stage) {
    this.metrics.researchFailures++;
    const startTime = this.timers.get(`research_${topicId}`);
    const duration = startTime ? Date.now() - startTime : null;
    this.timers.delete(`research_${topicId}`);
    
    logger.error('Research failed', {
      event: 'research_failure',
      topicId,
      userId,
      duration,
      error: error.message,
      stage,
      timestamp: new Date().toISOString()
    });
    
    // Send to Sentry for critical failures
    Sentry.captureException(error, {
      tags: {
        component: 'research_pipeline',
        stage,
        topicId
      },
      user: { id: userId }
    });
  }

  // Track vector operations
  trackVectorSearch(query, results, duration) {
    this.metrics.vectorSearches++;
    
    logger.info('Vector search performed', {
      event: 'vector_search',
      queryLength: query.length,
      resultsCount: results,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  // Track AI API usage and costs
  trackAIAPIUsage(provider, model, tokens, estimatedCost) {
    this.metrics.apiCosts += estimatedCost;
    
    logger.info('AI API usage', {
      event: 'ai_api_usage',
      provider,
      model,
      tokens,
      estimatedCost,
      totalCost: this.metrics.apiCosts,
      timestamp: new Date().toISOString()
    });
    
    // Alert if approaching budget limits
    const monthlyBudget = parseFloat(process.env.OPENAI_MONTHLY_BUDGET) || 1000;
    const alertThreshold = parseFloat(process.env.COST_ALERT_THRESHOLD) || 800;
    
    if (this.metrics.apiCosts > alertThreshold) {
      logger.warn('AI API cost threshold exceeded', {
        event: 'cost_alert',
        currentCost: this.metrics.apiCosts,
        threshold: alertThreshold,
        budget: monthlyBudget,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Track user interactions
  trackUserSession(userId, sessionDuration, tabsVisited, actionsPerformed) {
    this.metrics.userSessions++;
    
    logger.info('User session completed', {
      event: 'user_session',
      userId,
      sessionDuration,
      tabsVisited,
      actionsPerformed,
      timestamp: new Date().toISOString()
    });
  }

  // Get current metrics snapshot
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  // Reset metrics (called daily/weekly)
  resetMetrics() {
    const snapshot = this.getMetrics();
    logger.info('Metrics snapshot before reset', {
      event: 'metrics_reset',
      snapshot
    });
    
    this.metrics = {
      researchRequests: 0,
      researchCompletions: 0,
      researchFailures: 0,
      chatMessages: 0,
      quizGenerations: 0,
      vectorSearches: 0,
      userSessions: 0,
      apiCosts: 0,
    };
    
    return snapshot;
  }
}

// Health check endpoints
export const healthChecks = {
  async database() {
    try {
      // Test database connection
      const result = await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', latency: Date.now() };
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return { status: 'unhealthy', error: error.message };
    }
  },

  async vectorDatabase() {
    try {
      // Test Qdrant connection
      const response = await fetch(`${process.env.QDRANT_URL}/health`, {
        headers: process.env.QDRANT_API_KEY ? {
          'api-key': process.env.QDRANT_API_KEY
        } : {}
      });
      
      if (response.ok) {
        return { status: 'healthy', latency: Date.now() };
      } else {
        throw new Error(`Qdrant returned ${response.status}`);
      }
    } catch (error) {
      logger.error('Vector database health check failed', { error: error.message });
      return { status: 'unhealthy', error: error.message };
    }
  },

  async redis() {
    try {
      // Test Redis connection
      const redis = new Redis(process.env.REDIS_URL);
      await redis.ping();
      await redis.disconnect();
      return { status: 'healthy', latency: Date.now() };
    } catch (error) {
      logger.error('Redis health check failed', { error: error.message });
      return { status: 'unhealthy', error: error.message };
    }
  },

  async aiAPIs() {
    try {
      // Test OpenAI API
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return { status: 'healthy', latency: Date.now() };
      } else {
        throw new Error(`OpenAI API returned ${response.status}`);
      }
    } catch (error) {
      logger.error('AI API health check failed', { error: error.message });
      return { status: 'unhealthy', error: error.message };
    }
  }
};

// Performance monitoring middleware
export function performanceMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      event: 'http_request',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    // Alert on slow requests
    if (duration > 5000) {
      logger.warn('Slow request detected', {
        event: 'slow_request',
        method: req.method,
        url: req.url,
        duration,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  next();
}

// Export singleton instance
export const metrics = new LearningPlatformMetrics();