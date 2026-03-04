import posthog from 'posthog-js';
import { PROJECT_NAME } from './config';

interface ErrorContext {
  component: string;
  action?: string;
  user?: { id: string; email: string; loggedIn: boolean } | null;
  entityIds?: { articleId?: string; episodeId?: string; seriesId?: string };
  requestId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Maps route patterns to their page component files
 * Order matters: more specific routes should come before less specific ones
 */
const ROUTE_TO_PAGE_MAP: Array<{ pattern: RegExp; file: string }> = [
  { pattern: /^\/series\/[^/]+$/, file: 'SeriesPage.tsx' },
  { pattern: /^\/article\/[^/]+$/, file: 'ArticlePage.tsx' },
  { pattern: /^\/category\/[^/]+$/, file: 'CategoryPage.tsx' },
  { pattern: /^\/videos$/, file: 'VideosPage.tsx' },
  { pattern: /^\/admin$/, file: 'AdminPage.tsx' },
  { pattern: /^\/wallet$/, file: 'WalletPage.tsx' },
  { pattern: /^\/$/, file: 'HomePage.tsx' },
];

/**
 * Resolves the current pathname to its corresponding page file
 */
function getPageFile(pathname: string): string | null {
  for (const route of ROUTE_TO_PAGE_MAP) {
    if (route.pattern.test(pathname)) {
      return route.file;
    }
  }
  return null;
}

/**
 * Extracts the X-Request-Id header from a failed fetch Response.
 * Returns undefined if the header is not present.
 */
export function getRequestId(response: Response): string | undefined {
  return response.headers.get('X-Request-Id') ?? undefined;
}

/**
 * Captures an exception to PostHog with rich context
 *
 * Error title format: [project] Component @ /path (PageFile.tsx): Original error message
 * Example: [the-commons] ErrorTestButton @ / (HomePage.tsx): Cannot read properties of undefined
 */
export function captureError(error: Error, context: ErrorContext) {
  const page = window.location.pathname;
  const pageFile = getPageFile(page);

  // Format: [project] Component @ /path (PageFile.tsx): message
  const pageInfo = pageFile ? `${page} (${pageFile})` : page;
  const enrichedMessage = `[${PROJECT_NAME}] ${context.component} @ ${pageInfo}: ${error.message}`;
  const enrichedError = new Error(enrichedMessage);
  enrichedError.name = error.name; // Preserve original error type (TypeError, etc.)
  enrichedError.stack = error.stack; // Preserve original stack trace

  posthog.captureException(enrichedError, {
    // Structured properties for filtering/searching in PostHog
    project_name: PROJECT_NAME,
    component: context.component,
    page: page,
    page_file: pageFile,
    action: context.action,
    original_message: error.message,
    url: window.location.href,
    // User context
    user_id: context.user?.id,
    user_email: context.user?.email,
    user_logged_in: context.user?.loggedIn,
    // Entity context
    article_id: context.entityIds?.articleId,
    episode_id: context.entityIds?.episodeId,
    series_id: context.entityIds?.seriesId,
    // Backend correlation
    request_id: context.requestId,
    ...context.metadata,
  });

  console.error(`[${PROJECT_NAME}] Error in ${context.component}:`, error.message);

  return enrichedError;
}

/**
 * Creates a component-specific error capturer
 * Use this to avoid repeating the component name
 *
 * Example:
 * const captureComponentError = createErrorCapturer('UserProfile');
 * captureComponentError(error, { action: 'fetch_user' });
 */
export function createErrorCapturer(component: string) {
  return (error: Error, options?: {
    action?: string;
    user?: ErrorContext['user'];
    entityIds?: ErrorContext['entityIds'];
    requestId?: string;
    metadata?: Record<string, unknown>;
  }) => {
    return captureError(error, {
      component,
      action: options?.action,
      user: options?.user,
      entityIds: options?.entityIds,
      requestId: options?.requestId,
      metadata: options?.metadata,
    });
  };
}
