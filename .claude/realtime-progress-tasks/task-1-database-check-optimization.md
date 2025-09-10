# Task 1: Add Database Check at Start of generateContentHandler

## Overview
Fix the generateContentHandler function to check for existing content in the database before starting research, as mentioned in the user request.

## Current Problem
The generateContentHandler function in `app/src/learning/api/generateContent.ts` currently doesn't check for existing content at the start. It only falls back to database content if research fails. This causes unnecessary API calls and research when content already exists.

## Requirements

### 1. Add Database Check at Function Start
- Check for existing content in database before starting iterative research
- Look for content that matches the topicId and user preferences
- Return existing content immediately if found and valid
- Only proceed with research if no existing content is found

### 2. Content Validation Logic
- Check if existing content is recent enough (configurable TTL)
- Validate content quality/completeness
- Consider user-level and learning style preferences
- Handle content versioning if applicable

### 3. Response Format Consistency
- Ensure database-retrieved content matches the same response format as fresh research
- Include proper metadata flags (`fromDatabase: true`, `cached: true`, etc.)
- Maintain source attribution consistency

## Implementation Details

### File to Modify
- `/home/manalkaff/projects/brainlens/app/src/learning/api/generateContent.ts`

### Function to Modify
- `generateContentHandler` function (lines 5-146)

### Steps
1. **Add database check at the very beginning** (after authentication and validation, before calling iterativeResearchEngine)
2. **Query existing content** using similar logic to the fallback code (lines 92-113) but more comprehensive
3. **Add content freshness validation** - check timestamps, user preferences match
4. **Return early** if valid existing content is found
5. **Add proper logging** for cache hits vs misses
6. **Add configuration** for content TTL settings

### Database Query Logic
```typescript
// Check for existing content matching user preferences
const existingContent = await context.entities.GeneratedContent.findFirst({
  where: {
    topicId,
    // Match user level and style preferences if specified
    userLevel: options.userLevel || 'intermediate',
    learningStyle: options.learningStyle || 'textual',
    NOT: {
      userLevel: "cache" // Exclude cache entries
    }
  },
  include: {
    topic: true // Include topic info for metadata
  },
  orderBy: { createdAt: 'desc' }
});
```

### Content Freshness Check
- Add configurable TTL (e.g., 7 days for generated content)
- Check if content matches current user preferences
- Validate content completeness (has required sections, sources, etc.)

### Success Criteria
1. ✅ Database check happens before any research API calls
2. ✅ Existing valid content returns immediately 
3. ✅ Response format matches iterative research output
4. ✅ Proper logging for cache hits vs research calls
5. ✅ Configuration for content freshness TTL
6. ✅ TypeScript compilation passes without errors
7. ✅ Existing functionality remains unchanged when no content exists

## Testing Notes
- Test with existing content in database
- Test with expired content
- Test with mismatched user preferences
- Test fallback to research when no content exists
- Verify response format consistency

## Expected Outcome
- Significant reduction in unnecessary API calls and research time
- Faster response times for repeat topic requests
- Maintained consistency with existing API contract
- Foundation for real-time progress tracking (subsequent tasks)