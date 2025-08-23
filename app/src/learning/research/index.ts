/**
 * BrainLens Research System - Phase 1 Complete Export
 * 
 * This file provides comprehensive exports for all Phase 1 research components.
 * Import from this file to access the complete research system.
 * 
 * Phase 1 Components:
 * ✅ Multi-Agent Search Orchestration (5 specialized agents)
 * ✅ Vector Database Integration (Qdrant + OpenAI embeddings)
 * ✅ Real-time Streaming (Server-Sent Events)
 * ✅ Content Aggregation & Deduplication
 * ✅ Recursive Research Pipeline (3-level depth)
 * ✅ SearXNG Meta Search Engine Integration
 * ✅ Research State Management
 * ✅ Comprehensive Integration Layer
 */

// === CORE RESEARCH PIPELINE ===
export {
  RecursiveResearchSystem,
  MultiAgentCoordinator,
  DEFAULT_RESEARCH_CONFIG,
  type ResearchPipelineConfig,
  type ResearchStatus,
  type AgentCoordinationResult,
  type RecursiveResearchResult,
  type ResearchNode,
  type AggregatedContent
} from './pipeline';

// === MULTI-AGENT SYSTEM ===
export {
  ResearchAgentFactory,
  GeneralResearchAgent,
  AcademicResearchAgent,
  ComputationalAgent,
  VideoLearningAgent,
  CommunityDiscussionAgent,
  type ResearchAgent,
  type ResearchResult,
  type SearchResult
} from './agents';

// === AGENT CONFIGURATIONS ===
export {
  AgentConfigManager,
  AGENT_SEARCH_CONFIGS,
  GENERAL_RESEARCH_CONFIG,
  ACADEMIC_RESEARCH_CONFIG,
  COMPUTATIONAL_RESEARCH_CONFIG,
  VIDEO_LEARNING_CONFIG,
  COMMUNITY_DISCUSSION_CONFIG,
  type AgentSearchConfig,
  type AgentConfigName
} from './searxng/agentConfigs';

// === SEARXNG INTEGRATION ===
export {
  SearxngClient,
  SearxngUtils,
  isSearxngError,
  getSearxngErrorMessage,
  type SearxngSearchOptions,
  type SearxngSearchResult,
  type SearxngResponse,
  type SearxngConfig
} from './searxng';

// === VECTOR DATABASE ===
export {
  QdrantVectorStore,
  VectorStore, // Legacy compatibility
  vectorStore, // Singleton instance
  type VectorStoreConfig,
  type VectorDocument,
  type SearchResult as VectorSearchResult
} from './vectorStore';

// === EMBEDDINGS SERVICE ===
export {
  EmbeddingService,
  embeddingService, // Singleton instance
  type EmbeddingCacheEntry
} from './embeddings';

// === CONTENT AGGREGATION ===
export {
  ContentAggregator,
  defaultContentAggregator, // Singleton instance
  type AggregatedResult,
  type SourceAttribution,
  type QualityMetrics,
  type AggregationConfig,
  type AggregationSummary
} from './aggregation';

// === REAL-TIME STREAMING ===
export {
  streamingManager, // Singleton instance
  StreamingManager,
  StreamingUtils,
  type StreamingResearchUpdate,
  type ResearchProgressUpdate,
  type ResearchContentUpdate,
  type ResearchErrorUpdate,
  type ResearchCompleteUpdate,
  type StreamingConnection
} from './streaming';

// === STREAMING API HANDLERS ===
export {
  researchStreamingHandler,
  enhancedResearchHandler,
  getStreamingStatusHandler,
  streamingApiMiddleware
} from './streamingApi';

// === FRONTEND HOOKS ===
export {
  useResearchStreaming,
  useMultipleResearchStreams,
  type UseResearchStreamingOptions,
  type ResearchStreamingState
} from '../hooks/useResearchStreaming';

// === WASP INTEGRATION ===
export {
  ResearchIntegrationManager,
  getResearchManager,
  startTopicResearch,
  type ResearchIntegrationConfig
} from './integration';

// === API OPERATIONS ===
export {
  researchTopicHandler,
  getResearchStatusHandler,
  cancelResearchHandler,
  getResearchHistoryHandler
} from './api';

// === RESEARCH OPERATIONS ===
export {
  startTopicResearch as startResearch,
  getTopicResearchStatus,
  getResearchStatus,
  cancelTopicResearch as cancelResearch,
  getResearchHistory,
  searchTopicContent,
  generateTopicContent,
  getTopicSubtopics
} from './operations';

// === VALIDATION & UTILITIES ===
export {
  validateResearchInput,
  sanitizeSearchQuery,
  extractTopicKeywords,
  calculateResearchComplexity,
  estimateResearchDuration,
  type ResearchInputValidation,
  type ResearchComplexity
} from '../validation/inputValidation';

// === ERROR HANDLING ===
export {
  ResearchError,
  AgentError,
  VectorStoreError,
  StreamingError,
  handleResearchError,
  createRecoveryStrategy,
  type ErrorRecoveryStrategy,
  type ResearchErrorType
} from './errors/errorHandler';

// === CONFIGURATION ===

/**
 * Default Phase 1 Configuration
 * 
 * Optimized settings for production use with all Phase 1 features enabled.
 */
export const PHASE_1_CONFIG = {
  // Research Pipeline
  research: {
    maxDepth: 3,
    maxSubtopicsPerLevel: 5,
    enableRealTimeUpdates: true,
    agentTimeout: 30000,
    retryAttempts: 2
  },
  
  // Vector Database
  vectorStore: {
    collectionName: 'learning_content',
    vectorSize: 1536, // OpenAI text-embedding-3-small
    distance: 'Cosine' as const
  },
  
  // Content Aggregation
  aggregation: {
    duplicateThreshold: 0.8,
    maxResults: 50,
    minRelevanceScore: 0.3,
    minConfidenceScore: 0.4,
    boostFactors: {
      multipleAgents: 0.2,
      highQualitySources: 0.15,
      recentContent: 0.1,
      uniqueContent: 0.1
    }
  },
  
  // SearXNG Integration
  searxng: {
    timeout: 30000,
    retryAttempts: 3,
    engines: {
      general: [],
      academic: ['arxiv', 'google scholar', 'pubmed'],
      computational: ['wolframalpha'],
      video: ['youtube'],
      community: ['reddit', 'stackoverflow']
    }
  },
  
  // Real-time Streaming
  streaming: {
    heartbeatInterval: 30000,
    maxConnections: 100,
    reconnectDelay: 3000,
    maxReconnectAttempts: 5
  },
  
  // Integration
  integration: {
    enableRealTimeUpdates: true,
    maxConcurrentResearch: 3,
    defaultUserContext: {
      userLevel: 'intermediate' as const,
      learningStyle: 'mixed' as const
    }
  }
} as const;

// === SYSTEM INFORMATION ===

/**
 * Phase 1 System Information
 */
export const PHASE_1_INFO = {
  version: '1.0.0',
  phase: 1,
  completionDate: '2024-12-19',
  features: [
    'Multi-Agent Search Orchestration',
    'Vector Database Integration',
    'Real-time Streaming Updates',
    'Content Aggregation & Deduplication',
    'Recursive Research Pipeline',
    'SearXNG Meta Search Integration',
    'Research State Management',
    'Wasp Framework Integration',
    'Frontend React Hooks',
    'Error Handling & Recovery',
    'Performance Optimization',
    'Comprehensive Testing'
  ],
  agents: [
    'General Research Agent',
    'Academic Research Agent', 
    'Computational Agent',
    'Video Learning Agent',
    'Community Discussion Agent'
  ],
  integrations: [
    'Qdrant Vector Database',
    'OpenAI Embeddings API',
    'SearXNG Meta Search Engine',
    'Redis Caching',
    'PostgreSQL Storage',
    'Server-Sent Events',
    'Wasp OpenSaaS Framework'
  ],
  nextPhases: [
    'Phase 2: Research & Content Pipeline Enhancement',
    'Phase 3: Learning Interface Implementation', 
    'Phase 4: Advanced Features (RAG, MindMap, Export)',
    'Phase 5: Polish & Production Deployment'
  ]
} as const;

// === HEALTH CHECK UTILITIES ===

/**
 * Comprehensive system health check for all Phase 1 components
 */
export async function performSystemHealthCheck(): Promise<{
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    vectorDatabase: boolean;
    embeddingService: boolean;
    searxngEngine: boolean;
    streamingService: boolean;
    agentOrchestration: boolean;
  };
  details: {
    vectorDatabase: any;
    embeddingService: any;
    searxngEngine: any;
    streamingService: any;
    agentOrchestration: any;
  };
  timestamp: Date;
}> {
  const results = {
    overall: 'healthy' as const,
    components: {
      vectorDatabase: false,
      embeddingService: false,
      searxngEngine: false,
      streamingService: false,
      agentOrchestration: false
    },
    details: {} as any,
    timestamp: new Date()
  };

  try {
    // Check Vector Database
    try {
      const { vectorStore } = await import('./vectorStore');
      results.details.vectorDatabase = await vectorStore.healthCheck();
      results.components.vectorDatabase = results.details.vectorDatabase;
    } catch (error) {
      results.details.vectorDatabase = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Check Embedding Service
    try {
      const { embeddingService } = await import('./embeddings');
      results.details.embeddingService = await embeddingService.healthCheck();
      results.components.embeddingService = results.details.embeddingService.openai && results.details.embeddingService.cache;
    } catch (error) {
      results.details.embeddingService = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Check SearXNG
    try {
      const { SearxngClient } = await import('./searxng/client');
      const searxngClient = new SearxngClient();
      results.details.searxngEngine = await searxngClient.testConnection();
      results.components.searxngEngine = results.details.searxngEngine;
    } catch (error) {
      results.details.searxngEngine = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Check Streaming Service
    try {
      const { streamingManager } = await import('./streaming');
      results.details.streamingService = streamingManager.getGlobalStatistics();
      results.components.streamingService = true; // If no error, streaming is operational
    } catch (error) {
      results.details.streamingService = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Check Agent Orchestration
    try {
      const { ResearchAgentFactory } = await import('./agents');
      const agents = ResearchAgentFactory.getAllAgents();
      results.details.agentOrchestration = {
        totalAgents: agents.length,
        availableAgents: agents.map(a => a.name),
        operational: agents.length === 5
      };
      results.components.agentOrchestration = agents.length === 5;
    } catch (error) {
      results.details.agentOrchestration = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Determine overall health
    const healthyComponents = Object.values(results.components).filter(Boolean).length;
    const totalComponents = Object.keys(results.components).length;
    
    if (healthyComponents === totalComponents) {
      results.overall = 'healthy';
    } else if (healthyComponents >= totalComponents * 0.6) {
      results.overall = 'degraded' as any;
    } else {
      results.overall = 'critical' as any;
    }

    return results;

  } catch (error) {
    return {
      ...results,
      overall: 'critical',
      details: {
        ...results.details,
        systemError: error instanceof Error ? error.message : 'Unknown system error'
      }
    };
  }
}

// === QUICK START UTILITIES ===

/**
 * Initialize Phase 1 research system with default configuration
 */
export async function initializeResearchSystem(customConfig?: Partial<typeof PHASE_1_CONFIG>): Promise<{
  success: boolean;
  components: string[];
  errors: string[];
}> {
  const config = { ...PHASE_1_CONFIG, ...customConfig };
  const result = {
    success: true,
    components: [] as string[],
    errors: [] as string[]
  };

  try {
    // Initialize Vector Store
    try {
      const { QdrantVectorStore } = await import('./vectorStore');
      const vectorStoreInstance = new QdrantVectorStore(config.vectorStore);
      await vectorStoreInstance.healthCheck();
      result.components.push('Vector Database');
    } catch (error) {
      result.errors.push(`Vector Database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Initialize Embedding Service
    try {
      const { embeddingService } = await import('./embeddings');
      await embeddingService.healthCheck();
      result.components.push('Embedding Service');
    } catch (error) {
      result.errors.push(`Embedding Service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Initialize SearXNG Client
    try {
      const { SearxngClient } = await import('./searxng/client');
      const searxngClient = new SearxngClient();
      await searxngClient.testConnection();
      result.components.push('SearXNG Engine');
    } catch (error) {
      result.errors.push(`SearXNG Engine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Initialize Research Agents
    try {
      const { ResearchAgentFactory } = await import('./agents');
      const agents = ResearchAgentFactory.getAllAgents();
      if (agents.length === 5) {
        result.components.push('Research Agents');
      } else {
        result.errors.push(`Research Agents: Expected 5 agents, found ${agents.length}`);
      }
    } catch (error) {
      result.errors.push(`Research Agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Initialize Streaming Manager
    try {
      const { streamingManager } = await import('./streaming');
      streamingManager.getGlobalStatistics();
      result.components.push('Streaming Service');
    } catch (error) {
      result.errors.push(`Streaming Service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    result.success = result.errors.length === 0;
    return result;

  } catch (error) {
    return {
      success: false,
      components: result.components,
      errors: [...result.errors, `System Initialization: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Quick research function for immediate use
 * 
 * @param topic - Topic to research
 * @param options - Research options
 * @returns Promise<Research result>
 */
export async function quickResearch(
  topic: string,
  options: {
    userId?: string;
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
    enableStreaming?: boolean;
    maxDepth?: number;
  } = {}
): Promise<any> {
  try {
    const topicId = `quick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { RecursiveResearchSystem } = await import('./pipeline');
    const researchSystem = new RecursiveResearchSystem({
      maxDepth: options.maxDepth || 2,
      enableRealTimeUpdates: options.enableStreaming || false
    });

    const result = await researchSystem.startRecursiveResearch(
      topic,
      topicId,
      {
        userId: options.userId || 'anonymous',
        userLevel: options.userLevel || 'intermediate'
      }
    );

    return result;

  } catch (error) {
    throw new Error(`Quick research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// === EXPORTS SUMMARY ===

/**
 * Phase 1 Research System Complete
 * 
 * All core components are implemented and ready for use:
 * 
 * 🔍 Multi-Agent Search System
 * 📊 Vector Database Integration  
 * 🔄 Real-time Streaming
 * 🧮 Content Aggregation
 * 🌳 Recursive Research Pipeline
 * 🔧 SearXNG Integration
 * 📡 Wasp Framework Integration
 * ⚛️ React Frontend Hooks
 * ❌ Error Handling
 * 📈 Performance Optimization
 * 
 * Ready for Phase 2 development!
 */

export default {
  config: PHASE_1_CONFIG,
  info: PHASE_1_INFO,
  healthCheck: performSystemHealthCheck,
  initialize: initializeResearchSystem,
  quickResearch
};