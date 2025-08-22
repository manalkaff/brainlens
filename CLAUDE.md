# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BrainLens is an AI-powered learning research platform built with Wasp (v0.17.0) Open SaaS boilerplate. The app automatically researches any topic using multi-agent web scraping and AI aggregation, then presents the information through multiple learning modalities including guided learning, exploration, chat, mind maps, and quizzes.

## Development Commands

### Core Wasp Commands
```bash
# Navigate to app directory
cd app

# Start development server (frontend + backend + database)
wasp start

# Database operations
wasp db migrate-dev    # Run database migrations
wasp db reset          # Reset database
wasp db seed           # Seed database with mock data
wasp db studio         # Open Prisma Studio
wasp db generate       # Generate Prisma client

# Build for production
wasp build
```

### Additional Development Tasks
```bash
# Install dependencies (in app directory)
npm install

# Type checking
npm run typecheck

# Code formatting
npm run format

# Linting
npm run lint
```

## High-Level Architecture

### Tech Stack
- **Frontend**: React 18+, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express (via Wasp)
- **Database**: PostgreSQL with Prisma ORM
- **Vector Storage**: Qdrant for RAG system
- **AI/ML**: OpenAI API, Vercel AI SDK 4.0
- **Search**: SearXNG meta search engine with multi-agent orchestration
- **Caching**: Redis for browser/server-side caching
- **Auth**: Wasp built-in authentication with email/password
- **Payments**: Stripe and Lemon Squeezy integration
- **UI Components**: Radix UI, shadcn/ui, Lucide icons

### Core Learning Platform Architecture

#### Multi-Agent Search System (`src/learning/research/`)
- **5 Specialized Agents**: General, Academic, Computational, Video, Social
- **SearXNG Integration**: Meta search across specialized engines
- **Real-time Streaming**: Progressive UI updates during research
- **Content Aggregation**: Intelligent deduplication and synthesis

#### Research Pipeline
```
User Query → Ground Definition → Multi-Agent Search → 
Results Aggregation → Content Generation → 
3-Level Topic Tree → Vector Embedding → Qdrant Storage
```

#### Learning Interface Tabs
1. **Learn Tab**: Guided, personalized learning with knowledge assessment
2. **Explore Tab**: Self-directed navigation with tree-view sidebar
3. **Ask Tab**: RAG-powered conversational learning
4. **MindMap Tab**: Visual knowledge representation with React Flow
5. **Quiz Tab**: AI-generated adaptive assessments

#### Vector Storage & RAG System (`src/learning/chat/`, `src/learning/research/vectorStore.ts`)
- **Qdrant Vector DB**: Semantic search and content retrieval
- **OpenAI Embeddings**: text-embedding-3-small for vector generation
- **RAG Implementation**: Context-aware chat responses
- **Conversation Management**: Persistent chat threads with history

### Key Data Models

#### Learning Platform
- **Topic**: Hierarchical topic structure with 3-level depth
- **UserTopicProgress**: Progress tracking, bookmarks, preferences
- **VectorDocument**: Embedded content for RAG retrieval
- **ChatThread/Message**: Conversation history
- **Quiz/QuizQuestion**: Adaptive assessments

#### SaaS Boilerplate
- **User**: Authentication, subscriptions, credits
- **DailyStats**: Analytics and usage metrics
- **File**: S3 file upload management

### File Structure Patterns

#### Feature Organization
```
src/
├── learning/           # Main learning platform
│   ├── components/     # React components by feature
│   ├── hooks/         # Custom React hooks
│   ├── operations.ts  # Wasp queries/actions
│   ├── research/      # Multi-agent search system
│   ├── chat/          # RAG and conversation system
│   ├── assessment/    # Content generation
│   └── api/          # API handlers
├── auth/              # Authentication pages
├── admin/             # Admin dashboard
├── payment/           # Stripe/Lemon Squeezy
├── client/            # Shared client components
└── shared/            # Utilities and types
```

#### Component Patterns
- Feature-based organization within `src/learning/components/`
- Each tab has its own component directory
- Shared UI components in `src/components/ui/`
- Custom hooks in feature-specific `hooks/` directories

### Important Implementation Notes

#### Wasp Configuration
- Main config in `app/main.wasp` defines all routes, pages, operations, and APIs
- Database schema in `app/schema.prisma` 
- All imports use `@src/` path prefix
- Operations (queries/actions) are defined in Wasp config and implemented in TypeScript
- See `.kiro/steering/wasp-overview.md` for Wasp framework guidance

#### Research System
- Research triggered via `startTopicResearch` action
- Progress streamed via Server-Sent Events (`/api/research/stream`)
- Results automatically stored in Qdrant for RAG
- 5 agents run in parallel for comprehensive coverage

#### RAG Integration
- Automatic embedding generation during research
- Context extraction for chat responses
- User preference adaptation (knowledge level, learning style)
- Conversation history optimization

#### State Management
- React context for topic state (`src/learning/context/TopicContext.tsx`)
- Wasp operations for server state
- Local storage for user preferences
- Shared state between tabs via context

### Common Development Patterns

#### Adding New Learning Features
1. Define operations in `main.wasp`
2. Implement server logic in appropriate `operations.ts`
3. Create React components in feature directory
4. Add to appropriate tab component
5. Update type definitions and database schema if needed

#### Extending Research Agents
1. Add agent configuration in `src/learning/research/searxng/agentConfigs.ts`
2. Update search orchestration in `src/learning/research/agents.ts`
3. Modify result aggregation in `src/learning/research/aggregation.ts`

#### Custom Hook Pattern
```typescript
// Custom hooks follow naming convention: use[Feature][Action]
export const useTopicResearch = (topicId: string) => {
  // Implementation with error handling and loading states
}
```

This architecture enables rapid development of learning features while maintaining the SaaS boilerplate's user management, payments, and analytics capabilities.