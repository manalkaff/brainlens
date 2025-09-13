# Manual Integration Test for Landing Page Topic Creation

This document outlines the manual testing steps to verify that the landing page integration with topic creation functionality works correctly.

## Test Scenarios

### 1. Authenticated User Flow
**Prerequisites:** User is logged in

**Steps:**
1. Navigate to the landing page (`/`)
2. Enter a topic in the input field (e.g., "Machine Learning")
3. Click the submit button or press Cmd+Enter
4. Verify that:
   - Loading state is shown
   - Success message appears
   - User is redirected to `/learn/machine-learning` (or similar slug)
   - Topic is created in the database
   - Research is automatically started (optional)

**Expected Result:** Topic is created and user is navigated to the topic page

### 2. Unauthenticated User Flow
**Prerequisites:** User is not logged in

**Steps:**
1. Navigate to the landing page (`/`)
2. Enter a topic in the input field (e.g., "React Hooks")
3. Click the submit button or press Cmd+Enter
4. Verify that:
   - User is redirected to `/signup`
   - Topic is stored in sessionStorage with key `pendingTopic`

**Expected Result:** User is redirected to signup with topic stored for later creation

### 3. Post-Authentication Topic Creation
**Prerequisites:** User has a pending topic stored and just completed signup/login

**Steps:**
1. Complete the unauthenticated user flow above
2. Sign up or log in
3. Verify that:
   - Pending topic is automatically created
   - User is redirected to the topic page
   - sessionStorage is cleared

**Expected Result:** Pending topic is created and user is navigated to the topic page

### 4. Error Handling
**Prerequisites:** User is logged in

**Steps:**
1. Navigate to the landing page (`/`)
2. Enter a topic that will cause an error (or simulate network failure)
3. Click the submit button
4. Verify that:
   - Appropriate error message is displayed
   - User can retry if the error is retryable
   - Loading state is cleared

**Expected Result:** Error is handled gracefully with user-friendly messages

## Implementation Verification

### Files to Check:
- `app/src/landing-page/LandingPage.tsx` - Main integration logic
- `app/src/landing-page/utils/pendingTopicHandler.ts` - Pending topic utilities
- `app/src/landing-page/hooks/usePendingTopicHandler.ts` - Post-auth hook
- `app/src/client/App.tsx` - Hook integration

### Key Features Implemented:
- ✅ Topic creation with `createTopic` operation
- ✅ Automatic research start with `startTopicResearch` operation
- ✅ Authentication flow handling
- ✅ Pending topic storage and retrieval
- ✅ Post-authentication topic creation
- ✅ Error handling with user-friendly messages
- ✅ Navigation to topic page after creation
- ✅ Loading states and user feedback

### Integration Points:
- ✅ InputCard component receives `onSubmit` handler
- ✅ HeroSection passes through the handler
- ✅ LandingPage implements the core logic
- ✅ App component handles post-auth pending topics
- ✅ Proper error propagation to InputCard for display

## Testing Commands

To test the integration manually:

1. Start the development server:
   ```bash
   cd app && wasp start
   ```

2. Navigate to `http://localhost:3000`

3. Follow the test scenarios above

## Notes

- The integration maintains the existing topic creation and research workflow
- Authentication flow redirects to signup/login as needed
- Pending topics are handled automatically after authentication
- Error handling provides user-friendly messages
- The implementation is backward compatible with existing functionality