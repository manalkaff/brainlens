# Task 1: Store Subtopics in Database

## Problem
Currently, the `processSubtopicsInBackground` function in `iterativeResearch.ts` processes subtopics but does not store them in the database like the main topic. The subtopic results need to be persisted so they can be retrieved later without regenerating.

## Current State Analysis
- Location: `app/src/learning/api/iterativeResearch.ts:244-308`
- Function: `processSubtopicsInBackground`
- Issue: Subtopic results are not stored in database after processing
- Research results are tracked in Redis via `progressTracker` but not persisted

## Required Changes

### 1. Modify `processSubtopicsInBackground` function
- After each subtopic research is completed (line 274), store the result in database
- Use existing `storeUserContent` method for persistence
- Ensure proper parent-child relationship in Topic entity

### 2. Database Storage Implementation
- Store each subtopic as a separate Topic entity with:
  - `parentId` pointing to main topic
  - `depth = 1` (since these are first-level subtopics)
  - `status = 'COMPLETED'`
- Store content using existing `storeGeneratedContent` method
- Use `generateUniqueSlug` to avoid slug conflicts

### 3. Update Progress Tracking
- After storing each subtopic, update progress with database ID
- Ensure Redis progress tracking includes persistence confirmation

## Implementation Steps

1. **Add database storage after subtopic completion (around line 285)**:
   ```typescript
   // After successful subtopic research
   await this.storeUserContent(subtopic.title, result.result, userContext);
   ```

2. **Store subtopic in Topic entity with proper hierarchy**:
   - Find or create subtopic in Topic table
   - Set parentId to main topic ID
   - Use existing `storeToDatabase` logic for subtopics

3. **Update progress tracking to include database IDs**:
   ```typescript
   await progressTracker.updateSubtopicProgress(mainTopicId, subtopic.title, {
     status: 'completed',
     progress: 100,
     topicId: storedTopicId, // Add database ID
     result: {
       content: result.result.content.content,
       sourcesCount: result.result.sources.length
     }
   });
   ```

## Files to Modify
- `app/src/learning/api/iterativeResearch.ts` (primary)
- `app/src/learning/api/progressTracker.ts` (if progress structure needs updates)

## Validation
- After implementation, verify subtopics appear in database with correct parent relationships
- Check that content is stored and retrievable
- Ensure no duplicate subtopics are created on re-runs

## Testing
- Create a new topic research
- Wait for subtopics to complete in background
- Query database to confirm subtopics are stored
- Verify content retrieval works for subtopics

## Success Criteria
- ✅ Subtopics are stored in Topic table with correct parentId
- ✅ Subtopic content is stored in GeneratedContent table
- ✅ Progress tracking includes database persistence confirmation
- ✅ No duplicate subtopics created on subsequent runs
- ✅ Run `npx tsc` without errors