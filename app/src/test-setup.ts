import { vi } from 'vitest';

// Set up environment variables for testing
process.env.NODE_ENV = 'development';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock wasp/server module
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

// Mock wasp/server/operations
vi.mock('wasp/server/operations', () => ({}));

// Mock wasp/entities
vi.mock('wasp/entities', () => ({}));

// Mock @prisma/client
vi.mock('@prisma/client', () => ({
  TopicStatus: {
    RESEARCHING: 'RESEARCHING',
    COMPLETED: 'COMPLETED',
    ERROR: 'ERROR',
    PENDING: 'PENDING',
  },
  MessageRole: {
    USER: 'USER',
    ASSISTANT: 'ASSISTANT',
    SYSTEM: 'SYSTEM',
  },
  QuestionType: {
    MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
    TRUE_FALSE: 'TRUE_FALSE',
    FILL_BLANK: 'FILL_BLANK',
    CODE_CHALLENGE: 'CODE_CHALLENGE',
  },
}));