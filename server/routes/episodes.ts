import { Router } from "express";
import { storage } from "../storage";
import { ledewire } from "../ledewire";
import { requireAdminAuth } from "../adminAuth";
import { captureServerError } from "../errorTracking";
import { captureRouteError } from "./helpers";

const router = Router();

// Create episode
router.post("/", requireAdminAuth, async (req, res) => {
  try {
    const { title, description, videoUrl, videoType, price, thumbnail, seriesId } = req.body;
    
    // Convert price to cents
    const priceCents = Math.round(price * 100);
    
    // Register content with Ledewire
    const ledewireContent = await ledewire.registerContent(
      title,
      priceCents,
      {
        content: description || 'Premium video content',
        metadata: {
          type: 'video',
          video_url: videoUrl,
          video_type: videoType,
          thumbnail,
        },
      }
    );
    
    // Create episode in our database
    const episode = await storage.createEpisode({
      seriesId,
      title,
      description,
      videoUrl,
      videoType,
      price: priceCents,
      thumbnail,
      ledewireContentId: ledewireContent.id,
    });
    
    res.json({
      ...episode,
      price: episode.price / 100,
    });
  } catch (error: any) {
    captureRouteError(error, req, 400);
    res.status(400).json({ error: error.message, requestId: req.requestId });
  }
});

// Update episode
router.put("/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, videoUrl, videoType, price, thumbnail } = req.body;
    
    // Get existing episode to compare for Ledewire sync
    const existingEpisode = await storage.getEpisode(id);
    if (!existingEpisode) {
      return res.status(404).json({ error: 'Episode not found' });
    }
    
    // Convert price to cents if provided
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (videoUrl !== undefined) updates.videoUrl = videoUrl;
    if (videoType !== undefined) updates.videoType = videoType;
    if (thumbnail !== undefined) updates.thumbnail = thumbnail;
    if (price !== undefined) updates.price = Math.round(price * 100);
    
    const episode = await storage.updateEpisode(id, updates);
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }
    
    // Sync price/title changes with Ledewire if content is registered
    if (existingEpisode.ledewireContentId) {
      const newPriceCents = price !== undefined ? Math.round(price * 100) : undefined;
      const priceChanged = newPriceCents !== undefined && newPriceCents !== existingEpisode.price;
      const titleChanged = title !== undefined && title !== existingEpisode.title;
      
      if (priceChanged || titleChanged) {
        try {
          const ledewireUpdates: { title?: string; priceCents?: number } = {};
          if (titleChanged) ledewireUpdates.title = title;
          if (priceChanged) ledewireUpdates.priceCents = newPriceCents;
          
          await ledewire.updateContent(existingEpisode.ledewireContentId, ledewireUpdates);
          console.log(`[EPISODE-UPDATE] Synced changes to Ledewire for episode ${id}`);
        } catch (ledewireError: any) {
          captureServerError(ledewireError, {
            endpoint: req.path,
            method: req.method,
            statusCode: 200,
            requestId: req.requestId,
            entityIds: { episodeId: id },
            metadata: { ledewireSync: true },
          });
        }
      }
    }
    
    res.json({
      ...episode,
      price: episode.price / 100,
    });
  } catch (error: any) {
    captureRouteError(error, req, 400);
    res.status(400).json({ error: error.message, requestId: req.requestId });
  }
});

// Delete episode
router.delete("/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteEpisode(id);
    res.json({ success: true });
  } catch (error: any) {
    captureRouteError(error, req, 400);
    res.status(400).json({ error: error.message, requestId: req.requestId });
  }
});

export default router;
