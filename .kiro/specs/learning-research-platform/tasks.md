# Implementation Plan

## Important Note: Test Generation
**DO NOT WRITE TESTS** - This project has an automated hook that generates tests when tasks are completed. Focus only on implementing the core functionality without writing any test files.

- [x] 1. Database Schema and Core Models Setup
  - Extend the existing Prisma schema with new models for Topic, UserTopicProgress, ChatThread, Message, Quiz, QuizQuestion, and VectorDocument
  - Add necessary enums (TopicStatus, MessageRole, QuestionType) to support the learning platform
  - Create database migration to add new tables and relationships to existing User model
  - Set up proper indexing for performance optimization on frequently queried fields
  - _Requirements: 8.1, 8.2, 9.1, 9.2_

- [ ] 2. Basic Topic Management Operations
  - [x] 2.1 Implement core topic CRUD operations
    - Create `createTopic` action to initialize new learning topics with slug generation
    - Implement `getTopic` query to fetch topic details with user progress
    - Build `getTopicTree` query to retrieve hierarchical topic structure
    - Ensure proper error handling and validation for all operations
    - _Requirements: 1.1, 1.2, 9.1_

  - [x] 2.2 Implement user progress tracking operations
    - Create `updateTopicProgress` action to track completion status and time spent
    - Implement progress calculation logic for nested topic hierarchies
    - Add bookmark functionality for saving interesting content sections
    - Implement proper validation for progress tracking accuracy and data integrity
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 3. Landing Page Redesign and Topic Creation Interface
  - [x] 3.1 Redesign main landing page for topic input
    - Move existing landing page content to `/home` route with new HomePage component
    - Create new main landing page (`/`) with centered textarea input for topic research
    - Design clean, focused interface that immediately communicates the platform's purpose
    - Add example topics and quick start suggestions below the main input
    - Style the new landing page with existing Tailwind CSS theme for consistency
    - _Requirements: 1.1, 1.2_

  - [x] 3.2 Create topic routing and navigation
    - Add Wasp routes for `/home` (original landing), `/learn` (search), and `/learn/:slug` (topic page)
    - Update main landing page route (`/`) to use new topic input interface
    - Implement proper authentication requirements for learning features
    - Create navigation integration with existing app header/sidebar
    - Add breadcrumb navigation for topic hierarchy
    - _Requirements: 1.2, 10.1_

- [-] 4. Multi-Agent Research Pipeline with SearXNG
  - [x] 4.1 Implement specialized research agents
    - Create General Research Agent with no specific engine constraints for broad topic coverage
    - Build Academic Research Agent using 'arxiv', 'google scholar', 'pubmed' engines for scholarly content
    - Implement Computational Agent using 'wolframalpha' for mathematical and scientific queries
    - Create Video Learning Agent using 'youtube' for educational video content discovery
    - Build Community Discussion Agent using 'reddit' for real-world perspectives and discussions
    - _Requirements: 1.3, 1.4, 1.5_

  - [x] 4.2 Design agent-specific prompts and query optimization
    - Create General Agent prompt: "Research comprehensive information about {topic} including definitions, key concepts, applications, and current developments"
    - Design Academic Agent prompt: "Find peer-reviewed research, academic papers, and scholarly articles about {topic} focusing on latest findings and theoretical frameworks"
    - Build Computational Agent prompt: "Analyze mathematical, scientific, or computational aspects of {topic} including formulas, calculations, and technical specifications"
    - Create Video Agent prompt: "Discover educational videos, tutorials, and visual explanations about {topic} suitable for different learning levels"
    - Design Community Agent prompt: "Find real-world discussions, practical applications, common questions, and user experiences related to {topic}"
    - _Requirements: 1.3, 1.4, 1.5_

  - [x] 4.3 Build recursive topic research system with multi-agent coordination
    - Implement agent coordination system that distributes research across specialized agents
    - Create content aggregation and deduplication logic across different agent results
    - Add 3-level deep subtopic identification using combined agent insights
    - Build real-time status updates showing which agents are active and their progress
    - Implement error handling and retry mechanisms for each agent type
    - _Requirements: 1.6, 1.7, 4.1, 4.2_

- [x] 5. Vector Storage and RAG System
  - [x] 5.1 Integrate Qdrant vector database
    - Set up Qdrant connection and collection management
    - Implement embedding generation using OpenAI text-embedding-3-small
    - Create vector document storage with metadata indexing
    - Add vector search functionality for content retrieval
    - _Requirements: 1.8, 5.1, 5.2_

  - [x] 5.2 Build RAG system for conversational learning
    - Implement context retrieval from vector database based on user queries
    - Create prompt engineering system for contextual AI responses
    - Add conversation history management and context window optimization
    - Build relevance scoring and result ranking for retrieved content
    - _Requirements: 5.3, 5.4_

- [x] 6. Main Topic Page and Tab Structure
  - [x] 6.1 Create main topic page layout
    - Build `TopicPage.tsx` with tab navigation structure
    - Implement responsive design for desktop and mobile interfaces
    - Add topic header with title, progress indicator, and metadata
    - Create shared state management for cross-tab data synchronization
    - _Requirements: 2.1, 3.1_

  - [x] 6.2 Implement tab switching and state management
    - Create tab navigation component with active state indicators
    - Implement lazy loading for tab content to optimize performance
    - Add URL hash routing for direct tab access and bookmarking
    - Build shared context provider for topic data across all tabs
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 7. Learn Tab - Personalized Learning Interface
  - [x] 7.1 Build knowledge assessment component
    - Create initial knowledge level assessment questionnaire
    - Implement learning style preference selection interface
    - Add starting point recommendation system based on topic structure
    - Store user preferences in UserTopicProgress model
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 7.2 Implement guided learning experience
    - Create streaming content display using Vercel AI SDK 4.0
    - Build interactive headers for subtopic navigation and deep dives
    - Add contextual expansion for mentioned concepts with inline content
    - Implement adaptive difficulty adjustment based on user interactions
    - _Requirements: 3.4, 3.5, 4.3, 4.4_

- [x] 8. Explore Tab - Tree Navigation and Content
  - [x] 8.1 Build hierarchical topic tree component
    - Create expandable tree view with topic hierarchy visualization
    - Implement search functionality within the topic tree structure
    - Add visual indicators for read/unread content and completion status
    - Build lazy loading for unexplored subtopics with on-demand generation
    - _Requirements: 2.2, 9.4_

  - [x] 8.2 Implement MDX content rendering
    - Set up MDX processing for rich content display with code blocks and diagrams
    - Create clickable header navigation for quick content jumping
    - Add export functionality for PDF and Markdown formats
    - Implement bookmarking system for saving interesting content sections
    - _Requirements: 9.3, 9.5_

- [x] 9. Ask Tab - Conversational Learning Interface
  - [x] 9.1 Build chat interface components
    - Create chat message components with user and assistant message styling
    - Implement chat thread management with sidebar for conversation history
    - Add "New Chat" functionality to reset conversation context
    - Build message input with auto-resize and send functionality
    - _Requirements: 5.1, 5.5_

  - [x] 9.2 Implement RAG-powered chat operations
    - Create `sendMessage` action with vector search and AI response generation
    - Implement conversation context management and history persistence
    - Add smart question suggestions based on user's reading history
    - Build copy/export functionality for conversation threads
    - _Requirements: 5.2, 5.3, 5.4, 5.6_

- [x] 10. MindMap Tab - Visual Knowledge Representation
  - [x] 10.1 Implement React Flow mind map visualization
    - Set up React Flow with custom node components for topic representation
    - Create color-coding system based on completion status and content depth
    - Implement node sizing based on content depth and user engagement
    - Add click handlers for topic summaries and navigation
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 10.2 Add interactive mind map features
    - Implement zoom, pan, and fullscreen controls for mind map navigation
    - Create auto-layout options (hierarchical, radial, force-directed)
    - Add search highlighting functionality within the mind map
    - Build export functionality for mind map as image format
    - _Requirements: 6.4, 6.5, 6.6_

- [x] 11. Quiz Tab - Adaptive Assessment System
  - [x] 11.1 Build quiz generation system
    - Create `generateQuiz` action using AI to create questions from explored content
    - Implement multiple question types (multiple choice, true/false, fill-in-blank)
    - Add adaptive difficulty based on user's demonstrated knowledge level
    - Build quiz persistence and progress tracking functionality
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 11.2 Implement quiz interface and scoring
    - Create quiz taking interface with question navigation and timer
    - Build `submitQuizAnswer` action with immediate feedback and explanations
    - Implement score calculation and improvement trend tracking
    - Add achievement badges and gamification elements for motivation
    - _Requirements: 7.4, 7.5, 7.6_

- [x] 12. Real-time Features and Streaming
  - [x] 12.1 Implement content streaming during research
    - Set up WebSocket or Server-Sent Events for real-time research updates
    - Create progressive loading states with descriptive status messages
    - Build incremental UI updates as content becomes available during research
    - Add optimistic UI updates for immediate user feedback
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 12.2 Build streaming content display components
    - Create `StreamingContent.tsx` component for real-time content rendering
    - Implement typewriter effect for AI-generated content display
    - Add loading skeletons and progress indicators for better UX
    - Build error handling and retry mechanisms for failed streams
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 13. Integration with Existing SaaS Features
  - [x] 13.1 Implement subscription and credit system integration
    - Add credit consumption tracking for AI API usage and research operations
    - Implement subscription status checking for premium learning features
    - Create upgrade prompts when free users reach usage limits
    - Add admin controls for managing user learning quotas and permissions
    - _Requirements: 10.2, 10.3, 10.4_

  - [x] 13.2 Integrate with existing authentication and user management
    - Ensure all learning routes require authentication using existing Wasp auth
    - Add learning progress to user account page and dashboard
    - Implement email notifications for learning milestones and achievements
    - Create admin dashboard sections for learning platform analytics
    - _Requirements: 10.1, 10.5, 10.6_

- [x] 14. Performance Optimization and Caching
  - [x] 14.1 Implement caching strategies
    - Set up Redis caching for frequently accessed topics and content
    - Implement vector embedding caching to reduce API calls
    - Add browser caching for static learning content and assets
    - Create database query optimization with proper indexing
    - _Requirements: 1.8, 4.4, 8.5_

  - [x] 14.2 Optimize real-time performance
    - Implement efficient WebSocket message broadcasting for concurrent users
    - Add client-side state management optimization for large topic trees
    - Create progressive loading strategies for content-heavy learning materials
    - Build memory management for long-running learning sessions
    - _Requirements: 4.3, 4.4, 8.4_

- [ ] 15. Quality Assurance and Validation
  - [ ] 15.1 Implement comprehensive error handling and validation
    - Add proper error handling for all Wasp operations (topic, chat, quiz, progress)
    - Implement validation for AI research pipeline components and external API responses
    - Add input validation and sanitization for all user-facing components
    - Build robust error recovery mechanisms for database operations
    - _Requirements: All requirements - error handling coverage_

  - [ ] 15.2 Manual testing and quality validation
    - Perform manual testing of complete learning workflows
    - Validate real-time features and WebSocket connections
    - Test cross-browser compatibility for learning interfaces
    - Validate performance of vector search and content generation
    - _Requirements: All requirements - manual validation_

- [x] 16. Documentation and Deployment Preparation
  - [x] 16.1 Create user documentation and onboarding
    - Write user guides for each learning tab and feature
    - Create interactive onboarding flow for new users
    - Add help tooltips and contextual guidance throughout the interface
    - Build FAQ section addressing common learning platform questions
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 16.2 Prepare production deployment configuration
    - Set up environment variables for AI APIs and vector database
    - Configure production Qdrant instance and connection settings
    - Add monitoring and logging for research pipeline and user interactions
    - Create backup and recovery procedures for learning data and vectors
    - _Requirements: 10.6, 9.6_
