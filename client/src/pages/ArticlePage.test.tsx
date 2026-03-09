import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRoute } from '../test/test-utils';
import ArticlePage from './ArticlePage';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { createArticle } from '../test/mocks/data/articles';

// Mock modals
vi.mock('../components/AuthModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="auth-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../components/PasswordResetModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="password-reset-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../components/AddFundsModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="add-funds-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock react-tweet (makes external API calls)
vi.mock('react-tweet', () => ({
  Tweet: ({ id }: { id: string }) => <div data-testid={`tweet-${id}`}>Tweet embed</div>,
}));

const freeArticle = createArticle({
  id: 'free-1',
  title: 'Free Article Title',
  subheader: 'A compelling subheader',
  summary: '<p>This is the article summary.</p>',
  content: '<p>First paragraph of the article.</p><p>Second paragraph with more detail.</p><p>Third paragraph wrapping up.</p>',
  category: 'elections',
  viewCount: 1234,
  readTimeMinutes: 5,
  publishedAt: '2025-06-15T12:00:00.000Z',
  price: 0,
  thumbnail: 'https://example.com/thumb.webp',
});

const paidArticle = createArticle({
  id: 'paid-1',
  title: 'Premium Article Title',
  subheader: 'Exclusive analysis',
  summary: '<p>Premium summary content.</p>',
  content: '<p>Preview paragraph one.</p><p>Preview paragraph two.</p><p>This is the premium content behind the paywall.</p>',
  category: 'policy',
  viewCount: 5678,
  readTimeMinutes: 8,
  publishedAt: '2025-06-10T12:00:00.000Z',
  price: 199,
  thumbnail: 'https://example.com/premium-thumb.webp',
  ledewireContentId: 'lw-content-123',
});

function renderArticlePage(articleId: string) {
  return renderWithRoute(<ArticlePage />, {
    routePath: '/article/:articleId',
    initialPath: `/article/${articleId}`,
  });
}

function setupFreeArticleHandler() {
  server.use(
    http.get('/api/articles/:articleId', () => HttpResponse.json(freeArticle)),
  );
}

function setupPaidArticleHandler(purchased = false) {
  server.use(
    http.get('/api/articles/:articleId', () => HttpResponse.json(paidArticle)),
    http.get('/api/articles/:articleId/purchase/verify', () =>
      HttpResponse.json({ has_purchased: purchased }),
    ),
  );
}

describe('ArticlePage', () => {
  describe('Loading state', () => {
    it('shows loading spinner while fetching', () => {
      setupFreeArticleHandler();
      renderArticlePage('free-1');

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Error / Not Found', () => {
    it('shows "Article not found" for missing article', async () => {
      server.use(
        http.get('/api/articles/:articleId', () =>
          HttpResponse.json({ error: 'Not found' }, { status: 404 }),
        ),
      );

      renderArticlePage('nonexistent');

      await waitFor(() => {
        expect(screen.getByText('Article not found')).toBeInTheDocument();
      });

      expect(screen.getByText("The article you're looking for doesn't exist.")).toBeInTheDocument();
    });

    it('shows back to home link on error page', async () => {
      server.use(
        http.get('/api/articles/:articleId', () =>
          HttpResponse.json({ error: 'Not found' }, { status: 404 }),
        ),
      );

      renderArticlePage('nonexistent');

      await waitFor(() => {
        expect(screen.getByText('Back to home')).toBeInTheDocument();
      });
    });
  });

  describe('Free article', () => {
    it('renders article title', async () => {
      setupFreeArticleHandler();
      renderArticlePage('free-1');

      await waitFor(() => {
        expect(screen.getByTestId('text-article-title')).toHaveTextContent('Free Article Title');
      });
    });

    it('renders subheader', async () => {
      setupFreeArticleHandler();
      renderArticlePage('free-1');

      await waitFor(() => {
        expect(screen.getByTestId('text-article-subheader')).toHaveTextContent('A compelling subheader');
      });
    });

    it('renders article summary', async () => {
      setupFreeArticleHandler();
      renderArticlePage('free-1');

      await waitFor(() => {
        expect(screen.getByTestId('text-article-summary')).toHaveTextContent('This is the article summary.');
      });
    });

    it('renders full article content', async () => {
      setupFreeArticleHandler();
      renderArticlePage('free-1');

      await waitFor(() => {
        expect(screen.getByTestId('text-article-content')).toBeInTheDocument();
      });

      expect(screen.getByText('First paragraph of the article.')).toBeInTheDocument();
    });

    it('renders article metadata (date, read time, views)', async () => {
      setupFreeArticleHandler();
      renderArticlePage('free-1');

      await waitFor(() => {
        expect(screen.getByTestId('text-article-date')).toBeInTheDocument();
      });

      expect(screen.getByTestId('text-article-read-time')).toBeInTheDocument();
      expect(screen.getByTestId('text-article-view-count')).toHaveTextContent('1.2K views');
    });

    it('does not show price for free articles', async () => {
      setupFreeArticleHandler();
      renderArticlePage('free-1');

      await waitFor(() => {
        expect(screen.getByTestId('text-article-title')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('text-article-price')).not.toBeInTheDocument();
    });

    it('renders "Back to home" link', async () => {
      setupFreeArticleHandler();
      renderArticlePage('free-1');

      await waitFor(() => {
        expect(screen.getByTestId('link-back-home')).toBeInTheDocument();
      });

      expect(screen.getByTestId('link-back-home')).toHaveAttribute('href', '/');
    });

    it('renders share buttons', async () => {
      setupFreeArticleHandler();
      renderArticlePage('free-1');

      await waitFor(() => {
        expect(screen.getByTestId('button-share-twitter')).toBeInTheDocument();
      });

      expect(screen.getByTestId('button-share-facebook')).toBeInTheDocument();
      expect(screen.getByTestId('button-share-linkedin')).toBeInTheDocument();
      expect(screen.getByTestId('button-copy-link')).toBeInTheDocument();
    });

    it('renders author byline', async () => {
      setupFreeArticleHandler();
      renderArticlePage('free-1');

      await waitFor(() => {
        // Author byline within the article (not the header logo)
        expect(screen.getByTestId('text-article-author')).toHaveTextContent('The Commons');
      });
    });
  });

  describe('Paid article - paywall', () => {
    it('shows price in metadata', async () => {
      setupPaidArticleHandler(false);
      renderArticlePage('paid-1');

      await waitFor(() => {
        expect(screen.getByTestId('text-article-price')).toHaveTextContent('$1.99 to unlock');
      });
    });

    it('shows paywall with "Buy Now" button', async () => {
      setupPaidArticleHandler(false);
      renderArticlePage('paid-1');

      await waitFor(() => {
        expect(screen.getByTestId('button-buy-now')).toBeInTheDocument();
      });

      expect(screen.getByTestId('button-buy-now')).toHaveTextContent('Buy Now - $1.99');
    });

    it('shows preview content, not full content', async () => {
      setupPaidArticleHandler(false);
      renderArticlePage('paid-1');

      await waitFor(() => {
        expect(screen.getByTestId('text-article-preview')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('text-article-content')).not.toBeInTheDocument();
    });

    it('shows support message on paywall', async () => {
      setupPaidArticleHandler(false);
      renderArticlePage('paid-1');

      await waitFor(() => {
        expect(screen.getByText('Support the work you want to see in the world')).toBeInTheDocument();
      });
    });

    it('opens auth modal when unauthenticated user clicks Buy Now', async () => {
      setupPaidArticleHandler(false);
      renderArticlePage('paid-1');
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('button-buy-now')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('button-buy-now'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Paid article - non-monetized (no ledewireContentId)', () => {
    it('shows full content when article has price but no ledewireContentId', async () => {
      const nonMonetizedPaid = createArticle({
        id: 'non-monetized-1',
        title: 'Non-Monetized Article',
        content: '<p>Full content visible.</p>',
        price: 199,
        ledewireContentId: null,
      });

      server.use(
        http.get('/api/articles/:articleId', () => HttpResponse.json(nonMonetizedPaid)),
      );

      renderArticlePage('non-monetized-1');

      await waitFor(() => {
        expect(screen.getByTestId('text-article-content')).toBeInTheDocument();
      });

      // No paywall because ledewireContentId is null (isMonetized = false)
      expect(screen.queryByTestId('button-buy-now')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('copy link button shows "Copied!" feedback', async () => {
      setupFreeArticleHandler();
      renderArticlePage('free-1');
      const user = userEvent.setup();

      // Mock clipboard API via Object.defineProperty (navigator.clipboard is getter-only)
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
        configurable: true,
      });

      await waitFor(() => {
        expect(screen.getByTestId('button-copy-link')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('button-copy-link'));

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });
  });
});
