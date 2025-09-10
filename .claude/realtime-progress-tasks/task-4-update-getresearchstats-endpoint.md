# Task 4: Update getResearchStats to Read from Redis

## Overview
Modify the existing `getResearchStats` endpoint to read real-time progress information from Redis instead of just basic database status. This will provide the frontend polling mechanism with detailed step-by-step progress updates.

## Current State
- `getResearchStats` operation in `/home/manalkaff/projects/brainlens/app/src/server/operations/iterativeResearch.ts` (line 238)
- Returns basic research statistics from database
- Frontend polls this endpoint via interval to check research status
- No step-level progress information available

## Requirements

### 1. Enhanced Progress Response Format
- Include current step information (step number, name, description)
- Provide step timing data (start time, duration, estimated remaining)
- Show step results for completed steps
- Include overall progress percentage
- Maintain backward compatibility with existing response format

### 2. Redis Integration
- Read progress data from Redis using the progressTracker
- Fall back to database-only response if Redis is unavailable
- Handle cases where research is complete but progress is still cached
- Support both main topic and subtopic progress tracking

### 3. Real-time Progress Details
- Current step being executed
- Step completion status and results
- Main topic completion status
- Subtopics progress array
- Error information for failed steps

## Implementation Details

### Files to Modify

#### 1. Update getResearchStats Operation
**File:** `/home/manalkaff/projects/brainlens/app/src/server/operations/iterativeResearch.ts`
- Modify the `getResearchStats` function (starting at line 238)
- Integrate Redis progress reading
- Enhance response format with step details

#### 2. Update Progress Types (if needed)
**File:** `/home/manalkaff/projects/brainlens/app/src/shared/progressTypes.ts`
- Add response interface for enhanced research stats
- Ensure compatibility with frontend expectations

### Enhanced Response Interface

```typescript
interface EnhancedResearchStats {
  // Existing database fields (for backward compatibility)
  topicId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ERROR';
  lastResearched?: Date;
  cacheStatus?: string;
  
  // New real-time progress fields
  realTimeProgress?: {
    isActive: boolean;
    phase: 'main_topic' | 'subtopics' | 'completed';
    currentStep?: {
      number: number;
      name: string;
      description: string;
      startTime: Date;
      estimatedDuration: number;
      progress: number; // 0-100 for current step
    };
    completedSteps: CompletedStep[];
    overallProgress: number; // 0-100 overall
    mainTopicCompleted: boolean;
    mainTopicResult?: any;
    subtopicsProgress: SubtopicProgress[];
    error?: string;
    estimatedTimeRemaining?: number;
  };
  
  // Legacy fields maintained for compatibility
  totalTopicsProcessed?: number;
  cacheHits?: number;
  processingTime?: number;
}

interface CompletedStep {
  number: number;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  result?: any;
}
```

### Updated getResearchStats Implementation

```typescript
export const getResearchStats = async (
  { topicId }: { topicId: string },
  context: any
) => {
  try {
    // Get basic database statistics (existing functionality)
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        generatedContent: {
          select: { 
            id: true,
            createdAt: true,
            contentType: true,
            userLevel: true,
            metadata: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!topic) {
      throw new HttpError(404, `Topic with ID "${topicId}" not found`);
    }

    // Base response with existing database information
    let response: EnhancedResearchStats = {
      topicId,
      status: topic.status as any,
      lastResearched: topic.lastResearched,
      cacheStatus: topic.cacheStatus,
      totalTopicsProcessed: 1,
      cacheHits: 0,
      processingTime: 0
    };

    // Try to get real-time progress from Redis
    try {
      const progressData = await progressTracker.getResearchProgress(topicId);
      
      if (progressData) {
        // Research is active or recently completed
        response.realTimeProgress = {
          isActive: progressData.status !== 'completed' && progressData.status !== 'error',
          phase: progressData.phase || 'main_topic',
          overallProgress: progressData.progress || 0,
          mainTopicCompleted: progressData.mainTopicCompleted || false,
          mainTopicResult: progressData.mainTopicResult,
          subtopicsProgress: progressData.subtopicsProgress || [],
          error: progressData.error,
          estimatedTimeRemaining: calculateEstimatedTimeRemaining(progressData)
        };

        // Include current step if research is active
        if (progressData.currentStep !== undefined && progressData.stepDetails) {
          response.realTimeProgress.currentStep = {
            number: progressData.currentStep,
            name: progressData.stepDetails.name,
            description: progressData.stepDetails.description,
            startTime: progressData.stepDetails.startTime,
            estimatedDuration: progressData.stepDetails.estimatedDuration,
            progress: progressData.stepDetails.progress || 0
          };
        }

        // Include completed steps
        if (progressData.completedSteps) {
          response.realTimeProgress.completedSteps = progressData.completedSteps;
        }

        // Override database status with real-time status if available
        if (progressData.status) {
          response.status = mapProgressStatusToDbStatus(progressData.status);
        }
      }
    } catch (redisError) {
      console.warn('Failed to get progress from Redis, using database only:', redisError);
      // Continue with database-only response
    }

    // If no real-time progress but topic is completed, check for main topic completion
    if (!response.realTimeProgress?.isActive && topic.status === 'COMPLETED') {
      const latestContent = topic.generatedContent[0];
      if (latestContent) {
        response.realTimeProgress = {
          isActive: false,
          phase: 'completed',
          overallProgress: 100,
          mainTopicCompleted: true,
          mainTopicResult: {
            contentId: latestContent.id,
            createdAt: latestContent.createdAt,
            contentType: latestContent.contentType
          },
          subtopicsProgress: []
        };
      }
    }

    return response;

  } catch (error) {
    console.error(`Failed to get research stats:`, error);
    throw new HttpError(500, `Failed to get research stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper functions
function calculateEstimatedTimeRemaining(progressData: any): number | undefined {
  if (!progressData.currentStep || progressData.progress >= 100) {
    return undefined;
  }

  const remainingProgress = 100 - progressData.progress;
  const currentStepWeight = RESEARCH_STEPS[progressData.currentStep]?.progressWeight || 10;
  const averageStepDuration = 20; // seconds, could be calculated from historical data
  
  return Math.ceil((remainingProgress / currentStepWeight) * averageStepDuration);
}

function mapProgressStatusToDbStatus(progressStatus: string): 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ERROR' {
  switch (progressStatus) {
    case 'idle':
    case 'starting':
      return 'PENDING';
    case 'researching_main':
    case 'researching_subtopics':
      return 'IN_PROGRESS';
    case 'completed':
      return 'COMPLETED';
    case 'error':
      return 'ERROR';
    default:
      return 'PENDING';
  }
}
```

### Frontend Compatibility Considerations

The enhanced response maintains backward compatibility by:
1. Keeping all existing fields in the response
2. Adding new progress data under `realTimeProgress` optional field
3. Falling back gracefully when Redis is unavailable
4. Using the same polling mechanism (no changes needed in frontend initially)

### Integration with Progress Tracker

```typescript
// Example of how progress tracker methods will be called
const progressData = await progressTracker.getResearchProgress(topicId);

// This should return an object like:
{
  status: 'researching_main',
  phase: 'main_topic',
  currentStep: 2,
  stepDetails: {
    name: 'Executing Research',
    description: 'Gathering information from multiple sources',
    startTime: new Date('2024-01-01T10:00:00Z'),
    estimatedDuration: 30,
    progress: 45
  },
  completedSteps: [
    {
      number: 0,
      name: 'Understanding Topic',
      startTime: new Date('2024-01-01T09:58:00Z'),
      endTime: new Date('2024-01-01T09:58:15Z'),
      duration: 15,
      result: { understanding: "Topic summary...", keyPoints: [...] }
    },
    {
      number: 1,
      name: 'Planning Research',
      startTime: new Date('2024-01-01T09:58:15Z'),
      endTime: new Date('2024-01-01T09:58:25Z'),
      duration: 10,
      result: { strategy: "multi-source", queriesCount: 5 }
    }
  ],
  progress: 35,
  mainTopicCompleted: false,
  subtopicsProgress: []
}
```

## Error Handling and Fallbacks

### Redis Unavailable
- Fall back to database-only response
- Log warning but don't fail the request
- Set `realTimeProgress.isActive = false`

### Invalid Progress Data
- Validate progress data structure
- Sanitize step information
- Provide default values for missing fields

### Concurrent Access
- Handle cases where progress is being updated while reading
- Ensure atomic read operations
- Handle Redis key expiration gracefully

## Success Criteria

1. ✅ Enhanced response includes detailed step progress information
2. ✅ Backward compatibility maintained with existing frontend
3. ✅ Redis integration provides real-time progress updates
4. ✅ Graceful degradation when Redis is unavailable
5. ✅ Step timing and completion information is accurate
6. ✅ Subtopic progress tracking works correctly
7. ✅ Error scenarios are handled appropriately
8. ✅ TypeScript compilation succeeds
9. ✅ Frontend polling continues to work without modifications

## Testing Requirements

- Test with active research in progress
- Test with completed research (should show final results)
- Test with Redis unavailable (should fall back gracefully)
- Test with invalid/corrupted progress data in Redis
- Test concurrent access during progress updates
- Test step transition edge cases
- Verify response format matches interface definitions

## Expected Outcome

- Frontend gets detailed real-time progress updates through existing polling mechanism
- Step-by-step progress is visible without changing frontend architecture
- Robust error handling ensures service reliability
- Foundation for enhanced UI progress display
- Seamless integration with existing research workflow