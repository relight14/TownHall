import { Router } from "express";
import { storage } from "../storage";
import { requireAdminAuth, setAdminToken, isAdminTokenValid } from "../adminAuth";
import { captureRouteError, checkRateLimit, resetRateLimit } from "./helpers";
import crypto from "crypto";

const generateAdminToken = () => crypto.randomBytes(32).toString('hex');

const router = Router();

// Verify admin token
router.get("/verify", (req, res) => {
  const adminToken = req.headers['x-admin-token'] as string;
  
  if (!adminToken || !isAdminTokenValid(adminToken)) {
    return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
  
  res.json({ valid: true });
});

// Admin login
router.post("/login", async (req, res) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    }
    
    const { email, password } = req.body;
    
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail) {
      return res.status(500).json({ error: 'Admin authentication not configured' });
    }
    
    const dbAdmin = await storage.getAdminByEmail(email);
    let authenticated = false;
    
    if (dbAdmin) {
      authenticated = await storage.verifyAdminPassword(email, password);
    } else if (email === adminEmail && adminPassword && password === adminPassword) {
      authenticated = true;
      await storage.createOrUpdateAdmin(email, password);
    }
    
    if (authenticated) {
      resetRateLimit(clientIp);
      const newToken = generateAdminToken();
      setAdminToken(newToken);
      res.json({ success: true, authenticated: true, adminToken: newToken });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

// Change admin password
router.post("/change-password", requireAdminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      return res.status(500).json({ error: 'Admin email not configured' });
    }
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    const dbAdmin = await storage.getAdminByEmail(adminEmail);
    let isValidCurrentPassword = false;
    
    if (dbAdmin) {
      isValidCurrentPassword = await storage.verifyAdminPassword(adminEmail, currentPassword);
    } else {
      const adminPassword = process.env.ADMIN_PASSWORD;
      isValidCurrentPassword = currentPassword === adminPassword;
    }
    
    if (!isValidCurrentPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    await storage.createOrUpdateAdmin(adminEmail, newPassword);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

// Site settings
router.get("/site-settings", async (req, res) => {
  try {
    const settings = await storage.getSiteSettings();
    res.json(settings);
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

router.put("/site-settings", requireAdminAuth, async (req, res) => {
  try {
    const { heroHeading, heroSubheading } = req.body;
    const settings = await storage.updateSiteSettings({ heroHeading, heroSubheading });
    res.json(settings);
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

// Featured episodes
router.get("/featured-episodes", async (req, res) => {
  try {
    const featured = await storage.getFeaturedEpisodes();
    res.json(featured.map(f => ({
      ...f.episode,
      seriesId: f.episode.seriesId,
      displayOrder: f.displayOrder,
    })));
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

router.put("/featured-episodes", requireAdminAuth, async (req, res) => {
  try {
    const { episodeIds } = req.body;
    if (!Array.isArray(episodeIds)) {
      return res.status(400).json({ error: 'episodeIds must be an array' });
    }
    await storage.setFeaturedEpisodes(episodeIds);
    const featured = await storage.getFeaturedEpisodes();
    res.json(featured.map(f => ({
      ...f.episode,
      seriesId: f.episode.seriesId,
      displayOrder: f.displayOrder,
    })));
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

// Admin articles list (returns all articles without preview sanitization)
router.get("/articles", requireAdminAuth, async (req, res) => {
  try {
    const articles = await storage.getAllArticles();
    res.json(articles);
  } catch (error: any) {
    captureRouteError(error, req, 500);
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

export default router;
