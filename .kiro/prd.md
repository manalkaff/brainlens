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
User Query → Ground Definition Agent → Search Query Generation → 
Meta Search Engine → Results Aggregation → Summary + Subtopics Generation →
Recursive Subtopic Research (3 levels deep) → Knowledge Tree Complete → Embedding Generation → Qdrant Storage → RAG-Ready Index
```

**Backend Process:**
1. **Ground Definition Agent**: Establishes core understanding of user query
2. **Search Query Generator**: Creates optimized search queries for meta engines
3. **Meta Search Integration**: Fetches comprehensive results from multiple sources
4. **Aggregation Engine**: Combines and deduplicates information
5. **Content Generator**: Creates summary and identifies subtopics
6. **Recursive Depth**: Automatically explores 3 levels deep (expandable on demand)
7. **Real-time Streaming**: Updates UI progressively as content generates

#### 4.2 URL Structure
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
  - MDX-rendered documents
  - Rich media support (diagrams, code blocks, tables)
  - Clickable headers for navigation
  - On-demand generation for unexplored topics

**Features:**
- **Lazy Loading**: Generate content only when requested
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
  - Meta search engine APIs
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
    createdAt: Date
    lastAccessed: Date
  }
}
```

#### 6.3 Real-time Features
- **WebSocket/SSE**: Live updates during content generation
- **Optimistic UI**: Immediate feedback for user actions
- **Progress Indicators**: Loading states for each section
- **Incremental Rendering**: Show content as it becomes available

#### 6.4 Vector Storage Strategy:
- Automatic Indexing: Every generated document/topic automatically embedded and stored
- Chunking Strategy: Split documents into semantic chunks (max 512 tokens)
- Real-time Updates: Stream content → Generate embeddings → Store in Qdrant pipeline
- Retrieval Optimization: Pre-compute embeddings during initial research phase
- Collection Structure: One collection per main topic, points for subtopics
- Hybrid Search: Combine vector similarity with metadata filtering for precise retrieval

### 7. User Journey

1. **Discovery**: User enters topic in search box
2. **Processing**: Loading animation with status updates
   - "Understanding your topic..."
   - "Researching across the web..."
   - "Building knowledge tree..."
   - "Preparing your learning experience..."
3. **Landing**: Arrives at `/{topic-slug}` with Learn tab open
4. **Onboarding**: Quick setup (skippable for returning users)
5. **Learning**: Engages with content through preferred method
6. **Exploration**: Switches between tabs based on needs
7. **Assessment**: Takes quizzes to validate understanding
8. **Completion**: Achievement celebration and next topic suggestions

### 8. MVP Scope

**Must Have:**
- Topic research with 3-level depth
- All 5 tabs with basic functionality
- Vercel AI SDK 4.0 for multi llm integration
- Real-time UI updates
- Learn tab with personalization
- Explore tab with tree navigation
- Basic RAG for Ask tab
- Simple mindmap visualization
- Auto-generated quizzes
- Progress tracking

**Nice to Have:**
- Multiple learning style implementations
- Export functionality
- Achievement system
- Social sharing
- Collaborative features


### 9. Unique Value Proposition

- **Multi-modal Learning**: Not just text, but guided, exploratory, visual, and conversational
- **Real-time Research**: Live web aggregation, not static content
- **Depth Control**: Automatic 3-level exploration with on-demand expansion
- **Personalized Experience**: Adapts to knowledge level and learning style
- **Zero Configuration**: Works instantly with just a topic name
- **Comprehensive Platform**: Everything needed to master a topic in one place

---