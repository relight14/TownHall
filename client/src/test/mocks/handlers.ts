import { http, HttpResponse } from 'msw';
import { createArticle, createFeaturedArticle } from './data/articles';
import { createSeries } from './data/series';
import { createFeaturedEpisode } from './data/episodes';

const defaultArticles = [
  createArticle({ id: 'art-1', title: 'Elections Article', category: 'elections', viewCount: 500 }),
  createArticle({ id: 'art-2', title: 'Policy Article', category: 'policy', viewCount: 300 }),
  createArticle({ id: 'art-3', title: 'Rankings Article', category: 'candidate-rankings', viewCount: 200 }),
];

const defaultFeatured = [
  createFeaturedArticle({ id: 'feat-1', title: 'Featured: Big Story', category: 'elections' }),
];

const defaultLatest = [
  createArticle({ id: 'latest-1', title: 'Latest One', publishedAt: '2025-06-10T00:00:00.000Z' }),
  createArticle({ id: 'latest-2', title: 'Latest Two', publishedAt: '2025-06-09T00:00:00.000Z' }),
  createArticle({ id: 'latest-3', title: 'Latest Three', publishedAt: '2025-06-08T00:00:00.000Z' }),
];

const defaultMostRead = [
  createArticle({ id: 'mr-1', title: 'Most Read One', viewCount: 10000 }),
  createArticle({ id: 'mr-2', title: 'Most Read Two', viewCount: 5000 }),
];

const defaultSeries = [createSeries()];
const defaultFeaturedEpisodes = [createFeaturedEpisode()];

export const handlers = [
  // Articles
  http.get('/api/articles', () => {
    return HttpResponse.json(defaultArticles);
  }),

  http.get('/api/articles/featured', () => {
    return HttpResponse.json(defaultFeatured);
  }),

  http.get('/api/articles/latest', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    return HttpResponse.json(defaultLatest.slice(0, limit));
  }),

  http.get('/api/articles/most-read', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    return HttpResponse.json(defaultMostRead.slice(0, limit));
  }),

  // Single article (fallback - tests should override with specific data)
  http.get('/api/articles/:articleId', ({ params }) => {
    const article = [...defaultArticles, ...defaultFeatured].find(a => a.id === params.articleId);
    if (article) return HttpResponse.json(article);
    return HttpResponse.json({ error: 'Article not found' }, { status: 404 });
  }),

  // Article view increment
  http.post('/api/articles/:articleId/view', () => {
    return HttpResponse.json({ success: true });
  }),

  // Series
  http.get('/api/series', () => {
    return HttpResponse.json(defaultSeries);
  }),

  // Featured episodes
  http.get('/api/featured-episodes', () => {
    return HttpResponse.json(defaultFeaturedEpisodes);
  }),

  // Site settings
  http.get('/api/site-settings', () => {
    return HttpResponse.json({
      heroHeading: 'Test Hero Heading',
      heroSubheading: 'Test Hero Subheading',
    });
  }),

  // Auth - return 401 by default (unauthenticated)
  http.get('/api/auth/session', () => {
    return HttpResponse.json({ authenticated: false }, { status: 401 });
  }),

  http.get('/api/auth/user', () => {
    return new HttpResponse(null, { status: 401 });
  }),
];
