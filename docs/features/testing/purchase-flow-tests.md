# Purchase Flow Integration Tests

## Status

| Field | Value |
| --- | --- |
| Status | ✅ Complete |
| Completed | 2026-02-19 |
| Author | Claude Code |
| Parent Feature | [Testing](README.md) |
| Related Issues | N/A |

## What It Does

Integration tests for the ArticlePage purchase flow. Tests the full user journey: viewing a paywalled article, clicking buy, authenticating through the real AuthModal, and verifying two outcomes — article purchased (paywall removed) and article not purchased (paywall stays). Also tests that unauthenticated users see only the preview content.

## Implementation

### Files Changed

| Path | Purpose |
| --- | --- |
| `client/src/pages/ArticlePage.purchase-flow.test.tsx` | 6 integration tests covering paywall, auth, purchase paths |

### Domain Model

N/A

### Key Logic

Tests use the REAL `AuthModal` component (not mocked) to exercise the actual login flow. Only Google OAuth dependencies are mocked since they require valid client IDs. MSW handlers simulate the auth API (`/api/auth/login`) returning a valid JWT token, the purchase verification endpoint (`/api/articles/:id/verify-purchase`) returning purchased/not-purchased states, and the wallet balance endpoint. The test creates a valid JWT with a far-future expiration so `isTokenExpired()` in VideoStoreContext passes.

## Decisions

| Decision | Why | Alternatives Considered |
| --- | --- | --- |
| Real AuthModal instead of mocked | Tests the actual login UI and state flow | Mocking AuthModal, setting token directly |
| Valid JWT with exp:9999999999 | VideoStoreContext checks token expiration on mount | Mocking isTokenExpired, using real JWTs |
| Two separate test paths (purchased vs not) | Covers both happy and unhappy paths without test coupling | Single test with conditional assertions |

## Gotchas & Warnings

- Must mock `@react-oauth/google` AND `useGoogleOAuthStatus` from App.tsx — GoogleOAuthProvider wraps the app
- The test token must be a structurally valid JWT (3 base64 segments with valid JSON) or VideoStoreContext will reject it
- MSW handler order matters — more specific handlers (per-test overrides) must be registered via `server.use()` in individual tests

## Dependencies

None beyond the shared testing infrastructure.

## Testing

```bash
npx vitest run client/src/pages/ArticlePage.purchase-flow.test.tsx
```

## Related

- [Vitest Setup](vitest-setup.md) — Test infrastructure this depends on
- [Preview Security](preview-security.md) — Content stripping tests in the same file
