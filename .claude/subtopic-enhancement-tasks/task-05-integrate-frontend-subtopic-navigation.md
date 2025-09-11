# Task 5: Integrate Frontend Subtopic Navigation

## Problem
Update the frontend (specifically the Explore tab) to handle subtopic selection by:
1. Adding subtopic ID as a query parameter when user clicks a subtopic
2. Calling the new subtopic content API
3. Displaying the subtopic content properly
4. Handling loading/error states for subtopic content

## Current State Analysis
- Current file: `app/src/learning/components/tabs/ExploreTab.tsx`
- Current behavior: Clicking subtopics may not properly fetch from database
- URL structure: Currently `/learn/topic-slug` - need to support `/learn/topic-slug?subtopic=subtopic-id`
- Content display: Uses `useTopicContent` hook and related components

## Required Changes

### 1. URL Parameter Handling
Update URL to include subtopic ID when subtopic is selected:
```typescript
// When subtopic is clicked, update URL
const handleSubtopicClick = (subtopicId: string) => {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('subtopic', subtopicId);
  window.history.pushState({}, '', currentUrl.toString());
  
  // Trigger content fetch for subtopic
  fetchSubtopicContent(subtopicId);
};
```

### 2. Create Subtopic Content Hook
New hook or extend existing one to handle subtopic content:
```typescript
// In useTopicContent or new useSubtopicContent hook
const useSubtopicContent = (mainTopicId: string, subtopicId: string | null) => {
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    if (subtopicId) {
      fetchSubtopicContent(mainTopicId, subtopicId);
    }
  }, [mainTopicId, subtopicId]);
  
  const fetchSubtopicContent = async (mainTopicId: string, subtopicId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/learning/get-subtopic-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainTopicId,
          subtopicId,
          options: { userLevel: 'intermediate', learningStyle: 'textual' }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setContent(data);
        setIsGenerating(false);
      } else if (data.generating) {
        setIsGenerating(true);
        // Set up polling for progress
      } else {
        setError(data.message || 'Content not found');
      }
    } catch (err) {
      setError('Failed to fetch subtopic content');
    } finally {
      setIsLoading(false);
    }
  };
  
  return { content, isLoading, error, isGenerating, refetch: fetchSubtopicContent };
};
```

### 3. Update ExploreTab Component
Modify the main ExploreTab to handle subtopic navigation:

```typescript
export function ExploreTab() {
  // ... existing code ...
  
  // Get subtopic ID from URL params
  const [searchParams] = useSearchParams();
  const selectedSubtopicId = searchParams.get('subtopic');
  
  // Use subtopic content hook
  const {
    content: subtopicContent,
    isLoading: isLoadingSubtopic,
    error: subtopicError,
    isGenerating: isGeneratingSubtopic
  } = useSubtopicContent(topic?.id, selectedSubtopicId);
  
  // Determine what content to show
  const contentToRender = selectedSubtopicId ? subtopicContent : mainTopicContent;
  const isLoadingContent = selectedSubtopicId ? isLoadingSubtopic : isLoadingMainTopic;
  
  // Handle subtopic selection
  const handleSubtopicSelect = (subtopicId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('subtopic', subtopicId);
    window.history.pushState({}, '', url.toString());
    // Hook will automatically fetch content via useEffect
  };
  
  // Handle back to main topic
  const handleBackToMainTopic = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('subtopic');
    window.history.pushState({}, '', url.toString());
  };
  
  // ... rest of component logic ...
}
```

### 4. Update Subtopic Display Components
Ensure subtopic cards/tree components call the selection handler:

```typescript
// In subtopic card/tree component
<SubtopicCard
  onClick={() => handleSubtopicSelect(subtopic.id)}
  isSelected={selectedSubtopicId === subtopic.id}
>
  {subtopic.title}
</SubtopicCard>
```

### 5. Add Loading States for Subtopic Content
Handle different loading states:
- Loading subtopic content
- Subtopic is generating (show progress)
- Subtopic not found
- Error loading subtopic

```typescript
// Loading state component
if (selectedSubtopicId && isLoadingSubtopic) {
  return <LoadingSkeleton message="Loading subtopic content..." />;
}

// Generating state
if (selectedSubtopicId && isGeneratingSubtopic) {
  return (
    <RealTimeProgressDisplay 
      topicId={topic.id}
      subtopicId={selectedSubtopicId}
      message="Subtopic is being generated..."
    />
  );
}

// Error state
if (selectedSubtopicId && subtopicError) {
  return (
    <ErrorDisplay 
      error={subtopicError}
      onRetry={() => refetchSubtopic()}
      onBackToMain={() => handleBackToMainTopic()}
    />
  );
}
```

### 6. Update Content Display
Ensure MDXContent and other components work with subtopic content:
```typescript
<MDXContent 
  content={contentToRender?.content} 
  metadata={contentToRender?.metadata}
  sources={contentToRender?.sources}
  isSubtopic={!!selectedSubtopicId}
  onBackToMain={selectedSubtopicId ? handleBackToMainTopic : undefined}
/>
```

## Implementation Steps

1. **Update URL handling**:
   - Add query parameter support for subtopic ID
   - Handle browser back/forward navigation
   - Update URL when subtopic is selected

2. **Create/update content hooks**:
   - Extend existing hooks or create new ones for subtopic content
   - Add API integration for subtopic content endpoint
   - Handle loading, error, and generating states

3. **Update ExploreTab component**:
   - Add subtopic selection logic
   - Integrate with URL parameters
   - Handle content switching between main topic and subtopics

4. **Update subtopic UI components**:
   - Add click handlers for subtopic selection
   - Show selected state for current subtopic
   - Add navigation breadcrumbs

5. **Add loading and error states**:
   - Show appropriate loading states
   - Handle "generating" state with progress
   - Add error handling and retry functionality

## Files to Modify
- `app/src/learning/components/tabs/ExploreTab.tsx` (primary)
- `app/src/learning/hooks/useTopicContent.ts` or create `useSubtopicContent.ts`
- Subtopic display components (cards, tree views)
- Loading and error display components

## URL Structure
- Main topic: `/learn/topic-slug`
- Subtopic selected: `/learn/topic-slug?subtopic=subtopic-id`
- Navigation should maintain this structure

## Integration Points
- URL parameters using `useSearchParams`
- New subtopic content API from Task 4
- Existing progress tracking system
- Current loading and error display components

## Validation
- URL updates correctly when subtopic is selected
- Subtopic content loads from database
- Progress display works during generation
- Error handling for missing/failed content
- Browser navigation (back/forward) works correctly

## Testing
- Click different subtopics and verify URL changes
- Test with subtopics that exist in database
- Test with subtopics currently being generated
- Test with non-existent subtopics
- Test browser back/forward navigation
- Verify loading states and error handling

## Success Criteria
- ✅ URL includes subtopic ID when subtopic is selected
- ✅ Subtopic content API is called correctly
- ✅ Subtopic content displays properly
- ✅ Loading states work for subtopic generation
- ✅ Error handling for missing subtopics
- ✅ Browser navigation works correctly
- ✅ UI shows selected subtopic state
- ✅ Run `npx tsc` without errors