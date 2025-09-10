# Design Document

## Overview

This design implements real-time progress tracking for the research and content generation process by leveraging Redis for progress state management and the existing polling mechanism for updates. The system will provide step-by-step visibility into the research process, immediate display of main topic results, and background tracking of subtopic generation.

## Architecture

### Current System Flow
1. User submits topic on landing page → redirected to `/learn/topic-slug`
2. Frontend calls `generateContent` API
3. Backend calls `researchAndGenerate` in `iterativeResearch.ts`
4. Frontend polls `getResearchStats` to check completion status
5. Process completes when all subtopics are done

### Enhanced System Flow
1. User submits topic → redirected to `/learn/topic-slug`
2. Frontend calls `generateContent` API (non-blocking for main topic)
3. Backend stores progress updates in Redis during research steps
4. Frontend polls enhanced `getResearchStats` for real-time progress
5. Main topic completion triggers immediate content display
6. Subtopic research continues in background with progress tracking

## Components and Interfaces

### 1. Progress State Management (Redis)

**Progress State Schema:**
```typescript
interface ResearchProgressState {
  topicId: string;
  mainTopicStatus: 'pending' | 'in_progress' | 'completed' | 'error';
  currentStep: number;
  totalSteps: number;
  stepDetails: {
    stepNumber: number;
    stepName: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    result?: string;
    error?: string;
  }[];
  subtopicsStatus: {
    total: number;
    completed: number;
    inProgress: string[];
    errors: string[];
  };
  mainTopicContent?: any;
  lastUpdated: Date;
}
```

**Redis Key Structure:**
- `research_progress:{topicId}` - Main progress state
- `research_step:{topicId}:{stepNumber}` - Individual step details
- TTL: 24 hours for cleanup

### 2. Progress Tracking Service

**Location:** `app/src/learning/api/progressTracker.ts`

```typescript
class ResearchProgressTracker {
  // Initialize progress tracking for a topic
  async initializeProgress(topicId: string, totalSteps: number): Promise<void>
  
  // Update current step status
  async updateStepStatus(topicId: string, stepNumber: number, status: StepStatus, details?: any): Promise<void>
  
  // Mark main topic as completed with content
  async completeMainTopic(topicId: string, content: any): Promise<void>
  
  // Update subtopic progress
  async updateSubtopicProgress(topicId: string, subtopicTitle: string, status: string): Promise<void>
  
  // Get current progress state
  async getProgressState(topicId: string): Promise<ResearchProgressState | null>
  
  // Clean up completed progress data
  async cleanupProgress(topicId: string): Promise<void>
}
```

### 3. Enhanced Research Functions

**Modified `generateContentHandler` (generateContent.ts):**
- Add database content check at the beginning
- Initialize progress tracking
- Return immediately after main topic completion
- Continue subtopic research in background

**Modified `researchAndGenerate` (iterativeResearch.ts):**
- Add progress tracking calls at each research step
- Separate main topic and subtopic processing
- Update Redis with step-by-step progress

### 4. Enhanced getResearchStats Operation

**Enhanced Response Schema:**
```typescript
interface EnhancedResearchStats {
  // Existing fields
  totalTopics: number;
  researchedTopics: number;
  
  // New progress fields
  progressState?: ResearchProgressState;
  mainTopicReady: boolean;
  mainTopicContent?: any;
  realTimeProgress: {
    currentStep: string;
    stepProgress: number; // 0-100
    estimatedTimeRemaining?: number;
  };
}
```

### 5. Frontend Progress Display

**Progress UI Components:**
- `ResearchProgressIndicator` - Shows current step and progress
- `StepResultDisplay` - Shows completed step results with timing
- `MainTopicContentDisplay` - Immediately shows main topic when ready
- `SubtopicProgressTracker` - Background subtopic progress

## Data Models

### Database Changes
No new database tables required. Existing `GeneratedContent` and `Topic` tables will be used.

### Redis Data Structure
```
research_progress:{topicId} = {
  topicId: string,
  mainTopicStatus: string,
  currentStep: number,
  totalSteps: number,
  stepDetails: StepDetail[],
  subtopicsStatus: SubtopicStatus,
  mainTopicContent?: any,
  lastUpdated: Date
}
```

## Error Handling

### Progress Tracking Errors
- Redis unavailable: Fallback to basic status without detailed progress
- Step tracking failure: Log error but continue research process
- Progress state corruption: Reinitialize progress tracking

### Research Process Errors
- Step failure: Store error in progress state and display to user
- Main topic failure: Show error state and allow retry
- Subtopic failure: Continue with other subtopics, mark failed ones

### Recovery Strategies
- Progress state recovery from database content status
- Graceful degradation when Redis is unavailable
- Automatic cleanup of stale progress data

## Implementation Phases

### Phase 1: Progress Infrastructure
- Create `ResearchProgressTracker` class
- Implement Redis progress state management
- Add progress tracking to research functions

### Phase 2: API Enhancement
- Enhance `getResearchStats` operation
- Modify `generateContentHandler` for database checks
- Implement main topic/subtopic separation

### Phase 3: Frontend Integration
- Create progress display components
- Implement real-time progress updates
- Add main topic immediate display

### Phase 4: Background Processing
- Implement subtopic background processing
- Add subtopic progress tracking
- Implement cleanup mechanisms

## Performance Considerations

### Redis Optimization
- Use Redis pipelines for batch progress updates
- Implement efficient key expiration strategies
- Monitor Redis memory usage and performance

### Polling Optimization
- Implement exponential backoff for polling
- Reduce polling frequency after main topic completion
- Add client-side caching for progress states

### Background Processing
- Use proper async/await patterns for subtopic research
- Implement queue-based processing for high load
- Add resource limits for concurrent subtopic research

## Security Considerations

### Access Control
- Ensure progress data is user-scoped
- Validate topic ownership before progress updates
- Implement rate limiting for progress polling

### Data Privacy
- No sensitive data in progress states
- Automatic cleanup of progress data
- Secure Redis configuration

## Monitoring and Observability

### Metrics
- Progress update frequency and latency
- Redis performance metrics
- Research completion rates and timing
- Error rates by research step

### Logging
- Structured logging for progress updates
- Research step timing and performance
- Error tracking and debugging information

### Alerting
- Redis connection failures
- High error rates in research steps
- Performance degradation alerts