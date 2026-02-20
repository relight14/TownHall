/**
 * Extract the first N <p> tags from HTML content as a preview.
 * Used server-side to strip paid article content for unauthenticated users.
 */
export function extractServerPreview(html: string, paragraphCount: number = 3): string {
  const paragraphRegex = /<p[^>]*>[\s\S]*?<\/p>/gi;
  const paragraphs = html.match(paragraphRegex) || [];
  return paragraphs.slice(0, paragraphCount).join('');
}
