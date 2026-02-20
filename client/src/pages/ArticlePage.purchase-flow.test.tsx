import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRoute } from '../test/test-utils';
import ArticlePage from './ArticlePage';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { createArticle } from '../test/mocks/data/articles';
import { extractServerPreview } from '@shared/preview';

// Do NOT mock AuthModal — we need the real login form for this flow
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

vi.mock('react-tweet', () => ({
  Tweet: ({ id }: { id: string }) => <div data-testid={`tweet-${id}`}>Tweet embed</div>,
}));

// AuthModal dependencies — disable Google OAuth, keep email/password form
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => null,
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../App', () => ({
  useGoogleOAuthStatus: () => ({ isAvailable: false }),
}));

// Valid JWT with exp far in the future (year ~2286) so isTokenExpired() returns false
const TEST_TOKEN = [
  btoa(JSON.stringify({ alg: 'HS256' })),
  btoa(JSON.stringify({ sub: 'user-1', exp: 9999999999 })),
  'test-sig',
].join('.');

const paidArticle = createArticle({
  id: 'paid-flow-1',
  title: 'Premium Flow Article',
  subheader: 'Exclusive analysis',
  summary: '<p>Article summary.</p>',
  content: '<p>Preview paragraph one.</p><p>Preview paragraph two.</p><p>Full premium content here.</p>',
  category: 'elections',
  price: 99, // $0.99
  ledewireContentId: 'lw-content-flow-1',
});

function renderArticlePage(articleId: string) {
  return renderWithRoute(<ArticlePage />, {
    routePath: '/article/:articleId',
    initialPath: `/article/${articleId}`,
  });
}

function setupHandlers({ hasPurchased }: { hasPurchased: boolean }) {
  server.use(
    http.get('/api/articles/:articleId', () => HttpResponse.json(paidArticle)),
    http.post('/api/auth/login', () =>
      HttpResponse.json({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
        ledewireToken: TEST_TOKEN,
      }),
    ),
    http.get('/api/articles/:articleId/purchase/verify', () =>
      HttpResponse.json({ has_purchased: hasPurchased }),
    ),
    http.get('/api/wallet/balance', () =>
      HttpResponse.json({ balance_cents: 1000 }),
    ),
  );
}

async function loginThroughModal(user: ReturnType<typeof userEvent.setup>) {
  // Click Buy Now → auth modal opens
  await user.click(screen.getByTestId('button-buy-now'));

  await waitFor(() => {
    expect(screen.getByTestId('input-email')).toBeInTheDocument();
  });

  // Fill in credentials and submit
  await user.type(screen.getByTestId('input-email'), 'test@example.com');
  await user.type(screen.getByTestId('input-password'), 'password123');
  await user.click(screen.getByTestId('button-submit'));

  // Wait for auth modal to close
  await waitFor(() => {
    expect(screen.queryByTestId('input-email')).not.toBeInTheDocument();
  });
}

describe('ArticlePage - Preview content security', () => {
  const fullContent = [
    '<p>Free intro paragraph visible to everyone.</p>',
    '<p>Second free paragraph with more detail.</p>',
    '<p>Third free paragraph wrapping up.</p>',
    '<p>PREMIUM: Secret exclusive content behind the paywall.</p>',
    '<p>PREMIUM: More exclusive analysis only for paying users.</p>',
    '<p>PREMIUM: Final conclusion with insider info.</p>',
  ].join('');

  it('renders only preview paragraphs — premium content is NOT in the DOM', async () => {
    // Simulate server behavior: strip content to first 3 paragraphs
    const previewContent = extractServerPreview(fullContent, 3);
    const previewArticle = createArticle({
      id: 'preview-security-1',
      title: 'Preview Security Test',
      content: previewContent,
      price: 99,
      ledewireContentId: 'lw-preview-1',
      isPreview: true,
    });

    server.use(
      http.get('/api/articles/:articleId', () => HttpResponse.json(previewArticle)),
    );

    renderArticlePage('preview-security-1');

    await waitFor(() => {
      expect(screen.getByTestId('text-article-preview')).toBeInTheDocument();
    });

    // Preview paragraphs are visible
    expect(screen.getByText('Free intro paragraph visible to everyone.')).toBeInTheDocument();
    expect(screen.getByText('Second free paragraph with more detail.')).toBeInTheDocument();
    expect(screen.getByText('Third free paragraph wrapping up.')).toBeInTheDocument();

    // Premium content NEVER appears in the DOM — server stripped it
    expect(screen.queryByText(/PREMIUM/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Secret exclusive/)).not.toBeInTheDocument();
    expect(screen.queryByText(/insider info/)).not.toBeInTheDocument();

    // Full content container is NOT rendered
    expect(screen.queryByTestId('text-article-content')).not.toBeInTheDocument();
  });

  it('paywall banner shows with correct price alongside preview', async () => {
    const previewContent = extractServerPreview(fullContent, 3);
    const previewArticle = createArticle({
      id: 'preview-price-1',
      title: 'Price Display Test',
      content: previewContent,
      price: 199,
      ledewireContentId: 'lw-price-1',
      isPreview: true,
    });

    server.use(
      http.get('/api/articles/:articleId', () => HttpResponse.json(previewArticle)),
    );

    renderArticlePage('preview-price-1');

    await waitFor(() => {
      expect(screen.getByTestId('button-buy-now')).toBeInTheDocument();
    });

    expect(screen.getByText(/Unlock the full article for just \$1\.99/)).toBeInTheDocument();
    expect(screen.getByTestId('button-buy-now')).toHaveTextContent('Buy Now - $1.99');
  });
});

describe('ArticlePage - Purchase flow', () => {
  it('shows paywall with lock banner for unauthenticated user', async () => {
    setupHandlers({ hasPurchased: false });
    renderArticlePage('paid-flow-1');

    await waitFor(() => {
      expect(screen.getByTestId('button-buy-now')).toBeInTheDocument();
    });

    expect(screen.getByText(/Unlock the full article for just \$0\.99/)).toBeInTheDocument();
    expect(screen.getByTestId('text-article-preview')).toBeInTheDocument();
    expect(screen.queryByTestId('text-article-content')).not.toBeInTheDocument();
  });

  it('opens auth modal when unauthenticated user clicks Buy Now', async () => {
    setupHandlers({ hasPurchased: false });
    renderArticlePage('paid-flow-1');
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId('button-buy-now')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('button-buy-now'));

    await waitFor(() => {
      expect(screen.getByTestId('input-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-password')).toBeInTheDocument();
      expect(screen.getByTestId('button-submit')).toHaveTextContent('Sign In');
    });
  });

  describe('user has NOT purchased the article', () => {
    it('keeps paywall banner after login', async () => {
      setupHandlers({ hasPurchased: false });
      renderArticlePage('paid-flow-1');
      const user = userEvent.setup();

      // 1. Paywall is visible
      await waitFor(() => {
        expect(screen.getByTestId('button-buy-now')).toBeInTheDocument();
      });
      expect(screen.getByText(/Unlock the full article/)).toBeInTheDocument();

      // 2-4. Login through auth modal
      await loginThroughModal(user);

      // 5. Paywall STILL visible — user hasn't purchased this article
      await waitFor(() => {
        expect(screen.getByText(/Unlock the full article/)).toBeInTheDocument();
      });
      expect(screen.queryByTestId('text-article-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('text-article-preview')).toBeInTheDocument();
    });
  });

  describe('user HAS purchased the article', () => {
    it('removes paywall and shows full content after login', async () => {
      setupHandlers({ hasPurchased: true });
      renderArticlePage('paid-flow-1');
      const user = userEvent.setup();

      // 1. Paywall is visible before login
      await waitFor(() => {
        expect(screen.getByTestId('button-buy-now')).toBeInTheDocument();
      });
      expect(screen.getByText(/Unlock the full article/)).toBeInTheDocument();

      // 2-4. Login through auth modal
      await loginThroughModal(user);

      // 5. Paywall gone — full content displayed
      await waitFor(() => {
        expect(screen.getByTestId('text-article-content')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('button-buy-now')).not.toBeInTheDocument();
      expect(screen.queryByText(/Unlock the full article/)).not.toBeInTheDocument();
      expect(screen.queryByTestId('text-article-preview')).not.toBeInTheDocument();
    });
  });
});
