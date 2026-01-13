# ChrisCillizza - Project Architecture

> **Platform**: Video and article monetization for political commentary
> **Focus**: Elections, policy analysis, candidate rankings
> **Ledewire Integration**: Micropayments for videos AND articles

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React + Vite)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   HomePage   │  │  ArticlePage │  │    AdminPage         │  │
│  │  CategoryPage│  │  SeriesPage  │  │   AboutPage          │  │
│  │  WalletPage  │  │              │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                            │                                    │
│                 ┌──────────┴──────────┐                        │
│                 │  VideoStoreContext  │                        │
│                 │   (Global State)    │                        │
│                 └─────────────────────┘                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────┴─────────────────────────────────────┐
│                      SERVER (Express.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   routes.ts │  │  storage.ts │  │      ledewire.ts        │ │
│  │  (API Layer)│  │ (Data Layer)│  │ (Payment Integration)   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ googleAuth  │  │ sso-module  │  │   object_storage        │ │
│  │   .ts       │  │  (SSO Kit)  │  │   (Replit)              │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │ og-middleware│ │  adminAuth  │                              │
│  │ (OG Images)  │ │   .ts       │                              │
│  └─────────────┘  └─────────────┘                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  PostgreSQL │  │  Ledewire   │  │    Replit Object        │ │
│  │  (Drizzle)  │  │    API      │  │      Storage            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 + TypeScript | UI components and routing |
| **Build** | Vite | Fast dev server and bundling |
| **Styling** | Tailwind CSS + shadcn/ui | Component library |
| **Backend** | Express.js + TypeScript | REST API server |
| **Database** | PostgreSQL + Drizzle ORM | Data persistence |
| **Auth** | Google OAuth 2.0 + Ledewire SSO | User authentication |
| **Payments** | Ledewire API | Micropayment processing |
| **Storage** | Replit Object Storage | Image/asset uploads |
| **OG Images** | og-middleware | Social sharing previews |

---

## Key Differentiator: Articles

This project has **paid articles** in addition to videos:

- Articles have categories: `elections`, `policy`, `candidate-rankings`, `speech-analysis`
- Each article can be monetized with Ledewire micropayments
- Preview content (first 3 paragraphs) shown for paid articles
- Full content unlocked after purchase

---

## Project Structure

```
ChrisCillizza/
├── client/
│   ├── src/
│   │   ├── App.tsx              # Main app with routing
│   │   ├── components/
│   │   │   ├── admin/           # Admin-specific components
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── AuthModal.tsx
│   │   │   ├── PasswordResetModal.tsx  # Password reset flow
│   │   │   ├── ObjectUploader.tsx      # Image uploads
│   │   │   └── ...
│   │   ├── context/
│   │   │   └── VideoStoreContext.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── ArticlePage.tsx   # Article viewing
│   │   │   ├── CategoryPage.tsx  # Category listing
│   │   │   ├── AboutPage.tsx     # About section
│   │   │   └── ...
│   │   └── hooks/
│   │       ├── use-upload.ts     # Upload hook
│   │       └── ...
│   └── public/
│
├── server/
│   ├── index.ts
│   ├── routes.ts                 # Extended with articles
│   ├── storage.ts
│   ├── ledewire.ts
│   ├── googleAuth.ts
│   ├── adminAuth.ts              # Shared admin auth module
│   ├── og-middleware.ts          # Social sharing images
│   ├── sso-module/
│   └── replit_integrations/
│       └── object_storage/       # Image upload handling
│
├── shared/
│   └── schema.ts                 # Extended with articles table
│
└── docs/
```

---

## Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts | `id`, `email`, `googleId`, `ledewireUserId` |
| `series` | Video series | `id`, `title`, `thumbnail` |
| `episodes` | Videos | `id`, `seriesId`, `price`, `ledewireContentId` |
| `articles` | **Paid articles** | `id`, `title`, `content`, `category`, `price`, `ledewireContentId`, `viewCount`, `featured` |
| `sessions` | Express sessions | `sid`, `sess`, `expire` |
| `admin_settings` | Admin auth | `email`, `passwordHash` |
| `site_settings` | Site content | `heroHeading`, `heroSubheading` |
| `featured_episodes` | Homepage highlights | `episodeId`, `displayOrder` |

### Article Categories
- `elections` - Election coverage
- `policy` - Policy analysis
- `candidate-rankings` - Candidate evaluations
- `speech-analysis` - Speech breakdowns

---

## API Endpoints (Extended)

### Articles
- `GET /api/articles` - List all articles (preview only for paid)
- `GET /api/articles/:id` - Get article (full if purchased, preview if not)
- `GET /api/articles/featured` - Get featured articles
- `GET /api/articles/latest` - Get latest articles
- `GET /api/articles/most-read` - Get popular articles
- `GET /api/articles/category/:category` - Filter by category
- `POST /api/articles/:id/view` - Increment view count
- `POST /api/articles` - Create article (admin)
- `PUT /api/articles/:id` - Update article (admin)
- `DELETE /api/articles/:id` - Delete article (admin)

### Article Purchases
- `POST /api/articles/:id/purchase` - Purchase article
- `GET /api/articles/:id/purchase/verify` - Check ownership

### Password Reset (Ledewire)
- `POST /api/auth/password/reset-request` - Request reset code
- `POST /api/auth/password/reset` - Confirm reset with code

### Object Storage
- `POST /api/storage/upload` - Upload image
- `GET /api/storage/list` - List uploads
- `DELETE /api/storage/:key` - Delete file

---

## Unique Features

### 1. Article Content Protection
```javascript
// Server-side preview extraction for paid articles
function extractServerPreview(html, paragraphCount = 3) {
  const paragraphRegex = /<p[^>]*>[\s\S]*?<\/p>/gi;
  const paragraphs = html.match(paragraphRegex) || [];
  return paragraphs.slice(0, paragraphCount).join('');
}
```

### 2. OG Middleware for Social Sharing
Generates dynamic Open Graph images for articles when shared on social media.

### 3. Password Reset Flow
Full password reset via Ledewire's email-based reset code system.

### 4. Replit Object Storage
Image uploads stored in Replit's integrated object storage.

---

## Security Features

- **Admin Auth Module** - Shared authentication logic
- **Content Preview** - Never exposes full paid content without purchase verification
- **Rate Limiting** - Login and purchase endpoints
- **Session Management** - Secure cookie handling
- **OG Image Generation** - Safe HTML rendering

---

## Environment Variables

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

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Admin
ADMIN_EMAIL=...
ADMIN_PASSWORD=...

# Replit
REPLIT_DB_URL=...
REPLIT_OBJECT_STORAGE_...

# Server
PORT=5000
NODE_ENV=production
```

---

## Notes & Observations

<!-- Add your audit notes here -->
