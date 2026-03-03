import { PostHog } from 'posthog-node';

interface ServerErrorContext {
  endpoint?: string;
  method?: string;
  statusCode?: number;
  requestId?: string;
  userId?: string;
  entityIds?: {
    articleId?: string;
    episodeId?: string;
    seriesId?: string;
  };
  duration?: number;
  metadata?: Record<string, unknown>;
}

let posthogClient: PostHog | null = null;

function getClient(): PostHog | null {
  if (posthogClient) return posthogClient;

  const apiKey = process.env.POSTHOG_SERVER_API_KEY;
  const host = process.env.POSTHOG_SERVER_HOST || 'https://us.i.posthog.com';

  if (!apiKey) return null;

  posthogClient = new PostHog(apiKey, { host });
  return posthogClient;
}

/**
 * Captures a server-side error to PostHog with structured context.
 * Always logs to console.error regardless of PostHog availability.
 */
export function captureServerError(error: unknown, context: ServerErrorContext) {
  const err = error instanceof Error ? error : new Error(String(error));

  // Always log to console (preserves existing behavior)
  console.error(`[ERROR] ${context.method ?? ''} ${context.endpoint ?? ''} ${context.statusCode ?? 500}:`, err.message);

  const client = getClient();
  if (!client) return;

  const distinctId = context.userId || context.requestId || 'server';

  client.captureException(err, distinctId, {
    endpoint: context.endpoint,
    method: context.method,
    status_code: context.statusCode,
    request_id: context.requestId,
    user_id: context.userId,
    article_id: context.entityIds?.articleId,
    episode_id: context.entityIds?.episodeId,
    series_id: context.entityIds?.seriesId,
    duration_ms: context.duration,
    ...context.metadata,
  });
}

/**
 * Flushes pending events and shuts down the PostHog client.
 * Call on process exit to ensure all events are sent.
 */
export async function shutdownErrorTracking() {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}
