# Overview

This is a video streaming platform for premium content, specifically designed for adventure films and documentaries. The application enables content creators to monetize their videos through micropayments using the Ledewire payment system. Users can browse video series, purchase individual episodes, and watch purchased content. The platform includes an admin panel for content management and a wallet system for handling micropayments.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack**: React 18 with TypeScript, built using Vite as the build tool. The UI leverages shadcn/ui components with Radix UI primitives and Tailwind CSS for styling.

**Routing**: React Router v6 handles client-side routing with distinct pages for home, series detail, admin management, and wallet management.

**State Management**: Context API pattern via `VideoStoreContext` manages global application state including user authentication, series/episode data, purchase history, and wallet balance. This centralizes business logic and provides a clean interface for components to access shared state.

**Component Structure**: 
- Pages (`HomePage`, `SeriesPage`, `AdminPage`, `WalletPage`) handle route-level concerns
- Shared components (`SeriesCard`, `EpisodeCard`, `VideoPlayer`) provide reusable UI elements
- Modal components (`AuthModal`, `PurchaseModal`) handle user interactions
- UI primitives from shadcn/ui provide consistent, accessible base components

**Design Patterns**: The application uses composition patterns extensively, with components accepting props interfaces for type safety. Image loading includes fallback handling via `ImageWithFallback` component. Video embeds support both Vimeo and YouTube through a unified `VideoEmbed` component.

## Backend Architecture

**Framework**: Express.js server with TypeScript, running in ESM module mode.

**Request Flow**: 
1. Static file serving for production builds
2. API routes under `/api/*` prefix
3. Vite development middleware in development mode
4. Fallback to index.html for SPA routing

**API Structure**: RESTful endpoints organized in `server/routes.ts`:
- `/api/auth/*` - User authentication (login, signup)
- `/api/series/*` - Series CRUD operations
- `/api/episodes/*` - Episode CRUD operations
- `/api/ledewire/*` - Payment processing and wallet management
- `/api/admin/*` - Admin authentication and privileged operations

**Authentication**: Two-tier security model:
- User authentication via Ledewire tokens (stored in user records)
- Admin authentication via session tokens (4-hour TTL, rate-limited login attempts)
- Admin endpoints protected by `requireAdminAuth` middleware

**Rate Limiting**: Login endpoint includes IP-based rate limiting (5 attempts per 15 minutes) to prevent brute force attacks.

## Data Storage

**ORM**: Drizzle ORM provides type-safe database access with PostgreSQL dialect.

**Database Schema**:
- `users` - User accounts with Ledewire integration fields
- `series` - Video series metadata including optional trailers
- `episodes` - Individual videos linked to series, with pricing and Ledewire content IDs

**Storage Abstraction**: `IStorage` interface in `server/storage.ts` abstracts database operations, with `DatabaseStorage` implementation using Drizzle. This pattern allows for potential future storage backend changes without affecting business logic.

**Data Relationships**: Episodes cascade delete when parent series is removed. PostgreSQL `gen_random_uuid()` generates primary keys.

## External Dependencies

**Ledewire Payment System**: Micropayment platform integration for content monetization. The system handles:
- User authentication and wallet management
- Content registration (episodes as purchasable items)
- Purchase verification and transaction processing
- Wallet balance tracking
- **Wallet Top-ups via Stripe**: Ledewire handles Stripe integration internally. The `/wallet/payment-session` endpoint creates a Stripe Checkout session with success/cancel URLs, returning a `checkout_url` for redirect.

**Integration Points**:
- `server/ledewire.ts` - API client wrapper for Ledewire endpoints
- Buyer credentials (API key/secret) for customer operations
- Seller credentials (separate API key/secret) for content registration
- Security: Seller credentials never exposed to frontend

**Authentication Methods**:
- Email/password authentication via Ledewire
- Google SSO - Google Client ID is fetched dynamically from Ledewire's `/v1/seller/config` endpoint at runtime
  - No need to manage separate Google OAuth credentials
  - Google ID tokens are forwarded to Ledewire's `/v1/auth/login/google` for verification
  - If Google OAuth is unavailable, the app gracefully falls back to email/password only
- SSO sessions managed via express-session with PostgreSQL storage

**Neon Database**: Serverless PostgreSQL provider using `@neondatabase/serverless` driver for edge-compatible database connections.

**Video Hosting**: Platform-agnostic video delivery supporting:
- Vimeo (embedded player)
- YouTube (embedded player)
- Episodes and series trailers can use either platform
- URLs stored in database, converted to embed URLs client-side

**UI Component Libraries**:
- Radix UI - Accessible component primitives
- shadcn/ui - Pre-styled component implementations
- Lucide React - Icon system
- Tailwind CSS - Utility-first styling

**Build System**:
- Vite - Frontend development and production builds
- esbuild - Server-side bundling with selective dependency bundling
- Custom build script bundles frequently-used dependencies to reduce syscalls and improve cold start times

**Development Tools**:
- Replit-specific plugins (cartographer, dev banner, runtime error overlay)
- Custom meta images plugin for OpenGraph image URL injection