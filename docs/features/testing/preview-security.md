# Preview Security Tests

## Status

| Field | Value |
| --- | --- |
| Status | ✅ Complete |
| Completed | 2026-02-19 |
| Author | Claude Code |
| Parent Feature | [Testing](README.md) |
| Related Issues | N/A |

## What It Does

Verifies that premium article content is properly stripped for unauthenticated users. The server returns only the first 3 paragraphs as a preview via `extractServerPreview()`. These tests ensure the full content never leaks to the client and that the preview extraction logic works correctly across edge cases.

## Implementation

### Files Changed

| Path | Purpose |
| --- | --- |
| `shared/preview.ts` | Extracted `extractServerPreview` from server/routes.ts |
| `shared/preview.test.ts` | 8 unit tests for preview extraction logic |
| `client/src/pages/ArticlePage.purchase-flow.test.tsx` | 2 integration tests verifying preview rendering in the UI |

### Domain Model

N/A

### Key Logic

`extractServerPreview()` uses a regex to match `<p>` tags (including those with attributes and nested HTML) and returns only the first N paragraphs. The server applies this in two places: the public articles listing endpoint and the individual article endpoint (when the user hasn't purchased). Integration tests verify that when the server returns `isPreview: true`, the ArticlePage renders only the preview content and the full article text is not present in the DOM.

## Decisions

| Decision | Why | Alternatives Considered |
| --- | --- | --- |
| Extracted to `shared/preview.ts` | Enables unit testing without Express; function is used by both server routes | Keeping inline in routes.ts, testing via HTTP |
| Regex-based paragraph extraction | Simple, works for the content format used (CMS-generated HTML) | DOM parsing with jsdom on server side |
| Testing both unit (shared/) and integration (ArticlePage) | Unit tests cover edge cases; integration tests verify the UI respects `isPreview` | Only unit tests |

## Gotchas & Warnings

- The regex `/<p[^>]*>[\s\S]*?<\/p>/gi` uses lazy matching — it handles nested tags but could fail on malformed HTML with unclosed `<p>` tags
- The server must set `isPreview: true` in the API response — the client uses this flag to decide whether to show the paywall

## Dependencies

None.

## Testing

```bash
# Unit tests for extraction logic
npx vitest run shared/preview.test.ts

# Integration tests for UI rendering
npx vitest run client/src/pages/ArticlePage.purchase-flow.test.tsx
```

## Related

- [Purchase Flow Tests](purchase-flow-tests.md) — Integration tests that verify preview behavior in context
- [Vitest Setup](vitest-setup.md) — Test infrastructure
