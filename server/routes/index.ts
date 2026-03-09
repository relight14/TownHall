import type { Express } from "express";
import type { Server } from "http";
import { ledewire } from "../ledewire";
import { storage } from "../storage";
import { setupGoogleAuth, getSession } from "../googleAuth";
import { createSSORoutes } from "../sso-module/sso-routes";
import type { SSOConfig } from "../sso-module/sso-types";
import { registerObjectStorageRoutes } from "../replit_integrations/object_storage";

import authRouter from "./auth";
import adminRouter from "./admin";
import walletRouter from "./wallet";
import seriesRouter from "./series";
import episodesRouter from "./episodes";
import articlesRouter from "./articles";
import { articlePurchaseRouter, episodePurchaseRouter } from "./purchases";

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

  // ===== Mount Domain Routers =====
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/wallet", walletRouter);
  app.use("/api/series", seriesRouter);
  app.use("/api/episodes", episodesRouter);

  // Articles router handles both public listing and admin CRUD
  app.use("/api/articles", articlesRouter);

  // Article purchase routes (/:id/purchase, /:id/purchase/verify)
  app.use("/api/articles", articlePurchaseRouter);

  // Episode purchase routes (/purchase, /purchase/verify/:episodeId)
  app.use("/api", episodePurchaseRouter);

  return httpServer;
}
