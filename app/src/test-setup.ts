import { vi } from 'vitest';

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