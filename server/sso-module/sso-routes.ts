import { Router, Request, Response } from "express";
import { SSO_COOKIE_NAME, setSSoCookie, clearSSoCookie, decodeJwtPayload, configureCookieOptions } from "./sso-helpers";
import type { SSOConfig, SessionResponse } from "./sso-types";

export function createSSORoutes(config: SSOConfig): Router {
  const router = Router();
  
  if (config.cookieOptions) {
    configureCookieOptions(config.cookieOptions);
  }

  router.get("/session", async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.[SSO_COOKIE_NAME];
      
      if (!refreshToken) {
        return res.status(401).json({ 
          authenticated: false, 
          error: 'No session found' 
        } as SessionResponse);
      }
      
      console.log('[SSO] Attempting token refresh from SSO cookie');
      
      const refreshedAuth = await config.refreshToken(refreshToken);
      
      if (!refreshedAuth) {
        console.log('[SSO] Token refresh failed - clearing cookie');
        clearSSoCookie(res);
        return res.status(401).json({ 
          authenticated: false, 
          error: 'Session expired' 
        } as SessionResponse);
      }
      
      const payload = decodeJwtPayload(refreshedAuth.access_token);
      const ledewireUserId = payload?.buyer_claims?.user_id || payload?.sub;
      const email = payload?.buyer_claims?.email;
      
      let user: { id: string; email: string; name: string } | null = null;
      
      if (config.findUserByLedewireId) {
        user = await config.findUserByLedewireId(ledewireUserId);
      }
      
      if (!user && email && config.findUserByEmail) {
        user = await config.findUserByEmail(email);
      }
      
      if (user && config.updateUserTokens) {
        await config.updateUserTokens(
          user.id,
          refreshedAuth.access_token,
          refreshedAuth.refresh_token,
          ledewireUserId
        );
      }
      
      // Hydrate Express session if callback provided
      if (user && config.onSessionRestored) {
        config.onSessionRestored(req, user.id);
        console.log('[SSO] Hydrated Express session for user:', user.id);
      }
      
      if (refreshedAuth.refresh_token) {
        setSSoCookie(res, refreshedAuth.refresh_token);
        console.log('[SSO] Updated SSO cookie with new refresh token');
      }
      
      console.log('[SSO] Session restored successfully');
      
      const response: SessionResponse = {
        authenticated: true,
        user: user ? {
          id: user.id,
          email: user.email,
          name: user.name,
        } : null,
        ledewireToken: refreshedAuth.access_token,
        ledewireUserId,
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('[SSO] Session check error:', error);
      clearSSoCookie(res);
      res.status(401).json({ 
        authenticated: false, 
        error: 'Session invalid' 
      } as SessionResponse);
    }
  });

  router.post("/logout", (req: Request, res: Response) => {
    clearSSoCookie(res);
    console.log('[SSO] Cleared SSO cookie on logout');
    res.json({ success: true });
  });

  return router;
}

export { setSSoCookie, clearSSoCookie } from "./sso-helpers";
