# Authentication Guide

This document explains how authentication works in the Ledewire video store applications.

## Overview

Users can authenticate via:
- **Email/Password** - Traditional login with Ledewire credentials
- **Google SSO** - Sign in with Google account

Both methods use Ledewire as the identity provider. The app receives access and refresh tokens from Ledewire to make authenticated API calls.

---

## Token System

| Token | Duration | Purpose |
|-------|----------|---------|
| Access Token | ~15 minutes | Authorize API requests (wallet, purchases) |
| Refresh Token | 30 days | Get new access tokens automatically |
| SSO Cookie | 30 days | Store refresh token for session persistence |

### How Tokens Flow

```
User logs in (Google or Email)
    ↓
Ledewire returns access_token + refresh_token
    ↓
App stores tokens in database
    ↓
Refresh token saved in SSO cookie (30 days)
    ↓
Access token used for API calls
    ↓
When access token expires → refresh automatically
```

---

## Google SSO Implementation

We use the `@react-oauth/google` package with the `GoogleLogin` component.

```tsx
import { GoogleLogin } from '@react-oauth/google';

<GoogleLogin
  onSuccess={(response) => {
    // response.credential is a Google ID token (JWT)
    loginWithGoogle(response.credential);
  }}
/>
```

### Important: GoogleLogin vs useGoogleLogin

| Component | Returns | Use For |
|-----------|---------|---------|
| `GoogleLogin` | `credential` (ID token) | User authentication |
| `useGoogleLogin` | `access_token` | Accessing Google APIs |

**Always use `GoogleLogin` component** - Ledewire needs the ID token to verify user identity.

---

## Token Validation

Before showing a user as logged in, we validate their token isn't expired:

```typescript
function isTokenExpired(token: string): boolean {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const now = Math.floor(Date.now() / 1000);
  const bufferSeconds = 60; // Refresh 60s before expiry
  return now >= (payload.exp - bufferSeconds);
}
```

This prevents the "$0 balance" bug where users appear logged in but their token is actually expired.

---

## Session Restoration

When the app loads, it tries to restore the user's session:

```
1. Check SSO cookie for refresh token
2. Exchange refresh token for new access token
3. Validate token isn't expired
4. If valid → set user as logged in
5. If invalid → user stays logged out
```

---

## SSO Cookie Configuration

```typescript
res.cookie('ledewire_sso', refreshToken, {
  domain: '.ledewire.com',  // Shared across subdomains
  httpOnly: true,           // Prevents XSS attacks
  secure: true,             // HTTPS only in production
  sameSite: 'lax',          // CSRF protection
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});
```

---

## Key Files

| File | Purpose |
|------|---------|
| `client/src/components/AuthModal.tsx` | Login/signup UI |
| `client/src/context/VideoStoreContext.tsx` | Auth state management |
| `server/googleAuth.ts` | Google OAuth endpoints |
| `server/sso-module/sso-helpers.ts` | Token utilities |
| `server/sso-module/sso-routes.ts` | Session restoration endpoint |

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Email/password login |
| `/api/auth/signup` | POST | Create new account |
| `/api/auth/google/verify` | POST | Verify Google credential |
| `/api/auth/session` | GET | Restore session from cookie |
| `/api/logout` | GET | Clear session |

---

## Troubleshooting

### User shows $0 balance after login
- Token might be expired but user state was set anyway
- Check that `isTokenExpired()` is called before `setUser()`

### Google SSO fails with "Invalid credential"
- Make sure you're using `GoogleLogin` component, not `useGoogleLogin` hook
- Verify the credential is sent as `{ credential }` not `{ accessToken }`

### Session doesn't persist on mobile
- Check SSO cookie has `sameSite: 'lax'` or `'none'` with `secure: true`
- Verify cookie domain is set correctly for production
