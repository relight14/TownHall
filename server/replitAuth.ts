import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { ledewire } from "./ledewire";
import crypto from "crypto";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

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
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function createLedewireAccountForSSOUser(email: string, name: string): Promise<{ accessToken: string; refreshToken: string; userId: string } | null> {
  try {
    const tempPassword = crypto.randomBytes(32).toString('hex');
    
    try {
      const signupResponse = await ledewire.signupBuyer(email, tempPassword, name);
      console.log(`[REPLIT_AUTH] Created new Ledewire account for SSO user: ${email}`);
      
      const decoded = JSON.parse(atob(signupResponse.access_token.split('.')[1]));
      return {
        accessToken: signupResponse.access_token,
        refreshToken: signupResponse.refresh_token,
        userId: decoded.sub,
      };
    } catch (signupError: any) {
      if (signupError.message?.includes('already exists') || signupError.message?.includes('duplicate')) {
        console.log(`[REPLIT_AUTH] Ledewire account exists for ${email}, attempting login...`);
        return null;
      }
      throw signupError;
    }
  } catch (error) {
    console.error(`[REPLIT_AUTH] Failed to create Ledewire account for SSO user:`, error);
    return null;
  }
}

async function upsertUser(claims: any) {
  const userId = claims["sub"];
  const email = claims["email"];
  const firstName = claims["first_name"];
  const lastName = claims["last_name"];
  const profileImageUrl = claims["profile_image_url"];
  const name = firstName && lastName 
    ? `${firstName} ${lastName}`.trim() 
    : firstName || lastName || email || 'User';

  const user = await storage.upsertUser({
    id: userId,
    email: email,
    firstName: firstName,
    lastName: lastName,
    profileImageUrl: profileImageUrl,
  });

  if (email && !user.ledewireUserId) {
    console.log(`[REPLIT_AUTH] SSO user ${email} needs Ledewire account, creating...`);
    const ledewireAccount = await createLedewireAccountForSSOUser(email, name);
    
    if (ledewireAccount) {
      await storage.updateUserLedewireTokens(
        userId,
        ledewireAccount.accessToken,
        ledewireAccount.refreshToken,
        ledewireAccount.userId
      );
      console.log(`[REPLIT_AUTH] Linked Ledewire account for SSO user: ${email}`);
    }
  }

  return user;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
