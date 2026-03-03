import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './mocks/server';

// Mock static asset imports (images, fonts, etc.)
vi.mock('@assets/Chris_C_Profile_1765399638128.webp', () => ({
  default: 'test-profile-pic.webp',
}));

// Mock analytics (PostHog would fail in jsdom)
vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
  identifyUser: vi.fn(),
  resetUser: vi.fn(),
}));

// Mock error tracking (PostHog would fail in jsdom)
vi.mock('@/lib/errorTracking', () => ({
  captureError: vi.fn((error: Error) => error),
  createErrorCapturer: vi.fn(() => vi.fn()),
  getRequestId: vi.fn(() => undefined),
}));

// Mock useErrorContext hook
vi.mock('@/hooks/useErrorContext', () => ({
  useErrorContext: vi.fn(() => ({ user: { id: '', email: '', loggedIn: false } })),
}));

// Mock config
vi.mock('@/lib/config', () => ({
  PROJECT_NAME: 'test-project',
}));

// Suppress noisy console output during tests (e.g. VideoStoreProvider auth checks)
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });

  console.log = (...args: unknown[]) => {
    const msg = String(args[0]);
    if (msg.includes('[AUTH]') || msg.includes('[SSO]') || msg.includes('[WALLET]')) return;
    originalConsoleLog(...args);
  };

  console.error = (...args: unknown[]) => {
    const msg = String(args[0]);
    if (msg.includes('Failed to increment') || msg.includes('Failed to refresh wallet')) return;
    originalConsoleError(...args);
  };
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});
