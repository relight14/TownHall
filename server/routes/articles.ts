import { Router } from "express";
import { storage } from "../storage";
import { ledewire } from "../ledewire";
import { requireAdminAuth } from "../adminAuth";
import { optionalAuth } from "../googleAuth";
import { insertArticleSchema } from "@shared/schema";
import { extractServerPreview } from "@shared/preview";
import { captureServerError } from "../errorTracking";
import { captureRouteError, sanitizeThumbnailUrl, sanitizeArticlesForPublicListing } from "./helpers";

const router = Router();

// Public listing endpoints

router.get("/", async (req, res) => {
  try {
    const articles = await storage.getAllArticles();
    res.json(sanitizeArticlesForPublicListing(articles));
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

router.get("/featured", async (req, res) => {
  try {
    const articles = await storage.getFeaturedArticles();
    res.json(sanitizeArticlesForPublicListing(articles));
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const articles = await storage.getLatestArticles(limit);
    res.json(sanitizeArticlesForPublicListing(articles));
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

router.get("/most-read", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const articles = await storage.getMostReadArticles(limit);
    res.json(sanitizeArticlesForPublicListing(articles));
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const articles = await storage.getArticlesByCategory(category);
    res.json(sanitizeArticlesForPublicListing(articles));
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

router.get("/state/:stateCode", async (req, res) => {
  try {
    const { stateCode } = req.params;
    const articles = await storage.getArticlesByState(stateCode);
    res.json(sanitizeArticlesForPublicListing(articles));
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

// Increment view count
router.post("/:id/view", async (req, res) => {
  try {
    const { id } = req.params;
    await storage.incrementArticleViewCount(id);
    res.json({ success: true });
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

// Get single article (with purchase check for paid articles)
router.get("/:id", optionalAuth, async (req: any, res) => {
  try {
    const article = await storage.getArticle(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Free articles return full content
    if (article.price <= 0) {
      return res.json(article);
    }
    
    // For paid articles, check if authenticated user has purchased
    const user = req.user;
    let hasPurchased = false;
    
    if (user?.ledewireAccessToken && article.ledewireContentId) {
      try {
        const purchaseStatus = await ledewire.verifyPurchase(
          user.ledewireAccessToken,
          article.ledewireContentId
        );
        hasPurchased = purchaseStatus.has_purchased;
      } catch (e) {
        // Purchase check failed - assume not purchased (secure default)
      }
    }
    
    if (hasPurchased) {
      return res.json(article);
    }
    
    // Not purchased - return preview
    const previewContent = extractServerPreview(article.content, 3);
    return res.json({
      ...article,
      content: previewContent,
      isPreview: true,
    });
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

// Create article (admin)
router.post("/", requireAdminAuth, async (req, res) => {
  console.log('[ARTICLE-CREATE] Starting article creation...');
  console.log('[ARTICLE-CREATE] Request body:', JSON.stringify({
    title: req.body.title,
    category: req.body.category,
    price: req.body.price,
    hasContent: !!req.body.content,
    hasThumbnail: !!req.body.thumbnail,
  }));
  
  try {
    // Sanitize thumbnail URL and convert publishedAt string to Date
    const body = {
      ...req.body,
      thumbnail: sanitizeThumbnailUrl(req.body.thumbnail),
      publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : new Date(),
    };
    const validated = insertArticleSchema.parse(body);
    console.log('[ARTICLE-CREATE] Validation passed, creating article in database...');
    
    // Create article first
    const article = await storage.createArticle(validated);
    console.log(`[ARTICLE-CREATE] Article created in database: id=${article.id}, title="${article.title}"`);
    
    // Register with Ledewire for micropayments
    const priceCents = validated.price || 99;
    console.log(`[ARTICLE-CREATE] Registering with Ledewire: price=${priceCents} cents`);
    
    try {
      // Construct the article source URL
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.REPLIT_DEPLOYMENT_URL || 'https://example.com';
      const sourceUrl = `${baseUrl}/article/${article.id}`;
      console.log(`[ARTICLE-CREATE] Source URL for Ledewire: ${sourceUrl}`);
      
      const content = await ledewire.registerContent(
        article.title,
        priceCents,
        { 
          content: article.content || '',
          teaser: article.summary || '',
          metadata: {
            type: 'article',
            articleId: article.id,
            author: 'The Commons',
            category: article.category,
            publication_date: article.publishedAt?.toISOString(),
            reading_time: `${article.readTimeMinutes || 5} min`,
            source_url: sourceUrl,
          },
        }
      );
      
      console.log(`[ARTICLE-CREATE] Ledewire registration successful: contentId=${content.id}`);
      
      // Update article with Ledewire content ID
      await storage.updateArticleLedewireId(article.id, content.id);
      console.log(`[ARTICLE-CREATE] Article updated with Ledewire content ID`);
      
      // Return updated article
      const updatedArticle = await storage.getArticle(article.id);
      console.log(`[ARTICLE-CREATE] Article creation complete: id=${article.id}`);
      res.json(updatedArticle);
    } catch (ledewireError: any) {
      captureServerError(ledewireError, {
        endpoint: req.path,
        method: req.method,
        statusCode: 200,
        requestId: req.requestId,
        entityIds: { articleId: article.id },
        metadata: { ledewireSync: true, articleTitle: article.title },
      });
      // Still return the article even if Ledewire registration failed
      res.json(article);
    }
  } catch (error: any) {
    captureRouteError(error, req, 400);
    res.status(400).json({ error: error.message, requestId: req.requestId });
  }
});

// Update article (admin)
router.put("/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the existing article to compare for Ledewire sync
    const existingArticle = await storage.getArticle(id);
    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Sanitize thumbnail and convert publishedAt string to Date if needed
    const body = {
      ...req.body,
      thumbnail: req.body.thumbnail !== undefined ? sanitizeThumbnailUrl(req.body.thumbnail) : undefined,
      publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : undefined,
    };
    const validated = insertArticleSchema.partial().parse(body);
    const article = await storage.updateArticle(id, validated);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Sync with Ledewire - either update existing or register new
    const currentPrice = article.price || existingArticle.price || 99;
    const currentTitle = article.title || existingArticle.title;
    
    if (existingArticle.ledewireContentId) {
      // Article already registered - sync price/title
      try {
        await ledewire.updateContent(existingArticle.ledewireContentId, {
          title: currentTitle,
          priceCents: currentPrice,
        });
      } catch (ledewireError: any) {
        captureServerError(ledewireError, {
          endpoint: req.path,
          method: req.method,
          statusCode: 200,
          requestId: req.requestId,
          entityIds: { articleId: id },
          metadata: { ledewireSync: true },
        });
      }
    } else if (currentPrice > 0) {
      // Article has a price but no Ledewire ID - register it now
      try {
        // Construct the article source URL
        const baseUrl = process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : process.env.REPLIT_DEPLOYMENT_URL || 'https://example.com';
        const sourceUrl = `${baseUrl}/article/${article.id}`;
        
        const content = await ledewire.registerContent(
          currentTitle,
          currentPrice,
          { 
            content: article.content || '',
            teaser: article.summary || '',
            metadata: {
              type: 'article',
              articleId: article.id,
              author: 'The Commons',
              category: article.category,
              publication_date: article.publishedAt?.toISOString(),
              reading_time: `${article.readTimeMinutes || 5} min`,
              source_url: sourceUrl,
            },
          }
        );
        
        // Update article with Ledewire content ID
        await storage.updateArticleLedewireId(article.id, content.id);

        // Return the updated article with the new ledewireContentId
        const updatedArticle = await storage.getArticle(article.id);
        return res.json(updatedArticle);
      } catch (ledewireError: any) {
        captureServerError(ledewireError, {
          endpoint: req.path,
          method: req.method,
          statusCode: 200,
          requestId: req.requestId,
          entityIds: { articleId: id },
          metadata: { ledewireSync: true },
        });
      }
    }
    
    res.json(article);
  } catch (error: any) {
    captureRouteError(error, req, 400);
    res.status(400).json({ error: error.message, requestId: req.requestId });
  }
});

// Delete article (admin)
router.delete("/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteArticle(id);
    res.json({ success: true });
  } catch (error: any) {
    captureRouteError(error, req, 400);
    res.status(400).json({ error: error.message, requestId: req.requestId });
  }
});

export default router;
