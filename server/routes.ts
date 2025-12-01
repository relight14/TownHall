import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ledewire } from "./ledewire";
import { insertUserSchema, insertSeriesSchema, insertEpisodeSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ===== Authentication Routes =====
  
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      // Sign up with Ledewire
      const ledewireAuth = await ledewire.signupBuyer(email, password, name);
      
      // Decode the JWT to get user ID (simple extraction, in production use proper JWT library)
      const payload = JSON.parse(Buffer.from(ledewireAuth.access_token.split('.')[1], 'base64').toString());
      const ledewireUserId = payload.buyer_claims?.user_id || payload.sub;
      
      // Create user in our database
      const user = await storage.createUser({
        email,
        name,
        ledewireAccessToken: ledewireAuth.access_token,
        ledewireRefreshToken: ledewireAuth.refresh_token,
        ledewireUserId,
      });
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        ledewireToken: ledewireAuth.access_token,
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(400).json({ error: error.message });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Login with Ledewire
      const ledewireAuth = await ledewire.loginBuyer(email, password);
      
      // Find or create user in our database
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Decode JWT to get user ID
        const payload = JSON.parse(Buffer.from(ledewireAuth.access_token.split('.')[1], 'base64').toString());
        const ledewireUserId = payload.buyer_claims?.user_id || payload.sub;
        
        user = await storage.createUser({
          email,
          name: email.split('@')[0],
          ledewireAccessToken: ledewireAuth.access_token,
          ledewireRefreshToken: ledewireAuth.refresh_token,
          ledewireUserId,
        });
      } else {
        // Update tokens
        const payload = JSON.parse(Buffer.from(ledewireAuth.access_token.split('.')[1], 'base64').toString());
        const ledewireUserId = payload.buyer_claims?.user_id || payload.sub;
        
        await storage.updateUserLedewireTokens(
          user.id,
          ledewireAuth.access_token,
          ledewireAuth.refresh_token,
          ledewireUserId
        );
      }
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        ledewireToken: ledewireAuth.access_token,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({ error: error.message });
    }
  });
  
  // ===== Wallet Routes =====
  
  app.get("/api/wallet/balance", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization required' });
      }
      
      const token = authHeader.replace('Bearer ', '');
      const balance = await ledewire.getWalletBalance(token);
      
      res.json(balance);
    } catch (error: any) {
      console.error('Get balance error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/wallet/payment-session", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization required' });
      }
      
      const token = authHeader.replace('Bearer ', '');
      const { amount_cents } = req.body;
      
      const session = await ledewire.createPaymentSession(token, amount_cents);
      
      res.json(session);
    } catch (error: any) {
      console.error('Create payment session error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // ===== Series Routes =====
  
  app.get("/api/series", async (req, res) => {
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
      console.error('Get series error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/series/:id", async (req, res) => {
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
      console.error('Get series error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/series", async (req, res) => {
    try {
      const validated = insertSeriesSchema.parse(req.body);
      const series = await storage.createSeries(validated);
      
      res.json(series);
    } catch (error: any) {
      console.error('Create series error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/series/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validated = insertSeriesSchema.partial().parse(req.body);
      const series = await storage.updateSeries(id, validated);
      
      if (!series) {
        return res.status(404).json({ error: 'Series not found' });
      }
      
      res.json(series);
    } catch (error: any) {
      console.error('Update series error:', error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // ===== Episode Routes =====
  
  app.post("/api/episodes", async (req, res) => {
    try {
      const { title, description, videoUrl, videoType, price, thumbnail, seriesId } = req.body;
      
      // Convert price to cents
      const priceCents = Math.round(price * 100);
      
      // Register content with Ledewire
      const ledewireContent = await ledewire.registerContent(
        title,
        priceCents,
        {
          description,
          video_url: videoUrl,
          video_type: videoType,
          thumbnail,
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
      console.error('Create episode error:', error);
      res.status(400).json({ error: error.message });
    }
  });
  
  app.delete("/api/episodes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEpisode(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete episode error:', error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // ===== Purchase Routes =====
  
  app.post("/api/purchase", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization required' });
      }
      
      const token = authHeader.replace('Bearer ', '');
      const { episodeId } = req.body;
      
      // Get episode details
      const episode = await storage.getEpisode(episodeId);
      if (!episode || !episode.ledewireContentId) {
        return res.status(404).json({ error: 'Episode not found or not registered with Ledewire' });
      }
      
      // Make purchase with Ledewire
      const purchase = await ledewire.createPurchase(
        token,
        episode.ledewireContentId,
        episode.price
      );
      
      res.json(purchase);
    } catch (error: any) {
      console.error('Purchase error:', error);
      res.status(400).json({ error: error.message });
    }
  });
  
  app.get("/api/purchase/verify/:episodeId", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization required' });
      }
      
      const token = authHeader.replace('Bearer ', '');
      const { episodeId } = req.params;
      
      // Get episode details
      const episode = await storage.getEpisode(episodeId);
      if (!episode || !episode.ledewireContentId) {
        return res.status(404).json({ error: 'Episode not found' });
      }
      
      // Verify purchase with Ledewire
      const verification = await ledewire.verifyPurchase(token, episode.ledewireContentId);
      
      res.json(verification);
    } catch (error: any) {
      console.error('Verify purchase error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
