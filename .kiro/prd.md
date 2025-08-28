# Product Requirements Document (PRD)
## AI-Powered Learning Research Platform

### 1. Executive Summary

An educational web application that automatically researches any topic a user wants to learn, mapping out comprehensive knowledge trees with nested subtopics through intelligent web scraping and AI aggregation, then presenting the information through multiple learning modalities - eliminating the need for manual research across multiple sources.

### 2. Problem Statement

**Current Pain Points:**
- Learning new topics requires extensive manual research across multiple sources (articles, YouTube, courses)
- Difficult to understand the full scope and structure of a subject
- Time-consuming to identify what subtopics are important
- Information overload makes it hard to create a clear learning path
- No clear progression from basics to advanced concepts
- One-size-fits-all learning approaches don't work for everyone

**Target Users:**
- Self-directed learners
- Students researching new subjects
- Professionals upskilling
- Curious individuals exploring new interests
- Educators planning curriculum

### 3. Solution Overview

An AI-powered platform that acts as a comprehensive learning companion - users simply enter a topic, and the system automatically:
1. Researches the topic using meta search engines and AI aggregation
2. Builds a 3-level deep knowledge tree of subtopics
3. Provides multiple learning interfaces (guided, exploratory, conversational, visual)
4. Adapts to user's knowledge level and preferred learning style
5. Tracks progress and generates personalized quizzes

### 4. Core Architecture

#### 4.1 Research Pipeline
```
User Query → Ground Definition Agent → Multi-Agent Search Orchestration → 
SearXNG Multi-Engine Search → Results Aggregation → Summary + Subtopics Generation →
Recursive Subtopic Research (3 levels deep) → Knowledge Tree Complete → Embedding Generation → Qdrant Storage → RAG-Ready Index
```

**Backend Process:**
1. **Ground Definition Agent**: Establishes core understanding of user query
2. **Multi-Agent Search Orchestration**: Deploys 5 specialized search agents simultaneously
3. **SearXNG Integration**: Parallel searches across specialized engines
4. **Results Aggregation**: Combines and deduplicates information from all agents
5. **Content Generator**: Creates summary and identifies subtopics
6. **Recursive Depth**: Automatically explores 3 levels deep (expandable on demand)
7. **Real-time Streaming**: Updates UI progressively as content generates

#### 4.2 Multi-Agent Search Architecture

**5 Specialized Search Agents:**

1. **General Research Agent**
   - **Purpose**: Broad web search for general information
   - **SearXNG Config**: No specific engines (uses default web engines)
   - **Use Case**: Overview, definitions, general context

2. **Academic Research Agent**
   - **Purpose**: Scholarly and scientific information
   - **SearXNG Engines**: `arxiv`, `google scholar`, `pubmed`
   - **Use Case**: Research papers, academic definitions, scientific data

3. **Computational Agent**
   - **Purpose**: Mathematical, computational, and factual data
   - **SearXNG Engines**: `wolframalpha`
   - **Use Case**: Calculations, formulas, structured data, facts

4. **Video Research Agent**
   - **Purpose**: Educational video content and tutorials
   - **SearXNG Engines**: `youtube`
   - **Use Case**: Visual learning materials, tutorials, demonstrations

5. **Social Research Agent**
   - **Purpose**: Community discussions and practical insights
   - **SearXNG Engines**: `reddit`
   - **Use Case**: Real-world experiences, discussions, troubleshooting

**Search Execution Flow:**
```typescript
// Parallel execution of all 5 agents
const searchPromises = [
  searchSearxng(query, { /* general - no engines specified */ }),
  searchSearxng(query, { engines: ['arxiv', 'google scholar', 'pubmed'] }),
  searchSearxng(query, { engines: ['wolframalpha'] }),
  searchSearxng(query, { engines: ['youtube'] }),
  searchSearxng(query, { engines: ['reddit'] })
];

const results = await Promise.allSettled(searchPromises);
```

#### 4.3 URL Structure
- Base: `/{topic-slug}` (e.g., `/machine-learning`, `/quantum-computing`)
- Clean, shareable URLs for each learning topic

### 5. User Interface Tabs

#### 5.1 Learn Tab (Default)
**Purpose**: Guided, personalized learning experience

**Initial Setup Flow:**
1. **Knowledge Assessment**: "What's your current knowledge level?"
   - Complete beginner
   - Some familiarity
   - Intermediate
   - Advanced

2. **Learning Style Selection**: "How do you prefer to learn?"
   - Full text reading
   - Text with visual diagrams
   - Interactive (Duolingo-style)
   - Code-based learning
   - Mixed approach

3. **Starting Point**: "Where would you like to begin?"
   - Dynamic suggestions based on knowledge tree
   - Examples: "What is React?", "React Components", "React Alternatives"

**Learning Experience:**
- **Streaming AI Responses**: Using Vercel AI SDK 4.0 for real-time content
- **Interactive Headers**: Clickable subtopic headers for deep dives
- **Contextual Expansion**: Click any mentioned concept to expand inline
- **Progress Tracking**: Visual indicators of completed sections
- **Adaptive Difficulty**: Content adjusts based on user interaction

#### 5.2 Explore Tab
**Purpose**: Self-directed, non-linear exploration

**Layout:**
- **Left Sidebar**: 
  - Tree-view navigation of all topics/subtopics
  - Expand/collapse nodes
  - Search within tree
  - Visual indicators for read/unread content
  
- **Right Content Area**:
  - MDX-rendered documents with source attribution
  - Rich media support (diagrams, code blocks, tables)
  - Clickable headers for navigation
  - On-demand generation for unexplored topics

**Features:**
- **Automatic Content Generation**: Main topics automatically generate content when research is complete
- **Source Attribution**: Every paragraph displays clickable "Source" badges that link to original research sources
- **Lazy Loading**: Generate content only when requested for subtopics
- **Breadcrumb Navigation**: Show current location in knowledge tree
- **Bookmarking**: Save interesting sections
- **Export Options**: Download as PDF/Markdown

#### 5.3 Ask Tab
**Purpose**: Conversational learning with context-aware AI

**Features:**
- **RAG Integration With Qdrant**: Retrieval from all generated topic documents
- **Chat History**: Persistent conversation threads
- **Context Switching**: Multiple conversation threads per topic
- **Smart Suggestions**: Pre-populated questions based on reading history
- **Code Execution**: For technical topics (sandboxed environment)

**UI Elements:**
- Chat interface with message bubbles
- Thread sidebar for history
- "New Chat" button to reset context
- Copy/Export conversation options

#### 5.4 MindMap Tab
**Purpose**: Visual representation of knowledge structure

**Implementation with React Flow:**
- **Interactive Nodes**: 
  - Click to view summary
  - Double-click to navigate to content
  - Color-coded by completion status
  - Size based on content depth
  
- **Features**:
  - Zoom/Pan controls
  - Fullscreen mode
  - Export as image
  - Filter by completion/difficulty
  - Search highlighting
  - Auto-layout options (hierarchical, radial, force-directed)

#### 5.5 Quiz Tab
**Purpose**: Gamified knowledge testing

**Flow:**
1. **Initial State**: "Generate Quiz" button
2. **Quiz Generation**: AI creates questions based on explored content
3. **Quiz Types**:
   - Multiple choice
   - True/False
   - Fill in the blanks
   - Code challenges (for technical topics)
   - Matching exercises

**Features:**
- **Adaptive Difficulty**: Based on user's reading history
- **Progress Tracking**: Score history and improvement trends
- **Explanations**: Detailed answers with links to source content
- **Leaderboard**: Optional competitive element
- **Achievement Badges**: Gamification rewards

### 6. Technical Implementation

#### 6.1 Tech Stack
- **Frontend**: 
  - Next.js 14+ (App Router)
  - React 18+
  - Vercel AI SDK 4.0 for streaming
  - React Flow for mindmaps
  - MDX for rich content
  - Tailwind CSS for styling
  - Framer Motion for animations

- **Backend**:
  - Next.js API Routes
  - Kiro AI Integration
  - SearXNG Meta Search Engine
  - Multi-Agent Search Orchestration
  - PostgreSQL (via Prisma)
  - Vector DB for RAG using QDRANT

- **From Wasp OpenSaaS Boilerplate**:
  - Authentication system
  - Payment integration
  - User management
  - Email system

#### 6.2 Data Models

```typescript
// Core entities
Topic {
  id: string
  slug: string
  title: string
  summary: string
  depth: number
  parentId?: string
  createdAt: Date
  metadata: JSON
}

UserProgress {
  userId: string
  topicId: string
  completed: boolean
  timeSpent: number
  lastAccessed: Date
  quizScores: JSON
}

ChatThread {
  id: string
  userId: string
  topicId: string
  messages: Message[]
  createdAt: Date
}

VectorDocument {
  id: string
  topicId: string
  content: string
  embedding: vector
  metadata: {
    depth: number
    parentTopicId: string
    contentType: 'summary' | 'full' | 'quiz' | 'user_note'
    sourceAgent: 'general' | 'academic' | 'computational' | 'video' | 'social'
    createdAt: Date
    lastAccessed: Date
  }
}

SearchResult {
  id: string
  topicId: string
  query: string
  agent: 'general' | 'academic' | 'computational' | 'video' | 'social'
  results: JSON // SearXNG results
  createdAt: Date
}
```

#### 6.3 Real-time Features
- **WebSocket/SSE**: Live updates during content generation
- **Optimistic UI**: Immediate feedback for user actions
- **Progress Indicators**: Loading states for each section
- **Incremental Rendering**: Show content as it becomes available

#### 6.4 SearXNG Integration

**Configuration:**
```typescript
interface SearxngSearchOptions {
  categories?: string[];
  engines?: string[];
  language?: string;
  pageno?: number;
}

// Agent-specific configurations
const AGENT_CONFIGS = {
  general: { /* no engines - uses default */ },
  academic: { engines: ['arxiv', 'google scholar', 'pubmed'] },
  computational: { engines: ['wolframalpha'] },
  video: { engines: ['youtube'] },
  social: { engines: ['reddit'] }
};
```

**Multi-Agent Search Implementation:**
```typescript
export const multiAgentSearch = async (query: string) => {
  const agents = ['general', 'academic', 'computational', 'video', 'social'];
  
  const searchPromises = agents.map(agent => 
    searchSearxng(query, AGENT_CONFIGS[agent])
      .then(results => ({ agent, ...results }))
      .catch(error => ({ agent, error, results: [], suggestions: [] }))
  );
  
  const results = await Promise.allSettled(searchPromises);
  return aggregateResults(results);
};
```

**Result Processing:**
- **Source Attribution**: Each result tagged with originating agent
- **Quality Scoring**: Different weights for different agent types
- **Deduplication**: Cross-agent duplicate detection and removal
- **Content Enrichment**: Combine complementary information from multiple agents

#### 6.5 Vector Storage Strategy:
- Automatic Indexing: Every generated document/topic automatically embedded and stored
- Chunking Strategy: Split documents into semantic chunks (max 512 tokens)
- Real-time Updates: Stream content → Generate embeddings → Store in Qdrant pipeline
- Retrieval Optimization: Pre-compute embeddings during initial research phase
- Collection Structure: One collection per main topic, points for subtopics
- Agent Source Tracking: Metadata includes source agent for result provenance
- Hybrid Search: Combine vector similarity with metadata filtering for precise retrieval

### 7. User Journey

1. **Discovery**: User enters topic in search box
2. **Processing**: Automatic research initiation with loading animation and status updates
   - "Creating topic..."
   - "Starting AI research..."
   - "Understanding your topic..."
   - "Deploying research agents..."
   - "Searching academic sources..."
   - "Gathering video content..."
   - "Analyzing community discussions..."
   - "Aggregating results..."
   - "Building knowledge tree..."
   - "Preparing your learning experience..."
3. **Landing**: Arrives at `/{topic-slug}` with Learn tab open
4. **Onboarding**: Quick setup (skippable for returning users)
5. **Learning**: Engages with content through preferred method
6. **Exploration**: Content automatically available in Explore tab with source attribution
7. **Source Verification**: Can click source badges to verify and explore original research
8. **Assessment**: Takes quizzes to validate understanding
9. **Completion**: Achievement celebration and next topic suggestions

### 8. MVP Scope

**Must Have:**
- SearXNG integration with 5 specialized agents
- Topic research with 3-level depth
- All 5 tabs with basic functionality
- Vercel AI SDK 4.0 for multi llm integration
- Real-time UI updates with agent progress indicators
- Learn tab with personalization
- Explore tab with tree navigation and automatic content generation
- Source attribution system with clickable badges linking to original sources
- Basic RAG for Ask tab with source attribution
- Simple mindmap visualization
- Auto-generated quizzes
- Progress tracking
- Automatic research initiation when topics are created

**Nice to Have:**
- Multiple learning style implementations
- Export functionality
- Achievement system
- Social sharing
- Collaborative features


### 9. Unique Value Proposition

- **Multi-Agent Intelligence**: 5 specialized search agents for comprehensive coverage
- **Multi-modal Learning**: Not just text, but guided, exploratory, visual, and conversational
- **Real-time Research**: Live web aggregation across academic, social, and computational sources
- **Source Diversity**: Academic papers, video tutorials, community discussions, and computational data
- **Depth Control**: Automatic 3-level exploration with on-demand expansion
- **Personalized Experience**: Adapts to knowledge level and learning style
- **Zero Configuration**: Works instantly with just a topic name
- **Comprehensive Platform**: Everything needed to master a topic in one place

### 10. SearXNG Agent Specializations

**General Agent**: Broad web coverage for foundational understanding
**Academic Agent**: Peer-reviewed research and scholarly articles
**Computational Agent**: Mathematical proofs, calculations, and structured data
**Video Agent**: Visual learning through tutorials and demonstrations
**Social Agent**: Real-world applications and community insights

This multi-agent approach ensures comprehensive topic coverage from multiple perspectives, providing learners with both theoretical foundations and practical applications.

---