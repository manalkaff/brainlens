// Set up environment variables for testing
process.env.NODE_ENV = 'development';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock Wasp modules to avoid compilation issues
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock wasp/server
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

// Mock wasp/entities
vi.mock('wasp/entities', () => ({}));

// Mock wasp/client/operations
vi.mock('wasp/client/operations', () => ({
  useQuery: vi.fn(),
}));

// Mock wasp/client/auth
vi.mock('wasp/client/auth', () => ({
  useAuth: vi.fn(),
}));

// Mock wasp/client/router
vi.mock('wasp/client/router', () => ({
  useParams: vi.fn(),
  Link: vi.fn(({ children, ...props }: any) => {
    // Mock Link component as a simple function that returns children
    return children;
  }),
}));