# Performance Optimizations Guide

A step-by-step guide for applying frontend performance optimizations across Ledewire projects. Each section covers a specific optimization with before/after patterns and where to apply them.

---

## 1. Regex-Based HTML Stripping

**Problem:** Using `document.createElement` + `innerHTML` + `textContent` to strip HTML causes DOM allocation on every call. This is expensive in list rendering (article cards, search results).

**Solution:** Add these three functions to `client/src/lib/utils.ts`:

```typescript
// Regex-based — no DOM allocation
export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// LRU-cached version for repeated calls (article lists, re-renders)
const stripHtmlCache = new Map<string, string>();
const STRIP_HTML_CACHE_MAX_SIZE = 100;

export function stripHtmlMemoized(html: string): string {
  if (!html) return '';
  const cached = stripHtmlCache.get(html);
  if (cached !== undefined) return cached;
  const result = stripHtml(html);
  if (stripHtmlCache.size >= STRIP_HTML_CACHE_MAX_SIZE) {
    const firstKey = stripHtmlCache.keys().next().value;
    if (firstKey) stripHtmlCache.delete(firstKey);
  }
  stripHtmlCache.set(html, result);
  return result;
}

// Read time using the optimized stripHtml
export function calculateReadTime(content: string, wordsPerMinute: number = 200): number {
  if (!content) return 1;
  const text = stripHtml(content);
  const words = text.split(/\s+/).filter(word => word.length > 0).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
```

**How to find candidates:**

```bash
grep -r "document.createElement\|innerHTML\|textContent" --include="*.ts" --include="*.tsx" client/src/
```

**Where to use which:**
- `stripHtml` — one-off calls (single article page, form processing)
- `stripHtmlMemoized` — list rendering (article cards, search results, any `.map()` context)
- `calculateReadTime` — wherever you show "X min read"

---

## 2. Image Lazy Loading Defaults

**Problem:** All images load immediately on page load, blocking LCP and wasting bandwidth for below-fold content.

**Solution:** Update `client/src/components/ui/image-with-fallback.tsx`:

```typescript
<img
  src={src}
  alt={alt}
  loading="lazy"      // Defer loading until near viewport
  decoding="async"    // Don't block rendering thread
  onError={() => setError(true)}
  className={className}
  {...props}
/>
```

For above-the-fold images (hero, header, profile), override with `loading="eager"`:

```typescript
<img src={profilePic} alt="Profile" loading="eager" decoding="async" />
```

**How to find candidates:**

```bash
grep -r "<img" --include="*.tsx" client/src/
```

---

## 3. Lazy Loading Modals

**Problem:** Modals (auth, password reset, add funds) are bundled with the page even though most users never open them. This adds to initial bundle size.

**Before:**
```typescript
import AuthModal from '../components/AuthModal';
import PasswordResetModal from '../components/PasswordResetModal';
```

**After:**
```typescript
import { lazy, Suspense } from 'react';

const AuthModal = lazy(() => import('../components/AuthModal'));
const PasswordResetModal = lazy(() => import('../components/PasswordResetModal'));

// Wrap in Suspense where rendered
{showAuthModal && (
  <Suspense fallback={
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full" />
    </div>
  }>
    <AuthModal ... />
  </Suspense>
)}
```

**How to find candidates:**

```bash
grep -r "import.*Modal\|import.*Dialog" --include="*.tsx" client/src/pages/
```

**Rule of thumb:** If a component is conditionally rendered behind user interaction (click, toggle), it's a lazy loading candidate.

---

## 4. Memoized Array Operations

**Problem:** Array operations (`filter`, `sort`, `map`, spread) inside component bodies re-execute on every render, even when inputs haven't changed.

**Before:**
```typescript
const allArticles = [...articles, ...featuredArticles.filter(fa => !articles.find(a => a.id === fa.id))];
const categoryArticles = getFilteredArticles(activeCategory);
const latestForCategory = [...categoryArticles].sort((a, b) => ...);
```

**After:**
```typescript
import { useMemo } from 'react';

const allArticles = useMemo(() =>
  [...articles, ...featuredArticles.filter(fa => !articles.find(a => a.id === fa.id))],
  [articles, featuredArticles]
);

const categoryArticles = useMemo(() => {
  if (activeCategory === 'all') return allArticles;
  return allArticles.filter(a => a.category === activeCategory);
}, [allArticles, activeCategory]);

const latestForCategory = useMemo(() =>
  [...categoryArticles].sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  ),
  [categoryArticles]
);
```

**How to find candidates:**

```bash
grep -r "\.filter\|\.sort\|\.map" --include="*.tsx" client/src/pages/
```

**When to memoize:** Arrays derived from state/props that are used in JSX rendering. Skip for simple one-liner transforms or event handlers.

---

## Implementation Checklist

For each Ledewire project, apply in this order:

1. **Add utility functions** to `client/src/lib/utils.ts` — copy `stripHtml`, `stripHtmlMemoized`, `calculateReadTime`
2. **Update ImageWithFallback** — add `loading="lazy"` and `decoding="async"` defaults
3. **Lazy load modals** in page components — replace static imports with `lazy()` + `Suspense`
4. **Memoize array operations** in page components — wrap derived arrays in `useMemo`
5. **Audit above-fold images** — set `loading="eager"` on hero/header images

## Files Typically Modified

| File | Changes |
| --- | --- |
| `client/src/lib/utils.ts` | Add stripHtml, stripHtmlMemoized, calculateReadTime |
| `client/src/components/ui/image-with-fallback.tsx` | Add lazy loading defaults |
| `client/src/pages/HomePage.tsx` | Lazy modals, useMemo, stripHtml import |
| `client/src/pages/ArticlePage.tsx` | Lazy modals, stripHtml import |
