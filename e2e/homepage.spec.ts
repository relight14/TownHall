import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with logo and category navigation', async ({ page }) => {
    // Logo
    await expect(page.getByTestId('logo')).toHaveText('So What');

    // Category tabs
    await expect(page.getByTestId('category-tab-all')).toBeVisible();
    await expect(page.getByTestId('category-tab-elections')).toBeVisible();
    await expect(page.getByTestId('category-tab-policy')).toBeVisible();
    await expect(page.getByTestId('category-tab-videos')).toBeVisible();
  });

  test('displays articles after loading', async ({ page }) => {
    // Wait for skeleton to disappear and content to appear
    await expect(page.locator('main')).not.toContainText('No articles available yet.', { timeout: 15000 });

    // Should have at least one article link
    const articleLinks = page.locator('a[href^="/article/"]');
    await expect(articleLinks.first()).toBeVisible({ timeout: 10000 });
  });

  test('featured article displays prominently', async ({ page }) => {
    // Wait for any featured article to appear
    const featuredArticle = page.locator('[data-testid^="featured-article-"]').first();
    await expect(featuredArticle).toBeVisible({ timeout: 15000 });

    // Featured article should have a title (h2)
    const title = featuredArticle.locator('h2');
    await expect(title).toBeVisible();
  });

  test('category tab navigation filters content', async ({ page }) => {
    // Wait for page to load
    const featuredArticle = page.locator('[data-testid^="featured-article-"]').first();
    await expect(featuredArticle).toBeVisible({ timeout: 15000 });

    // Click a category tab
    await page.getByTestId('category-tab-elections').click();

    // The tab should become active (have the underline span)
    const activeIndicator = page.getByTestId('category-tab-elections').locator('span');
    await expect(activeIndicator).toBeVisible();
  });

  test('article card click navigates to article page', async ({ page }) => {
    // Wait for articles to load
    const articleLink = page.locator('a[href^="/article/"]').first();
    await expect(articleLink).toBeVisible({ timeout: 15000 });

    // Get the href before clicking
    const href = await articleLink.getAttribute('href');
    expect(href).toBeTruthy();

    await articleLink.click();

    // Should navigate to the article page
    await expect(page).toHaveURL(new RegExp(`/article/`));
  });

  test('"View all" link navigates to category page', async ({ page }) => {
    // Wait for category sections to load
    const viewAllLink = page.locator('[data-testid^="view-all-"]').first();

    // Only run this test if there are category sections
    const count = await viewAllLink.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await expect(viewAllLink).toBeVisible({ timeout: 15000 });
    const parentLink = viewAllLink.locator('xpath=ancestor::a');
    await parentLink.click();

    await expect(page).toHaveURL(/\/category\//);
  });

  test('footer links are present', async ({ page }) => {
    const termsLink = page.getByTestId('link-terms');
    const privacyLink = page.getByTestId('link-privacy');

    await expect(termsLink).toBeVisible();
    await expect(privacyLink).toBeVisible();
    await expect(termsLink).toHaveText('Terms of Service');
    await expect(privacyLink).toHaveText('Privacy Policy');
  });

  test('login button opens auth modal', async ({ page }) => {
    const loginButton = page.getByTestId('button-login');

    // Login button may not be visible if user is already logged in
    const isVisible = await loginButton.isVisible();
    if (!isVisible) {
      test.skip();
      return;
    }

    await loginButton.click();

    // Auth modal should appear (look for the modal overlay or form)
    const modal = page.locator('[role="dialog"], [data-testid="auth-modal"], .fixed.inset-0');
    await expect(modal.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Homepage - Responsive', () => {
  test('mobile layout shows hamburger-friendly navigation', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    await page.goto('/');

    // Category tabs should still be visible (horizontally scrollable)
    await expect(page.getByTestId('category-tab-all')).toBeVisible();

    // Logo should be visible
    await expect(page.getByTestId('logo')).toBeVisible();
  });

  test('desktop layout shows full navigation', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-only test');

    await page.goto('/');

    // All category tabs visible
    await expect(page.getByTestId('category-tab-all')).toBeVisible();
    await expect(page.getByTestId('category-tab-elections')).toBeVisible();
    await expect(page.getByTestId('category-tab-policy')).toBeVisible();
  });
});
