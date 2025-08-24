import type { MiddlewareConfigFn } from 'wasp/server';

// Middleware configuration to enable CORS for learning APIs
export const learningApiMiddleware: MiddlewareConfigFn = (config) => {
  return config;
};