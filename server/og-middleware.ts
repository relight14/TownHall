import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import fs from "fs";
import path from "path";

const SITE_NAME = "So What";
const DEFAULT_DESCRIPTION = "Premium political analysis and commentary. Independent journalism that cuts through the noise.";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>?/g, ' ')
    .replace(/&\w+;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#?\w+;/g, ' ')
    .replace(/<\/?[a-z][^>]*>?/gi, ' ')
    .replace(/https?:\/\/[^\s"]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200);
}

function generateOgHtml(options: {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
  type?: string;
}): string {
  const { title, description, imageUrl, url, type = "article" } = options;
  
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} | ${SITE_NAME}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@replit" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    
    <link rel="icon" type="image/webp" href="/favicon.webp" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
}

function isSocialPreviewBot(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  const socialBotPatterns = [
    /facebookexternalhit/i,
    /Facebot/i,
    /Twitterbot/i,
    /LinkedInBot/i,
    /WhatsApp/i,
    /Slackbot/i,
    /TelegramBot/i,
    /Discordbot/i,
    /Pinterest/i,
    /iMessageLinkPreviewer/i,
    /Skype/i,
    /vkShare/i,
    /Embedly/i,
  ];
  return socialBotPatterns.some(pattern => pattern.test(userAgent));
}

function getBaseUrl(req: Request): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'chriscillizza.ledewire.com';
  return `${protocol}://${host}`;
}

function makeAbsoluteUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  return `${baseUrl}/${url}`;
}

function isValidOgImageUrl(url: string | null): boolean {
  if (!url) return false;
  if (url.startsWith('data:')) return false;
  return true;
}

export function createOgMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.headers['user-agent'];
    
    if (!isSocialPreviewBot(userAgent)) {
      return next();
    }

    const baseUrl = getBaseUrl(req);
    const fullUrl = `${baseUrl}${req.originalUrl}`;

    try {
      const articleMatch = req.path.match(/^\/article\/([^\/]+)/);
      if (articleMatch) {
        const articleId = articleMatch[1];
        const article = await storage.getArticle(articleId);
        
        if (article) {
          const imageUrl = isValidOgImageUrl(article.thumbnail)
            ? makeAbsoluteUrl(article.thumbnail!, baseUrl)
            : `${baseUrl}/og-default.webp`;
          
          const cleanDescription = article.subheader || DEFAULT_DESCRIPTION;
          
          const html = generateOgHtml({
            title: article.title,
            description: cleanDescription,
            imageUrl,
            url: fullUrl,
            type: "article",
          });
          
          return res.send(html);
        }
      }

      const seriesMatch = req.path.match(/^\/series\/([^\/]+)/);
      if (seriesMatch) {
        const seriesId = seriesMatch[1];
        const series = await storage.getSeries(seriesId);
        
        if (series) {
          const imageUrl = series.thumbnail 
            ? makeAbsoluteUrl(series.thumbnail, baseUrl)
            : `${baseUrl}/og-default.webp`;
          
          const html = generateOgHtml({
            title: series.title,
            description: series.description || DEFAULT_DESCRIPTION,
            imageUrl,
            url: fullUrl,
            type: "video.other",
          });
          
          return res.send(html);
        }
      }

      next();
    } catch (error) {
      console.error('[OG Middleware] Error:', error);
      next();
    }
  };
}
