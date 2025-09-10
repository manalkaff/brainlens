# Task 3: Integrate Step-by-Step Progress Updates

## Overview
Modify the AI learning agent and iterative research system to emit real-time progress updates for each of the 6 research steps. This will provide the granular step-by-step tracking requested by the user.

## Current State
- aiLearningAgent has 6 distinct steps (0-5) with console logging
- No progress updates sent to Redis
- No timing information stored for individual steps
- No way to track step completion for frontend display

## Requirements

### 1. Step Progress Integration in AI Learning Agent
- Emit progress updates at the start and completion of each step
- Store step timing information (start time, duration)
- Include step results and status information
- Handle step failures gracefully with error tracking

### 2. Progress Update Integration Points
- Step 0: Understanding topic from research
- Step 1: Planning research strategy  
- Step 2: Executing research plan
- Step 3: Analyzing research results
- Step 4: Generating comprehensive content
- Step 5: Identifying subtopics

### 3. Enhanced Progress Information
- Step-specific progress percentages
- Detailed step descriptions for UI display
- Intermediate results for immediate user feedback
- Error details for failed steps

## Implementation Details

### Files to Modify

#### 1. AI Learning Agent Core
**File:** `/home/manalkaff/projects/brainlens/app/src/learning/api/aiLearningAgent/index.ts`
- Integrate Redis progress tracker
- Add progress updates before/after each step
- Include step timing and result information

#### 2. Iterative Research Engine
**File:** `/home/manalkaff/projects/brainlens/app/src/learning/api/iterativeResearch.ts`
- Track main topic vs subtopic research phases
- Update overall research status
- Coordinate progress updates across the entire research process

#### 3. Generate Content Handler
**File:** `/home/manalkaff/projects/brainlens/app/src/learning/api/generateContent.ts`
- Initialize research progress tracking
- Handle progress completion and cleanup

### Step Progress Implementation

#### Modified AI Learning Agent researchAndGenerate Function
```typescript
async researchAndGenerate(request: TopicResearchRequest): Promise<TopicResearchResult> {
  console.log(`🔬 Starting iterative research for: "${request.topic}" at depth ${request.depth}`);

  // Initialize progress tracking for main topic only
  if (request.depth === 0) {
    await progressTracker.initializeResearch(request.topic, {
      status: 'researching_main',
      currentStep: 0,
      totalSteps: 6,
      progress: 0,
      message: 'Starting research process...'
    });
  }

  const startTime = Date.now();
  
  try {
    // Step 0: Understanding topic from research
    if (request.depth === 0) {
      await progressTracker.startStep(request.topic, 0, 'Understanding topic from research');
    }
    
    let understanding: TopicUnderstanding;
    if (request.understanding) {
      understanding = request.understanding;
      console.log(`📖 Using provided topic understanding for: "${request.topic}"`);
    } else {
      console.log("🔍 Step 0: Understanding topic from research...");
      const step0Start = Date.now();
      understanding = await this.understandTopic(request.topic);
      const step0Duration = (Date.now() - step0Start) / 1000;
      console.log(`✅ Step 0 completed in ${step0Duration.toFixed(2)} seconds`);
      
      if (request.depth === 0) {
        await progressTracker.completeStep(request.topic, 0, 'Understanding topic from research', {
          understanding: understanding.summary,
          keyPoints: understanding.keyPoints
        }, step0Duration);
      }
    }

    // Step 1: Planning research strategy
    if (request.depth === 0) {
      await progressTracker.startStep(request.topic, 1, 'Planning research strategy');
    }
    
    console.log("📋 Step 1: Planning research strategy...");
    const step1Start = Date.now();
    const researchPlan = await this.researchPlanning.planResearch(
      request.topic,
      understanding,
      request.userContext,
    );
    const step1Duration = (Date.now() - step1Start) / 1000;
    console.log(`✅ Step 1 completed in ${step1Duration.toFixed(2)} seconds`);
    
    if (request.depth === 0) {
      await progressTracker.completeStep(request.topic, 1, 'Planning research strategy', {
        strategy: researchPlan.researchStrategy,
        queriesCount: researchPlan.queries.length,
        enginesUsed: researchPlan.engines
      }, step1Duration);
    }

    // Continue similar pattern for remaining steps...
    // [Steps 2-5 implementation following same pattern]

    const result: TopicResearchResult = {
      // ... existing result construction
    };

    // Complete main topic research if this is depth 0
    if (request.depth === 0) {
      await progressTracker.completeMainTopic(request.topic, {
        content: result.content.content,
        subtopicsCount: result.subtopics.length,
        sourcesCount: result.sources.length,
        researchDuration: researchDuration
      });
    }

    return result;
    
  } catch (error) {
    // Handle step failure
    if (request.depth === 0) {
      await progressTracker.setError(request.topic, error.message);
    }
    throw error;
  }
}
```

### Step Definitions and Progress Mapping

```typescript
interface StepDefinition {
  stepNumber: number;
  name: string;
  description: string;
  estimatedDuration: number; // seconds
  progressWeight: number; // contribution to overall progress (0-100)
}

const RESEARCH_STEPS: StepDefinition[] = [
  {
    stepNumber: 0,
    name: 'Understanding Topic',
    description: 'Analyzing and understanding the topic scope and context',
    estimatedDuration: 15,
    progressWeight: 15
  },
  {
    stepNumber: 1, 
    name: 'Planning Research',
    description: 'Creating strategic research plan and identifying sources',
    estimatedDuration: 10,
    progressWeight: 10
  },
  {
    stepNumber: 2,
    name: 'Executing Research',
    description: 'Gathering information from multiple search engines and sources',
    estimatedDuration: 30,
    progressWeight: 35
  },
  {
    stepNumber: 3,
    name: 'Analyzing Results',
    description: 'Synthesizing and analyzing gathered research data',
    estimatedDuration: 20,
    progressWeight: 20
  },
  {
    stepNumber: 4,
    name: 'Generating Content',
    description: 'Creating comprehensive learning content from research',
    estimatedDuration: 15,
    progressWeight: 15
  },
  {
    stepNumber: 5,
    name: 'Identifying Subtopics',
    description: 'Extracting related subtopics for deeper exploration',
    estimatedDuration: 5,
    progressWeight: 5
  }
];
```

### Progress Integration in Iterative Research Engine

```typescript
// In researchAndGenerate function
async researchAndGenerate(
  topic: string,
  options: IterativeResearchOptions = {},
  userContext?: { userId?: string; level?: string; style?: string }
): Promise<IterativeResearchResult> {
  
  // Initialize overall research tracking
  await progressTracker.initializeResearch(topic, {
    status: 'researching_main',
    phase: 'main_topic',
    message: 'Starting comprehensive research process'
  });

  try {
    // Step 1: Research main topic (calls aiLearningAgent with progress updates)
    console.log("🔬 Step 1: Researching main topic...");
    const mainResult = await this.researchSingleTopic({
      topic,
      depth: 0,
      maxDepth,
      userContext: options.userContext
    }, options.forceRefresh, userContext);
    
    // Main topic completed - update status
    await progressTracker.updatePhase(topic, 'subtopics', 'Main topic research completed, starting subtopics');
    
    // Step 2: Research subtopics in background
    if (mainResult.result.subtopics.length > 0) {
      // Start subtopics but don't wait for completion
      this.processSubtopicsInBackground(
        mainResult.result.subtopics,
        topic,
        options,
        userContext
      );
    } else {
      await progressTracker.completeResearch(topic);
    }
    
    // Return main topic result immediately
    const result: IterativeResearchResult = {
      mainTopic: mainResult.result,
      subtopicResults: new Map(), // Empty for now, will be populated in background
      totalTopicsProcessed: 1,
      totalProcessingTime: Date.now() - startTime,
      cacheHits: mainResult.fromCache ? 1 : 0,
      cacheKey: mainResult.result.cacheKey
    };

    return result;
    
  } catch (error) {
    await progressTracker.setError(topic, error.message);
    throw error;
  }
}

// New method for background subtopic processing
private async processSubtopicsInBackground(
  subtopics: SubtopicInfo[],
  mainTopic: string,
  options: IterativeResearchOptions,
  userContext?: any
): Promise<void> {
  try {
    // Process subtopics without blocking main response
    for (const subtopic of subtopics) {
      await progressTracker.updateSubtopicProgress(mainTopic, subtopic.title, {
        status: 'in_progress',
        progress: 0
      });
      
      // Research subtopic
      const result = await this.researchSingleTopic({
        topic: subtopic.title,
        depth: 1,
        maxDepth: options.maxDepth || 3,
        userContext: options.userContext
      }, options.forceRefresh, userContext);
      
      await progressTracker.updateSubtopicProgress(mainTopic, subtopic.title, {
        status: 'completed',
        progress: 100,
        result: result.result
      });
    }
    
    await progressTracker.completeResearch(mainTopic);
    
  } catch (error) {
    await progressTracker.updateSubtopicProgress(mainTopic, 'error', {
      status: 'error',
      error: error.message
    });
  }
}
```

## Integration with Generate Content Handler

```typescript
// In generateContentHandler function
export const generateContentHandler = async (req: Request, res: Response, context: any) => {
  try {
    // ... existing validation code ...
    
    const { topicId, options } = req.body;
    const topic = await context.entities.Topic.findUnique({
      where: { id: topicId }
    });

    // Initialize progress tracking
    await progressTracker.initializeResearch(topic.id, {
      status: 'starting',
      message: `Starting research for: ${topic.title}`
    });

    try {
      // Check database first (Task 1)
      const existingContent = await checkExistingContent(topicId, options, context);
      if (existingContent) {
        await progressTracker.setCompleted(topic.id, 'Found existing content');
        return res.json({
          ...existingContent,
          cached: true,
          fromDatabase: true
        });
      }

      // Use the iterative research engine (with progress tracking)
      const researchResult = await iterativeResearchEngine.researchAndGenerate(
        topic.title,
        researchOptions,
        userContext
      );

      // Store results and return main topic immediately
      await iterativeResearchEngine.storeToDatabase(researchResult, topic.slug);
      
      return res.json({
        success: true,
        content: researchResult.mainTopic.content.content,
        // ... rest of response format
        fromIterativeResearch: true,
        mainTopicOnly: true // Flag indicating subtopics are still processing
      });

    } catch (researchError) {
      await progressTracker.setError(topic.id, researchError.message);
      // ... existing error handling
    }
  } catch (error) {
    // ... existing error handling
  }
}
```

## Success Criteria

1. ✅ Each of the 6 steps emits progress updates at start and completion
2. ✅ Step timing information is accurately captured and stored
3. ✅ Step results are available for immediate UI feedback
4. ✅ Main topic completion triggers immediate response to frontend
5. ✅ Subtopics continue processing in background with progress updates
6. ✅ Error handling preserves progress state and shows specific step failures
7. ✅ TypeScript compilation succeeds without errors
8. ✅ Console logging is preserved for debugging
9. ✅ Progress percentages accurately reflect step completion weights

## Testing Requirements

- Test each individual step progress update
- Test step failure scenarios and error propagation
- Test timing accuracy for step duration measurement
- Test main topic completion while subtopics continue
- Test concurrent research processes don't interfere
- Verify Redis storage of all progress information

## Expected Outcome

- Real-time step-by-step progress visibility for users
- Immediate main topic results while subtopics process in background
- Detailed error tracking and reporting for failed steps
- Foundation for enhanced frontend progress display
- Maintained research quality and accuracy