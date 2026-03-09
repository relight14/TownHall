import { Router } from "express";
import { storage } from "../storage";
import { ledewire } from "../ledewire";
import { requireAdminAuth } from "../adminAuth";
import { insertSeriesSchema } from "@shared/schema";
import { captureServerError } from "../errorTracking";
import { captureRouteError } from "./helpers";

const router = Router();

// ===== Series Routes =====

router.get("/", async (req, res) => {
  try {
    const allSeries = await storage.getAllSeries();
    
    // Fetch episodes for each series
    const seriesWithEpisodes = await Promise.all(
      allSeries.map(async (s) => {
        const episodes = await storage.getEpisodesBySeriesId(s.id);
        return {
          ...s,
          episodes: episodes.map(ep => ({
            id: ep.id,
            title: ep.title,
            description: ep.description,
            videoUrl: ep.videoUrl,
            videoType: ep.videoType,
            price: ep.price / 100, // Convert cents to dollars
            thumbnail: ep.thumbnail,
            ledewireContentId: ep.ledewireContentId,
          })),
        };
      })
    );
    
    res.json(seriesWithEpisodes);
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const series = await storage.getSeries(req.params.id);
    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }
    
    const episodes = await storage.getEpisodesBySeriesId(series.id);
    
    res.json({
      ...series,
      episodes: episodes.map(ep => ({
        id: ep.id,
        title: ep.title,
        description: ep.description,
        videoUrl: ep.videoUrl,
        videoType: ep.videoType,
        price: ep.price / 100,
        thumbnail: ep.thumbnail,
        ledewireContentId: ep.ledewireContentId,
      })),
    });
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

router.post("/", requireAdminAuth, async (req, res) => {
  try {
    const validated = insertSeriesSchema.parse(req.body);
    const series = await storage.createSeries(validated);
    
    res.json(series);
  } catch (error: any) {
    captureRouteError(error, req, 400);
    res.status(400).json({ error: error.message, requestId: req.requestId });
  }
});

router.put("/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const validated = insertSeriesSchema.partial().parse(req.body);
    const series = await storage.updateSeries(id, validated);
    
    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }
    
    res.json(series);
  } catch (error: any) {
    captureRouteError(error, req, 400);
    res.status(400).json({ error: error.message, requestId: req.requestId });
  }
});

export default router;
