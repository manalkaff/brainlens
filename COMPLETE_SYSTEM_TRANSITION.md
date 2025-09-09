# Complete System Transition: Migrate to Iterative Research Engine

## Overview
The BrainLens application currently has TWO research systems running in parallel, causing inconsistencies and failures. This transition will **COMPLETELY** migrate from the legacy research system to the new Iterative Research Engine and remove all old code.

## Current Problem
- **Landing Page**: Uses `startTopicResearch` (OLD system)
- **Content Generation**: Uses `generateContentHandler` (NEW-ish system) 
- **Iterative Research**: `iterativeResearch.ts` is implemented but **NEVER USED**
- **Result**: Data format mismatches, content generation failures, inconsistent user experience

## Required Changes

### 1. Update Landing Page Research Trigger

**File**: `app/src/landing-page/LandingPage.tsx`

**REPLACE** (lines ~98-104):
```typescript
await startTopicResearch({ 
  topicId: topic.id,
  userContext: {
    userLevel: 'intermediate',
    learningStyle: 'mixed'
  }
});
```

**WITH**:
```typescript
await startIterativeResearch({
  topicSlug: topic.slug,
  options: {
    maxDepth: 3,
    forceRefresh: false,
    userContext: {
      level: 'intermediate',
      interests: [],
      previousKnowledge: []
    }
  }
});
```

**ALSO UPDATE** import statement:
```typescript
// REMOVE:
import { createTopic, startTopicResearch } from 'wasp/client/operations';

// REPLACE WITH:
import { createTopic, startIterativeResearch } from 'wasp/client/operations';
```

### 2. Remove Legacy Research Operations from Wasp Config

**File**: `app/main.wasp`

**DELETE** these operations (lines ~366-384):
```wasp
// Research Operations
action startTopicResearch {
  fn: import { startTopicResearch } from "@src/learning/research/operations",
  entities: [Topic, VectorDocument, UserTopicProgress]
}

action cancelTopicResearch {
  fn: import { cancelTopicResearch } from "@src/learning/research/operations",
  entities: [Topic]
}

query getResearchStatus {
  fn: import { getResearchStatus } from "@src/learning/research/operations",
  entities: [Topic]
}

query getResearchResults {
  fn: import { getResearchResults } from "@src/learning/research/operations",
  entities: [Topic, VectorDocument]
}
```

**KEEP** (these are the new system):
```wasp
// Iterative Research Operations (AI Learning Engine)
action startIterativeResearch {
  fn: import { startIterativeResearch } from "@src/server/operations/iterativeResearch",
  entities: [Topic, UserTopicProgress, VectorDocument, GeneratedContent]
}

action expandTopicDepth {
  fn: import { expandTopicDepth } from "@src/server/operations/iterativeResearch",
  entities: [Topic, UserTopicProgress, VectorDocument]
}

action generateSubtopicsForTopic {
  fn: import { generateSubtopics } from "@src/server/operations/iterativeResearch",
  entities: [Topic, UserTopicProgress]
}
```

### 3. Update Sources Operations to Use New System

**File**: `app/src/learning/sources/operations.ts`

**FIND** the import and usage of old research system:
```typescript
const { startTopicResearch } = await import('../research/operations');
await startTopicResearch(
```

**REPLACE WITH**:
```typescript
const { startIterativeResearch } = await import('wasp/client/operations');
await startIterativeResearch({
  topicSlug: topic.slug,
  options: {
    forceRefresh: true,
    userContext: {
      level: 'intermediate',
      interests: [],
      previousKnowledge: []
    }
  }
});
```

### 4. Update Frontend Hooks to Use New Research Status

**File**: `app/src/learning/context/TopicContext.tsx`

**REPLACE** research status query (lines ~150-165):
```typescript
// REMOVE:
const { 
  data: researchStatus, 
  isLoading: researchLoading,
  error: researchError,
  refetch: refetchResearchStatus
} = useQuery(getResearchStatus, { topicId: topic?.id || '' }, {
  enabled: !!topic?.id,
  refetchInterval: (data: any) => {
    if (data?.status === 'active' || data?.status === 'queued') {
      return 2000;
    }
    return 10000;
  }
});

// REPLACE WITH:
const { 
  data: researchStats, 
  isLoading: researchLoading,
  error: researchError,
  refetch: refetchResearchStats
} = useQuery(getResearchStats, { topicId: topic?.id || '' }, {
  enabled: !!topic?.id,
  refetchInterval: 5000 // Check every 5 seconds
});
```

### 5. Delete Legacy Research Files

**DELETE** these entire files:
```bash
rm app/src/learning/research/operations.ts
rm app/src/learning/research/api.ts
rm app/src/learning/research/streamingApi.ts
rm app/src/learning/research/integration.ts
rm app/src/learning/research/index.ts
```

**KEEP** (these are still needed for vector operations and agents):
- `app/src/learning/research/agents.ts`
- `app/src/learning/research/aggregation.ts`
- `app/src/learning/research/vectorStore.ts`
- `app/src/learning/research/embeddings.ts`
- All files under `app/src/learning/research/searxng/`

### 6. Update Explore Tab to Use New Research System

**File**: Search for any references to old research operations in:
- `app/src/learning/components/tabs/ExploreTab.tsx`
- `app/src/learning/components/research/ResearchStatusDisplay.tsx`

**REPLACE** any calls to:
- `startTopicResearch` → `startIterativeResearch`
- `getResearchStatus` → `getResearchStats`
- `getResearchResults` → Use data from `GeneratedContent` table instead

### 7. Simplify generateContent.ts Logic

**File**: `app/src/learning/api/generateContent.ts`

**SIMPLIFY** the content checking logic (lines ~88-130):

**REMOVE** the complex cache checking and replace with:
```typescript
// Check if we have research results from iterative research
const existingContent = await context.entities.GeneratedContent.findFirst({
  where: {
    topicId,
    contentType: 'exploration',
    NOT: {
      userLevel: "cache"
    }
  }
});

if (existingContent) {
  return res.json({
    success: true,
    content: existingContent.content,
    metadata: existingContent.metadata,
    sources: existingContent.sources || [],
    topicId: existingContent.topicId,
    fromDatabase: true
  });
}

// If no content found, research hasn't completed yet
return res.status(400).json({ 
  error: 'Topic research in progress',
  message: 'Please wait for research to complete before generating content',
  needsResearch: false,
  topicId: topic.id
});
```

### 8. Update All Frontend Hooks

**Files to update**:
- `app/src/learning/hooks/useIterativeResearch.ts` (ensure it's being used)
- `app/src/learning/hooks/useContentGeneration.ts` (update error handling)
- `app/src/learning/hooks/useStreamingContent.ts` (update API expectations)

**Replace any references to**:
- `startTopicResearch` → `startIterativeResearch`
- `getResearchStatus` → `getResearchStats`
- `cancelTopicResearch` → `cleanupCache` (if needed)

### 9. Update Error Handling

**Throughout the codebase**, replace research-related error messages:

**OLD**:
```typescript
'Use the "Start Research" action in the Explore tab to gather sources'
```

**NEW**:
```typescript
'Research is in progress. Content will be available shortly.'
```

### 10. Clean Up Imports

**Search and replace across all files**:
```bash
# Find all files with old imports
grep -r "learning/research/operations" app/src/
grep -r "startTopicResearch" app/src/
grep -r "getResearchStatus" app/src/
grep -r "getResearchResults" app/src/
```

**Replace with new imports**:
- `startTopicResearch` → `startIterativeResearch`
- `getResearchStatus` → `getResearchStats` 
- `getResearchResults` → Direct database queries to `GeneratedContent`

## Validation Steps

### 1. Test Complete Flow
1. Go to landing page
2. Enter a topic (e.g., "Machine Learning")
3. Verify `startIterativeResearch` is called (check console logs)
4. Verify user is redirected to `/learn/machine-learning`
5. Verify content appears in Explore tab after research completes
6. Verify all other tabs work correctly

### 2. Check Database
After successful research, verify:
- `Topic` table has the new topic with `status: 'COMPLETED'`
- `GeneratedContent` table has content with `contentType: 'exploration'`
- `VectorDocument` table has embedded research data

### 3. Test Error Handling
1. Test with malformed topic names
2. Test with network issues
3. Verify graceful degradation

### 4. Performance Check
1. Check that old research system is completely removed
2. Verify no orphaned API calls
3. Ensure new system completes in reasonable time

## Success Criteria

✅ **Landing page uses only `startIterativeResearch`**  
✅ **All old research operations removed from Wasp config**  
✅ **All old research files deleted**  
✅ **Frontend consistently uses new research system**  
✅ **Content generation works reliably**  
✅ **No references to old research operations anywhere**  
✅ **Complete topic creation → research → content flow works end-to-end**

## Timeline
This is a **complete system replacement**. Plan for:
- **Development**: 4-6 hours
- **Testing**: 2-3 hours  
- **Deployment**: 1 hour

**No half measures. No backwards compatibility. Complete migration only.**

---

## Final Checklist Before Deployment

- [ ] All old research files deleted
- [ ] All imports updated
- [ ] All Wasp operations updated
- [ ] Landing page flow tested end-to-end
- [ ] Content generation tested
- [ ] Error handling verified
- [ ] Performance acceptable
- [ ] Database migrations (if needed)
- [ ] No console errors
- [ ] All tabs working correctly

**This transition is ALL OR NOTHING. Complete the entire migration in one go.**