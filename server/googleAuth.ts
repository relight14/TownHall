import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { ledewire } from "./ledewire";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
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
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

async function createLedewireAccountForGoogleUser(email: string, name: string): Promise<{ accessToken: string; refreshToken: string; userId: string } | null> {
  try {
    const tempPassword = crypto.randomBytes(32).toString('hex');
    
    try {
      const signupResponse = await ledewire.signupBuyer(email, tempPassword, name);
      console.log(`[GOOGLE_AUTH] Created new Ledewire account for Google user: ${email}`);
      
      const decoded = JSON.parse(Buffer.from(signupResponse.access_token.split('.')[1], 'base64').toString('utf8'));
      return {
        accessToken: signupResponse.access_token,
        refreshToken: signupResponse.refresh_token,
        userId: decoded.sub,
      };
    } catch (signupError: any) {
      if (signupError.message?.includes('already exists') || signupError.message?.includes('duplicate')) {
        console.log(`[GOOGLE_AUTH] Ledewire account exists for ${email}`);
        return null;
      }
      throw signupError;
    }
  } catch (error) {
    console.error(`[GOOGLE_AUTH] Failed to create Ledewire account for Google user:`, error);
    return null;
  }
}

export async function setupGoogleAuth(app: Express) {
  app.set("trust proxy", 1);
  
  // Add COOP header for popup support
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
  });
  
  app.use(getSession());

  const clientID = process.env.GOOGLE_CLIENT_ID;

  if (!clientID) {
    console.warn('[GOOGLE_AUTH] Google OAuth credentials not configured. Google login will not work.');
  }

  // Endpoint to verify Google token and create/login user
  app.post("/api/auth/google/verify", async (req, res) => {
    try {
      const { credential, accessToken } = req.body;
      
      if (!clientID) {
        return res.status(500).json({ error: 'Google OAuth not configured' });
      }

      let email: string;
      let name: string;
      let googleId: string;
      let profileImageUrl: string | undefined;

      if (credential) {
        // Verify the ID token (from GoogleLogin component)
        const client = new OAuth2Client(clientID);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: clientID,
        });
        
        const payload = ticket.getPayload();
        if (!payload) {
          return res.status(401).json({ error: 'Invalid Google token' });
        }

        email = payload.email || '';
        name = payload.name || payload.email || 'User';
        googleId = payload.sub;
        profileImageUrl = payload.picture;
      } else if (accessToken) {
        // Get user info from access token (from useGoogleLogin hook)
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (!response.ok) {
          return res.status(401).json({ error: 'Invalid Google access token' });
        }
        
        const userInfo = await response.json();
        email = userInfo.email || '';
        name = userInfo.name || userInfo.email || 'User';
        googleId = userInfo.sub;
        profileImageUrl = userInfo.picture;
      } else {
        return res.status(400).json({ error: 'No token provided' });
      }

      if (!email) {
        return res.status(400).json({ error: 'Email not available from Google' });
      }

      // Find or create user
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
        if (!user.googleId) {
          await storage.updateUserGoogleId(user.id, googleId);
          console.log(`[GOOGLE_AUTH] Linked Google account to existing user: ${email}`);
        }
      }

      // Create Ledewire account if needed
      if (!user.ledewireUserId) {
        console.log(`[GOOGLE_AUTH] Google user ${email} needs Ledewire account, creating...`);
        const ledewireAccount = await createLedewireAccountForGoogleUser(email, name);
        
        if (ledewireAccount) {
          await storage.updateUserLedewireTokens(
            user.id,
            ledewireAccount.accessToken,
            ledewireAccount.refreshToken,
            ledewireAccount.userId
          );
          console.log(`[GOOGLE_AUTH] Linked Ledewire account for Google user: ${email}`);
          // Refresh user data
          user = await storage.getUserByEmail(email);
        }
      }

      // Set user in session
      (req.session as any).userId = user!.id;
      
      res.json({
        user: {
          id: user!.id,
          email: user!.email,
          name: user!.name,
        },
        ledewireToken: user!.ledewireAccessToken,
      });
    } catch (error: any) {
      console.error('[GOOGLE_AUTH] Token verification error:', error);
      res.status(401).json({ error: error.message || 'Authentication failed' });
    }
  });

  // Logout endpoint
  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('[GOOGLE_AUTH] Logout error:', err);
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    (req as any).user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
