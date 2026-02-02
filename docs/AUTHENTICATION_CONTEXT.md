# Authentication Context (AI Reference)

> **Purpose**: This file provides context for AI assistants when discussing authentication across Ledewire video store applications. Read this file when the user asks about OAuth, tokens, login issues, or authentication.

---

## Repository Overview

Three repositories share authentication with Ledewire as identity provider:

| Repository | Domain | Status |
|------------|--------|--------|
| ChrisCillizza | chriscillizza.ledewire.com | Reference implementation |
| RoccoPendola | roccopendola.ledewire.com | Matches ChrisCillizza |
| JalbertFilm | jalbertfilm.ledewire.com | Different approach (see below) |

---

## Architecture Decisions Made

### Decision 1: GoogleLogin Component vs useGoogleLogin Hook

**Problem**: `useGoogleLogin` hook returns `access_token` (for Google APIs), but Ledewire needs `credential` (ID token) to verify identity.

**Solution**: Use `GoogleLogin` component from `@react-oauth/google`.

```typescript
// CORRECT
import { GoogleLogin } from '@react-oauth/google';
<GoogleLogin onSuccess={(r) => loginWithGoogle(r.credential)} />

// WRONG - returns access_token, not credential
import { useGoogleLogin } from '@react-oauth/google';
```

**Applied to**: ChrisCillizza, RoccoPendola

---

### Decision 2: Token Validation Before Setting User State

**Problem**: Users appeared logged in with $0 balance because expired tokens were trusted.

**Solution**: Validate token expiration before calling `setUser()`.

```typescript
if (ssoData.ledewireToken && !isTokenExpired(ssoData.ledewireToken)) {
  setUser(ssoData.user);
  setLedewireToken(ssoData.ledewireToken);
}
```

**Applied to**: ChrisCillizza, RoccoPendola (via `isTokenExpired`), JalbertFilm (via API validation)

---

### Decision 3: 60-Second Token Expiration Buffer

**Problem**: Race conditions when client thinks token is valid but server rejects it.

**Solution**: Both client and server use 60-second buffer before token expiry.

```typescript
const bufferSeconds = 60;
return now >= (payload.exp - bufferSeconds);
```

**Applied to**: ChrisCillizza, RoccoPendola

---

### Decision 4: Two Valid Validation Approaches

**ChrisCillizza & RoccoPendola - JWT Expiration Check**:
```typescript
// Fast, no network call, parses JWT locally
if (!isTokenExpired(token)) {
  setUser(user);
}
```

**JalbertFilm - API Validation**:
```typescript
// Makes actual API call, proves token works end-to-end
const response = await fetch('/api/wallet/balance', {
  headers: { 'Authorization': `Bearer ${token}` }
});
if (response.ok) {
  setUser(user);
}
```

| Approach | Speed | Reliability |
|----------|-------|-------------|
| JWT Check | Faster (local) | Good |
| API Validation | Slower (network) | Better (proves token works) |

**JalbertFilm does NOT have `isTokenExpired` function** - this is intentional, not a bug.

---

## Key Fixes Applied (January 2026)

### ChrisCillizza
- Already had correct implementation
- Used as reference for other repos

### RoccoPendola (Fixed)
| Before | After |
|--------|-------|
| `useGoogleLogin` hook | `GoogleLogin` component |
| Sends `accessToken` | Sends `credential` |
| No token validation | `isTokenExpired()` check |
| 30s buffer | 60s buffer |

### JalbertFilm (Fixed)
| Before | After |
|--------|-------|
| No session validation | `validateAndRestoreSession()` via API |
| `sameSite: 'lax'` | `sameSite: 'none'` for mobile |

---

## File Locations

### ChrisCillizza / RoccoPendola
```
client/src/components/AuthModal.tsx      → GoogleLogin component
client/src/context/VideoStoreContext.tsx → isTokenExpired(), session logic
server/googleAuth.ts                     → /verify endpoint, middleware
server/sso-module/sso-helpers.ts         → isTokenExpired() server-side
server/sso-module/sso-routes.ts          → /api/auth/session endpoint
```

### JalbertFilm
```
client/src/components/AuthModal.tsx      → Native Google SDK
client/src/context/VideoStoreContext.tsx → validateAndRestoreSession()
server/googleAuth.ts                     → /verify-token endpoint
server/sso.ts                            → SSO cookie helpers
sso-module/sso-helpers.ts                → decodeJwtPayload (NO isTokenExpired)
```

---

## Common Issues Reference

### "$0 balance on mobile after Google login"
- **Cause**: Token expired but user state was set
- **Fix**: Validate token before `setUser()`

### "Google login fails with invalid credential"
- **Cause**: Using `useGoogleLogin` (returns access_token) instead of `GoogleLogin` (returns credential)
- **Fix**: Switch to `GoogleLogin` component

### "Session doesn't persist on mobile"
- **Cause**: Cookie `sameSite: 'lax'` blocks in mobile webviews
- **Fix**: Use `sameSite: 'none'` with `secure: true` in production

### "Token refresh race condition"
- **Cause**: Client and server using different expiration buffers
- **Fix**: Standardize to 60 seconds on both

---

## API Contract

### Ledewire expects:
```
POST /auth/login/google
Body: { id_token: "..." }  ← This is the "credential" from GoogleLogin
```

### Our endpoints:
```
POST /api/auth/google/verify    → ChrisCillizza, RoccoPendola
POST /api/auth/google/verify-token → JalbertFilm
Body: { credential: "..." }
```

---

## Quick Verification Checklist

When reviewing auth code:

- [ ] Uses `GoogleLogin` component (or native SDK)
- [ ] Sends `credential`, not `accessToken`
- [ ] Validates token before `setUser()`
- [ ] SSO cookie: `httpOnly`, `secure` (prod), `sameSite` appropriate
- [ ] 60s buffer on expiration checks (ChrisCillizza/RoccoPendola only)

---

## Last Updated
- **Date**: January 29, 2026
- **Changes**: Fixed OAuth across all 3 repositories
- **Verified**: ChrisCillizza, RoccoPendola, JalbertFilm
