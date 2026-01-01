import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { ledewire } from "./ledewire";
import { setSSoCookie, clearSSoCookie } from "./sso-module/sso-routes";
import { isTokenExpired, decodeJwtPayload } from "./sso-module/sso-helpers";
import crypto from "crypto";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const isProduction = process.env.NODE_ENV === 'production';
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      domain: isProduction ? '.ledewire.com' : undefined,
      maxAge: sessionTtl,
    },
  });
}

export async function setupGoogleAuth(app: Express) {
  // Add COOP header for popup support
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
  });

  // Endpoint to get the Google Client ID from Ledewire config
  app.get("/api/auth/google/config", async (req, res) => {
    try {
      const config = await ledewire.getSellerConfig();
      
      if (!config.google_client_id) {
        console.warn('[GOOGLE_AUTH] Ledewire config does not include google_client_id');
        return res.status(503).json({ error: 'Google OAuth not configured in Ledewire' });
      }
      
      res.json({ clientId: config.google_client_id });
    } catch (error: any) {
      console.error('[GOOGLE_AUTH] Failed to get Google config:', error);
      res.status(500).json({ error: 'Failed to get Google OAuth configuration' });
    }
  });

  // Endpoint to verify Google token via Ledewire and create/login user
  app.post("/api/auth/google/verify", async (req, res) => {
    try {
      const { credential } = req.body;
      
      if (!credential) {
        return res.status(400).json({ error: 'No credential provided' });
      }

      // Send the ID token directly to Ledewire for verification and authentication
      console.log('[GOOGLE_AUTH] Authenticating with Ledewire Google OAuth...');
      const ledewireAuth = await ledewire.loginWithGoogle(credential);
      
      // Decode the access token to get user info
      const payload = decodeJwtPayload(ledewireAuth.access_token);
      if (!payload) {
        return res.status(401).json({ error: 'Failed to decode Ledewire token' });
      }
      
      const email = payload.buyer_claims?.email || payload.email || '';
      const ledewireUserId = payload.buyer_claims?.user_id || payload.sub || '';
      
      if (!email) {
        return res.status(400).json({ error: 'Email not available from authentication' });
      }

      // Decode the Google ID token to get profile info (name, picture)
      let name = email;
      let profileImageUrl: string | undefined;
      let googleId: string | undefined;
      
      try {
        const googlePayload = decodeJwtPayload(credential);
        if (googlePayload) {
          name = googlePayload.name || googlePayload.email || email;
          profileImageUrl = googlePayload.picture;
          googleId = googlePayload.sub;
        }
      } catch (e) {
        console.log('[GOOGLE_AUTH] Could not decode Google token for profile info, using email as name');
      }

      // Find or create local user
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        user = await storage.createUser({
          email,
          name,
          googleId,
          profileImageUrl,
        });
        console.log(`[GOOGLE_AUTH] Created new user for Google account: ${email}`);
      } else {
        // Update Google ID if not set
        if (googleId && !user.googleId) {
          await storage.updateUserGoogleId(user.id, googleId);
          console.log(`[GOOGLE_AUTH] Linked Google account to existing user: ${email}`);
        }
      }

      // Update Ledewire tokens
      await storage.updateUserLedewireTokens(
        user.id,
        ledewireAuth.access_token,
        ledewireAuth.refresh_token,
        ledewireUserId
      );
      
      // Refresh user data
      user = await storage.getUserByEmail(email);

      // Set user in session
      (req.session as any).userId = user!.id;
      
      // Set SSO cookie for cross-subdomain authentication
      setSSoCookie(res, ledewireAuth.refresh_token);
      console.log('[SSO] Set SSO cookie on Google login');
      
      res.json({
        user: {
          id: user!.id,
          email: user!.email,
          name: user!.name,
        },
        ledewireToken: ledewireAuth.access_token,
      });
    } catch (error: any) {
      console.error('[GOOGLE_AUTH] Authentication error:', error);
      res.status(401).json({ error: error.message || 'Authentication failed' });
    }
  });

  // Logout endpoint
  app.get("/api/logout", (req, res) => {
    // Clear SSO cookie
    clearSSoCookie(res);
    console.log('[SSO] Cleared SSO cookie on logout');
    
    req.session.destroy((err) => {
      if (err) {
        console.error('[GOOGLE_AUTH] Logout error:', err);
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  let userId = (req.session as any)?.userId;
  
  // If no session, try to find user via Bearer token
  if (!userId) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = decodeJwtPayload(token);
        const ledewireUserId = payload?.buyer_claims?.user_id || payload?.sub;
        if (ledewireUserId) {
          const user = await storage.getUserByLedewireId(ledewireUserId);
          if (user) {
            userId = user.id;
            console.log('[AUTH] Found user via Bearer token, ledewireUserId:', ledewireUserId);
          }
        }
      } catch (e) {
        console.log('[AUTH] Failed to decode Bearer token');
      }
    }
  }
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    let user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    if (user.ledewireAccessToken && isTokenExpired(user.ledewireAccessToken)) {
      console.log('[AUTH] Ledewire token expired for user:', userId);
      
      if (!user.ledewireRefreshToken) {
        console.log('[AUTH] No refresh token available - clearing session');
        clearSSoCookie(res);
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Session expired" });
      }
      
      console.log('[AUTH] Attempting to refresh Ledewire token...');
      const result = await ledewire.refreshToken(user.ledewireRefreshToken);
      
      if (result.success) {
        const payload = decodeJwtPayload(result.access_token);
        const ledewireUserId = payload?.buyer_claims?.user_id || payload?.sub || user.ledewireUserId;
        
        await storage.updateUserLedewireTokens(
          userId,
          result.access_token,
          result.refresh_token,
          ledewireUserId
        );
        
        user = await storage.getUser(userId);
        console.log('[AUTH] Ledewire token refreshed successfully');
        
        if (result.refresh_token) {
          setSSoCookie(res, result.refresh_token);
        }
      } else if (result.permanent) {
        console.log('[AUTH] Token refresh permanently failed:', result.error, '- clearing session');
        clearSSoCookie(res);
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Session expired" });
      } else {
        console.log('[AUTH] Token refresh transiently failed:', result.error, '- proceeding with stale token');
      }
    }
    
    (req as any).user = user;
    return next();
  } catch (error) {
    console.error('[AUTH] Error in isAuthenticated middleware:', error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Optional auth middleware - populates req.user if authenticated, but doesn't block unauthenticated requests
export const optionalAuth: RequestHandler = async (req, res, next) => {
  let userId = (req.session as any)?.userId;
  
  // If no session, try to find user via Bearer token
  if (!userId) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = decodeJwtPayload(token);
        const ledewireUserId = payload?.buyer_claims?.user_id || payload?.sub;
        if (ledewireUserId) {
          const user = await storage.getUserByLedewireId(ledewireUserId);
          if (user) {
            userId = user.id;
          }
        }
      } catch (e) {
        // Token decode failed - continue as unauthenticated
      }
    }
  }
  
  // If no user found, just continue (don't block)
  if (!userId) {
    return next();
  }
  
  try {
    let user = await storage.getUser(userId);
    if (!user) {
      return next();
    }
    
    // Handle token refresh if needed
    if (user.ledewireAccessToken && isTokenExpired(user.ledewireAccessToken)) {
      if (user.ledewireRefreshToken) {
        const result = await ledewire.refreshToken(user.ledewireRefreshToken);
        if (result.success) {
          const payload = decodeJwtPayload(result.access_token);
          const ledewireUserId = payload?.buyer_claims?.user_id || payload?.sub || user.ledewireUserId;
          await storage.updateUserLedewireTokens(userId, result.access_token, result.refresh_token, ledewireUserId);
          user = await storage.getUser(userId);
          if (result.refresh_token) {
            setSSoCookie(res, result.refresh_token);
          }
        }
      }
    }
    
    (req as any).user = user;
    return next();
  } catch (error) {
    // On error, continue as unauthenticated
    return next();
  }
};
