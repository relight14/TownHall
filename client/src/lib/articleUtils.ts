/** Increment article view count — fire-and-forget, no state needed */
export async function incrementArticleView(articleId: string): Promise<void> {
  try {
    await fetch(`/api/articles/${articleId}/view`, { method: 'POST' });
  } catch (error) {
    console.error('Failed to increment view count:', error);
  }
}
