import { Router } from "express";
import { storage } from "../storage";
import { ledewire } from "../ledewire";
import { isAuthenticated } from "../googleAuth";
import { captureRouteError } from "./helpers";

// Article purchase routes — mounted at /api/articles
export const articlePurchaseRouter = Router();

// Episode purchase routes — mounted at /api
export const episodePurchaseRouter = Router();

// ===== Article Purchase Routes =====

// Purchase article
articlePurchaseRouter.post("/:id/purchase", isAuthenticated, async (req: any, res) => {
  const { id: articleId } = req.params;
  
  try {
    const user = req.user;
    const token = user?.ledewireAccessToken;
    
    if (!token) {
      return res.status(401).json({ error: 'Ledewire authentication required' });
    }
    
    const article = await storage.getArticle(articleId);
    if (!article || !article.ledewireContentId) {
      return res.status(404).json({ error: 'Article not found or not registered with Ledewire' });
    }
    
    const purchase = await ledewire.createPurchase(
      token,
      article.ledewireContentId,
      article.price
    );
    
    if (purchase.status !== 'completed' && purchase.status !== 'success') {
      return res.status(400).json({ 
        error: 'Purchase was not completed', 
        status: purchase.status,
        unlocked: false 
      });
    }
    
    const verification = await ledewire.verifyPurchase(token, article.ledewireContentId);
    
    if (!verification.has_purchased) {
      return res.status(400).json({ 
        error: 'Purchase verification failed', 
        unlocked: false 
      });
    }
    
    res.json({ ...purchase, unlocked: true });
  } catch (error: any) {
    captureRouteError(error, req, 400);
    res.status(400).json({ error: error.message, unlocked: false, requestId: req.requestId });
  }
});

// Verify article purchase
articlePurchaseRouter.get("/:id/purchase/verify", isAuthenticated, async (req: any, res) => {
  const { id: articleId } = req.params;
  
  try {
    const user = req.user;
    const token = user?.ledewireAccessToken;
    
    if (!token) {
      return res.status(401).json({ error: 'Ledewire authentication required' });
    }
    
    const article = await storage.getArticle(articleId);
    if (!article || !article.ledewireContentId) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    const verification = await ledewire.verifyPurchase(token, article.ledewireContentId);
    return res.status(200).json(verification);
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

// ===== Episode Purchase Routes =====
// Mounted at /api, these handle /purchase and /purchase/verify/:episodeId

// Purchase episode
episodePurchaseRouter.post("/purchase", async (req, res) => {
  const { episodeId } = req.body;
  console.log(`[PURCHASE FLOW] Starting purchase for episode: ${episodeId}`);
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('[PURCHASE FLOW] Error: No authorization header');
      return res.status(401).json({ error: 'Authorization required' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Get episode details
    const episode = await storage.getEpisode(episodeId);
    if (!episode || !episode.ledewireContentId) {
      console.log(`[PURCHASE FLOW] Error: Episode ${episodeId} not found or no Ledewire content ID`);
      return res.status(404).json({ error: 'Episode not found or not registered with Ledewire' });
    }
    
    console.log(`[PURCHASE FLOW] Episode found: ${episode.title}, Ledewire ID: ${episode.ledewireContentId}, Price: ${episode.price} cents`);
    
    // Make purchase with Ledewire
    const purchase = await ledewire.createPurchase(
      token,
      episode.ledewireContentId,
      episode.price
    );
    
    console.log(`[PURCHASE FLOW] Purchase response received, status: ${purchase.status}`);
    
    if (purchase.status !== 'completed' && purchase.status !== 'success') {
      console.log(`[PURCHASE FLOW] Purchase not confirmed - status: ${purchase.status}, rejecting unlock`);
      return res.status(400).json({ 
        error: 'Purchase was not completed', 
        status: purchase.status,
        unlocked: false 
      });
    }
    
    // Double-verify the purchase is actually recorded
    const verification = await ledewire.verifyPurchase(token, episode.ledewireContentId);
    
    if (!verification.has_purchased) {
      console.log(`[PURCHASE FLOW] Verification failed - Ledewire says not purchased, rejecting unlock`);
      return res.status(400).json({ 
        error: 'Purchase verification failed', 
        unlocked: false 
      });
    }
    
    console.log(`[PURCHASE FLOW] Purchase verified successfully, unlocking content`);
    res.json({ ...purchase, unlocked: true });
  } catch (error: any) {
    captureRouteError(error, req, 400);
    res.status(400).json({ error: error.message, unlocked: false, requestId: req.requestId });
  }
});

// Verify episode purchase
episodePurchaseRouter.get("/purchase/verify/:episodeId", async (req, res) => {
  const { episodeId } = req.params;
  console.log(`[PURCHASE VERIFY] Checking purchase status for episode: ${episodeId}`);
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('[PURCHASE VERIFY] Error: No authorization header');
      return res.status(401).json({ error: 'Authorization required' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Get episode details
    const episode = await storage.getEpisode(episodeId);
    if (!episode || !episode.ledewireContentId) {
      console.log(`[PURCHASE VERIFY] Episode ${episodeId} not found`);
      return res.status(404).json({ error: 'Episode not found' });
    }
    
    console.log(`[PURCHASE VERIFY] Verifying with Ledewire for content ID: ${episode.ledewireContentId}`);
    
    // Verify purchase with Ledewire
    const verification = await ledewire.verifyPurchase(token, episode.ledewireContentId);
    
    console.log(`[PURCHASE VERIFY] Result for episode ${episodeId}: has_purchased=${verification.has_purchased}`);
    
    res.json(verification);
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});
