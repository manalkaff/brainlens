# Task 4: Create Subtopic Content API

## Problem
Need a new API endpoint to fetch subtopic content from the database, similar to how the main topic content is fetched in `generateContentHandler`. The API should handle cases where subtopic is not found or still generating.

## Current State Analysis
- Current API: `learningContentGeneration` (POST `/api/learning/generate-content`) only handles main topics
- Reference implementation: `generateContentHandler` in `app/src/learning/api/generateContent.ts`
- Database structure: Subtopics stored as Topic entities with `parentId` pointing to main topic
- Need: Similar API for fetching subtopic content by main topic ID + subtopic ID

## Required Implementation

### 1. Create New API Endpoint
Add new Wasp API definition in `main.wasp`:
```wasp
api getSubtopicContent {
  fn: import { getSubtopicContentHandler } from "@src/learning/api/getSubtopicContent",
  entities: [Topic, GeneratedContent],
  httpRoute: (POST, "/api/learning/get-subtopic-content")
}
```

### 2. Create API Handler
New file: `app/src/learning/api/getSubtopicContent.ts`

**Input Parameters**:
- `mainTopicId`: ID of the parent topic
- `subtopicId`: ID of the subtopic to fetch content for
- `options`: User preferences (level, style, etc.)

**Response Logic**:
1. **Database Check**: Look for existing content for this subtopic
2. **Generation Check**: If not found, check if subtopics are currently generating using Redis progress tracker
3. **Progress Response**: If generating, return progress status
4. **Not Found**: If not generating and not found, return "content not found"

### 3. Database Query Logic
```typescript
// Find subtopic by ID and verify it belongs to main topic
const subtopic = await context.entities.Topic.findFirst({
  where: {
    id: subtopicId,
    parentId: mainTopicId
  }
});

if (!subtopic) {
  return res.status(404).json({ error: 'Subtopic not found' });
}

// Look for existing content
const existingContent = await context.entities.GeneratedContent.findFirst({
  where: {
    topicId: subtopicId,
    userLevel: options.userLevel || 'intermediate',
    learningStyle: options.learningStyle || 'textual'
  }
});
```

### 4. Progress Tracking Integration
Use existing `progressTracker` to check if subtopics are generating:
```typescript
import { progressTracker } from './progressTracker';

// Check if main topic has subtopics in progress
const progress = await progressTracker.getProgress(mainTopicId);
const isSubtopicGenerating = progress?.subtopics?.[subtopic.title]?.status === 'in_progress';

if (isSubtopicGenerating) {
  return res.json({
    success: false,
    generating: true,
    progress: progress.subtopics[subtopic.title],
    message: `Subtopic "${subtopic.title}" is currently being generated`
  });
}
```

### 5. Response Format
Match the format of main topic content API:
```typescript
// Success response
return res.json({
  success: true,
  content: existingContent.content,
  metadata: existingContent.metadata,
  sources: existingContent.sources || [],
  topicId: subtopicId,
  parentTopicId: mainTopicId,
  fromDatabase: true
});

// Not found response
return res.status(404).json({
  success: false,
  error: 'Content not found',
  generating: false,
  message: `No content found for subtopic "${subtopic.title}"`
});
```

## Implementation Steps

1. **Add API definition to `main.wasp`**:
   - Insert new API block in the learning APIs section
   - Include required entities: Topic, GeneratedContent

2. **Create `getSubtopicContent.ts` handler**:
   - Import required dependencies
   - Implement request validation
   - Add database queries
   - Integrate progress tracking
   - Handle error cases

3. **Response format consistency**:
   - Match existing API response structure
   - Include proper error handling
   - Add appropriate HTTP status codes

4. **Integration with progress tracker**:
   - Check Redis for current generation status
   - Return progress information when generating
   - Handle cases where progress data is stale

## Files to Create/Modify
- `app/main.wasp` (add new API definition)
- `app/src/learning/api/getSubtopicContent.ts` (new file)

## API Contract

### Request
```typescript
POST /api/learning/get-subtopic-content
{
  "mainTopicId": "uuid",
  "subtopicId": "uuid", 
  "options": {
    "userLevel": "beginner" | "intermediate" | "advanced",
    "learningStyle": "textual" | "visual" | "interactive"
  }
}
```

### Response (Success)
```typescript
{
  "success": true,
  "content": "MDX content string",
  "metadata": { /* content metadata */ },
  "sources": [ /* source array */ ],
  "topicId": "subtopic-uuid",
  "parentTopicId": "main-topic-uuid",
  "fromDatabase": true
}
```

### Response (Generating)
```typescript
{
  "success": false,
  "generating": true,
  "progress": {
    "status": "in_progress",
    "progress": 45,
    "message": "Researching subtopic..."
  },
  "message": "Subtopic is currently being generated"
}
```

### Response (Not Found)
```typescript
{
  "success": false,
  "error": "Content not found",
  "generating": false,
  "message": "No content found for subtopic"
}
```

## Validation
- API endpoint responds to POST requests
- Database queries work correctly
- Progress tracking integration functions
- Error handling covers all edge cases
- Response format matches existing APIs

## Testing
- Test with existing subtopic IDs
- Test with non-existent subtopic IDs
- Test during active subtopic generation
- Test error cases (invalid IDs, missing params)
- Verify response format consistency

## Success Criteria
- ✅ New API endpoint created and accessible
- ✅ Database queries for subtopic content work
- ✅ Progress tracking integration functions
- ✅ Proper error handling for all cases
- ✅ Response format matches existing API standards
- ✅ Run `npx tsc` without errors