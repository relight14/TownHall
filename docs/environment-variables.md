# Environment Variables Reference

Complete mapping of all `process.env` variables used in the ChrisCillizza project.

## Required Variables

### Database
| Variable | Location | Required | Default | Description |
|----------|----------|----------|---------|-------------|
| `DATABASE_URL` | `server/db.ts:9,15`<br>`server/googleAuth.ts:15`<br>`server/replitAuth.ts:27`<br>`drizzle.config.ts:12` | ✅ Yes | - | PostgreSQL connection string (Neon serverless) |

### Ledewire API (Buyer - Customer Authentication)
| Variable | Location | Required | Default | Description |
|----------|----------|----------|---------|-------------|
| `LEDEWIRE_API_URL` | `server/ledewire.ts:1` | ⚠️ Optional | `https://api.staging.ledewire.com/v1` | Ledewire API base URL |
| `LEDEWIRE_API_KEY` | `server/ledewire.ts:4` | ✅ Yes | - | Ledewire buyer API key |
| `LEDEWIRE_API_SECRET` | `server/ledewire.ts:5` | ✅ Yes | - | Ledewire buyer API secret |

### Ledewire API (Seller - Content Registration)
| Variable | Location | Required | Default | Description |
|----------|----------|----------|---------|-------------|
| `CILLIZZA_SELLER_API_KEY` | `server/ledewire.ts:8` | ✅ Yes | - | Seller API key for content registration |
| `CILLIZZA_SELLER_API_SECRET` | `server/ledewire.ts:9` | ✅ Yes | - | Seller API secret for content registration |

### Session Management
| Variable | Location | Required | Default | Description |
|----------|----------|----------|---------|-------------|
| `SESSION_SECRET` | `server/googleAuth.ts:21`<br>`server/replitAuth.ts:33` | ⚠️ Optional | Auto-generated (dev) | Secret for session encryption. Falls back to random bytes in dev if not set |

### Admin Authentication
| Variable | Location | Required | Default | Description |
|----------|----------|----------|---------|-------------|
| `ADMIN_EMAIL` | `server/routes.ts:149,194` | ✅ Yes | - | Admin user email address |
| `ADMIN_PASSWORD` | `server/routes.ts:150,212` | ✅ Yes | - | Admin user password (initial, can be changed via admin panel) |

### Server Configuration
| Variable | Location | Required | Default | Description |
|----------|----------|----------|---------|-------------|
| `PORT` | `server/index.ts:102`<br>`server/sso-module/example-integration.ts:123` | ⚠️ Optional | `5000` | Server port number |
| `NODE_ENV` | `server/index.ts:89`<br>`server/googleAuth.ts:12`<br>`server/sso-module/sso-helpers.ts:14,28`<br>`vite.config.ts:14`<br>`vite-plugin-meta-images.ts:75` | ⚠️ Optional | - | Environment: `production` or `development` |

---

## Replit-Specific Variables (Optional)

### Replit Platform
| Variable | Location | Required | Default | Description |
|----------|----------|----------|---------|-------------|
| `REPL_ID` | `server/replitAuth.ts:17,178`<br>`vite.config.ts:15` | ⚠️ Only if using Replit Auth | - | Replit Repl ID (for Replit OIDC authentication) |
| `ISSUER_URL` | `server/replitAuth.ts:16` | ⚠️ Only if using Replit Auth | `https://replit.com/oidc` | OIDC issuer URL for Replit authentication |

### Replit Domains
| Variable | Location | Required | Default | Description |
|----------|----------|----------|---------|-------------|
| `REPLIT_DOMAINS` | `server/routes.ts:471` | ⚠️ Optional | - | Comma-separated list of production domains (used for payment redirects) |
| `REPLIT_DEV_DOMAIN` | `server/routes.ts:472`<br>`vite-plugin-meta-images.ts:65` | ⚠️ Optional | - | Development domain (fallback for payment redirects) |
| `REPLIT_INTERNAL_APP_DOMAIN` | `vite-plugin-meta-images.ts:59` | ⚠️ Optional | - | Internal app domain for meta images |

### Replit Object Storage
| Variable | Location | Required | Default | Description |
|----------|----------|----------|---------|-------------|
| `PUBLIC_OBJECT_SEARCH_PATHS` | `server/replit_integrations/object_storage/objectStorage.ts:47` | ⚠️ Only if using Object Storage | - | Comma-separated paths for public object search |
| `PRIVATE_OBJECT_DIR` | `server/replit_integrations/object_storage/objectStorage.ts:67` | ⚠️ Only if using Object Storage | - | Private object directory path |

### Replit Connectors (Scripts Only)
| Variable | Location | Required | Default | Description |
|----------|----------|----------|---------|-------------|
| `REPLIT_CONNECTORS_HOSTNAME` | `scripts/fetch-pr.ts:10`<br>`scripts/fetch-full-pr.ts:10` | ⚠️ Only for PR scripts | - | Replit connectors hostname |
| `REPL_IDENTITY` | `scripts/fetch-pr.ts:11`<br>`scripts/fetch-full-pr.ts:11` | ⚠️ Only for PR scripts | - | Replit identity token |
| `WEB_REPL_RENEWAL` | `scripts/fetch-pr.ts:13`<br>`scripts/fetch-full-pr.ts:13` | ⚠️ Only for PR scripts | - | Web Repl renewal token |

---

## Usage by File

### `server/db.ts`
- `DATABASE_URL` (required) - Database connection

### `server/googleAuth.ts`
- `NODE_ENV` - Environment detection
- `DATABASE_URL` - Session store connection
- `SESSION_SECRET` - Session encryption (optional, auto-generated in dev)

### `server/replitAuth.ts` (⚠️ Not currently used)
- `ISSUER_URL` - OIDC issuer (defaults to Replit)
- `REPL_ID` - Replit Repl ID (required if using)
- `DATABASE_URL` - Session store connection
- `SESSION_SECRET` - Session encryption

### `server/routes.ts`
- `ADMIN_EMAIL` - Admin authentication (lines 149, 194)
- `ADMIN_PASSWORD` - Admin authentication (lines 150, 212)
- `REPLIT_DOMAINS` - Payment redirect URLs (line 471)
- `REPLIT_DEV_DOMAIN` - Payment redirect fallback (line 472)

### `server/ledewire.ts`
- `LEDEWIRE_API_URL` - API base URL (defaults to staging)
- `LEDEWIRE_API_KEY` - Buyer API key
- `LEDEWIRE_API_SECRET` - Buyer API secret
- `CILLIZZA_SELLER_API_KEY` - Seller API key
- `CILLIZZA_SELLER_API_SECRET` - Seller API secret

### `server/index.ts`
- `NODE_ENV` - Production/development mode
- `PORT` - Server port (defaults to 5000)

### `server/replit_integrations/object_storage/objectStorage.ts`
- `PUBLIC_OBJECT_SEARCH_PATHS` - Public object search paths
- `PRIVATE_OBJECT_DIR` - Private object directory

### `server/sso-module/sso-helpers.ts`
- `NODE_ENV` - Production detection for cookie settings

### `server/sso-module/example-integration.ts`
- `LEDEWIRE_BUYER_API_KEY` - Example integration API key
- `LEDEWIRE_BUYER_API_SECRET` - Example integration API secret
- `PORT` - Server port

### `vite.config.ts`
- `NODE_ENV` - Production detection
- `REPL_ID` - Replit detection for dev tools

### `vite-plugin-meta-images.ts`
- `REPLIT_INTERNAL_APP_DOMAIN` - Internal domain for meta images
- `REPLIT_DEV_DOMAIN` - Dev domain for meta images
- `NODE_ENV` - Production detection

### `drizzle.config.ts`
- `DATABASE_URL` - Database connection for migrations

### `scripts/fetch-pr.ts` & `scripts/fetch-full-pr.ts`
- `REPLIT_CONNECTORS_HOSTNAME` - Connectors hostname
- `REPL_IDENTITY` - Identity token
- `WEB_REPL_RENEWAL` - Renewal token

---

## Minimum Required for Production

```env
# Database
DATABASE_URL=postgresql://...

# Ledewire (Buyer)
LEDEWIRE_API_URL=https://api.ledewire.com/v1
LEDEWIRE_API_KEY=...
LEDEWIRE_API_SECRET=...

# Ledewire (Seller)
CILLIZZA_SELLER_API_KEY=...
CILLIZZA_SELLER_API_SECRET=...

# Admin
ADMIN_EMAIL=...
ADMIN_PASSWORD=...

# Session
SESSION_SECRET=...

# Server
NODE_ENV=production
PORT=5000
```

---

## Optional (Replit Deployment)

```env
# Replit Platform
REPL_ID=...
REPLIT_DOMAINS=example.com,www.example.com
REPLIT_DEV_DOMAIN=dev.example.com

# Object Storage (if using)
PUBLIC_OBJECT_SEARCH_PATHS=/bucket1/public,/bucket2/public
PRIVATE_OBJECT_DIR=/bucket1/private
```

---

## Notes

1. **Object Storage**: Only required if using file upload features. The app will work without it, but upload endpoints will fail.

2. **Replit Variables**: The app works outside Replit. Replit-specific variables are only needed when:
   - Using Replit OIDC authentication (currently not used - project uses Google Auth)
   - Using Replit Object Storage
   - Deploying on Replit platform

3. **Session Secret**: In development, if `SESSION_SECRET` is not set, a random secret is generated. In production, this should always be set to a secure random string.

4. **Payment Redirects**: The app falls back to `localhost:5000` if Replit domain variables are not set, which is fine for local development.
