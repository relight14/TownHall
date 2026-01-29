import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { queryClient } from "./lib/queryClient";
import { PROJECT_NAME } from "./lib/config";
import App from "./App";
import "./index.css";
import { ErrorBoundary, setupGlobalErrorHandlers } from "./components/ErrorBoundary";

// Initialize PostHog BEFORE the Provider so direct imports work
const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

if (posthogKey && posthogHost) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: true,
    capture_pageleave: true,
  });

  // Register project as a super property - included in ALL events automatically
  posthog.register({
    project_name: PROJECT_NAME,
  });

  console.log(`[PostHog] Initialized for project: ${PROJECT_NAME}`);
} else {
  console.warn('[PostHog] Missing VITE_PUBLIC_POSTHOG_KEY or VITE_PUBLIC_POSTHOG_HOST');
}

// Setup global error handlers
setupGlobalErrorHandlers();

createRoot(document.getElementById("root")!).render(
  <PostHogProvider client={posthog}>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </PostHogProvider>
);
