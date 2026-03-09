/**
 * Shared API response types.
 *
 * These represent the shapes returned by the REST API (JSON-serialized).
 * They differ from the DB row types in shared/schema.ts:
 *   - Dates are serialized as ISO strings
 *   - Episode prices are in dollars (not cents)
 *   - Series includes a joined `episodes` array
 *   - Articles may include computed fields like `isPreview` and `author`
 *
 * Import these everywhere instead of re-declaring inline types.
 */

// ─── Episode ────────────────────────────────────────────────────────

export interface ApiEpisode {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoType: 'vimeo' | 'youtube';
  /** Price in dollars (API converts from cents). */
  price: number;
  thumbnail: string;
  ledewireContentId?: string | null;
}

// ─── Series ─────────────────────────────────────────────────────────

export interface ApiSeries {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  trailerUrl?: string | null;
  trailerType?: 'vimeo' | 'youtube' | null;
  episodes: ApiEpisode[];
}

// ─── Featured Episode ───────────────────────────────────────────────

export interface ApiFeaturedEpisode extends ApiEpisode {
  seriesId: string;
  displayOrder: number;
}

// ─── Article ────────────────────────────────────────────────────────

export interface ApiArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  subheader: string;
  thumbnail: string | null;
  category: string;
  topic: string;
  state: string | null;
  contributorId: string | null;
  /** Price in cents (articles are NOT converted to dollars by the API). */
  price: number;
  ledewireContentId?: string | null;
  viewCount: number;
  readTimeMinutes: number;
  featured: number | null;
  /** ISO date string. */
  publishedAt: string;
  /** ISO date string. */
  createdAt: string;
  /** Computed by the API — contributor/site name. */
  author?: string;
  /** True when the content has been truncated for non-purchasers. */
  isPreview?: boolean;
}

// ─── Site Settings ──────────────────────────────────────────────────

export interface ApiSiteSettings {
  heroHeading: string;
  heroSubheading: string;
}

// ─── User (client-side shape from auth endpoints) ───────────────────

export interface ApiUser {
  id: string;
  email: string;
  name: string;
}
