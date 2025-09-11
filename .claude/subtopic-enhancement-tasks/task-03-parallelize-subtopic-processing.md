# Task 3: Parallelize Subtopic Processing

## Problem
The `processSubtopicsInBackground` function currently processes subtopics sequentially (line 255: `for (const subtopic of subtopics)`), which is slow. Need to make it run in parallel while maintaining the same functionality.

## Current State Analysis
- Location: `app/src/learning/api/iterativeResearch.ts:244-308`
- Current implementation: Sequential processing with `for` loop
- Performance issue: Each subtopic waits for the previous one to complete
- Functionality to preserve: Progress tracking, error handling, database storage

## Required Changes

### 1. Convert Sequential to Parallel Processing
Replace the sequential `for` loop with `Promise.allSettled()` to process all subtopics simultaneously while maintaining error isolation.

### 2. Maintain Progress Tracking
- Ensure each subtopic's progress is tracked independently
- Update progress for completed subtopics as they finish
- Handle partial completions gracefully

### 3. Error Handling
- Use `Promise.allSettled()` to prevent one failed subtopic from affecting others
- Log individual subtopic failures
- Continue processing remaining subtopics even if some fail

## Implementation Steps

1. **Replace sequential loop with parallel processing**:
   ```typescript
   // Replace this:
   for (const subtopic of subtopics) {
     // processing logic
   }
   
   // With this:
   const subtopicPromises = subtopics.map(async (subtopic) => {
     // same processing logic wrapped in async function
   });
   
   const results = await Promise.allSettled(subtopicPromises);
   ```

2. **Preserve individual progress tracking**:
   - Each subtopic maintains its own progress updates
   - Progress tracking calls remain the same within each subtopic processor
   - Final completion check waits for all to finish

3. **Handle results and errors**:
   ```typescript
   results.forEach((result, index) => {
     const subtopic = subtopics[index];
     if (result.status === 'rejected') {
       console.error(`Subtopic "${subtopic.title}" failed:`, result.reason);
       // Update progress tracker with failure
     }
   });
   ```

4. **Maintain completion logic**:
   - Still call `progressTracker.completeResearch(mainTopicId)` after all are done
   - Count successful vs failed subtopics
   - Log summary of parallel processing results

## Implementation Details

### Before (Sequential):
```typescript
for (const subtopic of subtopics) {
  try {
    // progress start
    // research subtopic
    // progress complete
  } catch (error) {
    // handle error
  }
}
```

### After (Parallel):
```typescript
const subtopicPromises = subtopics.map(async (subtopic) => {
  try {
    // same logic as before, but in async function
    await progressTracker.updateSubtopicProgress(mainTopicId, subtopic.title, {
      status: 'in_progress',
      progress: 0
    });
    
    const result = await this.researchSingleTopic(/* ... */);
    
    // Store in database (from Task 1)
    await this.storeUserContent(subtopic.title, result.result, userContext);
    
    await progressTracker.updateSubtopicProgress(mainTopicId, subtopic.title, {
      status: 'completed',
      progress: 100,
      result: {
        content: result.result.content.content,
        sourcesCount: result.result.sources.length
      }
    });
    
    return { subtopic, result, success: true };
  } catch (error) {
    console.error(`Failed to process subtopic "${subtopic.title}":`, error);
    await progressTracker.updateSubtopicProgress(mainTopicId, subtopic.title, {
      status: 'failed',
      progress: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return { subtopic, error, success: false };
  }
});

const results = await Promise.allSettled(subtopicPromises);
const successfulCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
console.log(`🏁 Parallel subtopics completed: ${successfulCount}/${subtopics.length} successful`);
```

## Files to Modify
- `app/src/learning/api/iterativeResearch.ts` (primary change in `processSubtopicsInBackground`)

## Performance Considerations
- **Rate Limiting**: Consider if OpenAI API has rate limits for parallel requests
- **Memory Usage**: Multiple parallel requests will use more memory
- **Error Isolation**: Failed subtopics won't block successful ones

## Validation
- All subtopics start processing simultaneously
- Progress updates appear for multiple subtopics at once
- Failed subtopics don't prevent others from completing
- Total processing time is significantly reduced

## Testing
- Start topic research and observe subtopic processing
- Verify multiple subtopics show "in_progress" status simultaneously
- Test with intentional failures to ensure error isolation
- Measure total processing time improvement

## Success Criteria
- ✅ Subtopics process in parallel instead of sequentially
- ✅ Individual progress tracking maintained
- ✅ Error handling preserves functionality
- ✅ Total processing time significantly reduced
- ✅ All existing functionality preserved
- ✅ Run `npx tsc` without errors