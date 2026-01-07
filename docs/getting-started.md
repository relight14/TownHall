# Getting Started Guide

Complete guide to setting up, using, and developing with ChrisCillizza.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Overview

ChrisCillizza is a platform for monetizing political commentary through videos and articles. It combines:

- Video series and episodes with Vimeo/YouTube integration
- Long-form articles across multiple categories
- Ledewire micropayments for content monetization
- Google OAuth authentication
- Admin dashboard for content management

### Content Categories

- **Elections** - Election coverage and analysis
- **Policy** - Policy analysis and breakdowns
- **Candidate Rankings** - Candidate evaluations
- **Speech Analysis** - Speech breakdowns and commentary

## Features

- 📺 **Video Content**: Series-based video organization with trailers
- 📝 **Articles**: Rich-text articles with TipTap editor
- 💰 **Micropayments**: Ledewire integration for content purchases
- 🔐 **Authentication**: Google OAuth and Ledewire SSO
- 👤 **User Wallets**: Balance tracking and transaction history
- 🎨 **Admin Dashboard**: Complete content management system
- 📱 **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- 🔍 **Content Preview**: Free previews for paid content
- 🏷️ **Featured Content**: Curated homepage sections

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend** | Express.js, Node.js |
| **Database** | PostgreSQL (Neon), Drizzle ORM |
| **Auth** | Google OAuth 2.0, Ledewire SSO |
| **Payments** | Ledewire API |
| **Storage** | Replit Object Storage (optional) |

## Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **PostgreSQL** database (we recommend [Neon](https://neon.tech) for serverless PostgreSQL)
- **npm** or **pnpm** package manager
- **Ledewire Account** - [Sign up at Ledewire](https://ledewire.com) to get API credentials
- **Google OAuth Credentials** - [Google Cloud Console](https://console.cloud.google.com/)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ChrisCillizza
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

## Environment Setup

1. **Copy the environment template**
   ```bash
   cp .env.example .env
   ```

2. **Configure your `.env` file**

   Open `.env` and fill in the required values:

   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

   # Ledewire API (Buyer - for customer authentication)
   LEDEWIRE_API_URL=https://api.ledewire.com/v1
   LEDEWIRE_API_KEY=your_buyer_api_key
   LEDEWIRE_API_SECRET=your_buyer_api_secret

   # Ledewire API (Seller - for content registration)
   CILLIZZA_SELLER_API_KEY=your_seller_api_key
   CILLIZZA_SELLER_API_SECRET=your_seller_api_secret

   # Admin Account
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=your_secure_password

   # Session Secret (generate a random string)
   SESSION_SECRET=your_random_secret_string_here

   # Server Configuration
   NODE_ENV=development
   PORT=5000
   ```

   **Getting Credentials:**

   - **Database URL**: Get from your PostgreSQL provider (e.g., [Neon](https://neon.tech))
   - **Ledewire Keys**:
     - Sign up at [Ledewire](https://ledewire.com)
     - Navigate to Developer Settings to get your API keys
     - You need both buyer and seller credentials
   - **Session Secret**: Generate with `openssl rand -hex 32`

   **See [environment-variables.md](environment-variables.md) for detailed configuration reference.**

## Database Setup

1. **Push the database schema**
   ```bash
   npm run db:push
   ```

   This creates all the required tables in your database.

2. **Seed the database with test data** (optional but recommended)
   ```bash
   npm run db:seed
   ```

   This will create:
   - Site settings (hero heading, subheading)
   - 4 test users
   - 3 video series
   - 5 episodes
   - 6 articles across all categories
   - Featured content

   **Test User Credentials:**
   - `test@example.com` / `password123`
   - `demo@example.com` / `password123`
   - `user@example.com` / `password123`
   - `reader@example.com` / `password123`

## Running the Application

**Development Mode:**
```bash
npm run dev
```

This starts:
- Frontend dev server at `http://localhost:5173` (Vite)
- Backend API server at `http://localhost:5000` (Express)

**Production Mode:**
```bash
npm run build
npm start
```

The app will be available at `http://localhost:5000`

## Usage

### Signing Up

1. Navigate to the application in your browser
2. Click "Sign In" in the navigation
3. Choose **Google Sign In** for OAuth authentication
4. Authorize the application with your Google account
5. Your account will be created automatically

**What happens during signup:**
- A user record is created in the database
- Your account is linked to Ledewire for payments
- You receive an initial wallet balance (if configured)

### Logging In

**Option 1: Google OAuth (Recommended)**
1. Click "Sign In"
2. Select Google authentication
3. Choose your Google account

**Option 2: Ledewire SSO**
1. Click "Sign In"
2. Use your Ledewire credentials
3. Authenticate through Ledewire

**Session Management:**
- Sessions are persistent (using PostgreSQL session store)
- You stay logged in until you explicitly log out
- Sessions are secure with encrypted cookies

### Purchasing Content

1. **Browse Content**
   - View free content immediately
   - See previews of paid content

2. **Purchase Process**
   - Click "Unlock" or "Purchase" on paid content
   - Confirm the purchase price
   - Content is unlocked using your Ledewire wallet balance

3. **View Purchased Content**
   - Access unlimited after purchase
   - Content appears in your library
   - Download or stream as available

**Pricing:**
- Videos: Typically $4.99 - $7.99
- Articles: Typically $0.99 - $2.49
- Some content is free

### Admin Access

**Login:**
1. Navigate to `/admin`
2. Use the credentials from your `.env`:
   - Email: `ADMIN_EMAIL`
   - Password: `ADMIN_PASSWORD`

**Admin Capabilities:**
- Create/edit/delete video series
- Create/edit/delete episodes
- Create/edit/delete articles
- Manage featured content
- Update site settings
- Upload images
- View analytics

## Development

### Database Seeding

Reset your database with fresh test data anytime:

```bash
npm run db:seed
```

This is useful when:
- Starting development
- Testing new features
- Resetting after breaking changes
- Creating demos

**What gets seeded:**
- Realistic video series and episodes
- Articles across all categories
- Mix of free and paid content
- Test user accounts
- Featured content

### Project Structure

```
ChrisCillizza/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # Global state (VideoStoreContext)
│   │   ├── hooks/       # Custom React hooks
│   │   └── App.tsx      # Main app component
│   └── public/          # Static assets
│
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Data layer
│   ├── ledewire.ts      # Payment integration
│   ├── googleAuth.ts    # OAuth configuration
│   ├── adminAuth.ts     # Admin authentication
│   └── og-middleware.ts # Social sharing images
│
├── shared/              # Shared code
│   └── schema.ts        # Database schema (Drizzle)
│
├── script/              # Utility scripts
│   └── seed.ts          # Database seeding
│
└── docs/                # Documentation
    ├── environment-variables.md
    ├── project-architecture.md
    └── getting-started.md
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (frontend + backend) |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run check` | Type check with TypeScript |
| `npm run db:push` | Push database schema changes |
| `npm run db:seed` | Seed database with test data |

## Troubleshooting

### Database Connection Issues

**Problem:** `Error connecting to database`

**Solutions:**
- Verify `DATABASE_URL` in `.env` is correct
- Check that your PostgreSQL database is running
- Ensure your IP is whitelisted (for cloud databases like Neon)
- Try `npm run db:push` to ensure schema is up to date

### Ledewire API Errors

**Problem:** `Invalid API credentials`

**Solutions:**
- Double-check `LEDEWIRE_API_KEY` and `LEDEWIRE_API_SECRET` in `.env`
- Verify you're using the correct API URL (production vs staging)
- Check that both buyer and seller credentials are configured
- Ensure your Ledewire account is active

### Google OAuth Not Working

**Problem:** `Google authentication fails`

**Solutions:**
- Verify your Google OAuth credentials
- Check authorized redirect URIs in Google Cloud Console
- Ensure you're using the correct client ID and secret
- Try clearing cookies and cache

### Port Already in Use

**Problem:** `Port 5000 is already in use`

**Solutions:**
- Change `PORT` in `.env` to a different port
- Kill the process using port 5000: `lsof -ti:5000 | xargs kill -9`
- Use a different port: `PORT=3000 npm run dev`

### Session Issues

**Problem:** User keeps getting logged out

**Solutions:**
- Ensure `SESSION_SECRET` is set in `.env`
- Check database connection (sessions are stored in PostgreSQL)
- Clear browser cookies
- Restart the server

### Seed Script Fails

**Problem:** `npm run db:seed` throws errors

**Solutions:**
- Run `npm run db:push` first to ensure schema is up to date
- Check database connection
- Verify all tables exist
- Clear existing data manually if foreign key constraints fail
