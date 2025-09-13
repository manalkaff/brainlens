# Learning Research Platform - Vector Storage and RAG System

This document provides an overview of the Vector Storage and RAG (Retrieval-Augmented Generation) system implemented for the learning research platform.

## Overview

The Vector Storage and RAG system enables intelligent conversational learning by combining vector-based content retrieval with AI-powered response generation. This system allows users to have contextual conversations about their learning topics, with responses grounded in the researched content.

## Components

### 1. Vector Storage (`src/learning/research/vectorStore.ts`)

**Features:**
- Qdrant vector database integration
- OpenAI text-embedding-3-small for embedding generation
- Vector document storage with metadata indexing
- Semantic search functionality for content retrieval
- Collection management and health monitoring

**Key Methods:**
- `initializeCollection()` - Set up vector collection
- `storeDocument()` / `storeDocuments()` - Store content with embeddings
- `searchSimilar()` - Semantic search across all content
- `searchInTopic()` - Search within specific topics
- `deleteByTopic()` - Clean up topic content

### 2. Vector Operations (`src/learning/research/vectorOperations.ts`)

**Features:**
- High-level operations for topic content management
- Integration with research pipeline for automatic storage
- Content recommendations and RAG context extraction
- Batch operations for efficient processing

**Key Methods:**
- `storeTopicContent()` - Store individual content pieces
- `storeTopicContentBatch()` - Batch content storage
- `searchTopicContent()` - Search within topics
- `extractRAGContext()` - Extract context for AI responses
- `getContentRecommendations()` - Get related content suggestions

### 3. RAG System (`src/learning/chat/ragSystem.ts`)

**Features:**
- Context retrieval from vector database based on user queries
- Adaptive prompt engineering based on user preferences
- Conversation history management and optimization
- Confidence scoring and relevance ranking
- Query expansion for better retrieval

**Key Methods:**
- `generateResponse()` - Generate contextual AI responses
- `searchRelevantContent()` - Find relevant content with expansion
- `optimizeConversationHistory()` - Manage conversation context
- `createPromptTemplate()` - Adaptive prompt generation

**User Adaptations:**
- Knowledge level (beginner, intermediate, advanced)
- Learning style (visual, auditory, kinesthetic, reading)
- Conversation context and history

### 4. Conversation Manager (`src/learning/chat/conversationManager.ts`)

**Features:**
- Session management for active conversations
- Message processing and AI response generation
- Database integration for persistent chat history
- Session optimization and cleanup

**Key Methods:**
- `startConversation()` - Initialize conversation session
- `processMessage()` - Handle user messages and generate responses
- `updateUserPreferences()` - Update learning preferences
- `generateConversationSummary()` - Summarize chat sessions

### 5. Chat Operations (`src/learning/chat/operations.ts`)

**Features:**
- Wasp operations for chat functionality
- Integration with authentication and user management
- Progress tracking from chat activity
- Thread management and message persistence

**Operations:**
- `createChatThread` - Create new chat threads
- `getChatThread` / `getChatThreads` - Retrieve chat data
- `sendMessage` - Process messages and get AI responses
- `updateChatThread` - Update chat settings

## Integration with Research Pipeline

The vector storage system is automatically integrated with the research pipeline:

1. **Automatic Storage**: Research results are automatically stored in the vector database during the research process
2. **Content Types**: Different content types (summary, research, subtopic, generated) are indexed separately
3. **Metadata Indexing**: Rich metadata enables filtered searches and content organization
4. **Hierarchical Storage**: Content is organized by topic hierarchy and depth

## Database Schema

The system uses the existing database schema with:
- `VectorDocument` model for storing vector metadata
- `ChatThread` and `Message` models for conversation persistence
- Integration with `Topic` and `UserTopicProgress` models

## Environment Configuration

Required environment variables:
```bash
# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-api-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
```

## Usage Examples

### Starting a Conversation
```typescript
// Create a chat thread
const thread = await createChatThread({
  topicId: 'topic-123',
  title: 'Learning about Machine Learning',
  userPreferences: {
    knowledgeLevel: 'intermediate',
    learningStyle: 'visual'
  }
});

// Send a message
const response = await sendMessage({
  threadId: thread.id,
  content: 'What are the main types of machine learning?'
});
```

### Direct RAG Usage
```typescript
// Generate a response with context
const ragResponse = await ragSystem.generateResponse(
  'Explain neural networks',
  {
    topicId: 'ml-topic',
    topicTitle: 'Machine Learning',
    userKnowledgeLevel: 'beginner',
    conversationHistory: []
  }
);
```

### Vector Search
```typescript
// Search for relevant content
const results = await searchTopicContent(
  'deep learning algorithms',
  'ml-topic',
  {
    limit: 10,
    scoreThreshold: 0.7,
    contentTypes: ['summary', 'research']
  }
);
```

## Performance Considerations

1. **Token Management**: Context windows are optimized to stay within model limits
2. **Conversation History**: Older messages are summarized to maintain context while reducing tokens
3. **Batch Operations**: Multiple documents are processed in batches for efficiency
4. **Caching**: Vector embeddings and search results can be cached for better performance
5. **Session Management**: Inactive conversation sessions are automatically cleaned up

## Future Enhancements

1. **Advanced Retrieval**: Implement hybrid search combining vector and keyword search
2. **Multi-modal Support**: Add support for image and document embeddings
3. **Personalization**: Learn from user interactions to improve response quality
4. **Real-time Updates**: Stream responses as they're generated
5. **Analytics**: Track conversation quality and user satisfaction metrics

## Testing

The system includes comprehensive test coverage for:
- Vector storage operations
- RAG response generation
- Conversation management
- Integration with existing systems

Run tests with:
```bash
wasp test client run
```

## Deployment

For production deployment:
1. Set up a Qdrant instance (cloud or self-hosted)
2. Configure environment variables
3. Run database migrations
4. Initialize vector collections
5. Monitor system performance and costs

The system is designed to scale with the application and can handle multiple concurrent conversations while maintaining response quality and performance.