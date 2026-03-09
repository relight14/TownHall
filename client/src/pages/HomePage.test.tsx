import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/test-utils';
import HomePage from './HomePage';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { createArticle, createFeaturedArticle } from '../test/mocks/data/articles';

// Mock lazy-loaded modals to avoid Suspense complexity in tests
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

const articles = [
  createArticle({ id: 'a1', title: 'Elections Piece', category: 'elections', viewCount: 800, publishedAt: '2025-06-05T12:00:00.000Z' }),
  createArticle({ id: 'a2', title: 'Policy Piece', category: 'policy', viewCount: 600, publishedAt: '2025-06-04T12:00:00.000Z' }),
  createArticle({ id: 'a3', title: 'Rankings Piece', category: 'candidate-rankings', viewCount: 400, publishedAt: '2025-06-03T12:00:00.000Z' }),
];

const featuredArticle = createFeaturedArticle({
  id: 'feat-main',
  title: 'The Big Featured Story',
  category: 'elections',
  summary: '<p>Featured summary text</p>',
  publishedAt: '2025-06-10T12:00:00.000Z',
  viewCount: 5000,
});

function setupHandlers() {
  server.use(
    http.get('/api/articles', () => HttpResponse.json(articles)),
    http.get('/api/articles/featured', () => HttpResponse.json([featuredArticle])),
    http.get('/api/articles/latest', () => HttpResponse.json(articles)),
    http.get('/api/articles/most-read', () => HttpResponse.json(articles)),
    http.get('/api/series', () => HttpResponse.json([])),
    http.get('/api/featured-episodes', () => HttpResponse.json([])),
  );
}

/** Wait for data to load (skeleton disappears) */
async function waitForDataLoaded() {
  await waitFor(() => {
    expect(screen.getByTestId(`featured-article-${featuredArticle.id}`)).toBeInTheDocument();
  });
}

describe('HomePage', () => {
  it('displays loading skeleton while data is fetching', () => {
    setupHandlers();
    renderWithProviders(<HomePage />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders featured article after loading', async () => {
    setupHandlers();
    renderWithProviders(<HomePage />);

    await waitForDataLoaded();

    const heroSection = screen.getByTestId(`featured-article-${featuredArticle.id}`);
    expect(within(heroSection).getByText('The Big Featured Story')).toBeInTheDocument();
    expect(within(heroSection).getByText('Featured summary text')).toBeInTheDocument();
  });

  it('renders latest articles sidebar', async () => {
    setupHandlers();
    renderWithProviders(<HomePage />);

    await waitForDataLoaded();

    expect(screen.getByText('Latest')).toBeInTheDocument();
    // Sidebar shows articles from allArticles sorted by date (excluding featured hero)
    expect(screen.getByTestId('latest-article-a1')).toBeInTheDocument();
  });

  it('renders most read articles sidebar', async () => {
    setupHandlers();
    renderWithProviders(<HomePage />);

    await waitForDataLoaded();

    expect(screen.getByText('Trending')).toBeInTheDocument();
    expect(screen.getByTestId('most-read-article-a1')).toBeInTheDocument();
  });

  it('renders Browse by State section', async () => {
    setupHandlers();
    renderWithProviders(<HomePage />);

    await waitForDataLoaded();

    // Browse by State section should exist with state links
    expect(screen.getByText('Browse by State')).toBeInTheDocument();
    expect(screen.getByTestId('state-link-GA')).toBeInTheDocument();
    expect(screen.getByTestId('state-link-NY')).toBeInTheDocument();
  });

  it('shows "Log in" button when unauthenticated', async () => {
    setupHandlers();
    renderWithProviders(<HomePage />);

    expect(screen.getByTestId('button-login')).toBeInTheDocument();
    expect(screen.getByText('Log in')).toBeInTheDocument();
  });

  it('renders topic navigation', () => {
    setupHandlers();
    renderWithProviders(<HomePage />);

    expect(screen.getByText('Politics')).toBeInTheDocument();
    expect(screen.getByTestId('category-tab-videos')).toBeInTheDocument();
  });

  it('renders footer with terms and privacy links', () => {
    setupHandlers();
    renderWithProviders(<HomePage />);

    expect(screen.getByTestId('link-terms')).toHaveTextContent('Terms of Service');
    expect(screen.getByTestId('link-privacy')).toHaveTextContent('Privacy Policy');
  });

  it('renders logo', () => {
    setupHandlers();
    renderWithProviders(<HomePage />);

    expect(screen.getByTestId('logo')).toHaveTextContent('The Commons');
  });

  it('state links point to correct URLs', async () => {
    setupHandlers();
    renderWithProviders(<HomePage />);

    await waitForDataLoaded();

    const gaLink = screen.getByTestId('state-link-GA');
    expect(gaLink.closest('a')).toHaveAttribute('href', '/state/ga');
  });

  it('shows empty state when no articles', async () => {
    server.use(
      http.get('/api/articles', () => HttpResponse.json([])),
      http.get('/api/articles/featured', () => HttpResponse.json([])),
      http.get('/api/articles/latest', () => HttpResponse.json([])),
      http.get('/api/articles/most-read', () => HttpResponse.json([])),
      http.get('/api/series', () => HttpResponse.json([])),
      http.get('/api/featured-episodes', () => HttpResponse.json([])),
    );

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to The Commons')).toBeInTheDocument();
    });
  });

  it('opens auth modal when clicking Log in', async () => {
    setupHandlers();
    renderWithProviders(<HomePage />);
    const user = userEvent.setup();

    await user.click(screen.getByTestId('button-login'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
    });
  });

  it('article links point to correct URLs', async () => {
    setupHandlers();
    renderWithProviders(<HomePage />);

    await waitForDataLoaded();

    // Featured article hero link
    const heroEl = screen.getByTestId(`featured-article-${featuredArticle.id}`);
    const featuredLink = heroEl.closest('a');
    expect(featuredLink).toHaveAttribute('href', '/article/feat-main');

    // Sidebar article link
    const latestEl = screen.getByTestId('latest-article-a1');
    const latestLink = latestEl.closest('a');
    expect(latestLink).toHaveAttribute('href', '/article/a1');
  });

  it('renders state links in Browse by State section', async () => {
    setupHandlers();
    renderWithProviders(<HomePage />);

    await waitForDataLoaded();

    // State links should point to /state/:code routes
    const nyLink = screen.getByTestId('state-link-NY');
    expect(nyLink.closest('a')).toHaveAttribute('href', '/state/ny');
  });
});
