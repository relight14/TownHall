import posthog from 'posthog-js';
import { PROJECT_NAME } from './config';

// Enabled by default in production, disabled in dev unless VITE_ENABLE_ANALYTICS=true
const isAnalyticsEnabled =
  !import.meta.env.DEV || import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

/**
 * Track a custom event in PostHog with automatic project tagging
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (!isAnalyticsEnabled) return;
  posthog.capture(eventName, {
    project_name: PROJECT_NAME,
    ...properties,
  });
}

/**
 * Identify a user in PostHog so all subsequent events are associated with them
 */
export function identifyUser(user: { id: string; email: string; name: string }) {
  if (!isAnalyticsEnabled) return;
  posthog.identify(user.id, {
    $set: {
      email: user.email,
      name: user.name,
    },
  });
}

/**
 * Reset PostHog identity on logout to disassociate the device from the user
 */
export function resetUser() {
  if (!isAnalyticsEnabled) return;
  posthog.reset();
}
