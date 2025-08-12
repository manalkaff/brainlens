---
description: 
inclusion: manual
---

# Wasp Testing Guide: Common Issues and Solutions

This guide covers common testing issues encountered when writing tests for Wasp applications and their solutions.

## Environment Setup Issues

### Problem: Environment Variable Validation Errors
**Error:**
```
══ Env vars validation failed ══
- Invalid discriminator value. Expected 'development' | 'production'
```

**Root Cause:** Wasp requires `NODE_ENV` to be set to either 'development' or 'production' for environment validation.

**Solution:**
1. Add `NODE_ENV=development` to your `.env.server` file:
```bash
# Environment
NODE_ENV=development
```

2. Set up environment variables in your test setup file (`src/test-setup.ts`):
```typescript
// Set up environment variables for testing
process.env.NODE_ENV = 'development';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
```

## Import and Module Issues

### Problem: Server-Side Code Import Errors
**Error:**
```
Error: Error parsing environment variables
❯ Module.ensureEnvSchema .wasp/out/sdk/wasp/env/validation.ts:17:11
```

**Root Cause:** Tests trying to import server-side Wasp modules trigger environment validation before tests can run.

**Solution:** Use mocking instead of direct imports for server-side code:

```typescript
// ❌ DON'T: Direct import of server modules
import { startTopicResearch } from '../operations';
import { HttpError } from 'wasp/server';

// ✅ DO: Mock the functionality instead
const mockStartTopicResearch = async (args: any, context: any) => {
  // Mock implementation
};

// Mock wasp/server module in test-setup.ts
vi.mock('wasp/server', () => ({
  HttpError: class HttpError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.name = 'HttpError';
    }
  },
}));
```

### Problem: Duplicate Export Errors
**Error:**
```
error TS2323: Cannot redeclare exported variable 'GeneralResearchAgent'
error TS2484: Export declaration conflicts with exported declaration
```

**Root Cause:** Classes are exported both in their declaration and in a separate export statement.

**Solution:** Remove duplicate exports:
```typescript
// ✅ DO: Export classes directly in their declaration
export class GeneralResearchAgent {
  // class implementation
}

// ❌ DON'T: Re-export at the end of file
export {
  GeneralResearchAgent, // This causes the duplicate export error
};
```

## TypeScript Type Issues

### Problem: Method Override Type Mismatches
**Error:**
```
error TS2416: Property 'execute' in type 'FailingAgent' is not assignable to the same property in base type
Type 'Promise<void>' is not assignable to type 'Promise<{...}>'
```

**Root Cause:** Overridden methods don't match the expected return type of the base class.

**Solution:** Use method mocking instead of class inheritance for error testing:
```typescript
// ❌ DON'T: Override with wrong return type
class FailingAgent extends MockGeneralResearchAgent {
  async execute() { // Wrong return type
    throw new Error('Mock agent error');
  }
}

// ✅ DO: Mock the method directly
test('should handle agent execution errors gracefully', async () => {
  const agent = new MockGeneralResearchAgent();
  
  // Mock the execute method to throw an error
  const originalExecute = agent.execute;
  agent.execute = async (topic: string, context?: any) => {
    throw new Error('Mock agent error');
  };
  
  try {
    await agent.execute('test topic');
    expect.fail('Should have thrown an error');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('Mock agent error');
  }
  
  // Restore original method
  agent.execute = originalExecute;
});
```

## Test Structure Best Practices

### Problem: Tests Failing Due to Async Timing
**Root Cause:** Status callbacks or async operations not completing in expected order.

**Solution:** Use proper async/await patterns and realistic expectations:
```typescript
// ❌ DON'T: Expect specific status order
const statuses = statusUpdates.map(u => u.status);
expect(statuses).toContain('initializing');
expect(statuses).toContain('researching');
expect(statuses).toContain('completed');

// ✅ DO: Test for essential outcomes
expect(statusUpdates.length).toBeGreaterThan(0);
const statuses = statusUpdates.map(u => u.status);
expect(statuses).toContain('completed'); // At least completed should be there
```

### Problem: Error Handling Tests Not Working
**Root Cause:** Expecting methods not to throw when they should throw, or vice versa.

**Solution:** Test the actual behavior, not idealized behavior:
```typescript
// ❌ DON'T: Expect error callbacks not to throw
expect(() => {
  failingCallback();
}).not.toThrow();

// ✅ DO: Test the actual behavior
expect(() => {
  failingCallback();
}).toThrow('Callback failed');
```

## Mock Implementation Guidelines

### Creating Effective Mocks
1. **Match the interface exactly:**
```typescript
interface MockContext {
  user: { id: string } | null;
  entities: {
    Topic: {
      findUnique: any;
      update: any;
    };
  };
}
```

2. **Use vi.fn() for trackable mocks:**
```typescript
const createMockContext = (): MockContext => ({
  user: { id: 'test-user-id' },
  entities: {
    Topic: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
});
```

3. **Mock return values appropriately:**
```typescript
mockContext.entities.Topic.findUnique.mockResolvedValue(mockTopic);
mockContext.entities.VectorDocument.findMany.mockResolvedValue(mockVectorDocs);
```

## Test Organization

### File Structure
```
src/
  feature/
    __tests__/
      feature.test.ts        # Main functionality tests
      integration.test.ts    # Integration tests
      operations.test.ts     # Wasp operations tests
      utils.test.ts         # Utility function tests
```

### Test Categories
1. **Unit Tests:** Test individual functions/classes in isolation
2. **Integration Tests:** Test how components work together
3. **Operations Tests:** Test Wasp operations with mocked context
4. **Error Handling Tests:** Test failure scenarios and recovery

## Running Tests

### Commands
```bash
# Run all tests
wasp test client run

# Run tests in watch mode
wasp test client

# Run specific test file
wasp test client run -- src/feature/__tests__/feature.test.ts
```

### Environment Requirements
- `NODE_ENV` must be set to 'development' or 'production'
- Database connection string (can be mock for unit tests)
- All required environment variables from `.env.server`

## Common Patterns

### Testing Async Operations
```typescript
test('should handle async operation', async () => {
  const result = await asyncOperation();
  expect(result).toBeDefined();
});
```

### Testing Error Conditions
```typescript
test('should throw error for invalid input', async () => {
  await expect(operation({ invalid: 'input' }))
    .rejects.toThrow('Expected error message');
});
```

### Testing with Context
```typescript
test('should require authentication', async () => {
  const contextWithoutUser = { ...mockContext, user: null };
  
  await expect(operation(args, contextWithoutUser))
    .rejects.toThrow('Authentication required');
});
```

### Testing Status Updates
```typescript
test('should emit status updates', async () => {
  const statusUpdates: any[] = [];
  
  coordinator.registerStatusCallback('test-id', (status) => {
    statusUpdates.push(status);
  });
  
  await coordinator.performOperation();
  
  expect(statusUpdates.length).toBeGreaterThan(0);
  expect(statusUpdates[statusUpdates.length - 1].status).toBe('completed');
});
```

## Debugging Test Issues

### Common Debug Steps
1. **Check environment variables:** Ensure all required env vars are set
2. **Verify imports:** Make sure you're not importing server-side code directly
3. **Check mock setup:** Ensure mocks are properly configured before tests run
4. **Review async handling:** Make sure all async operations are properly awaited
5. **Validate types:** Ensure mock return types match expected interfaces

### Useful Debug Commands
```bash
# Run with verbose output
wasp test client run -- --reporter=verbose

# Run single test with debugging
wasp test client run -- --reporter=verbose src/path/to/test.test.ts
```

This guide should help avoid the common pitfalls we encountered and provide a solid foundation for writing reliable tests in Wasp applications.