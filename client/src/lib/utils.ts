import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strips HTML tags from a string using regex
 * More performant than DOM-based approach
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')      // Remove HTML tags
    .replace(/&nbsp;/g, ' ')       // Replace common entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')          // Normalize whitespace
    .trim();
}

const stripHtmlCache = new Map<string, string>();
const STRIP_HTML_CACHE_MAX_SIZE = 100;

/**
 * Memoized version of stripHtml for list rendering
 * Caches results to avoid recalculation
 */
export function stripHtmlMemoized(html: string): string {
  if (!html) return '';

  const cached = stripHtmlCache.get(html);
  if (cached !== undefined) return cached;

  const result = stripHtml(html);

  // Evict oldest entry if cache is full
  if (stripHtmlCache.size >= STRIP_HTML_CACHE_MAX_SIZE) {
    const firstKey = stripHtmlCache.keys().next().value;
    if (firstKey) stripHtmlCache.delete(firstKey);
  }

  stripHtmlCache.set(html, result);
  return result;
}

/**
 * Calculates estimated read time in minutes
 * @param content - HTML or plain text content
 * @param wordsPerMinute - Reading speed (default: 200)
 */
export function calculateReadTime(
  content: string,
  wordsPerMinute: number = 200
): number {
  if (!content) return 1;
  const text = stripHtml(content);
  const words = text.split(/\s+/).filter(word => word.length > 0).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
