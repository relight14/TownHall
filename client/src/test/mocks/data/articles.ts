import type { Article } from '@/hooks/articles/useArticles';

let idCounter = 0;

export function createArticle(overrides: Partial<Article> = {}): Article {
  idCounter++;
  return {
    id: `article-${idCounter}`,
    title: `Test Article ${idCounter}`,
    summary: `<p>Summary for article ${idCounter}</p>`,
    content: `<p>Content for article ${idCounter}</p>`,
    subheader: `Subheader ${idCounter}`,
    thumbnail: `https://example.com/thumb-${idCounter}.webp`,
    category: 'elections',
    viewCount: 100 * idCounter,
    readTimeMinutes: 5,
    featured: 0,
    publishedAt: new Date(2025, 5, idCounter).toISOString(),
    price: 0,
    ...overrides,
  };
}

export function createFeaturedArticle(overrides: Partial<Article> = {}): Article {
  return createArticle({
    featured: 1,
    viewCount: 5000,
    ...overrides,
  });
}

export function createArticleList(count: number, overrides: Partial<Article> = {}): Article[] {
  return Array.from({ length: count }, (_, i) =>
    createArticle({ ...overrides, id: `article-list-${i + 1}` }),
  );
}

export function resetArticleIdCounter() {
  idCounter = 0;
}
