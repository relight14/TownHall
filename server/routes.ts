import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ledewire } from "./ledewire";
import { setupGoogleAuth, isAuthenticated, optionalAuth, getSession } from "./googleAuth";
import { insertUserSchema, insertSeriesSchema, insertEpisodeSchema, insertArticleSchema } from "@shared/schema";
import { createSSORoutes, setSSoCookie } from "./sso-module/sso-routes";
import type { SSOConfig } from "./sso-module/sso-types";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { requireAdminAuth, setAdminToken, clearAdminToken, isAdminTokenValid } from "./adminAuth";
import crypto from "crypto";

const generateAdminToken = () => crypto.randomBytes(32).toString('hex');

function sanitizeThumbnailUrl(thumbnail: string | null | undefined): string | null {
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

// Rate limiting for admin login
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Reset if lockout period has passed
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Check if locked out
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
}

function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ===== Setup Session Middleware (needed for SSO routes) =====
  app.set("trust proxy", 1);
  app.use(getSession());
  
  // ===== Setup SSO Routes =====
  const ssoConfig: SSOConfig = {
    refreshToken: async (refreshToken: string) => {
      return await ledewire.refreshToken(refreshToken);
    },
    findUserByLedewireId: async (ledewireUserId: string) => {
      const user = await storage.getUserByLedewireId(ledewireUserId);
      if (!user) return null;
      return {
        id: user.id,
        email: user.email || '',
        name: user.name || user.email || 'User',
      };
    },
    findUserByEmail: async (email: string) => {
      const user = await storage.getUserByEmail(email);
      if (!user) return null;
      return {
        id: user.id,
        email: user.email || '',
        name: user.name || user.email || 'User',
      };
    },
    updateUserTokens: async (userId: string, accessToken: string, refreshToken: string, ledewireUserId: string) => {
      await storage.updateUserLedewireTokens(userId, accessToken, refreshToken, ledewireUserId);
    },
    onSessionRestored: (req: any, userId: string) => {
      // Hydrate Express session so /api/auth/user works after SSO restoration
      if (req.session) {
        req.session.userId = userId;
      }
    },
  };
  
  const ssoRoutes = createSSORoutes(ssoConfig);
  app.use("/api/auth", ssoRoutes);
  
  // ===== Setup Object Storage Routes =====
  registerObjectStorageRoutes(app);
  
  // ===== Setup Google OAuth =====
  await setupGoogleAuth(app);
  
  // ===== Google OAuth User Route =====
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        ledewireToken: user.ledewireAccessToken,
      });
    } catch (error) {
      console.error("Error fetching Google OAuth user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // ===== Admin Authentication Route =====
  
  app.get("/api/admin/verify", (req, res) => {
    const adminToken = req.headers['x-admin-token'] as string;
    
    if (!adminToken || !isAdminTokenValid(adminToken)) {
      return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
    }
    
    res.json({ valid: true });
  });
  
  app.post("/api/admin/login", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      
      // Check rate limit
      if (!checkRateLimit(clientIp)) {
        console.log(`[ADMIN AUTH] Rate limit exceeded for IP: ${clientIp}`);
        return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
      }
      
      const { email, password } = req.body;
      
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminEmail) {
        console.log('[ADMIN AUTH] Admin email not configured');
        return res.status(500).json({ error: 'Admin authentication not configured' });
      }
      
      // First check database for admin credentials (allows password changes)
      const dbAdmin = await storage.getAdminByEmail(email);
      let authenticated = false;
      
      if (dbAdmin) {
        // Use database password if admin exists in DB
        authenticated = await storage.verifyAdminPassword(email, password);
      } else if (email === adminEmail && adminPassword && password === adminPassword) {
        // Fall back to env var password for initial setup
        authenticated = true;
        // Migrate the password to database for future logins
        await storage.createOrUpdateAdmin(email, password);
      }
      
      if (authenticated) {
        // Reset rate limit on successful login
        resetRateLimit(clientIp);
        
        // Generate new admin token and store it in shared auth module
        const newToken = generateAdminToken();
        setAdminToken(newToken);
        
        console.log('[ADMIN AUTH] Admin login successful');
        res.json({ success: true, authenticated: true, adminToken: newToken });
      } else {
        console.log('[ADMIN AUTH] Invalid credentials attempt');
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error: any) {
      console.error('[ADMIN AUTH] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/admin/change-password", requireAdminAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const adminEmail = process.env.ADMIN_EMAIL;
      
      if (!adminEmail) {
        return res.status(500).json({ error: 'Admin email not configured' });
      }
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      
      // Verify current password
      const dbAdmin = await storage.getAdminByEmail(adminEmail);
      let isValidCurrentPassword = false;
      
      if (dbAdmin) {
        isValidCurrentPassword = await storage.verifyAdminPassword(adminEmail, currentPassword);
      } else {
        // Check against env var password for first-time setup
        const adminPassword = process.env.ADMIN_PASSWORD;
        isValidCurrentPassword = currentPassword === adminPassword;
      }
      
      if (!isValidCurrentPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      // Update password in database
      await storage.createOrUpdateAdmin(adminEmail, newPassword);
      
      console.log('[ADMIN AUTH] Password changed successfully');
      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
      console.error('[ADMIN AUTH] Password change error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // ===== Site Settings Routes =====
  
  app.get("/api/site-settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error: any) {
      console.error('Error fetching site settings:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.put("/api/admin/site-settings", requireAdminAuth, async (req, res) => {
    try {
      const { heroHeading, heroSubheading } = req.body;
      const settings = await storage.updateSiteSettings({ heroHeading, heroSubheading });
      res.json(settings);
    } catch (error: any) {
      console.error('Error updating site settings:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // ===== Featured Episodes Routes =====
  
  app.get("/api/featured-episodes", async (req, res) => {
    try {
      const featured = await storage.getFeaturedEpisodes();
      res.json(featured.map(f => ({
        ...f.episode,
        seriesId: f.episode.seriesId,
        displayOrder: f.displayOrder,
      })));
    } catch (error: any) {
      console.error('Error fetching featured episodes:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.put("/api/admin/featured-episodes", requireAdminAuth, async (req, res) => {
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
      console.error('Error updating featured episodes:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/admin/articles", requireAdminAuth, async (req, res) => {
    try {
      const articles = await storage.getAllArticles();
      res.json(articles);
    } catch (error: any) {
      console.error('Error fetching admin articles:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
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
      
      // Set SSO cookie for cross-subdomain authentication
      if (ledewireAuth.refresh_token) {
        setSSoCookie(res, ledewireAuth.refresh_token);
        console.log('[SSO] Set SSO cookie on signup');
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
      
      // Set SSO cookie for cross-subdomain authentication
      if (ledewireAuth.refresh_token) {
        setSSoCookie(res, ledewireAuth.refresh_token);
        console.log('[SSO] Set SSO cookie on login');
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

  // Password reset - request code
  app.post("/api/auth/password/reset-request", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      const result = await ledewire.requestPasswordReset(email);
      res.json(result);
    } catch (error: any) {
      console.error('Password reset request error:', error);
      // Always return success to prevent email enumeration
      res.json({ message: 'If an account with this email exists, a reset code has been sent.' });
    }
  });

  // Password reset - confirm with code
  app.post("/api/auth/password/reset", async (req, res) => {
    try {
      const { email, reset_code, password } = req.body;
      
      if (!email || !reset_code || !password) {
        return res.status(400).json({ error: 'Email, reset code, and new password are required' });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      
      const result = await ledewire.resetPassword(email, reset_code, password);
      res.json(result);
    } catch (error: any) {
      console.error('Password reset error:', error);
      res.status(400).json({ error: error.message });
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
      
      // Validate amount
      if (!amount_cents || typeof amount_cents !== 'number' || amount_cents < 100) {
        return res.status(400).json({ error: 'Invalid amount. Minimum is $1.00 (100 cents).' });
      }
      
      // Use trusted domain from environment (Replit-managed)
      // REPLIT_DOMAINS contains comma-separated list of valid domains
      const replitDomains = process.env.REPLIT_DOMAINS;
      const replitDevDomain = process.env.REPLIT_DEV_DOMAIN;
      
      let baseUrl: string;
      if (replitDomains) {
        // Use the first production domain
        const primaryDomain = replitDomains.split(',')[0];
        baseUrl = `https://${primaryDomain}`;
      } else if (replitDevDomain) {
        // Fallback to dev domain
        baseUrl = `https://${replitDevDomain}`;
      } else {
        // Final fallback for local development
        baseUrl = 'http://localhost:5000';
      }
      
      const session = await ledewire.createPaymentSession(token, amount_cents, {
        success_url: `${baseUrl}/wallet?payment=success`,
        cancel_url: `${baseUrl}/wallet?payment=cancelled`,
      });
      
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
  
  app.post("/api/series", requireAdminAuth, async (req, res) => {
    try {
      const validated = insertSeriesSchema.parse(req.body);
      const series = await storage.createSeries(validated);
      
      res.json(series);
    } catch (error: any) {
      console.error('Create series error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/series/:id", requireAdminAuth, async (req, res) => {
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
  
  app.post("/api/episodes", requireAdminAuth, async (req, res) => {
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
      console.error('Create episode error:', error);
      res.status(400).json({ error: error.message });
    }
  });
  
  app.put("/api/episodes/:id", requireAdminAuth, async (req, res) => {
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
            console.error(`[EPISODE-UPDATE] Failed to sync with Ledewire:`, ledewireError.message);
            // Don't fail the request, just log the error
          }
        }
      }
      
      res.json({
        ...episode,
        price: episode.price / 100,
      });
    } catch (error: any) {
      console.error('Update episode error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/episodes/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEpisode(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete episode error:', error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // ===== Article Routes =====
  
  // Helper function to extract preview paragraphs on the server side
  function extractServerPreview(html: string, paragraphCount: number = 3): string {
    // Simple regex-based extraction of first N <p> tags
    const paragraphRegex = /<p[^>]*>[\s\S]*?<\/p>/gi;
    const paragraphs = html.match(paragraphRegex) || [];
    return paragraphs.slice(0, paragraphCount).join('');
  }
  
  // Helper function to sanitize article content for public listing endpoints
  // Paid articles only get preview content in list views (full content requires individual fetch with auth)
  function sanitizeArticlesForPublicListing(articles: any[]): any[] {
    return articles.map(article => {
      // Any article with price > 0 is considered paid, regardless of ledewireContentId
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
  
  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getAllArticles();
      res.json(sanitizeArticlesForPublicListing(articles));
    } catch (error: any) {
      console.error('Get articles error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/articles/featured", async (req, res) => {
    try {
      const articles = await storage.getFeaturedArticles();
      res.json(sanitizeArticlesForPublicListing(articles));
    } catch (error: any) {
      console.error('Get featured articles error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/articles/latest", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const articles = await storage.getLatestArticles(limit);
      res.json(sanitizeArticlesForPublicListing(articles));
    } catch (error: any) {
      console.error('Get latest articles error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/articles/most-read", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const articles = await storage.getMostReadArticles(limit);
      res.json(sanitizeArticlesForPublicListing(articles));
    } catch (error: any) {
      console.error('Get most read articles error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/articles/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const articles = await storage.getArticlesByCategory(category);
      res.json(sanitizeArticlesForPublicListing(articles));
    } catch (error: any) {
      console.error('Get articles by category error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/articles/:id/view", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementArticleViewCount(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Increment view count error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/articles/:id", optionalAuth, async (req: any, res) => {
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
      console.error('[ARTICLE-VIEW] ERROR:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/articles", requireAdminAuth, async (req, res) => {
    try {
      // Sanitize thumbnail URL and convert publishedAt string to Date
      const body = {
        ...req.body,
        thumbnail: sanitizeThumbnailUrl(req.body.thumbnail),
        publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : new Date(),
      };
      const validated = insertArticleSchema.parse(body);
      
      // Create article first
      const article = await storage.createArticle(validated);
      
      // Register with Ledewire for micropayments
      const priceCents = validated.price || 99;
      
      try {
        const content = await ledewire.registerContent(
          article.title,
          priceCents,
          { 
            content: article.content || '',
            teaser: article.summary || '',
            metadata: {
              type: 'article',
              articleId: article.id,
              author: 'Chris Cillizza',
              category: article.category,
              publication_date: article.publishedAt?.toISOString(),
              reading_time: `${article.readTimeMinutes || 5} min`,
            },
          }
        );
        
        // Update article with Ledewire content ID
        await storage.updateArticleLedewireId(article.id, content.id);
        
        // Return updated article
        const updatedArticle = await storage.getArticle(article.id);
        res.json(updatedArticle);
      } catch (ledewireError: any) {
        console.error('[ARTICLE-LEDEWIRE-ERROR]', ledewireError.message);
        // Still return the article even if Ledewire registration failed
        res.json(article);
      }
    } catch (error: any) {
      console.error('Create article error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/articles/:id", requireAdminAuth, async (req, res) => {
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
          console.log(`[ARTICLE-UPDATE] Synced to Ledewire: article ${id}, price=${currentPrice} cents, title=${currentTitle}`);
        } catch (ledewireError: any) {
          console.error(`[ARTICLE-UPDATE] Failed to sync with Ledewire:`, ledewireError.message);
        }
      } else if (currentPrice > 0) {
        // Article has a price but no Ledewire ID - register it now
        try {
          console.log(`[ARTICLE-UPDATE] Registering article ${id} with Ledewire (price=${currentPrice} cents)`);
          const content = await ledewire.registerContent(
            currentTitle,
            currentPrice,
            { 
              content: article.content || '',
              teaser: article.summary || '',
              metadata: {
                type: 'article',
                articleId: article.id,
                author: 'Chris Cillizza',
                category: article.category,
                publication_date: article.publishedAt?.toISOString(),
                reading_time: `${article.readTimeMinutes || 5} min`,
              },
            }
          );
          
          // Update article with Ledewire content ID
          await storage.updateArticleLedewireId(article.id, content.id);
          console.log(`[ARTICLE-UPDATE] Registered with Ledewire: article ${id}, contentId=${content.id}`);
          
          // Return the updated article with the new ledewireContentId
          const updatedArticle = await storage.getArticle(article.id);
          return res.json(updatedArticle);
        } catch (ledewireError: any) {
          console.error(`[ARTICLE-UPDATE] Failed to register with Ledewire:`, ledewireError.message);
        }
      }
      
      res.json(article);
    } catch (error: any) {
      console.error('Update article error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/articles/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteArticle(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete article error:', error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // ===== Purchase Routes =====
  
  // Article purchase endpoint - uses isAuthenticated to get fresh token from session
  app.post("/api/articles/:id/purchase", isAuthenticated, async (req: any, res) => {
    const { id: articleId } = req.params;
    console.log(`[ARTICLE PURCHASE] Starting purchase for article: ${articleId}`);
    
    try {
      const user = req.user;
      const token = user?.ledewireAccessToken;
      
      if (!token) {
        console.log('[ARTICLE PURCHASE] Error: No Ledewire token in session');
        return res.status(401).json({ error: 'Ledewire authentication required' });
      }
      
      // Get article details
      const article = await storage.getArticle(articleId);
      if (!article || !article.ledewireContentId) {
        console.log(`[ARTICLE PURCHASE] Error: Article ${articleId} not found or no Ledewire content ID`);
        return res.status(404).json({ error: 'Article not found or not registered with Ledewire' });
      }
      
      console.log(`[ARTICLE PURCHASE] Article found: ${article.title}, Ledewire ID: ${article.ledewireContentId}, Price: ${article.price} cents`);
      
      // Make purchase with Ledewire
      const purchase = await ledewire.createPurchase(
        token,
        article.ledewireContentId,
        article.price
      );
      
      console.log(`[ARTICLE PURCHASE] Purchase response received, status: ${purchase.status}`);
      
      if (purchase.status !== 'completed' && purchase.status !== 'success') {
        console.log(`[ARTICLE PURCHASE] Purchase not confirmed - status: ${purchase.status}, rejecting unlock`);
        return res.status(400).json({ 
          error: 'Purchase was not completed', 
          status: purchase.status,
          unlocked: false 
        });
      }
      
      // Double-verify the purchase is actually recorded
      const verification = await ledewire.verifyPurchase(token, article.ledewireContentId);
      
      if (!verification.has_purchased) {
        console.log(`[ARTICLE PURCHASE] Verification failed - Ledewire says not purchased, rejecting unlock`);
        return res.status(400).json({ 
          error: 'Purchase verification failed', 
          unlocked: false 
        });
      }
      
      console.log(`[ARTICLE PURCHASE] Purchase verified successfully, unlocking content`);
      res.json({ ...purchase, unlocked: true });
    } catch (error: any) {
      console.error(`[ARTICLE PURCHASE] Error for article ${articleId}:`, error.message);
      res.status(400).json({ error: error.message, unlocked: false });
    }
  });

  // Article purchase verification endpoint - uses isAuthenticated to get fresh token from session
  app.get("/api/articles/:id/purchase/verify", isAuthenticated, async (req: any, res) => {
    const { id: articleId } = req.params;
    console.log(`[ARTICLE VERIFY] Checking purchase status for article: ${articleId}`);
    
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
      console.log(`[ARTICLE VERIFY] Result for article ${articleId}: has_purchased=${verification.has_purchased}`);
      
      res.json(verification);
    } catch (error: any) {
      console.error(`[ARTICLE VERIFY] Error for article ${articleId}:`, error.message);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/purchase", async (req, res) => {
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
      
      // Verify the purchase was actually completed before returning success
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
      console.error(`[PURCHASE FLOW] Error for episode ${episodeId}:`, error.message);
      res.status(400).json({ error: error.message, unlocked: false });
    }
  });
  
  app.get("/api/purchase/verify/:episodeId", async (req, res) => {
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
      console.error(`[PURCHASE VERIFY] Error for episode ${episodeId}:`, error.message);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
