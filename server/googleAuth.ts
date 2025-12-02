import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { ledewire } from "./ledewire";
import crypto from "crypto";

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
      
      const decoded = JSON.parse(atob(signupResponse.access_token.split('.')[1]));
      return {
        accessToken: signupResponse.access_token,
        refreshToken: signupResponse.refresh_token,
        userId: decoded.sub,
      };
    } catch (signupError: any) {
      if (signupError.message?.includes('already exists') || signupError.message?.includes('duplicate')) {
        console.log(`[GOOGLE_AUTH] Ledewire account exists for ${email}, attempting login with temp password...`);
        return null;
      }
      throw signupError;
    }
  } catch (error) {
    console.error(`[GOOGLE_AUTH] Failed to create Ledewire account for Google user:`, error);
    return null;
  }
}

async function upsertGoogleUser(profile: Profile) {
  const googleId = profile.id;
  const email = profile.emails?.[0]?.value || '';
  const displayName = profile.displayName || '';
  const firstName = profile.name?.givenName || '';
  const lastName = profile.name?.familyName || '';
  const profileImageUrl = profile.photos?.[0]?.value || '';
  const name = displayName || `${firstName} ${lastName}`.trim() || email || 'User';

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

  if (email && !user.ledewireUserId) {
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
      user = await storage.getUserByEmail(email);
    }
  }

  return user;
}

export async function setupGoogleAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.warn('[GOOGLE_AUTH] Google OAuth credentials not configured. Google login will not work.');
    return;
  }

  passport.use(new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL: "/api/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await upsertGoogleUser(profile);
        done(null, user);
      } catch (error) {
        console.error('[GOOGLE_AUTH] Error in Google strategy:', error);
        done(error as Error, undefined);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  app.get("/api/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"],
  }));

  app.get("/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/?auth=failed",
    }),
    (req, res) => {
      res.redirect("/?auth=success");
    }
  );

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};
