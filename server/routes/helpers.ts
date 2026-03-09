import type { Request } from "express";
import { captureServerError } from "../errorTracking";
import { extractServerPreview } from "@shared/preview";

/**
 * Captures a route-level error with context extracted from the request.
 */
export function captureRouteError(error: unknown, req: Request, statusCode: number) {
  const reqAny = req as any;
  captureServerError(error, {
    endpoint: req.path,
    method: req.method,
    statusCode,
    requestId: req.requestId,
    userId: reqAny.user?.id || reqAny.session?.userId,
    entityIds: {
      articleId: req.params?.id && req.path.includes('article') ? req.params.id : req.body?.articleId,
      episodeId: req.params?.id && req.path.includes('episode') ? req.params.id : req.body?.episodeId || req.params?.episodeId,
      seriesId: req.params?.id && req.path.includes('series') ? req.params.id : req.body?.seriesId,
    },
    duration: req.startTime ? Date.now() - req.startTime : undefined,
  });
}

export function sanitizeThumbnailUrl(thumbnail: string | null | undefined): string | null {
  if (!thumbnail) return null;
  
  if (thumbnail.startsWith('data:')) {
    return null;
  }
  
  if (thumbnail.includes('substackcdn.com/image/fetch/')) {
    const match = thumbnail.match(/https%3A%2F%2F[^,\s]+/);
    if (match) {
      try {
        return decodeURIComponent(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
  
  return thumbnail;
}

/**
 * Sanitize article content for public listing endpoints.
 * Paid articles only get preview content in list views.
 */
export function sanitizeArticlesForPublicListing(articles: any[]): any[] {
  return articles.map(article => {
    const isPaidArticle = article.price > 0;
    if (isPaidArticle) {
      return {
        ...article,
        content: extractServerPreview(article.content, 3),
        isPreview: true,
      };
    }
    return article;
  });
}

// Rate limiting for admin login
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }
  
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
}

export function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}
