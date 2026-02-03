// Project identification - set via env variable per deployment
// Used to identify which project is sending errors to PostHog
//
// Set VITE_PUBLIC_PROJECT_NAME in your .env file:
// - chris-cillizza
// - prodrop
// - rocco-pendola
// etc.
export const PROJECT_NAME = import.meta.env.VITE_PUBLIC_PROJECT_NAME || 'unknown-project';
