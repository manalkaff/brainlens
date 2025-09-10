# Task 2: Set Up Redis Progress Infrastructure

## Overview
Create Redis-based infrastructure to store and retrieve real-time progress updates for the research process. This will be used instead of SSE/websockets to track step-by-step progress.

## Current Architecture
- Frontend polls `getResearchStats` operation to check research status
- No real-time step progress tracking
- No intermediate progress storage mechanism

## Requirements

### 1. Redis Configuration and Client
- Set up Redis client for the application
- Configure Redis connection settings
- Add environment variables for Redis configuration
- Create Redis utilities for progress tracking

### 2. Progress Data Structure
- Design Redis key structure for topic progress
- Define progress update data format
- Include step information, timing, status, and results
- Support both main topic and subtopic progress

### 3. Progress Tracking API
- Create functions to store progress updates
- Create functions to retrieve current progress
- Handle progress expiration and cleanup
- Support concurrent access and updates

## Implementation Details

### Files to Create/Modify

#### 1. Create Redis Client Setup
**File:** `/home/manalkaff/projects/brainlens/app/src/server/redis/client.ts`
```typescript
// Redis client configuration and setup
// Connection management
// Error handling and reconnection logic
```

#### 2. Create Progress Tracking Module
**File:** `/home/manalkaff/projects/brainlens/app/src/server/redis/progressTracker.ts`
```typescript
// Core progress tracking functionality
// Store/retrieve progress updates
// Key management and expiration
```

#### 3. Create Progress Types
**File:** `/home/manalkaff/projects/brainlens/app/src/shared/progressTypes.ts`
```typescript
// TypeScript interfaces for progress data
// Step definitions and status enums
// Progress update payload formats
```

### Redis Key Structure
```
research:progress:{topicId} -> Hash containing:
  - status: "idle" | "researching_main" | "researching_subtopics" | "completed" | "error"
  - currentStep: number (0-5 for main topic steps)
  - stepDetails: JSON object with step info
  - mainTopicCompleted: boolean
  - subtopicsInProgress: array of subtopic IDs
  - lastUpdated: timestamp
  - error: error message if status is "error"
```

### Progress Update Data Format
```typescript
interface ProgressUpdate {
  topicId: string;
  status: ResearchStatus;
  currentStep?: number;
  stepName?: string;
  stepStartTime?: Date;
  stepEndTime?: Date;
  stepResult?: any;
  progress: number; // 0-100
  message: string;
  mainTopicResult?: any; // Set when main topic completes
  subtopicsProgress?: SubtopicProgress[];
  error?: string;
}

interface SubtopicProgress {
  subtopicId: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "error";
  progress: number;
}
```

### Core Functions to Implement

#### Progress Storage
```typescript
// Store progress update in Redis
async function updateResearchProgress(topicId: string, update: ProgressUpdate): Promise<void>

// Store step completion with timing
async function completeResearchStep(
  topicId: string, 
  stepNumber: number, 
  stepName: string, 
  result: any, 
  duration: number
): Promise<void>

// Mark main topic as completed
async function completeMainTopic(topicId: string, result: any): Promise<void>

// Update subtopic progress
async function updateSubtopicProgress(topicId: string, subtopicProgress: SubtopicProgress[]): Promise<void>
```

#### Progress Retrieval
```typescript
// Get current progress for a topic
async function getResearchProgress(topicId: string): Promise<ProgressUpdate | null>

// Check if research is in progress
async function isResearchInProgress(topicId: string): Promise<boolean>

// Get completed main topic result
async function getCompletedMainTopic(topicId: string): Promise<any | null>
```

#### Cleanup and Maintenance
```typescript
// Set progress expiration (e.g., 1 hour)
async function setProgressExpiration(topicId: string, ttlSeconds: number): Promise<void>

// Clean up expired progress entries
async function cleanupExpiredProgress(): Promise<number>

// Clear progress for a topic
async function clearResearchProgress(topicId: string): Promise<void>
```

### Environment Configuration
Add to `.env.server`:
```
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
PROGRESS_TTL_SECONDS=3600
```

### Error Handling
- Redis connection failures should not break the research process
- Fallback to basic status without step details if Redis is unavailable
- Log Redis errors but continue operation
- Implement circuit breaker pattern for Redis operations

## Integration Points

### 1. Research Process Integration
- Modify aiLearningAgent to emit progress updates after each step
- Update iterativeResearch.ts to track main topic vs subtopic progress
- Ensure progress updates happen before step execution starts and after completion

### 2. getResearchStats Integration
- Modify the existing getResearchStats operation to read from Redis
- Maintain backward compatibility with existing polling mechanism
- Return enhanced progress data including step details

### 3. Error Handling Integration
- Update progress on research failures
- Clear progress on successful completion
- Handle Redis unavailability gracefully

## Success Criteria

1. ✅ Redis client successfully connects and handles errors
2. ✅ Progress updates can be stored and retrieved accurately
3. ✅ Key expiration works correctly (progress auto-cleanup)
4. ✅ Concurrent access handles multiple research processes
5. ✅ TypeScript interfaces are properly defined and used
6. ✅ Environment configuration works in development and production
7. ✅ Error handling gracefully degrades functionality
8. ✅ Memory usage is reasonable (no progress data leaks)

## Testing Requirements
- Test Redis connection and reconnection
- Test concurrent progress updates for multiple topics
- Test progress retrieval during active research
- Test cleanup and expiration functionality
- Test error scenarios (Redis down, network issues)

## Dependencies
- Redis server (local development setup)
- Redis client library (ioredis or node-redis)
- Update package.json with Redis dependencies

## Expected Outcome
- Robust Redis infrastructure for real-time progress tracking
- Foundation for step-by-step progress updates
- Scalable architecture supporting multiple concurrent research processes
- Clean separation of concerns with proper error handling